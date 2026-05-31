import jsPDF from "jspdf";

export function exportReportPdf(opts: {
  clientName: string;
  projectType: string;
  reportText: string;
  styleProfile?: Record<string, number> | null;
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  let y = margin;

  // Header
  doc.setFont("times", "italic");
  doc.setFontSize(22);
  doc.setTextColor(40, 30, 25);
  doc.text("Beatriz Ribeiro", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 110, 100);
  doc.text("ARQUITETURA · INTERIORES", margin, y);

  y += 24;
  doc.setDrawColor(200, 190, 180);
  doc.line(margin, y, pageW - margin, y);

  y += 36;
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 130, 120);
  doc.text("RELATÓRIO INTERPRETATIVO INTERNO", margin, y);

  y += 22;
  doc.setFont("times", "italic");
  doc.setFontSize(20);
  doc.setTextColor(40, 30, 25);
  const titleLines = doc.splitTextToSize(opts.clientName, pageW - margin * 2);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 100, 90);
  doc.text(opts.projectType, margin, y);
  y += 24;

  // Style profile chips
  if (opts.styleProfile && Object.keys(opts.styleProfile).length) {
    const sorted = Object.entries(opts.styleProfile).sort((a, b) => b[1] - a[1]).slice(0, 6);
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
      doc.setDrawColor(180, 165, 150);
      doc.setFillColor(245, 240, 232);
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
      y += 8;
      doc.setFont("times", "italic");
      doc.setFontSize(14);
      doc.setTextColor(80, 60, 45);
      const h = doc.splitTextToSize(headingMatch[1], pageW - margin * 2);
      doc.text(h, margin, y);
      y += h.length * 18 + 6;
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

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
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
