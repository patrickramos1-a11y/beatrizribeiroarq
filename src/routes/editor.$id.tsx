import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getBriefingById, updateBriefing, deleteBriefing,
  createQuestion, updateQuestion, deleteQuestion,
  createOption, updateOption, deleteOption,
  uploadBriefingImage,
  type Question, type QuestionOption,
} from "@/lib/briefing-queries";
import { PageShell } from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Image as ImageIcon, Save, Loader2, X } from "lucide-react";
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
      toast.error("Erro", { description: e.message });
    } finally {
      setSavingMeta(false);
    }
  };

  const addQuestion = async () => {
    await createQuestion({
      briefing_id: briefing.id,
      order_index: questions.length,
      title: "Nova pergunta",
      kind: "single",
    });
    refetch();
  };

  const removeBriefing = async () => {
    if (!confirm("Excluir este briefing e todas as respostas associadas?")) return;
    await deleteBriefing(briefing.id);
    qc.invalidateQueries({ queryKey: ["briefings"] });
    navigate({ to: "/" });
  };

  return (
    <PageShell>
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-6 py-6 flex items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Painel
          </Link>
          <div className="flex gap-2">
            <Link to="/briefing/$token" params={{ token: briefing.public_token }}>
              <Button variant="outline" size="sm">Visualizar como cliente</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={removeBriefing} className="gap-1.5 text-destructive">
              <Trash2 className="w-4 h-4" /> Excluir briefing
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="eyebrow">Perguntas</span>
            <h2 className="font-display text-3xl mt-2">{questions.length} no roteiro</h2>
          </div>
          <Button onClick={addQuestion} className="gap-2">
            <Plus className="w-4 h-4" /> Nova pergunta
          </Button>
        </div>

        <div className="space-y-8">
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              index={i}
              question={q}
              options={options.filter((o) => o.question_id === q.id)}
              onChange={refetch}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function QuestionEditor({
  index, question, options, onChange,
}: { index: number; question: Question; options: QuestionOption[]; onChange: () => void }) {
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
      toast.error("Erro", { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Excluir esta pergunta?")) return;
    await deleteQuestion(question.id);
    onChange();
  };

  const addOption = async () => {
    await createOption({
      question_id: question.id,
      order_index: options.length,
      label: "Opção",
    });
    onChange();
  };

  return (
    <article className="border border-border/60 rounded-sm bg-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <span className="eyebrow">Pergunta {index + 1}</span>
        <Button variant="ghost" size="sm" onClick={remove} className="text-destructive gap-1.5">
          <Trash2 className="w-3.5 h-3.5" /> Remover
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
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
          </div>
        </div>
      )}
    </article>
  );
}

function OptionEditor({ option, onChange }: { option: QuestionOption; onChange: () => void }) {
  const [label, setLabel] = useState(option.label);
  const [tag, setTag] = useState(option.tag ?? "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setLabel(option.label); setTag(option.tag ?? ""); }, [option.id]);

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
    await updateOption(option.id, { label, tag: tag || null });
    onChange();
  };

  const remove = async () => {
    await deleteOption(option.id);
    onChange();
  };

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
        <Button variant="ghost" size="sm" onClick={remove} className="w-full h-7 text-xs text-destructive gap-1">
          <X className="w-3 h-3" /> Remover
        </Button>
      </div>
    </div>
  );
}
