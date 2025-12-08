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
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-white hover:text-blue-300 transition-colors" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          <span>{APP_TITLE}</span>
        </Link>


        <nav className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link href="/create" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                動画作成
              </Link>
              <Link href="/mypage" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                マイページ
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
                  管理画面
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{user?.name || "ユーザー"}</p>
                      {user?.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    ログアウト
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild>
              <a href={getLoginUrl()}>ログイン</a>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
