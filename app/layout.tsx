// app/layout.tsx
import './globals.css';

export const metadata = {
  title: 'Monali — Bilan IA',
  description: 'Bilan vocal + plan de soin généré par IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="absolute inset-0 -z-10 h-[360px] bg-gradient-to-br from-brand-500/30 via-purple-400/20 to-pink-300/20 blur-3xl" />
        <header className="max-w-5xl mx-auto px-4 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-soft">
              <span className="font-bold">M</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Monali</h1>
              <p className="text-sm text-gray-300/80">Assistant de soin — Bilan vocal & Plan IA</p>
            </div>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4">{children}</main>
        <footer className="max-w-5xl mx-auto px-4 py-10 text-center text-gray-400/70 text-sm">© Monali</footer>
      </body>
    </html>
  );
}
