import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Film, Calendar, CreditCard, Download, Trash2, Loader2, User, Clock, CheckCircle, XCircle, AlertCircle, Edit } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";


export default function MyPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get tab from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'videos');
  
  // Reservation edit dialog state
  const [editingReservation, setEditingReservation] = useState<number | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editSlot, setEditSlot] = useState<number | null>(null);
  
  const handleReserveVideo = (videoId: number) => {
    // Store videoId in sessionStorage for use after payment
    sessionStorage.setItem('pendingReservationVideoId', videoId.toString());
    // Redirect to payment page (Stripe checkout)
    toast.info('投影予約には5,000円の決済が必要です');
    // Create Stripe checkout session
    createCheckoutMutation.mutate({ videoId });
  };
  
  const handleEditReservation = (reservationId: number, currentDate: Date, currentSlot: number) => {
    setEditingReservation(reservationId);
    setEditDate(currentDate.toISOString().split('T')[0]);
    setEditSlot(currentSlot);
  };
  
  const handleUpdateReservation = () => {
    if (!editingReservation || !editDate || editSlot === null) {
      toast.error("日付と時間を選択してください");
      return;
    }
    
    updateReservationMutation.mutate({
      id: editingReservation,
      projectionDate: new Date(editDate),
      slotNumber: editSlot,
    });
  };
  
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const { data: videos, isLoading: videosLoading, refetch: refetchVideos } = trpc.videos.getUserVideos.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: reservations, isLoading: reservationsLoading, refetch: refetchReservations } =
    trpc.reservations.getUserReservations.useQuery(undefined, { enabled: isAuthenticated });

  const { data: payments, isLoading: paymentsLoading } = trpc.payments.getUserPayments.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Get available slots for edit dialog
  const { data: availableSlots, isLoading: slotsLoading } = trpc.reservations.getAvailableSlots.useQuery(
    { date: editDate ? new Date(editDate) : new Date() },
    { enabled: !!editDate }
  );

  const deleteVideoMutation = trpc.videos.delete.useMutation({
    onSuccess: () => {
      toast.success("動画を削除しました");
      refetchVideos();
    },
    onError: (error) => {
      toast.error("削除に失敗しました: " + error.message);
    },
  });

  const cancelReservationMutation = trpc.reservations.cancel.useMutation({
    onSuccess: () => {
      toast.success("予約をキャンセルしました");
      refetchReservations();
    },
    onError: (error) => {
      toast.error("キャンセルに失敗しました: " + error.message);
    },
  });
  
  const updateReservationMutation = trpc.reservations.update.useMutation({
    onSuccess: () => {
      toast.success("予約を変更しました");
      setEditingReservation(null);
      setEditDate("");
      setEditSlot(null);
      refetchReservations();
    },
    onError: (error) => {
      toast.error("変更に失敗しました: " + error.message);
    },
  });

  const createCheckoutMutation = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error) => {
      toast.error("決済ページの作成に失敗しました: " + error.message);
    },
  });

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
              <User className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h1 className="text-2xl font-bold mb-2">ログインが必要です</h1>
              <p className="text-slate-600 mb-6">マイページを表示するにはログインしてください。</p>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>ログイン</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSlotTime = (slotNumber: number) => {
    const hour = 9 + Math.floor((slotNumber - 1) / 4);
    const minute = ((slotNumber - 1) % 4) * 15;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const canModifyReservation = (projectionDate: Date) => {
    const oneDayBefore = new Date(projectionDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    return new Date() <= oneDayBefore;
  };

  const getStatusBadge = (status: string, type: "video" | "reservation" | "payment") => {
    const statusConfig = {
      video: {
        completed: { icon: CheckCircle, text: "完了", color: "text-green-600 bg-green-50" },
        processing: { icon: Clock, text: "処理中", color: "text-yellow-600 bg-yellow-50" },
        failed: { icon: XCircle, text: "失敗", color: "text-red-600 bg-red-50" },
        pending: { icon: AlertCircle, text: "保留中", color: "text-gray-600 bg-gray-50" },
      },
      reservation: {
        confirmed: { icon: CheckCircle, text: "確定", color: "text-green-600 bg-green-50" },
        cancelled: { icon: XCircle, text: "キャンセル済", color: "text-red-600 bg-red-50" },
        completed: { icon: CheckCircle, text: "完了", color: "text-blue-600 bg-blue-50" },
        pending: { icon: AlertCircle, text: "保留中", color: "text-gray-600 bg-gray-50" },
      },
      payment: {
        succeeded: { icon: CheckCircle, text: "成功", color: "text-green-600 bg-green-50" },
        pending: { icon: Clock, text: "処理中", color: "text-yellow-600 bg-yellow-50" },
        failed: { icon: XCircle, text: "失敗", color: "text-red-600 bg-red-50" },
      },
    };

    const config = statusConfig[type][status as keyof typeof statusConfig[typeof type]];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4" />
        {config.text}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          {/* User Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">マイページ</h1>
                <p className="text-lg text-slate-600">
                  ようこそ、{user?.name || "ゲスト"}さん
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-white shadow-sm">
              <TabsTrigger value="videos" className="text-base data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                <Film className="h-5 w-5 mr-2" />
                動画
              </TabsTrigger>
              <TabsTrigger value="reservations" className="text-base data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                <Calendar className="h-5 w-5 mr-2" />
                予約管理
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-base data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
                <CreditCard className="h-5 w-5 mr-2" />
                決済履歴
              </TabsTrigger>
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos" className="mt-8">
              {videosLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-slate-600">動画を読み込んでいます...</p>
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {videos.map((video) => (
                    <Card key={video.id} className="hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                              <Film className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">動画 #{video.id}</h3>
                              <p className="text-sm text-slate-500">{formatDate(video.createdAt)}</p>
                            </div>
                          </div>
                          {getStatusBadge(video.status, "video")}
                        </div>
                        
                        <div className="space-y-2 mb-6 p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-600">時間:</span>
                            <span className="font-semibold text-slate-900">{video.duration}秒</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {video.status === "processing" && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                <span className="text-sm font-semibold text-blue-900">動画を生成中...</span>
                              </div>
                              <p className="text-xs text-blue-700">
                                Shotstack APIでテンプレートを結合しています。完了まで数分かかる場合があります。
                              </p>
                            </div>
                          )}
                          {video.status === "failed" && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span className="text-sm font-semibold text-red-900">動画生成に失敗しました</span>
                              </div>
                              <p className="text-xs text-red-700">
                                再度お試しいただくか、サポートにお問い合わせください。
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {video.status === "completed" && video.videoUrl && (
                              <Button asChild size="sm" variant="outline" className="flex-1">
                                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  ダウンロード
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteVideoMutation.mutate({ id: video.id })}
                              disabled={deleteVideoMutation.isPending || video.status === "processing"}
                              className="flex-1"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              削除
                            </Button>
                          </div>
                          {video.status === "completed" && (
                            <Button
                              size="sm"
                              onClick={() => handleReserveVideo(video.id)}
                              disabled={createCheckoutMutation.isPending}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              {createCheckoutMutation.isPending ? '処理中...' : '投影予約（5,000円）'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-slate-300">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Film className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">まだ動画がありません</h3>
                    <p className="text-slate-600 mb-6">テンプレートを選んで最初の動画を作成しましょう</p>
                    <Button onClick={() => setLocation("/create")} size="lg">
                      <Film className="h-5 w-5 mr-2" />
                      動画を作成
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reservations Tab */}
            <TabsContent value="reservations" className="mt-8">
              {reservationsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-slate-600">予約情報を読み込んでいます...</p>
                </div>
              ) : reservations && reservations.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {reservations.map((reservation) => {
                    const video = videos?.find(v => v.id === reservation.videoId);
                    return (
                      <Card key={reservation.id} className="hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-blue-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900">予約 #{reservation.id}</h3>
                                <p className="text-sm text-slate-500">予約日: {formatDate(reservation.createdAt)}</p>
                              </div>
                            </div>
                            {getStatusBadge(reservation.status, "reservation")}
                          </div>
                          
                          <div className="space-y-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                投影日:
                              </span>
                              <span className="font-semibold text-slate-900">
                                {new Date(reservation.projectionDate).toLocaleDateString("ja-JP", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                投影時間:
                              </span>
                              <span className="font-semibold text-slate-900">
                                {getSlotTime(reservation.slotNumber)}
                              </span>
                            </div>
                            {video && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 flex items-center gap-2">
                                  <Film className="h-4 w-4" />
                                  動画ID:
                                </span>
                                <span className="font-semibold text-slate-900">#{video.id}</span>
                              </div>
                            )}
                          </div>

                          {reservation.status === "confirmed" && canModifyReservation(reservation.projectionDate) && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditReservation(reservation.id, reservation.projectionDate, reservation.slotNumber)}
                                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                変更
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("本当にこの予約をキャンセルしますか？")) {
                                    cancelReservationMutation.mutate({ id: reservation.id });
                                  }
                                }}
                                disabled={cancelReservationMutation.isPending}
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                キャンセル
                              </Button>
                            </div>
                          )}
                          
                          {reservation.status === "confirmed" && !canModifyReservation(reservation.projectionDate) && (
                            <div className="text-sm text-slate-500 text-center p-3 bg-slate-100 rounded-lg">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              投影日の1日前を過ぎたため、変更・キャンセルはできません
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-slate-300">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">まだ予約がありません</h3>
                    <p className="text-slate-600 mb-6">動画を作成して投影予約をしましょう</p>
                    <Button onClick={() => setLocation("/create")} size="lg">
                      <Film className="h-5 w-5 mr-2" />
                      動画を作成
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-8">
              {paymentsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-slate-600">決済履歴を読み込んでいます...</p>
                </div>
              ) : payments && payments.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {payments.map((payment) => (
                    <Card key={payment.id} className="hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">決済 #{payment.id}</h3>
                              <p className="text-sm text-slate-500">{formatDate(payment.createdAt)}</p>
                            </div>
                          </div>
                          {getStatusBadge(payment.status, "payment")}
                        </div>
                        
                        <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">金額:</span>
                            <span className="text-2xl font-bold text-slate-900">¥{payment.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed border-slate-300">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">決済履歴がありません</h3>
                    <p className="text-slate-600">有料サービスを利用すると、ここに決済履歴が表示されます</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Edit Reservation Dialog */}
      <Dialog open={editingReservation !== null} onOpenChange={(open) => !open && setEditingReservation(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>予約の変更</DialogTitle>
            <DialogDescription>
              新しい投影日時を選択してください。投影日の1日前まで変更可能です。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-3">
                投影日を選択
              </label>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 30 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = editDate === dateStr;
                  return (
                    <Button
                      key={dateStr}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setEditDate(dateStr);
                        setEditSlot(null);
                      }}
                      className={isSelected ? "bg-blue-600" : ""}
                    >
                      <div className="text-center">
                        <div className="text-xs">{date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}</div>
                        <div className="text-xs">{date.toLocaleDateString("ja-JP", { weekday: "short" })}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Time Slot Selection */}
            {editDate && (
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  投影時間を選択
                </label>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : availableSlots && availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => {
                      const hour = 9 + Math.floor((slot - 1) / 4);
                      const minute = ((slot - 1) % 4) * 15;
                      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      const isSelected = editSlot === slot;
                      return (
                        <Button
                          key={slot}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEditSlot(slot)}
                          className={isSelected ? "bg-blue-600" : ""}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {timeStr}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-slate-400" />
                    <p>この日には空きスロットがありません。別の日付を選択してください。</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingReservation(null)}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleUpdateReservation}
                disabled={!editDate || editSlot === null || updateReservationMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateReservationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    変更中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    変更を確定
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
