import jsPDF from "jspdf";

type SelectedImage = {
  questionTitle: string;
  label: string;
  tag: string | null;
  interpretation: string | null;
  imageUrl: string;
};

async function loadImageDataUrl(url: string): Promise<{ dataUrl: string; format: "JPEG" | "PNG" } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const format: "JPEG" | "PNG" = blob.type.includes("png") ? "PNG" : "JPEG";
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { dataUrl, format };
  } catch {
    return null;
  }
}

export async function exportReportPdf(opts: {
  clientName: string;
  projectType: string;
  reportText: string;
  styleProfile?: Record<string, number> | null;
  selectedImages?: SelectedImage[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  let y = margin;

  // ====== COVER ======
  doc.setFillColor(247, 242, 232);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFont("times", "italic");
  doc.setFontSize(36);
  doc.setTextColor(40, 30, 25);
  doc.text("Beatriz Ribeiro", margin, pageH / 2 - 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 110, 100);
  doc.text("ARQUITETURA  ·  INTERIORES", margin, pageH / 2 - 22);

  doc.setDrawColor(180, 145, 110);
  doc.setLineWidth(0.8);
  doc.line(margin, pageH / 2, margin + 60, pageH / 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 130, 120);
  doc.text("RELATÓRIO INTERPRETATIVO INTERNO", margin, pageH / 2 + 26);

  doc.setFont("times", "italic");
  doc.setFontSize(30);
  doc.setTextColor(40, 30, 25);
  const titleLines = doc.splitTextToSize(opts.clientName, pageW - margin * 2);
  doc.text(titleLines, margin, pageH / 2 + 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(110, 100, 90);
  doc.text(opts.projectType, margin, pageH / 2 + 56 + titleLines.length * 30);

  doc.setFontSize(7);
  doc.setTextColor(150, 140, 130);
  doc.text(
    new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase(),
    margin,
    pageH - margin,
  );

  // ====== REPORT BODY ======
  doc.addPage();
  y = margin;

  doc.setFont("times", "italic");
  doc.setFontSize(10);
  doc.setTextColor(140, 130, 120);
  doc.text("Beatriz Ribeiro", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("RELATÓRIO INTERPRETATIVO", pageW - margin, y, { align: "right" });
  y += 8;
  doc.setDrawColor(220, 210, 195);
  doc.line(margin, y, pageW - margin, y);
  y += 30;

  doc.setFont("times", "italic");
  doc.setFontSize(22);
  doc.setTextColor(40, 30, 25);
  doc.text("Síntese interpretativa", margin, y);
  y += 30;

  // Style profile chips
  if (opts.styleProfile && Object.keys(opts.styleProfile).length) {
    const sorted = Object.entries(opts.styleProfile).sort((a, b) => b[1] - a[1]).slice(0, 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 100, 90);
    doc.text("PERFIL DE ESCOLHAS", margin, y);
    y += 14;
    let x = margin;
    doc.setFontSize(9);
    for (const [tag, count] of sorted) {
      const text = `${tag} · ${count}`;
      const w = doc.getTextWidth(text) + 14;
      if (x + w > pageW - margin) { x = margin; y += 22; }
      doc.setDrawColor(180, 145, 110);
      doc.setFillColor(243, 235, 220);
      doc.roundedRect(x, y - 10, w, 16, 3, 3, "FD");
      doc.setTextColor(80, 65, 55);
      doc.text(text, x + 7, y);
      x += w + 6;
    }
    y += 28;
  }

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(45, 38, 32);

  const sections = opts.reportText.split(/\n(?=#{1,3} )/);
  for (const section of sections) {
    const [firstLine, ...rest] = section.split("\n");
    const headingMatch = firstLine.match(/^#{1,3}\s+(.*)$/);
    if (headingMatch) {
      if (y > pageH - margin - 60) { doc.addPage(); y = margin; }
      y += 10;
      doc.setFont("times", "italic");
      doc.setFontSize(15);
      doc.setTextColor(80, 60, 45);
      const h = doc.splitTextToSize(headingMatch[1], pageW - margin * 2);
      doc.text(h, margin, y);
      y += h.length * 19 + 4;
      doc.setDrawColor(200, 175, 145);
      doc.setLineWidth(0.4);
      doc.line(margin, y, margin + 28, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(45, 38, 32);
      writeBody(rest.join("\n"));
    } else {
      writeBody(section);
    }
  }

  function writeBody(text: string) {
    const clean = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
    const paragraphs = clean.split(/\n\s*\n/);
    for (const para of paragraphs) {
      if (!para.trim()) continue;
      const lines = doc.splitTextToSize(para.trim(), pageW - margin * 2);
      for (const line of lines) {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += 14;
      }
      y += 6;
    }
  }

  // ====== MOODBOARD ======
  const images = (opts.selectedImages ?? []).filter((i) => !!i.imageUrl);
  if (images.length) {
    doc.addPage();
    y = margin;
    doc.setFont("times", "italic");
    doc.setFontSize(10);
    doc.setTextColor(140, 130, 120);
    doc.text("Beatriz Ribeiro", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("MOODBOARD DAS ESCOLHAS", pageW - margin, y, { align: "right" });
    y += 8;
    doc.setDrawColor(220, 210, 195);
    doc.line(margin, y, pageW - margin, y);
    y += 30;

    doc.setFont("times", "italic");
    doc.setFontSize(22);
    doc.setTextColor(40, 30, 25);
    doc.text("Universo visual", margin, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 100, 90);
    doc.text("As referências escolhidas pelo cliente, na ordem das perguntas.", margin, y);
    y += 24;

    const cols = 2;
    const gap = 18;
    const cellW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
    const imgH = cellW * 0.7;
    let col = 0;

    for (const img of images) {
      const loaded = await loadImageDataUrl(img.imageUrl);
      if (!loaded) continue;

      const cellH = imgH + 60;
      if (y + cellH > pageH - margin) {
        doc.addPage();
        y = margin;
        col = 0;
      }
      const x = margin + col * (cellW + gap);

      try {
        doc.addImage(loaded.dataUrl, loaded.format, x, y, cellW, imgH, undefined, "FAST");
      } catch {
        doc.setDrawColor(220, 210, 195);
        doc.rect(x, y, cellW, imgH);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(140, 130, 120);
      doc.text(img.questionTitle.toUpperCase().slice(0, 60), x, y + imgH + 12);

      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.setTextColor(40, 30, 25);
      const labelLines = doc.splitTextToSize(img.label, cellW);
      doc.text(labelLines[0] ?? "", x, y + imgH + 26);

      if (img.tag) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(150, 110, 75);
        doc.text(`#${img.tag}`, x, y + imgH + 40);
      }

      col++;
      if (col >= cols) {
        col = 0;
        y += cellH;
      }
    }
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(160, 150, 140);
    doc.text("Beatriz Ribeiro Arquitetura e Interiores", margin, pageH - 24);
    doc.text(`${i} / ${pageCount}`, pageW - margin, pageH - 24, { align: "right" });
  }

  const slug = opts.clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`relatorio-${slug}.pdf`);
}
