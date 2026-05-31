import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getBriefingById, getReport, saveEditedReport, deleteBriefing } from "@/lib/briefing-queries";
import { generateReport } from "@/lib/report.functions";
import { exportReportPdf } from "@/lib/pdf";
import { PageShell } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Sparkles, Download, Save, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/$id")({
  component: AdminDetail,
});

function AdminDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const genReport = useServerFn(generateReport);

  const { data } = useQuery({ queryKey: ["briefing-admin", id], queryFn: () => getBriefingById(id) });
  const { data: report, refetch: refetchReport } = useQuery({
    queryKey: ["report", id],
    queryFn: () => getReport(id),
  });

  const [edited, setEdited] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (report) setEdited(report.edited_text ?? report.ai_text ?? "");
  }, [report?.id]);

  if (!data) return <PageShell><div className="mx-auto max-w-5xl px-6 py-16 text-muted-foreground">Carregando…</div></PageShell>;
  const { briefing, questions, options, responses } = data;

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const res = await genReport({ data: { briefing_id: id } });
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Relatório gerado");
        await refetchReport();
      }
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    } finally {
      setGenerating(false);
    }
  };

  const onSave = async () => {
    await saveEditedReport(id, edited);
    toast.success("Salvo");
    refetchReport();
  };

  const onExport = () => {
    const text = edited || report?.ai_text || "";
    if (!text) {
      toast.error("Gere o relatório primeiro");
      return;
    }
    exportReportPdf({
      clientName: briefing.client_name,
      projectType: briefing.project_type,
      reportText: text,
      styleProfile: report?.style_profile,
    });
  };

  const onDelete = async () => {
    await deleteBriefing(id);
    await qc.invalidateQueries({ queryKey: ["briefings"] });
    toast.success("Briefing excluído");
    window.location.href = "/";
  };

  return (
    <PageShell>
      <section className="mx-auto max-w-5xl px-6 pt-12 pb-8">
        <Link to="/" className="eyebrow text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-6 mt-6">
          <div>
            <span className="eyebrow">{briefing.project_type}</span>
            <h1 className="font-display text-5xl mt-2 leading-tight">{briefing.client_name}</h1>
            <p className="text-muted-foreground mt-2">{responses.length} de {questions.length} perguntas respondidas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {report ? "Regenerar" : "Gerar relatório IA"}
            </Button>
            <Button variant="outline" onClick={onExport} className="gap-2">
              <Download className="w-4 h-4" /> Exportar PDF
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir briefing?</AlertDialogTitle>
                  <AlertDialogDescription>Remove o briefing, respostas e relatório. Permanente.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>

      <div className="rule mx-auto max-w-5xl" />

      <section className="mx-auto max-w-5xl px-6 py-10 grid lg:grid-cols-2 gap-12">
        <div>
          <h2 className="font-display text-2xl mb-6">Respostas</h2>
          <div className="space-y-6">
            {questions.map((q) => {
              const r = responses.find((x) => x.question_id === q.id);
              return (
                <div key={q.id} className="border-l-2 border-border pl-4">
                  <p className="eyebrow">Pergunta {q.order_index}</p>
                  <p className="font-display text-lg mt-1">{q.title}</p>
                  {!r ? (
                    <p className="text-muted-foreground text-sm mt-2 italic">sem resposta</p>
                  ) : q.kind === "text" ? (
                    <p className="text-sm mt-2 whitespace-pre-wrap">{r.text_answer || "—"}</p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.selected_option_ids.map((oid) => {
                        const o = options.find((x) => x.id === oid);
                        if (!o) return null;
                        return (
                          <div key={oid} className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-sm text-sm">
                            {o.image_url && <img src={o.image_url} alt="" className="w-6 h-6 rounded-sm object-cover" />}
                            <span>{o.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {r?.comment && (
                    <p className="text-xs text-muted-foreground italic mt-2">"{r.comment}"</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl mb-6">Relatório interpretativo</h2>
          {!report ? (
            <div className="border border-dashed border-border rounded-sm p-8 text-center text-muted-foreground">
              <Sparkles className="w-6 h-6 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Clique em "Gerar relatório IA" para criar uma análise interpretativa das escolhas do cliente.</p>
            </div>
          ) : (
            <>
              {report.style_profile && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {Object.entries(report.style_profile)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([tag, n]) => (
                      <span key={tag} className="text-xs px-2.5 py-1 bg-accent/10 text-accent border border-accent/20 rounded-sm">
                        {tag} · {n}
                      </span>
                    ))}
                </div>
              )}
              <Textarea
                value={edited}
                onChange={(e) => setEdited(e.target.value)}
                rows={22}
                className="font-sans text-sm leading-relaxed"
              />
              <Button onClick={onSave} variant="outline" size="sm" className="mt-3 gap-2">
                <Save className="w-3.5 h-3.5" /> Salvar edições
              </Button>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
