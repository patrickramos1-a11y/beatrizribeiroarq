import { CheckCircle2, ListChecks, Type } from "lucide-react";

type Kind = "single" | "multi" | "text";

const map = {
  single: {
    label: "Escolha única",
    icon: CheckCircle2,
    cls: "bg-[oklch(0.62_0.085_45_/_0.12)] text-[oklch(0.45_0.085_45)] border-[oklch(0.62_0.085_45_/_0.3)]",
  },
  multi: {
    label: "Múltipla escolha",
    icon: ListChecks,
    cls: "bg-[oklch(0.45_0.055_50_/_0.12)] text-[oklch(0.35_0.055_50)] border-[oklch(0.45_0.055_50_/_0.3)]",
  },
  text: {
    label: "Resposta em texto",
    icon: Type,
    cls: "bg-[oklch(0.22_0.012_50_/_0.08)] text-[oklch(0.22_0.012_50)] border-[oklch(0.22_0.012_50_/_0.2)]",
  },
} as const;

export function KindBadge({ kind, size = "sm" }: { kind: Kind; size?: "xs" | "sm" }) {
  const m = map[kind];
  const Icon = m.icon;
  const padding = size === "xs" ? "px-2 py-0.5 text-[0.65rem]" : "px-2.5 py-1 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm border font-medium tracking-wide uppercase ${padding} ${m.cls}`}
    >
      <Icon className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {m.label}
    </span>
  );
}

const statusMap: Record<string, { label: string; cls: string; desc: string }> = {
  draft: {
    label: "Rascunho",
    desc: "Em edição, ainda não enviado",
    cls: "bg-muted text-muted-foreground border-border",
  },
  sent: {
    label: "Aguardando cliente",
    desc: "Link enviado, aguardando início",
    cls: "bg-[oklch(0.92_0.012_75_/_0.6)] text-[oklch(0.35_0.018_60)] border-border",
  },
  in_progress: {
    label: "Em preenchimento",
    desc: "Cliente está respondendo",
    cls: "bg-[oklch(0.62_0.085_45_/_0.15)] text-[oklch(0.42_0.085_45)] border-[oklch(0.62_0.085_45_/_0.3)]",
  },
  completed: {
    label: "Concluído",
    desc: "Pronto para análise",
    cls: "bg-[oklch(0.45_0.055_50_/_0.15)] text-[oklch(0.32_0.055_50)] border-[oklch(0.45_0.055_50_/_0.4)]",
  },
  archived: {
    label: "Arquivado",
    desc: "Arquivado",
    cls: "bg-muted text-muted-foreground border-border opacity-70",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border", desc: "" };
  return (
    <span
      title={s.desc}
      className={`inline-flex items-center rounded-sm border px-2.5 py-1 text-xs font-medium tracking-wide uppercase ${s.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 opacity-70" />
      {s.label}
    </span>
  );
}
