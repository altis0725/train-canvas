import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, MonitorPlay, Layers, Sparkles, TrainFront, CheckCircle, Smartphone } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden font-sans">
      {/* Hero Background */}
      <div className="fixed inset-0 z-0">
        <img
          src="/img/hero-train.png"
          alt="Night Train Projection"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-black/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#020617]/30 to-[#020617]" />
      </div>

      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="min-h-screen flex items-center justify-center pt-20 px-4">
          <motion.div
            className="max-w-7xl mx-auto w-full text-center"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="mb-6 inline-block">
              <span className="px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-sm md:text-base tracking-widest uppercase backdrop-blur-sm box-glow">
                Next Gen Projection Mapping
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl lg:text-9xl font-bold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-slate-300 text-glow"
            >
              NIGHT TRAIN<br />CANVAS
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto tracking-wide leading-relaxed"
            >
              夜の水間鉄道を、あなたのキャンバスに。<br />
              世界に一つだけのデジタルアートトレインを創ろう。
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col md:flex-row gap-4 justify-center items-center">
              {isAuthenticated ? (
                <Link href="/create">
                  <Button size="lg" className="h-16 px-10 text-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-none skew-x-[-10deg] shadow-[0_0_20px_rgba(6,182,212,0.4)] neon-button">
                    <span className="skew-x-[10deg] flex items-center gap-2">
                      今すぐ始める <ArrowRight className="h-5 w-5" />
                    </span>
                  </Button>
                </Link>
              ) : (
                <Button asChild size="lg" className="h-16 px-10 text-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-none skew-x-[-10deg] shadow-[0_0_20px_rgba(6,182,212,0.4)] neon-button">
                  <a href={getLoginUrl()}>
                    <span className="skew-x-[10deg] flex items-center gap-2">
                      LINEでログイン <ArrowRight className="h-5 w-5" />
                    </span>
                  </a>
                </Button>
              )}
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <span className="text-xs text-slate-400 tracking-widest uppercase">Scroll</span>
            <div className="w-px h-16 bg-gradient-to-b from-cyan-500 to-transparent animate-pulse" />
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-900 to-transparent" />

          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-glow">HOW IT WORKS</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                3ステップで完了。あなたのデザインが実際の電車に投影されます。
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-900 to-transparent z-0" />

              {[
                {
                  icon: Layers,
                  title: "SELECT",
                  desc: "テンプレートを選択",
                  sub: "3つのシーンを選ぶだけ"
                },
                {
                  icon: Sparkles,
                  title: "COMBINE",
                  desc: "AIが自動合成",
                  sub: "シームレスな映像を生成"
                },
                {
                  icon: TrainFront,
                  title: "PROJECT",
                  desc: "夜間投影体験",
                  sub: "停車中の車両がキャンバスに"
                }
              ].map((step, i) => (
                <motion.div
                  key={i}
                  className="relative z-10 flex flex-col items-center text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                >
                  <div className="w-24 h-24 rounded-2xl bg-[#0f172a] border border-cyan-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] group hover:border-cyan-400 transition-colors duration-300">
                    <step.icon className="w-10 h-10 text-cyan-400 group-hover:text-cyan-200 transition-colors duration-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 tracking-wider">{step.title}</h3>
                  <p className="text-lg text-white font-medium mb-1">{step.desc}</p>
                  <p className="text-sm text-slate-400">{step.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PLANS SECTION */}
        <section className="py-32 bg-[#020617]/80 backdrop-blur-sm relative">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-glow-purple">PLANS</h2>
              <p className="text-slate-400">
                まずは無料体験から。感動の1分間投影プランもご用意。
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

              {/* FREE PLAN */}
              <motion.div
                className="glass-panel p-8 rounded-2xl border-white/5 hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-300 mb-2">FREE TRIAL</h3>
                  <div className="text-4xl font-bold text-white mb-2">¥0</div>
                  <p className="text-sm text-cyan-400 uppercase tracking-widest font-semibold">無料体験</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-cyan-500" />
                    <span>20秒間の動画生成</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <CheckCircle className="w-5 h-5 text-cyan-500" />
                    <span>テンプレート制限なし</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <MonitorPlay className="w-5 h-5 text-cyan-500" />
                    <span>Webプレビュー確認</span>
                  </li>
                </ul>
                <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-white/10" asChild>
                  <Link href="/create">無料で作成する</Link>
                </Button>
              </motion.div>

              {/* PAID PLAN */}
              <motion.div
                className="glass-panel p-8 rounded-2xl border-purple-500/30 relative overflow-hidden transform hover:-translate-y-2 transition-all duration-300"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="absolute top-0 right-0 p-4">
                  <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.5)]">
                    RECOMMENDED
                  </span>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-purple-300 mb-2 text-glow-purple">PROJECTION</h3>
                  <div className="text-4xl font-bold text-white mb-2">¥5,000</div>
                  <p className="text-sm text-purple-400 uppercase tracking-widest font-semibold">本番投影プラン</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">1分間のフル動画生成</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                    <span>実際の車両へ投影</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <Smartphone className="w-5 h-5 text-purple-500" />
                    <span>記念撮影タイム付き</span>
                  </li>
                  <li className="flex items-center gap-3 text-white">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                    <span>すべてのテンプレート利用可</span>
                  </li>
                </ul>
                <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] border-none" asChild>
                  <Link href="/create">投影を予約する</Link>
                </Button>
              </motion.div>

            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="w-full border-t border-white/10 bg-[#020617] pt-16 pb-8">
          <div className="container text-center">
            <h2 className="text-2xl font-bold mb-8 text-white tracking-widest" style={{ fontFamily: 'Orbitron' }}>NIGHT TRAIN CANVAS</h2>
            <div className="flex justify-center gap-8 mb-8 text-slate-400 text-sm">
              <a href="#" className="hover:text-cyan-400 transition-colors">利用規約</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">プライバシーポリシー</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">特定商取引法に基づく表記</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">お問い合わせ</a>
            </div>
            <p className="text-slate-600 text-xs text-center">
              © 2024 Mizuma Railway Projection Project. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
