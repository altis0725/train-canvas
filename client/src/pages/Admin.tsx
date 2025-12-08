import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, Calendar, CreditCard, Loader2, Shield, TrendingUp, Activity, DollarSign } from "lucide-react";
import { getLoginUrl } from "@/const";


export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();

  const { data: allUsers, isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: allReservations, isLoading: reservationsLoading } =
    trpc.admin.getAllReservations.useQuery(undefined, {
      enabled: isAuthenticated && user?.role === "admin",
    });

  const { data: allPayments, isLoading: paymentsLoading } = trpc.admin.getAllPayments.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h1 className="text-2xl font-bold mb-2">ログインが必要です</h1>
              <p className="text-slate-600 mb-6">管理画面を表示するにはログインしてください。</p>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>ログイン</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-red-400" />
              <h1 className="text-2xl font-bold mb-2">アクセス権限がありません</h1>
              <p className="text-slate-600">この画面は管理者のみアクセスできます。</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalRevenue = allPayments?.reduce((sum, payment) => {
    return payment.status === "succeeded" ? sum + payment.amount : sum;
  }, 0) || 0;

  const confirmedReservations = allReservations?.filter(r => r.status === "confirmed").length || 0;

  const stats = [
    {
      title: "総ユーザー数",
      value: allUsers?.length || 0,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50",
      loading: usersLoading,
    },
    {
      title: "確定予約数",
      value: confirmedReservations,
      icon: Calendar,
      gradient: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50",
      loading: reservationsLoading,
    },
    {
      title: "総決済額",
      value: `¥${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50",
      loading: paymentsLoading,
    },
    {
      title: "総決済数",
      value: allPayments?.length || 0,
      icon: CreditCard,
      gradient: "from-orange-500 to-red-500",
      bgColor: "bg-orange-50",
      loading: paymentsLoading,
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      
      <main className="flex-1 py-12">
        <div className="container max-w-7xl">
          {/* Admin Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">管理ダッシュボード</h1>
                <p className="text-lg text-slate-600">システム全体の統計情報と管理機能</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={index} 
                  className="hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200 overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Activity className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">{stat.title}</p>
                      {stat.loading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      ) : (
                        <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity Sections */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">最近のユーザー</h3>
                    <p className="text-sm text-slate-600">新規登録ユーザー</p>
                  </div>
                </div>
                
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : allUsers && allUsers.length > 0 ? (
                  <div className="space-y-3">
                    {allUsers.slice(0, 5).map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{u.name || "名前なし"}</p>
                          <p className="text-sm text-slate-600 truncate">{u.email || "メールなし"}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {u.role === "admin" ? "管理者" : "ユーザー"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">ユーザーがいません</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Reservations */}
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">最近の予約</h3>
                    <p className="text-sm text-slate-600">投影予約一覧</p>
                  </div>
                </div>
                
                {reservationsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : allReservations && allReservations.length > 0 ? (
                  <div className="space-y-3">
                    {allReservations.slice(0, 5).map((reservation) => {
                      const getSlotTime = (slotNumber: number) => {
                        const hour = 9 + Math.floor((slotNumber - 1) / 4);
                        const minute = ((slotNumber - 1) % 4) * 15;
                        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                      };

                      return (
                        <div key={reservation.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">予約 #{reservation.id}</p>
                            <p className="text-sm text-slate-600">
                              {new Date(reservation.projectionDate).toLocaleDateString("ja-JP")} {getSlotTime(reservation.slotNumber)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            reservation.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : reservation.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {reservation.status === "confirmed"
                              ? "確定"
                              : reservation.status === "cancelled"
                              ? "キャンセル"
                              : reservation.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">予約がありません</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart Placeholder */}
          <Card className="mt-6 border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">売上推移</h3>
                  <p className="text-sm text-slate-600">決済データの分析</p>
                </div>
              </div>
              
              <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                  <p className="text-slate-600">グラフ機能は今後実装予定</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

    </div>
  );
}
