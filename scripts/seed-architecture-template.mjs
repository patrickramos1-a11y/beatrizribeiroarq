import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const envText = await readFile(".env", "utf8").catch(() => "");
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key, rest.join("=").replace(/^["']|["']$/g, "")];
    }),
);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL/key in .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const images = {
  contemporaryHouse: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
  modernHouse: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
  industrialHouse: "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80",
  rusticHouse: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=80",
  facadeGarden: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=900&q=80",
  livingClear: "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=900&q=80",
  livingWood: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
  livingNeutral: "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=900&q=80",
  livingWide: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80",
  kitchenOpen: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=80",
  kitchenSemi: "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=900&q=80",
  kitchenClosed: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
  kitchenIsland: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?auto=format&fit=crop&w=900&q=80",
  diningIntegrated: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=900&q=80",
  diningNeutral: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=900&q=80",
  bedroomClear: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80",
  bedroomWood: "https://images.unsplash.com/photo-1617325247661-675ab4b64b85?auto=format&fit=crop&w=900&q=80",
  bedroomHotel: "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=900&q=80",
  closetOpen: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=900&q=80",
  closetClosed: "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?auto=format&fit=crop&w=900&q=80",
  bathroomClear: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=900&q=80",
  bathroomTub: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=900&q=80",
};

function paletteSvg(colors) {
  const rects = colors
    .map((color, index) => `<rect x="${index * 200}" y="0" width="200" height="520" fill="${color}"/>`)
    .join("");
  return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">${rects}</svg>`)}`;
}

function section(sectionTitle, description = "") {
  return `[section:${sectionTitle}]${description ? `\n${description}` : ""}`;
}

