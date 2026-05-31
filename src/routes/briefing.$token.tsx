import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getBriefingByToken, saveResponse, completeBriefing,
  type Question, type QuestionOption,
} from "@/lib/briefing-queries";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/briefing/$token")({
  component: PublicBriefing,
});

function PublicBriefing() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["briefing-public", token],
    queryFn: () => getBriefingByToken(token),
  });

  const [step, setStep] = useState(0);
  const [intro, setIntro] = useState(true);
  const [answers, setAnswers] = useState<Record<string, { sel: string[]; text: string; comment: string }>>({});

  useEffect(() => {
    if (data?.responses) {
      const seed: typeof answers = {};
      for (const r of data.responses) {
        seed[r.question_id] = {
          sel: r.selected_option_ids || [],
          text: r.text_answer ?? "",
          comment: r.comment ?? "",
        };
      }
      setAnswers(seed);
    }
  }, [data?.responses]);

  if (isLoading) return <CenterMsg>Carregando…</CenterMsg>;
  if (error || !data) return <CenterMsg>Briefing não encontrado.</CenterMsg>;

  const { briefing, questions, options } = data;
  const q: Question | undefined = questions[step];
  const ans = q ? answers[q.id] ?? { sel: [], text: "", comment: "" } : null;

  const setAns = (patch: Partial<{ sel: string[]; text: string; comment: string }>) => {
    if (!q) return;
    setAnswers((prev) => ({ ...prev, [q.id]: { ...(prev[q.id] ?? { sel: [], text: "", comment: "" }), ...patch } }));
  };

  const persist = async () => {
    if (!q || !ans) return;
    await saveResponse({
      briefing_id: briefing.id,
      question_id: q.id,
      selected_option_ids: ans.sel,
      text_answer: ans.text || null,
      comment: ans.comment || null,
    });
  };

  const onNext = async () => {
    try {
      await persist();
      if (step + 1 < questions.length) setStep(step + 1);
      else {
        await completeBriefing(briefing.id);
        await qc.invalidateQueries({ queryKey: ["briefings"] });
        navigate({ to: "/briefing/$token/enviado", params: { token } });
      }
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e.message });
    }
  };

  if (intro) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/60 px-6 py-6">
          <div className="mx-auto max-w-5xl"><Brand /></div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-24 text-center">
          <span className="eyebrow">{briefing.project_type}</span>
          <h1 className="font-display text-5xl md:text-6xl mt-4 leading-[1.05]">
            <em className="text-accent">{briefing.client_name}</em>
          </h1>
          <div className="rule my-10 max-w-xs mx-auto" />
          <h2 className="font-display text-2xl mb-6">{briefing.title}</h2>
          <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {briefing.intro}
          </p>
          <Button size="lg" className="mt-12 gap-2 px-10" onClick={() => setIntro(false)}>
            Iniciar jornada <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="mt-6 eyebrow">{questions.length} perguntas · ~5 minutos</p>
        </main>
      </div>
    );
  }

  if (!q) return <CenterMsg>Sem perguntas.</CenterMsg>;
  const qOptions = options.filter((o) => o.question_id === q.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/60 px-6 py-5 sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-6">
          <Brand subtle />
          <div className="flex-1 max-w-md">
            <Progress value={((step + 1) / questions.length) * 100} />
            <p className="eyebrow mt-2 text-center">
              Pergunta {step + 1} de {questions.length}
            </p>
          </div>
          <span className="hidden md:inline eyebrow">{briefing.client_name}</span>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-12">
        <span className="eyebrow">{briefing.project_type}</span>
        <h2 className="font-display text-3xl md:text-4xl mt-3 leading-tight">{q.title}</h2>
        {q.description && <p className="text-muted-foreground mt-3 max-w-2xl">{q.description}</p>}

        <div className="mt-10">
          {q.kind === "text" ? (
            <Textarea
              value={ans?.text ?? ""}
              onChange={(e) => setAns({ text: e.target.value })}
              placeholder="Escreva livremente…"
              rows={8}
              className="text-base"
            />
          ) : (
            <div className="flex gap-3 md:gap-4 w-full">
              {qOptions.map((o) => {
                const selected = ans?.sel.includes(o.id);
                const toggle = () => {
                  if (q.kind === "single") setAns({ sel: [o.id] });
                  else {
                    const has = ans?.sel.includes(o.id);
                    setAns({
                      sel: has ? (ans?.sel ?? []).filter((x) => x !== o.id) : [...(ans?.sel ?? []), o.id],
                    });
                  }
                };
                return (
                  <div key={o.id} className="flex-1 min-w-0">
                    <OptionCard option={o} selected={!!selected} onClick={toggle} />
                  </div>
                );
              })}
            </div>
          )}

          {q.allow_comment && q.kind !== "text" && (
            <div className="mt-6">
              <span className="eyebrow">Comentário (opcional)</span>
              <Textarea
                value={ans?.comment ?? ""}
                onChange={(e) => setAns({ comment: e.target.value })}
                placeholder="Algo a acrescentar sobre esta escolha?"
                rows={3}
                className="mt-2"
              />
            </div>
          )}
        </div>

        <div className="mt-12 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => step > 0 ? setStep(step - 1) : setIntro(true)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button size="lg" onClick={onNext} className="gap-2 px-8">
            {step + 1 === questions.length ? "Enviar briefing" : "Próxima"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

function OptionCard({ option, selected, onClick }: { option: QuestionOption; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-sm overflow-hidden border-2 transition-all ${
        selected ? "border-accent shadow-lg" : "border-transparent hover:border-border"
      }`}
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {option.image_url && (
          <img
            src={option.image_url}
            alt={option.label}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {selected && (
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md">
            <Check className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="p-3 bg-card">
        <p className="font-display text-sm md:text-base leading-snug truncate">{option.label}</p>
      </div>
    </button>
  );
}

function CenterMsg({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">{children}</div>
  );
}
