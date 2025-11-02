'use client';
import React, { useEffect, useRef, useState } from 'react';

type SpeechRecognitionType = typeof window extends any
  ? (window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition | any
  : any;

const QUESTIONS = [
  "Localisation et type de douleur ? (ex: lombaire, piqûre/tiraillement)",
  "Ancienneté + facteurs aggravants/soulageants ?",
  "Intensité moyenne/maximum (0–10) ?",
  "Sommeil, stress, activité récente ?",
  "Objectifs des 4 semaines ? Contre-indications connues ?"
];

type QA = { q: string; a: string };

export default function Home() {
  const [step, setStep] = useState(0);
  const [qa, setQA] = useState<QA[]>([]);
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState('prêt');
  const [plan, setPlan] = useState<any>(null);
  const [isIPhoneMode, setIsIPhoneMode] = useState(false);

  const recogRef = useRef<any>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Détecte iPhone/Safari
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad') || (ua.includes('safari') && !ua.includes('chrome'))) {
      setIsIPhoneMode(true);
    }
  }, []);

  // --- Reco locale (Chrome/Android)
  function startListenLocal() {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Reco locale indisponible sur ce navigateur."); return; }
    const r = new SR();
    r.lang = 'fr-FR';
    r.continuous = true;
    r.interimResults = true;
    r.onstart = () => { setListening(true); setStatus('écoute…'); };
    r.onend   = () => { setListening(false); setStatus('pause'); };
    r.onerror = () => { setListening(false); setStatus('erreur micro'); };
    r.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript.trim();
        if (e.results[i].isFinal) final += t + '\n';
      }
      if (final) setAnswer(prev => (prev + (prev && !prev.endsWith('\n') ? ' ' : '') + final));
    };
    r.start();
    recogRef.current = r;
  }
  function stopListenLocal() {
    if (recogRef.current) recogRef.current.stop();
  }

  // --- Enregistrement iPhone → /api/transcribe
  async function startRecordIPhone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const file = new File([blob], mime === 'audio/webm' ? 'audio.webm' : 'audio.m4a', { type: mime });
        const form = new FormData();
        form.append('file', file);
        setStatus('transcription…');
        const res = await fetch('/api/transcribe', { method: 'POST', body: form });
        if (!res.ok) { setStatus('erreur transcription'); alert("Transcription impossible (OPENAI_API_KEY ?)"); return; }
        const data = await res.json();
        setAnswer(prev => (prev + (prev ? '\n' : '') + (data.text || '')));
        setStatus('ok');
      };
      rec.start();
      mediaRecRef.current = rec;
      setListening(true);
      setStatus('enregistrement…');
    } catch (e) {
      console.error(e);
      alert('Accès micro refusé.');
    }
  }
  function stopRecordIPhone() {
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop();
      setListening(false);
    }
  }

  // --- Étape suivante
  function next() {
    const trimmed = answer.trim();
    if (!trimmed) { alert("Dis quelque chose avant de valider 😉"); return; }
    setQA(prev => [...prev, { q: QUESTIONS[step], a: trimmed }]);
    setAnswer('');
    setStep(s => s + 1);
    setStatus(step + 1 < QUESTIONS.length ? 'prêt' : 'bilan prêt à générer');
    stopListenLocal();
    stopRecordIPhone();
  }

  // --- Génère le plan
  async function generate() {
    setStatus('génération du plan…');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qa })
      });
      const data = await res.json();
      setPlan(data);
      setStatus('plan prêt');
    } catch (e) {
      console.error(e);
      setStatus('erreur plan');
      alert("Erreur génération plan (GEMINI_API_KEY ?)");
    }
  }

  // --- PDF médecin
  async function exportPDF() {
    try {
      setStatus('PDF…');
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qa, plan })
      });
      if (!res.ok) { setStatus('erreur PDF'); alert('Erreur génération PDF'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'courrier_medecin.pdf'; a.click();
      URL.revokeObjectURL(url);
      setStatus('plan prêt');
    } catch (e) {
      console.error(e);
      setStatus('erreur PDF');
    }
  }

  // ====== RENDER ======
  return (
    <div className="relative -mt-20">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Conversation */}
        <section className="glass rounded-xxl p-5 md:p-6 shadow-soft">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-4">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full ${i < step ? 'bg-brand-500' : 'bg-white/10'}`} />
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Bilan guidé — kiné ↔ patient</h2>
            <span className="text-xs text-gray-300/70">{status}</span>
          </div>

          {/* Chat bubbles */}
          <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
            {qa.map((x, i) => (
              <div key={i}>
                <div className="text-xs text-gray-400 mb-1">Question</div>
                <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">{x.q}</div>
                <div className="text-xs text-gray-400 mt-2 mb-1">Réponse</div>
                <div className="rounded-2xl bg-brand-500/10 border border-brand-500/30 px-4 py-3 whitespace-pre-wrap">{x.a}</div>
              </div>
            ))}
            {step < QUESTIONS.length && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Question</div>
                <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">{QUESTIONS[step]}</div>
              </div>
            )}
          </div>

          {/* Controls */}
          {step < QUESTIONS.length ? (
            <div className="mt-4 space-y-3">
              <textarea
                className="w-full h-28 rounded-2xl bg-black/40 border border-white/10 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Parlez (ou écrivez) la réponse du patient ici…"
              />
              <div className="flex flex-wrap gap-3">
                {!isIPhoneMode ? (
                  !listening
                    ? <button onClick={startListenLocal} className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 transition">🎤 Enregistrer (local)</button>
                    : <button onClick={stopListenLocal} className="px-4 py-2 rounded-xl bg-yellow-500/80 hover:bg-yellow-500 transition">⏸️ Pause</button>
                ) : (
                  !listening
                    ? <button onClick={startRecordIPhone} className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 transition">📱 Enregistrer & Transcrire</button>
                    : <button onClick={stopRecordIPhone} className="px-4 py-2 rounded-xl bg-yellow-500/80 hover:bg-yellow-500 transition">⏹️ Stop & Transcrire</button>
                )}
                <button onClick={() => setAnswer('')} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15">🧹 Effacer</button>
                <button onClick={next} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">➡️ Valider & continuer</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={generate} className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-soft">🧠 Générer le bilan + plan</button>
              {plan && <button onClick={exportPDF} className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15">📄 Courrier médecin (PDF)</button>}
            </div>
          )}
        </section>

        {/* Right: Plan */}
        <section className="glass rounded-xxl p-5 md:p-6 shadow-soft">
          <h2 className="text-lg font-semibold mb-1">Plan proposé</h2>
          {!plan && <p className="text-sm text-gray-300/80">Génère le plan pour l’afficher ici.</p>}
          {plan && (
            <div className="space-y-6">
              {plan.summary && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <h3 className="font-semibold mb-2">Synthèse</h3>
                  <p className="text-sm text-gray-200/90">{plan.summary}</p>
                </div>
              )}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <h3 className="font-semibold mb-2">Exercices (3–5)</h3>
                <ul className="space-y-2">
                  {(plan.exercises || []).map((x: any, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-lg bg-brand-500/30 flex items-center justify-center text-xs">{i + 1}</div>
                      <div>
                        <div className="font-medium">{x.content_id}</div>
                        <div className="text-xs text-gray-300/80">{x.reps_or_time} × {x.sets} séries</div>
                        <div className="text-xs text-gray-400/90">{(x.cues || []).join(' • ')}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {(plan.mind_body || []).length > 0 && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <h3 className="font-semibold mb-2">Mind-Body</h3>
                  <ul className="space-y-2">
                    {plan.mind_body.map((m: any, i: number) => (
                      <li key={i} className="flex items-center justify-between">
                        <div className="font-medium">{m.content_id}</div>
                        <div className="text-xs text-gray-300/80">{m.duration_sec ? `${Math.round(m.duration_sec / 60)} min` : ''}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {plan.notes && (
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-gray-200/90">{plan.notes}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
