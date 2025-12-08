import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { Film, Calendar, CreditCard, Sparkles, ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";
import StarryBackground from "@/components/StarryBackground";


export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      <main className="flex-1">
        {/* Hero Section with Starry Background */}
        <section className="relative min-h-[100vh] flex flex-col justify-center overflow-hidden">
          <StarryBackground />

          <div className="container relative z-10 flex flex-col items-center justify-center text-center mt-20">
            {/* Small Header */}
            <div className="mb-4 animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <span className="text-blue-200 tracking-wider text-sm md:text-base font-medium">
                水間鉄道プロジェクションマッピングサービス
              </span>
            </div>

            {/* Main Title overlaying the train */}
            <div className="relative w-full max-w-5xl mx-auto mb-12">
              {/* Train Placeholder */}
              <div className="relative w-full aspect-video md:aspect-[21/9] flex items-center justify-center">
                {/* Glowing background behind train */}
                <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full transform scale-75" />

                {/* Placeholder for Train Image - User to replace src */}
                <div className="relative w-full h-full bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 rounded-xl border border-blue-500/30 flex items-center justify-center overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=2000"
                    alt="Illuminated Train"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Digital Overlay Effects */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(59,130,246,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer" />

                  {/* Main Text Overlay */}
                  <h1 className="relative z-20 text-5xl md:text-8xl font-bold text-white tracking-tighter drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-200">
                      TrainCanvas
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            {/* Subtitle */}
            <h2 className="text-xl md:text-3xl text-white font-medium mb-12 tracking-wide animate-slide-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              君だけの電車を、<span className="text-blue-400">夜空に描こう</span>
            </h2>

            {/* CTA Button */}
            <div className="animate-slide-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              {isAuthenticated ? (
                <Link href="/create">
                  <Button size="lg" className="h-16 px-12 text-lg md:text-xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:shadow-[0_0_50px_rgba(37,99,235,0.8)] transition-all duration-300 border border-blue-400/50 backdrop-blur-md">
                    無料で体験する
                  </Button>
                </Link>
              ) : (
                <Button asChild size="lg" className="h-16 px-12 text-lg md:text-xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_30px_rgba(37,99,235,0.6)] hover:shadow-[0_0_50px_rgba(37,99,235,0.8)] transition-all duration-300 border border-blue-400/50 backdrop-blur-md">
                  <a href={getLoginUrl()}>
                    無料で体験する
                  </a>
                </Button>
              )}
            </div>

            {/* Scroll Indicator */}
            {/* Scroll Indicator */}
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 animate-bounce opacity-50">
              <div className="w-1 h-12 rounded-full bg-gradient-to-b from-blue-400 to-transparent" />
            </div>

            {/* Bottom Navigation Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/40 backdrop-blur-md">
              <div className="container flex justify-center py-6">
                <nav className="flex gap-4 md:gap-12 text-white/80 text-xs md:text-sm font-light tracking-wider">
                  {['サービス紹介', 'ギャラリー', '運行情報', 'お問い合わせ'].map((item) => (
                    <button
                      key={item}
                      className="hover:text-blue-400 transition-colors relative group py-2"
                      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    >
                      {item}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full" />
                    </button>
                  ))}
                </nav>
              </div>
            </div>

          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-slate-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                サービスの特徴
              </h2>
              <p className="text-xl text-slate-600">
                簡単3ステップで動画投影を実現
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: Film,
                  title: "テンプレート選択",
                  description: "3段階のテンプレートから選ぶだけで、プロ品質の動画を作成",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Calendar,
                  title: "投影予約",
                  description: "カレンダーから希望の日時を選択。先着順で予約を確定",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: CreditCard,
                  title: "簡単決済",
                  description: "クレジットカードで安全・簡単に決済。すぐに投影開始",
                  gradient: "from-orange-500 to-red-500"
                }
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white hover:-translate-y-2"
                >
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gradient-to-br from-slate-100 to-blue-50">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                料金プラン
              </h2>
              <p className="text-xl text-slate-600">
                まずは無料体験から
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <Card className="border-2 border-slate-200 bg-white hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">無料体験</h3>
                    <p className="text-slate-600">お試しで使ってみたい方に</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-slate-900">¥0</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {[
                      "20秒の動画投影",
                      "全テンプレート利用可能",
                      "即座に投影予約"
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                          <Check className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isAuthenticated ? (
                    <Link href="/create">
                      <Button className="w-full" size="lg" variant="outline">
                        無料で始める
                      </Button>
                    </Link>
                  ) : (
                    <Button asChild className="w-full" size="lg" variant="outline">
                      <a href={getLoginUrl()}>
                        無料で始める
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Paid Plan */}
              <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <span className="bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full">
                    おすすめ
                  </span>
                </div>

                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">有料サービス</h3>
                    <p className="text-blue-100">本格的に投影したい方に</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">¥5,000</span>
                      <span className="text-blue-200">/ 1回</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {[
                      "1分間の動画投影",
                      "全テンプレート利用可能",
                      "15分間で5回繰り返し投影",
                      "投影1日前まで変更可能"
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="rounded-full bg-white/20 p-1 mt-0.5">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-blue-50">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isAuthenticated ? (
                    <Link href="/create">
                      <Button className="w-full bg-white text-blue-600 hover:bg-blue-50" size="lg">
                        今すぐ始める
                      </Button>
                    </Link>
                  ) : (
                    <Button asChild className="w-full bg-white text-blue-600 hover:bg-blue-50" size="lg">
                      <a href={getLoginUrl()}>
                        今すぐ始める
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGg3djFoLTd6bTAtNWg3djFoLTd6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />

          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                今すぐ始めましょう
              </h2>
              <p className="text-xl text-white/90 mb-10">
                テンプレートを選んで、あなたのメッセージを電車車両で投影。
                <br />
                新しい広告・エンターテイメント体験を今すぐ。
              </p>

              {isAuthenticated ? (
                <Link href="/create">
                  <Button size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <Film className="mr-2 h-5 w-5" />
                    動画を作成する
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button asChild size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <a href={getLoginUrl()}>
                    <Film className="mr-2 h-5 w-5" />
                    動画を作成する
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
