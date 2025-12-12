import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Film, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";

export default function Header() {
  const { user, isAuthenticated, loading } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="fixed top-0 z-50 w-full glass-panel border-b-0 rounded-none">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-xl md:text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 font-orbitron hover:opacity-80 transition-opacity">
          WRAPPING THE TRAIN
        </Link>


        <nav className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link href="/create" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors tracking-wide">
                動画作成
              </Link>
              <Link href="/mypage" className="text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors tracking-wide">
                マイページ
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors tracking-wide">
                  管理画面
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full text-slate-300 hover:text-cyan-400 hover:bg-white/5">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-[#0f172a] border-white/10 text-slate-200">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{user?.name || "ユーザー"}</p>
                      {user?.email && (
                        <p className="text-xs text-slate-400">{user.email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300 focus:bg-white/5 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild className="neon-button bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <a href={getLoginUrl()}>ログイン</a>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
