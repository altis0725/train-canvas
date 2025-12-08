import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Link } from "wouter";
import StarryBackground from "@/components/StarryBackground";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen bg-[#050a14] text-white overflow-x-hidden font-sans">
      <StarryBackground />

      <main className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="flex-1 flex flex-col items-center justify-center relative pt-20 pb-32">

          {/* Top Label */}
          <div className="mb-6 animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <span className="text-blue-300 tracking-widest text-sm md:text-base font-medium drop-shadow-md">
              水間鉄道プロジェクションマッピングサービス
            </span>
          </div>

          {/* Main Visual Container */}
          <div className="relative w-full max-w-7xl mx-auto px-4 mb-16">
            <div className="relative aspect-[16/9] md:aspect-[21/9] flex items-center justify-center group">

              {/* Train Image (Placeholder for now, using a high quality night train or abstract train) */}
              {/* In a real scenario, we'd use the user's uploaded image or a specific asset. 
                  Here I'll use a placeholder that fits the vibe or a div with the train effect. */}
              <div className="relative w-full h-full bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 rounded-xl border border-blue-500/30 flex items-center justify-center overflow-hidden group">
                <img
                  src="/mizuma_train_projection.png"
                  alt="Mizuma Railway Kuha 553 with Projection Mapping"
                  className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                />
                {/* Overlay Gradient for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050a14] via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050a14]/50 via-transparent to-[#050a14]/50" />
              </div>

              {/* Title Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-white mb-4 drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  TrainCanvas
                </h1>
                <p className="text-xl md:text-3xl text-gray-200 font-medium tracking-widest drop-shadow-lg">
                  君だけの電車を、夜空に描こう
                </p>
              </div>

              {/* Geometric Decorations (as seen in reference) */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-50 hidden md:block" />
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-blue-500 to-transparent opacity-50 hidden md:block" />
            </div>
          </div>

          {/* CTA Button */}
          <div className="relative z-20 animate-slide-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            {isAuthenticated ? (
              <Link href="/create">
                <Button size="lg" className="h-20 px-16 text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-none rounded-sm shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] transition-all duration-300 skew-x-[-10deg]">
                  <span className="skew-x-[10deg]">無料で体験する</span>
                </Button>
              </Link>
            ) : (
              <Button asChild size="lg" className="h-20 px-16 text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-none rounded-sm shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] transition-all duration-300 skew-x-[-10deg]">
                <a href={getLoginUrl()} className="flex items-center justify-center w-full h-full">
                  <span className="skew-x-[10deg]">無料で体験する</span>
                </a>
              </Button>
            )}
          </div>

        </section>

        {/* Footer Navigation */}
        <footer className="w-full border-t border-white/10 bg-black/60 backdrop-blur-md relative z-20 mt-auto">
          <div className="container py-8">
            <nav className="flex justify-center gap-8 md:gap-16 text-gray-400 text-sm md:text-base font-light tracking-wider">
              {['サービス紹介', 'ギャラリー', '運行情報', 'お問い合わせ'].map((item) => (
                <button
                  key={item}
                  className="hover:text-cyan-400 transition-colors duration-300 relative group"
                >
                  {item}
                  <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-300 group-hover:w-full box-shadow-[0_0_10px_cyan]" />
                </button>
              ))}
            </nav>
          </div>
        </footer>
      </main>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-slide-up { animation: slide-up 1s ease-out; }
      `}</style>
    </div>
  );
}

