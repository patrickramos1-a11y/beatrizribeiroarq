import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getBriefingById, updateBriefing, deleteBriefing,
  createQuestion, updateQuestion, deleteQuestion, reorderQuestions,
  createOption, updateOption, deleteOption,
  uploadBriefingImage,
  listQuestionTemplates, importQuestionTemplate,
  type Question, type QuestionOption,
} from "@/lib/briefing-queries";
import { PageShell } from "@/components/Brand";
import { KindBadge } from "@/components/KindBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Plus, Trash2, Image as ImageIcon, Save, Loader2, X,
  ChevronUp, ChevronDown, MessageSquarePlus, Library, Eye, Copy as CopyIcon,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/editor/$id")({
  component: Editor,
});

function Editor() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["briefing-editor", id],
    queryFn: () => getBriefingById(id),
  });

  const [meta, setMeta] = useState({ client_name: "", project_type: "", title: "", intro: "" });
  const [savingMeta, setSavingMeta] = useState(false);

  useEffect(() => {
    if (data?.briefing) {
      const b = data.briefing;
      setMeta({
        client_name: b.client_name,
        project_type: b.project_type,
        title: b.title,
        intro: b.intro ?? "",
      });
    }
  }, [data?.briefing?.id]);

  if (isLoading || !data) {
    return <PageShell><div className="mx-auto max-w-5xl px-6 py-16 text-muted-foreground">Carregando…</div></PageShell>;
  }

  const { briefing, questions, options } = data;

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      await updateBriefing(briefing.id, meta);
      toast.success("Briefing atualizado");
      qc.invalidateQueries({ queryKey: ["briefings"] });
      refetch();
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e.message });
    } finally {
      setSavingMeta(false);
    }
  };

  const addQuestion = async () => {
    try {
      await createQuestion({
        briefing_id: briefing.id,
        order_index: questions.length,
        title: "Nova pergunta",
        kind: "single",
      });
      await refetch();
      toast.success("Pergunta adicionada");
    } catch (e: any) {
      toast.error("Não foi possível criar a pergunta", { description: e.message });
    }
  };

  const importFromTemplate = async (templateQuestionId: string) => {
    try {
      await importQuestionTemplate({
        briefing_id: briefing.id,
        template_question_id: templateQuestionId,
        next_order_index: questions.length,
      });
      await refetch();
      toast.success("Pergunta importada da biblioteca");
    } catch (e: any) {
      toast.error("Erro ao importar", { description: e.message });
    }
  };

  const moveQuestion = async (qid: string, direction: -1 | 1) => {
    const idx = questions.findIndex((q) => q.id === qid);
    const target = idx + direction;
    if (target < 0 || target >= questions.length) return;
    const a = questions[idx];
    const b = questions[target];
    try {
      await reorderQuestions([
        { id: a.id, order_index: b.order_index },
        { id: b.id, order_index: a.order_index },
      ]);
      await refetch();
    } catch (e: any) {
      toast.error("Erro ao reordenar", { description: e.message });
    }
  };

  const removeBriefing = async () => {
    if (!confirm("Excluir este briefing e todas as respostas associadas?")) return;
    try {
      await deleteBriefing(briefing.id);
      qc.invalidateQueries({ queryKey: ["briefings"] });
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error("Erro ao excluir", { description: e.message });
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/briefing/${briefing.public_token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado", { description: url });
  };

  return (
    <PageShell>
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Painel
          </Link>
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={copyLink} className="gap-1.5">
              <CopyIcon className="w-3.5 h-3.5" /> Copiar link
            </Button>
            <Link to="/briefing/$token" params={{ token: briefing.public_token }} search={{ preview: 1 } as any}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Eye className="w-3.5 h-3.5" /> Testar como cliente
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={removeBriefing} className="gap-1.5 text-destructive">
              <Trash2 className="w-4 h-4" /> Excluir
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <span className="eyebrow">Edição</span>
        <h1 className="font-display text-4xl md:text-5xl mt-3">Configurar briefing</h1>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div>
            <Label>Nome do cliente</Label>
            <Input value={meta.client_name} onChange={(e) => setMeta({ ...meta, client_name: e.target.value })} />
          </div>
          <div>
            <Label>Tipo de projeto</Label>
            <Input value={meta.project_type} onChange={(e) => setMeta({ ...meta, project_type: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Título</Label>
            <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Introdução</Label>
            <Textarea rows={4} value={meta.intro} onChange={(e) => setMeta({ ...meta, intro: e.target.value })} />
          </div>
        </div>
        <Button onClick={saveMeta} disabled={savingMeta} className="mt-5 gap-2">
          {savingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar dados
        </Button>
      </section>

      <div className="rule mx-auto max-w-5xl" />

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="eyebrow">Roteiro de perguntas</span>
            <h2 className="font-display text-3xl mt-2">{questions.length} no roteiro</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            <TemplateLibraryDialog
              currentBriefingId={briefing.id}
              onImport={importFromTemplate}
            />
            <Button onClick={addQuestion} className="gap-2">
              <Plus className="w-4 h-4" /> Nova pergunta
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              index={i}
              total={questions.length}
              question={q}
              options={options.filter((o) => o.question_id === q.id)}
              onChange={refetch}
              onMove={(dir) => moveQuestion(q.id, dir)}
            />
          ))}
          {questions.length === 0 && (
            <div className="border border-dashed border-border rounded-sm py-16 text-center text-muted-foreground">
              Nenhuma pergunta ainda. Crie a primeira ou importe da biblioteca.
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function TemplateLibraryDialog({
  currentBriefingId, onImport,
}: { currentBriefingId: string; onImport: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["templates", currentBriefingId],
    queryFn: () => listQuestionTemplates(currentBriefingId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Library className="w-4 h-4" /> Biblioteca
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Biblioteca de perguntas</DialogTitle>
          <DialogDescription>
            Importe perguntas já criadas em outros briefings, com todas as imagens, tags e interpretações.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando…</div>
        ) : templates.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Nenhuma pergunta disponível em outros briefings.
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {templates.map((t) => (
              <div key={t.id} className="border border-border/60 rounded-sm p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <KindBadge kind={t.kind} size="xs" />
                    <p className="font-display text-lg mt-2">{t.title}</p>
                    <p className="eyebrow mt-1">de {t.briefing_name}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { onImport(t.id); setOpen(false); }}
                    className="gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Importar
                  </Button>
                </div>
                {t.options.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {t.options.slice(0, 8).map((o) => (
                      <div key={o.id} className="flex-shrink-0 w-24">
                        <div className="aspect-[4/3] bg-muted rounded-sm overflow-hidden">
                          {o.image_url && <img src={o.image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <p className="text-[0.65rem] truncate mt-1 text-muted-foreground">{o.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuestionEditor({
  index, total, question, options, onChange, onMove,
}: {
  index: number; total: number; question: Question; options: QuestionOption[];
  onChange: () => void; onMove: (dir: -1 | 1) => void;
}) {
  const [local, setLocal] = useState(question);
  const [saving, setSaving] = useState(false);

  useEffect(() => setLocal(question), [question.id]);

  const save = async () => {
    setSaving(true);
    try {
      await updateQuestion(question.id, {
        title: local.title,
        description: local.description,
        kind: local.kind,
        allow_comment: local.allow_comment,
      });
      onChange();
      toast.success("Pergunta atualizada");
    } catch (e: any) {
      toast.error("Erro ao salvar", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Excluir esta pergunta?")) return;
    try {
      await deleteQuestion(question.id);
      onChange();
    } catch (e: any) {
      toast.error("Erro ao excluir", { description: e.message });
    }
  };

  const addOption = async () => {
    try {
      await createOption({
        question_id: question.id,
        order_index: options.length,
        label: "Opção",
      });
      onChange();
    } catch (e: any) {
      toast.error("Erro ao criar opção", { description: e.message });
    }
  };

  return (
    <article className="border border-border/60 rounded-sm bg-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="eyebrow">Pergunta {index + 1}</span>
          <KindBadge kind={local.kind} size="xs" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            title="Subir"
            className="h-8 w-8"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            title="Descer"
            className="h-8 w-8"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={remove} className="text-destructive gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Remover
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_240px]">
        <div>
          <Label>Título</Label>
          <Input value={local.title} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select value={local.kind} onValueChange={(v) => setLocal({ ...local, kind: v as Question["kind"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Escolha única (imagens)</SelectItem>
              <SelectItem value="multi">Múltipla escolha (imagens)</SelectItem>
              <SelectItem value="text">Resposta em texto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Descrição (opcional)</Label>
          <Textarea rows={2} value={local.description ?? ""} onChange={(e) => setLocal({ ...local, description: e.target.value })} />
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <Switch checked={local.allow_comment} onCheckedChange={(v) => setLocal({ ...local, allow_comment: v })} />
          <span className="text-sm">Permitir comentário do cliente</span>
        </div>
      </div>

      <Button onClick={save} disabled={saving} size="sm" className="mt-4 gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar pergunta
      </Button>

      {local.kind !== "text" && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <span className="eyebrow">Opções visuais</span>
            <Button size="sm" variant="outline" onClick={addOption} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Adicionar opção
            </Button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {options.map((o) => (
              <OptionEditor key={o.id} option={o} onChange={onChange} />
            ))}
            {options.length === 0 && (
              <p className="text-sm text-muted-foreground italic py-6">Sem opções ainda.</p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function OptionEditor({ option, onChange }: { option: QuestionOption; onChange: () => void }) {
  const [label, setLabel] = useState(option.label);
  const [tag, setTag] = useState(option.tag ?? "");
  const [interpretation, setInterpretation] = useState(option.interpretation ?? "");
  const [uploading, setUploading] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setLabel(option.label);
    setTag(option.tag ?? "");
    setInterpretation(option.interpretation ?? "");
  }, [option.id]);

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadBriefingImage(file);
      await updateOption(option.id, { image_url: url });
      onChange();
      toast.success("Imagem enviada");
    } catch (e: any) {
      toast.error("Erro no upload", { description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const saveText = async () => {
    try {
      await updateOption(option.id, { label, tag: tag || null });
      onChange();
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    }
  };

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await updateOption(option.id, { interpretation: interpretation || null });
      onChange();
      toast.success("Anotação salva");
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    } finally {
      setSavingNote(false);
    }
  };

  const remove = async () => {
    try {
      await deleteOption(option.id);
      onChange();
    } catch (e: any) {
      toast.error("Erro ao excluir", { description: e.message });
    }
  };

  const hasNote = (option.interpretation ?? "").trim().length > 0;

  return (
    <div className="flex-shrink-0 w-44 border border-border/60 rounded-sm bg-background overflow-hidden">
      <label className="block aspect-[4/3] bg-muted relative cursor-pointer group">
        {option.image_url ? (
          <img src={option.image_url} alt={option.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
            <ImageIcon className="w-5 h-5" /> Enviar imagem
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
      </label>
      <div className="p-2 space-y-1.5">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} onBlur={saveText} placeholder="Rótulo" className="h-8 text-xs" />
        <Input value={tag} onChange={(e) => setTag(e.target.value)} onBlur={saveText} placeholder="Tag (ex: minimalista)" className="h-8 text-xs" />

        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost" size="sm"
                className={`flex-1 h-7 text-xs gap-1 ${hasNote ? "text-accent" : "text-muted-foreground"}`}
                title="Anotação interpretativa"
              >
                <MessageSquarePlus className="w-3 h-3" />
                {hasNote ? "Anotação ✓" : "Anotar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <p className="eyebrow mb-2">Anotação interpretativa</p>
              <p className="text-xs text-muted-foreground mb-3">
                Contexto opcional para a IA: o que esta imagem revela sobre o gosto/estilo do cliente?
              </p>
              <Textarea
                rows={5}
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                placeholder="Ex: sugere preferência por linhas orgânicas e materialidade artesanal…"
                className="text-sm"
              />
              <Button onClick={saveNote} disabled={savingNote} size="sm" className="mt-2 w-full gap-1.5">
                {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Salvar anotação
              </Button>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={remove} className="h-7 w-7 text-destructive">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
