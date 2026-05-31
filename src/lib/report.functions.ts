import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({ briefing_id: z.string().uuid() });

export const generateReport = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;

    if (!LOVABLE_API_KEY) {
      return { error: "AI Gateway não está configurado." };
    }

    // Pull briefing + questions + options + responses via REST
    const headers = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
    };

    async function fetchTable(path: string) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }

    const briefings = await fetchTable(`briefings?id=eq.${data.briefing_id}&select=*`);
    const briefing = briefings[0];
    if (!briefing) return { error: "Briefing não encontrado." };

    const questions = await fetchTable(
      `questions?briefing_id=eq.${data.briefing_id}&select=*&order=order_index.asc`,
    );
    const qIds = questions.map((q: any) => q.id).join(",");
    const options = qIds
      ? await fetchTable(`question_options?question_id=in.(${qIds})&select=*`)
      : [];
    const responses = await fetchTable(
      `responses?briefing_id=eq.${data.briefing_id}&select=*`,
    );

    // Build context for the model
    const lines: string[] = [];
    const tagCounts: Record<string, number> = {};
    for (const q of questions) {
      const r = responses.find((x: any) => x.question_id === q.id);
      lines.push(`\n## ${q.title}`);
      if (q.description) lines.push(q.description);
      if (!r) {
        lines.push("_(sem resposta)_");
        continue;
      }
      if (q.kind === "text") {
        lines.push(`Resposta: ${r.text_answer || "(em branco)"}`);
      } else {
        const selected = (r.selected_option_ids as string[]) || [];
        for (const oid of selected) {
          const o = options.find((x: any) => x.id === oid);
          if (o) {
            lines.push(`• ${o.label}${o.tag ? ` [${o.tag}]` : ""} — ${o.interpretation ?? ""}`);
            if (o.tag) tagCounts[o.tag] = (tagCounts[o.tag] || 0) + 1;
          }
        }
      }
      if (r.comment) lines.push(`Comentário do cliente: ${r.comment}`);
    }

    const prompt = `Você é Beatriz Ribeiro, arquiteta sênior. Com base nas escolhas visuais do cliente abaixo, escreva um RELATÓRIO INTERPRETATIVO INTERNO (não para o cliente ler diretamente) que orientará o desenvolvimento conceitual do projeto.

Cliente: ${briefing.client_name}
Projeto: ${briefing.project_type}

Respostas:
${lines.join("\n")}

Tags acumuladas: ${Object.entries(tagCounts).map(([k, v]) => `${k}(${v})`).join(", ") || "—"}

Estruture o relatório em SEÇÕES claras com markdown:
1. **Perfil de Estilo** — síntese da identidade estética do cliente
2. **Atmosfera Desejada** — sensação que o espaço deve transmitir
3. **Paleta e Materialidade** — diretrizes de cor, textura, materiais
4. **Mobiliário e Composição** — orientações de layout e peças
5. **Pontos de Atenção** — tensões/contradições nas escolhas a discutir
6. **Próximos Passos** — recomendações práticas

Tom: profissional, técnico, sofisticado. Português brasileiro. Cerca de 600 palavras.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: "Você é uma arquiteta sênior especializada em interiores residenciais e corporativos de alto padrão.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, t);
      if (aiRes.status === 429) return { error: "Limite de uso atingido. Tente novamente em instantes." };
      if (aiRes.status === 402) return { error: "Créditos esgotados. Adicione créditos no workspace." };
      return { error: "Falha ao gerar relatório." };
    }

    const aiJson = await aiRes.json();
    const aiText: string = aiJson.choices?.[0]?.message?.content || "";

    // Upsert report
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        briefing_id: data.briefing_id,
        ai_text: aiText,
        style_profile: tagCounts,
        generated_at: new Date().toISOString(),
      }),
    });

    if (!upsertRes.ok) {
      // Try update if conflict (no upsert key)
      await fetch(
        `${SUPABASE_URL}/rest/v1/reports?briefing_id=eq.${data.briefing_id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ ai_text: aiText, style_profile: tagCounts, generated_at: new Date().toISOString() }),
        },
      );
    }

    return { ai_text: aiText, style_profile: tagCounts };
  });
