import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createBriefing,
  createQuestion,
  deleteQuestion,
  getLibraryBriefingContent,
  importQuestionTemplate,
  type Question,
  type QuestionOption,
} from "@/lib/briefing-queries";
import { PageShell } from "@/components/Brand";
import { KindBadge } from "@/components/KindBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ChevronDown, ChevronRight, Library, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

type LibraryQuestion = Question & { options: QuestionOption[] };
type ModuleKey = Question["kind"];

const moduleLabels: Record<ModuleKey, string> = {
  single: "Escolhas visuais",
  multi: "Seleções múltiplas",
  text: "Perguntas abertas",
};

function LibraryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [newTitle, setNewTitle] = useState("");
  const [newKind, setNewKind] = useState<Question["kind"]>("single");
  const [clientName, setClientName] = useState("");
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [creatingBriefing, setCreatingBriefing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["library-briefing"],
    queryFn: getLibraryBriefingContent,
  });

  const questions = useMemo<LibraryQuestion[]>(() => {
    if (!data) return [];
    return data.questions.map((question) => ({
      ...question,
      options: data.options.filter((option) => option.question_id === question.id),
    }));
  }, [data]);

  const modules = useMemo(() => {
    return (["single", "multi", "text"] as ModuleKey[])
      .map((kind) => ({
        kind,
        title: moduleLabels[kind],
        questions: questions.filter((question) => question.kind === kind),
      }))
      .filter((module) => module.questions.length > 0);
  }, [questions]);

  useEffect(() => {
    setCollapsed((current) => {
      const next = { ...current };
      for (const module of modules) {
        if (!(module.kind in next)) next[module.kind] = true;
      }
      return next;
    });
  }, [modules]);

  const selectedSet = new Set(selectedIds);

  const toggleQuestion = (id: string, checked: boolean) => {
    setSelectedIds((current) => checked ? [...current, id] : current.filter((selectedId) => selectedId !== id));
  };

  const toggleModule = (ids: string[], checked: boolean) => {
    setSelectedIds((current) => {
      const withoutModule = current.filter((id) => !ids.includes(id));
      return checked ? [...withoutModule, ...ids] : withoutModule;
    });
  };

  const addQuestion = async () => {
    const title = newTitle.trim() || "Nova pergunta da biblioteca";
    setCreatingQuestion(true);
    try {
      await createQuestion({
        briefing_id: data!.briefing.id,
        order_index: questions.length,
        title,
        kind: newKind,
      });
      setNewTitle("");
      await refetch();
      toast.success("Pergunta criada na biblioteca");
    } catch (e: any) {
      toast.error("Erro ao criar pergunta", { description: e.message });
    } finally {
      setCreatingQuestion(false);
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Apagar ${selectedIds.length} pergunta${selectedIds.length === 1 ? "" : "s"} da biblioteca?`)) return;
    try {
      for (const id of selectedIds) {
        await deleteQuestion(id);
      }
      setSelectedIds([]);
      await refetch();
      toast.success("Perguntas removidas");
    } catch (e: any) {
      toast.error("Erro ao apagar", { description: e.message });
    }
  };

  const createBriefingFromSelection = async () => {
    if (selectedIds.length === 0) return;
    setCreatingBriefing(true);
    try {
      const briefing = await createBriefing({
        client_name: clientName.trim() || "Novo cliente",
        project_type: "Projeto residencial",
        title: "Briefing visual",
        intro: "Bem-vindo(a) a uma jornada visual para descobrirmos juntos a alma do seu projeto.",
      });

      for (const [index, questionId] of selectedIds.entries()) {
        await importQuestionTemplate({
          briefing_id: briefing.id,
          template_question_id: questionId,
          next_order_index: index,
        });
      }

      await qc.invalidateQueries({ queryKey: ["briefings"] });
      navigate({ to: "/editor/$id", params: { id: briefing.id } });
    } catch (e: any) {
      toast.error("Erro ao criar briefing", { description: e.message });
      setCreatingBriefing(false);
    }
  };

  if (isLoading || !data) {
    return <PageShell><div className="mx-auto max-w-6xl px-6 py-16 text-muted-foreground">Carregando biblioteca…</div></PageShell>;
  }

  return (
    <PageShell>
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Painel
          </Link>
          <Link to="/editor/$id" params={{ id: data.briefing.id }}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Editar acervo completo
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <span className="eyebrow">Acervo interno</span>
        <div className="mt-3 grid gap-8 lg:grid-cols-[1fr_360px] items-end">
          <div>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05]">
              Biblioteca de<br />
              <em className="text-accent">perguntas.</em>
            </h1>
            <p className="mt-5 text-muted-foreground max-w-2xl leading-relaxed">
              Gerencie as perguntas padrão da casa, selecione módulos inteiros ou itens avulsos e monte um briefing novo a partir do acervo.
            </p>
          </div>

          <div className="border border-border/60 bg-card p-4 rounded-sm space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Nome do cliente"
                className="h-10"
              />
              <Button onClick={createBriefingFromSelection} disabled={selectedIds.length === 0 || creatingBriefing} className="gap-2 h-10">
                {creatingBriefing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Criar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedIds.length} pergunta{selectedIds.length === 1 ? "" : "s"} selecionada{selectedIds.length === 1 ? "" : "s"} para o próximo briefing.
            </p>
          </div>
        </div>
      </section>

      <div className="rule mx-auto max-w-6xl" />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="border border-border/60 bg-card rounded-sm p-4 grid gap-3 md:grid-cols-[1fr_220px_160px] items-center">
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Título da nova pergunta"
            className="h-10"
          />
          <Select value={newKind} onValueChange={(value) => setNewKind(value as Question["kind"])}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Escolha única</SelectItem>
              <SelectItem value="multi">Múltipla escolha</SelectItem>
              <SelectItem value="text">Resposta em texto</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={addQuestion} disabled={creatingQuestion} className="gap-2 h-10">
            {creatingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Nova pergunta
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {questions.length} pergunta{questions.length === 1 ? "" : "s"} no acervo.
          </p>
          <Button variant="outline" size="sm" onClick={deleteSelected} disabled={selectedIds.length === 0} className="gap-1.5 text-destructive">
            <Trash2 className="w-3.5 h-3.5" /> Apagar selecionadas
          </Button>
        </div>

        <div className="mt-6 space-y-3">
          {modules.map((module) => {
            const ids = module.questions.map((question) => question.id);
            const selectedCount = ids.filter((id) => selectedSet.has(id)).length;
            const isCollapsed = collapsed[module.kind] ?? true;
            return (
              <section key={module.kind} className="border border-border/60 rounded-sm bg-card overflow-hidden">
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCollapsed((current) => ({ ...current, [module.kind]: !isCollapsed }))}
                    className="flex items-center gap-3 text-left"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>
                      <span className="eyebrow">Módulo</span>
                      <span className="block font-display text-2xl leading-tight">{module.title}</span>
                    </span>
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {selectedCount}/{ids.length} selecionadas
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleModule(ids, selectedCount !== ids.length)}
                    >
                      {selectedCount === ids.length ? "Desmarcar módulo" : "Selecionar módulo"}
                    </Button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="border-t border-border/60 divide-y divide-border/60">
                    {module.questions.map((question) => (
                      <LibraryQuestionRow
                        key={question.id}
                        question={question}
                        checked={selectedSet.has(question.id)}
                        onCheckedChange={(checked) => toggleQuestion(question.id, checked)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}

          {modules.length === 0 && (
            <div className="border border-dashed border-border rounded-sm py-16 text-center text-muted-foreground">
              A biblioteca ainda está vazia. Crie a primeira pergunta acima.
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function LibraryQuestionRow({
  question, checked, onCheckedChange,
}: {
  question: LibraryQuestion;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <article className="p-4 grid gap-4 md:grid-cols-[28px_1fr_auto] items-start hover:bg-muted/30 transition-colors">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value === true)} className="mt-1" />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <KindBadge kind={question.kind} size="xs" />
          <span className="text-xs text-muted-foreground">#{question.order_index + 1}</span>
          <span className="text-xs text-muted-foreground">{question.options.length} opções</span>
        </div>
        <h2 className="font-display text-xl leading-tight mt-2">{question.title}</h2>
        {question.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{question.description}</p>
        )}
        {question.options.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {question.options.slice(0, 10).map((option) => (
              <div key={option.id} className="w-16 flex-shrink-0">
                <div className="aspect-square bg-muted rounded-sm overflow-hidden border border-border/60">
                  {option.image_url && <img src={option.image_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <p className="text-[0.65rem] truncate mt-1 text-muted-foreground">{option.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <Library className="w-4 h-4 text-muted-foreground" />
      </div>
    </article>
  );
}
