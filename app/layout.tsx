
export const metadata = { title: "Monali — Bilan IA", description: "Bilan vocal + plan de soin généré par IA" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <div className="relative">
          <div className="absolute inset-0 -z-10 h-[340px] bg-gradient-to-br from-brand-500/30 via-emerald-600/20 to-cyan-500/20 blur-3xl" />
          <header className="max-w-5xl mx-auto px-4 pt-8 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-soft">
                  <span className="font-bold">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight">Monali</h1>
                  <p className="text-sm text-gray-300/80">Assistant de soin — Bilan vocal & Plan IA</p>
                </div>
              </div>
              <div className="text-xs text-gray-300/70">MVP v3</div>
            </div>
          </header>
        </div>
        <main className="max-w-5xl mx-auto px-4">{children}</main>
        <footer className="max-w-5xl mx-auto px-4 py-10 text-center text-gray-400/70 text-sm">© Monali</footer>
      </body>
    </html>
  );
}
