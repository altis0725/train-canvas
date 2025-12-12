import { APP_TITLE } from "@/const";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-white/10 bg-[#020617] pt-16 pb-8">
      <div className="container text-center">
        <h2 className="text-2xl font-bold mb-8 text-white tracking-widest" style={{ fontFamily: 'Orbitron' }}>WRAPPING THE TRAIN</h2>
        <div className="flex justify-center gap-8 mb-8 text-slate-400 text-sm">
          <a href="#" className="hover:text-cyan-400 transition-colors">利用規約</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">プライバシーポリシー</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">特定商取引法に基づく表記</a>
          <a href="#" className="hover:text-cyan-400 transition-colors">お問い合わせ</a>
        </div>
        <p className="text-slate-600 text-xs text-center">
          &copy; {currentYear} Mizuma Railway Projection Project. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
