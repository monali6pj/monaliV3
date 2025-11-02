
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), { status: 500 });
    }
    const form = await req.formData();
    const file = form.get('file') as File|null;
    if (!file) return new Response(JSON.stringify({ error: "no_file" }), { status: 400 });
    const mform = new FormData();
    mform.append('file', file, file.name);
    mform.append('model', 'whisper-1');
    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: mform as any
    });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "openai_error", detail: t }), { status: 500 });
    }
    const data = await r.json();
    return new Response(JSON.stringify({ text: data.text || "" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e:any) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), { status: 500 });
  }
}
