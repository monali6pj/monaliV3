
# Monali v3 — Beau + PDF + iPhone

## Inclus
- UI design (gradient, glass, stepper, chat-bubbles).
- Bilan guidé **kiné ↔ patient** (Q→R→suivante).
- **Plan IA** via Gemini (`/api/plan`) — nécessite `GEMINI_API_KEY`.
- **Courrier médecin PDF** via `/api/report` (pdf-lib).
- **iPhone OK** : bouton "Enregistrer & Transcrire" qui envoie à `/api/transcribe` (Whisper) — nécessite `OPENAI_API_KEY`.

## Déploiement Vercel
1. Importer le projet (Next.js auto).
2. Variables d'env :
   - `GEMINI_API_KEY` (Google AI Studio)
   - `OPENAI_API_KEY` (pour Whisper iPhone)
3. Deploy, ouvrir l'URL.

## Utilisation
- Chrome/Android : utiliser "🎤 Enregistrer (local)".
- iPhone/Safari : utiliser "📱 Enregistrer & Transcrire".
- Une fois toutes les questions validées → **Générer le bilan + plan** → **Courrier médecin (PDF)**.

## Où modifier
- Questions : `app/page.tsx` → `QUESTIONS`
- Prompt IA : `app/api/plan/route.ts`
- Style : `app/globals.css` + classes Tailwind
