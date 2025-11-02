
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { qa, plan } = await req.json();
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const margin = 40;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - margin;
    const set = (txt: string, size=12, bold=false) => {
      const lines = wrapText(txt, bold?fontB:font, size, width - margin*2);
      lines.forEach(line => {
        y -= size + 2;
        page.drawText(line, { x: margin, y, size, font: bold?fontB:font, color: rgb(0.1,0.1,0.1) });
      });
      y -= 6;
    };

    // Header
    set("Monali — Compte-rendu clinique", 18, true);
    const date = new Date().toLocaleDateString('fr-FR');
    set(`Date : ${date}`, 12, false);

    // Synthèse QA
    set("Bilan (questions / réponses)", 14, true);
    (qa||[]).forEach((x:any, i:number)=>{
      set(`${i+1}. ${x.q}`, 12, true);
      set(`${x.a}`, 12, false);
    });

    // Plan
    set("Plan de soin proposé", 14, true);
    if (plan?.summary) set(`Synthèse: ${plan.summary}`, 12, false);
    const exo = plan?.exercises||[];
    if (exo.length){
      set("Exercices:", 12, true);
      exo.forEach((e:any, i:number)=>{
        set(`- ${e.content_id} — ${e.reps_or_time} × ${e.sets} séries`, 12, false);
        if (e.cues?.length) set(`  Cues: ${e.cues.join(' • ')}`, 12, false);
        if (e.stop_if?.length) set(`  Stop si: ${e.stop_if.join(' / ')}`, 12, false);
      });
    }
    const mb = plan?.mind_body||[];
    if (mb.length){
      set("Mind-Body:", 12, true);
      mb.forEach((m:any)=> set(`- ${m.content_id} ${m.duration_sec?('— '+Math.round(m.duration_sec/60)+' min'):''}`, 12, false));
    }
    if (plan?.notes) set(`Notes: ${plan.notes}`, 12, false);

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, { status: 200, headers: { "Content-Type": "application/pdf" } });
  } catch (e:any) {
    return new Response("Erreur PDF", { status: 500 });
  }
}

function wrapText(text: string, font: any, size: number, maxWidth: number) {
  const words = (text||'').split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const test = current ? current + ' ' + w : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