const template = [
  { section: "Sobre vocês", title: "Nome", kind: "text", required: true },
  { section: "Sobre vocês", title: "Quem irá morar na residência?", kind: "text", required: true },
  { section: "Sobre vocês", title: "Idades dos moradores", kind: "text" },
  { section: "Sobre vocês", title: "Possuem animais de estimação?", kind: "single", options: ["Sim", "Não"] },
  { section: "Sobre vocês", title: "Recebem visitas com frequência?", kind: "single", options: ["Sim", "Não"] },
  { section: "Sobre vocês", title: "Se sim, quantas pessoas normalmente?", kind: "text" },
  {
    section: "Rotina da casa",
    title: "O que é mais importante para vocês?",
    description: "Escolha até 3 opções.",
    kind: "multi",
    options: ["Conforto", "Praticidade", "Organização", "Receber amigos e familiares", "Sofisticação", "Integração dos ambientes", "Privacidade", "Facilidade de manutenção", "Espaços amplos", "Contato com área externa"],
  },
  {
    section: "Estilo de arquitetura",
    title: "Qual estilo mais representa a casa dos seus sonhos?",
    kind: "single",
    options: [
      ["Contemporâneo", images.contemporaryHouse, "contemporâneo, linhas retas, tons neutros, sofisticação discreta"],
      ["Moderno", images.modernHouse, "moderno, minimalista, funcionalidade, amplitude"],
      ["Industrial", images.industrialHouse, "industrial, concreto, metal, linguagem urbana"],
      ["Rústico contemporâneo", images.rusticHouse, "rústico contemporâneo, madeira, textura natural, aconchego"],
      ["Mistura de estilos", images.livingNeutral, "moodboard, composição, equilíbrio"],
    ],
  },
  {
    section: "Fachada",
    title: "Qual fachada mais agrada vocês?",
    kind: "single",
    options: [
      ["Fachada contemporânea clara", images.contemporaryHouse, "fachada clara, contemporânea"],
      ["Fachada moderna com linhas retas", images.modernHouse, "linhas retas, moderna"],
      ["Fachada com madeira/pedra/textura natural", images.rusticHouse, "madeira, pedra, textura natural"],
      ["Fachada sofisticada com paisagismo", images.facadeGarden, "paisagismo, sofisticação"],
    ],
  },
  { section: "Fachada", title: "O que gostaram em cada uma?", kind: "text" },
  { section: "Fachada", title: "O que não gostaram?", kind: "text" },
  {
    section: "Sala de estar",
    title: "Qual ambiente transmite mais a sensação que vocês desejam?",
    kind: "single",
    options: [
      ["Sala contemporânea clara", images.livingClear, "clean, tons neutros, iluminação"],
      ["Sala aconchegante com madeira", images.livingWood, "madeira, aconchego"],
      ["Sala sofisticada com tons neutros", images.livingNeutral, "sofisticada, tons neutros"],
      ["Sala integrada ampla", images.livingWide, "integrada, ampla"],
    ],
  },
  {
    section: "Cozinha",
    title: "Qual referência de cozinha mais agrada vocês?",
    kind: "single",
    options: [
      ["Cozinha aberta integrada", images.kitchenOpen, "cozinha aberta, integrada"],
      ["Cozinha semi integrada", images.kitchenSemi, "semi integrada"],
      ["Cozinha fechada elegante", images.kitchenClosed, "fechada, elegante"],
      ["Cozinha com ilha central", images.kitchenIsland, "ilha central"],
    ],
  },
  { section: "Cozinha", title: "Preferem:", kind: "single", options: ["Cozinha aberta", "Cozinha semi integrada", "Cozinha fechada"] },
  { section: "Cozinha", title: "Ilha é importante?", kind: "single", options: ["Sim", "Não", "Talvez"] },
  {
    section: "Sala de jantar",
    title: "Qual referência de sala de jantar mais combina com vocês?",
    kind: "single",
    options: [
      ["Sala de jantar integrada", images.diningIntegrated, "integrada"],
      ["Sala de jantar elegante e neutra", images.diningNeutral, "elegante, neutra"],
      ["Sala ampla para receber", images.livingWide, "receber, ampla"],
      ["Sala compacta e funcional", images.diningIntegrated, "compacta, funcional"],
    ],
  },
  { section: "Sala de jantar", title: "Mesa para:", kind: "single", options: ["4 pessoas", "6 pessoas", "8 pessoas", "10+ pessoas"] },
  {
    section: "Suíte master",
    title: "Qual quarto mais representa o que vocês desejam?",
    kind: "single",
    options: [
      ["Suíte clara e minimalista", images.bedroomClear, "minimalista, clara"],
      ["Suíte com madeira e aconchego", images.bedroomWood, "madeira, aconchego"],
      ["Suíte sofisticada", images.bedroomHotel, "sofisticação"],
      ["Suíte com atmosfera de hotelaria", images.bedroomHotel, "hotelaria, conforto"],
    ],
  },
  { section: "Closet", title: "O closet ideal precisa ter:", kind: "multi", options: ["Espaço para vestidos", "Espaço para ternos", "Espaço para bolsas", "Espaço para sapatos", "Penteadeira", "Espelho de corpo inteiro"] },
  {
    section: "Closet",
    title: "Qual referência de closet mais agrada vocês?",
    kind: "single",
    options: [
      ["Closet aberto", images.closetOpen, "aberto"],
      ["Closet fechado com portas", images.closetClosed, "fechado"],
      ["Closet com penteadeira", images.closetOpen, "penteadeira"],
      ["Closet sofisticado com iluminação", images.closetClosed, "iluminação, sofisticado"],
    ],
  },
  { section: "Banheiro", title: "O que é indispensável no banheiro?", kind: "multi", options: ["Duas cubas", "Banheira", "Chuveiro amplo", "Nichos", "Bancada extensa"] },
  {
    section: "Banheiro",
    title: "Qual referência de banheiro mais agrada vocês?",
    kind: "single",
    options: [
      ["Banheiro claro com bancada extensa", images.bathroomClear, "claro, bancada extensa"],
      ["Banheiro com duas cubas", images.bathroomClear, "duas cubas"],
      ["Banheiro com banheira", images.bathroomTub, "banheira"],
      ["Banheiro com nichos e chuveiro amplo", images.bathroomClear, "nichos, chuveiro amplo"],
    ],
  },
  { section: "Materiais e acabamentos", title: "Qual tom de madeira vocês preferem?", kind: "single", options: [["Clara", paletteSvg(["#e8d8bd", "#d8bf94", "#caa979", "#f5efe5"]), "madeira clara"], ["Média", paletteSvg(["#b98d5f", "#9f7046", "#c49a6c", "#e2c8a5"]), "madeira média"], ["Escura", paletteSvg(["#6f4b34", "#4a3024", "#866044", "#2f2119"]), "madeira escura"]] },
  { section: "Materiais e acabamentos", title: "Quais metais mais agradam?", kind: "multi", options: ["Preto", "Dourado", "Cromado", "Champagne"] },
  { section: "Materiais e acabamentos", title: "Quais pedras/acabamentos vocês mais gostam?", kind: "multi", options: ["Mármore", "Quartzo", "Granito", "Porcelanato"] },
  {
    section: "Paleta de cores",
    title: "Qual combinação mais agrada?",
    kind: "single",
    options: [
      ["Neutros claros", paletteSvg(["#f4efe6", "#d8c3a5", "#cdb894", "#b99365"]), "off-white, bege, areia, madeira clara"],
      ["Neutros sofisticados", paletteSvg(["#a69d92", "#8b7d70", "#eee9df", "#22201d"]), "cinza quente, taupe, branco quente, preto pontual"],
      ["Natural aconchegante", paletteSvg(["#7a805f", "#a77c52", "#d8ccb9", "#cbb99e"]), "verde oliva, madeira, linho, areia"],
      ["Elegante contrastada", paletteSvg(["#f8f7f2", "#191816", "#c8ad7f", "#e5dfd5"]), "branco, preto, champagne, mármore claro"],
    ],
  },
  {
    section: "O que não pode acontecer",
    title: "O que vocês não gostam?",
    description: "Conte o que vocês querem evitar no projeto. Exemplos: ambientes escuros, madeira escura, muito dourado, estilo clássico, muitos móveis, espaços pequenos, excesso de informação visual ou cores muito fortes.",
    kind: "text",
  },
  {
    section: "Sonho da casa",
    title: "Se pudesse escolher apenas três características para a nova casa, quais seriam?",
    kind: "multi",
    options: ["Confortável", "Elegante", "Funcional", "Ampla", "Integrada", "Aconchegante", "Sofisticada", "Fácil de manter", "Iluminada", "Acolhedora", "Outro"],
  },
];

