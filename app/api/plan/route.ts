
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { qa } = await req.json(); // [{q,a}]
    if (!process.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), { status: 500 });
    }

    const prompt = `Tu es un kinésithérapeute prudent. À partir de ce dialogue kiné↔patient (questions/réponses), produis :
1) une synthèse clinique brève (pas de copier-coller),
2) un plan initial (3–5 exercices max, niveau adapté),
3) 1–2 éléments mind-body (méditation/sophro/capsule),
4) des garde-fous sécurité (ex: douleur>5/10 → pause/alternative),
5) notes pour le médecin traitant.

Réponds STRICTEMENT en JSON :
{
  "summary": "…",
  "exercises": [
    {"content_id":"ex_squat_box_01","level":1,"sets":3,"reps_or_time":"8 reps","cues":["genoux stables","dos long"],"stop_if":["douleur>5"]}
  ],
  "mind_body":[{"content_id":"med_scan_body_01","duration_sec":300}],
  "notes":"…"
}

Dialogue :
${"${JSON.stringify(qa, null, 2)}"}
`;

    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key="+process.env.GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents:[{ role:"user", parts:[{ text: prompt }]}] })
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "gemini_error", detail: t }), { status: 500 });
    }
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    let json;
    try { json = JSON.parse(text); }
    catch {
      const m = text.match(/\{[\s\S]*\}/);
      json = m ? JSON.parse(m[0]) : {};
    }
    return new Response(JSON.stringify(json), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), { status: 500 });
  }
}