const { data: existingLibrary, error: findError } = await supabase
  .from("briefings")
  .select("*")
  .eq("client_name", "Biblioteca de perguntas")
  .maybeSingle();
if (findError) throw findError;

let library = existingLibrary;
if (!library) {
  const { data, error } = await supabase
    .from("briefings")
    .insert({
      client_name: "Biblioteca de perguntas",
      project_type: "Reforma residencial / interiores",
      title: "Briefing de Arquitetura e Interiores",
      intro: "Briefing visual para entender rotina, necessidades, preferências estéticas, ambientes, materiais, paleta de cores e expectativas dos clientes.",
      status: "draft",
    })
    .select()
    .single();
  if (error) throw error;
  library = data;
} else {
  const { data, error } = await supabase
    .from("briefings")
    .update({
      project_type: "Reforma residencial / interiores",
      title: "Briefing de Arquitetura e Interiores",
      intro: "Briefing visual para entender rotina, necessidades, preferências estéticas, ambientes, materiais, paleta de cores e expectativas dos clientes.",
    })
    .eq("id", library.id)
    .select()
    .single();
  if (error) throw error;
  library = data;
}

const templateTitles = new Set(template.map((item) => item.title));
const { data: currentQuestions, error: questionError } = await supabase
  .from("questions")
  .select("id,title,description")
  .eq("briefing_id", library.id);
if (questionError) throw questionError;

const duplicateIds = (currentQuestions ?? [])
  .filter((question) => templateTitles.has(question.title) && String(question.description ?? "").startsWith("[section:"))
  .map((question) => question.id);

if (duplicateIds.length > 0) {
  await supabase.from("question_options").delete().in("question_id", duplicateIds);
  const { error } = await supabase.from("questions").delete().in("id", duplicateIds);
  if (error) throw error;
}

for (const [index, item] of template.entries()) {
  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      briefing_id: library.id,
      order_index: index,
      title: item.title,
      description: section(item.section, item.description),
      kind: item.kind,
      allow_comment: item.kind !== "text",
    })
    .select()
    .single();
  if (error) throw error;

  for (const [optionIndex, option] of (item.options ?? []).entries()) {
    const normalized = Array.isArray(option)
      ? { label: option[0], image_url: option[1] ?? null, tag: option[2] ?? null, interpretation: option[2] ?? null }
      : { label: option, image_url: null, tag: String(option).toLocaleLowerCase("pt-BR"), interpretation: null };

    const { error: optionError } = await supabase.from("question_options").insert({
      question_id: question.id,
      order_index: optionIndex,
      label: normalized.label,
      image_url: normalized.image_url,
      tag: normalized.tag,
      interpretation: normalized.interpretation,
    });
    if (optionError) throw optionError;
  }
}

console.log(`Template configurado: ${template.length} perguntas em ${new Set(template.map((item) => item.section)).size} seções.`);
