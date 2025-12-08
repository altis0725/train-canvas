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
    {
      enabled: isAuthenticated,
      refetchInterval: (query) => {
        // If query is loading or has error, don't poll
        if (query.state.status === 'error' || query.state.status === 'pending') return false;

        // Check if any video is in processing status
        const hasProcessingVideo = query.state.data?.some(video => video.status === 'processing');

        // Poll every 5 seconds if there are processing videos
        return hasProcessingVideo ? 5000 : false;
      }
    }
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
    <div className="min-h-screen bg-[#020617] text-white py-12">

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          {/* User Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-cyan-900 border border-cyan-500/50 flex items-center justify-center text-cyan-100 text-2xl font-bold box-shadow-[0_0_15px_cyan]">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-orbitron tracking-wider text-glow">MY PAGE</h1>
                <p className="text-lg text-slate-400">
                  Welcome back, <span className="text-cyan-400">{user?.name || "Guest"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-[#0f172a] border border-white/10">
              <TabsTrigger value="videos" className="text-base data-[state=active]:bg-cyan-950 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-500">
                <Film className="h-5 w-5 mr-2" />
                動画
              </TabsTrigger>
              <TabsTrigger value="reservations" className="text-base data-[state=active]:bg-purple-950 data-[state=active]:text-purple-400 data-[state=active]:border-b-2 data-[state=active]:border-purple-500">
                <Calendar className="h-5 w-5 mr-2" />
                予約管理
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-base data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500">
                <CreditCard className="h-5 w-5 mr-2" />
                決済履歴
              </TabsTrigger>
            </TabsList>

            {/* Videos Tab */}
            <TabsContent value="videos" className="mt-8">
              {videosLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-cyan-600 mb-4" />
                  <p className="text-slate-500">Loading videos...</p>
                </div>
              ) : videos && videos.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {videos.map((video) => (
                    <Card key={video.id} className="bg-[#0f172a] border border-white/10 hover:border-cyan-500/50 transition-all duration-300 glass-panel">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-500/30 flex items-center justify-center">
                              <Film className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">Video #{video.id}</h3>
                              <p className="text-sm text-slate-500">{formatDate(video.createdAt)}</p>
                            </div>
                          </div>
                          {getStatusBadge(video.status, "video")}
                        </div>

                        <div className="space-y-2 mb-6 p-4 bg-black/40 rounded-lg border border-white/5">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="text-slate-400">Duration:</span>
                            <span className="font-semibold text-slate-200">{video.duration}s</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {video.status === "processing" && (
                            <div className="p-4 bg-blue-950/30 border border-blue-500/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                                <span className="text-sm font-semibold text-blue-300">Processing...</span>
                              </div>
                              <p className="text-xs text-blue-400/80">
                                Generating your unique projection video. This may take a few minutes.
                              </p>
                            </div>
                          )}
                          {video.status === "failed" && (
                            <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-semibold text-red-300">Generation Failed</span>
                              </div>
                              <p className="text-xs text-red-400/80">
                                Please try again or contact support.
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            {video.status === "completed" && video.videoUrl && (
                              <Button asChild size="sm" variant="outline" className="flex-1 border-slate-700 hover:bg-slate-800 text-slate-300">
                                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </a>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteVideoMutation.mutate({ id: video.id })}
                              disabled={deleteVideoMutation.isPending || video.status === "processing"}
                              className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                          {video.status === "completed" && (
                            <Button
                              size="sm"
                              onClick={() => handleReserveVideo(video.id)}
                              disabled={createCheckoutMutation.isPending}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none"
                            >
                              <Calendar className="h-4 w-4 mr-2" />
                              {createCheckoutMutation.isPending ? 'Processing...' : 'Book Projection (¥5,000)'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-[#0f172a] border border-white/10 border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <Film className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">No videos yet</h3>
                    <p className="text-slate-500 mb-6">Create your first projection video now.</p>
                    <Button onClick={() => setLocation("/create")} size="lg" className="bg-cyan-600 hover:bg-cyan-500 text-white neon-button">
                      <Film className="h-5 w-5 mr-2" />
                      Create Video
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reservations Tab */}
            <TabsContent value="reservations" className="mt-8">
              {reservationsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-purple-600 mb-4" />
                  <p className="text-slate-500">Loading reservations...</p>
                </div>
              ) : reservations && reservations.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {reservations.map((reservation) => {
                    const video = videos?.find(v => v.id === reservation.videoId);
                    return (
                      <Card key={reservation.id} className="bg-[#0f172a] border border-white/10 hover:border-purple-500/50 transition-all duration-300 glass-panel">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-purple-900 border border-purple-500/30 flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-purple-400" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white">Reservation #{reservation.id}</h3>
                                <p className="text-sm text-slate-500">Date: {formatDate(reservation.createdAt)}</p>
                              </div>
                            </div>
                            {getStatusBadge(reservation.status, "reservation")}
                          </div>

                          <div className="space-y-3 p-4 bg-[#1e293b]/50 rounded-lg mb-4 border border-white/5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Projection Date:
                              </span>
                              <span className="font-semibold text-white">
                                {new Date(reservation.projectionDate).toLocaleDateString("ja-JP", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Time Slot:
                              </span>
                              <span className="font-semibold text-white">
                                {getSlotTime(reservation.slotNumber)}
                              </span>
                            </div>
                            {video && (
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400 flex items-center gap-2">
                                  <Film className="h-4 w-4" />
                                  Video ID:
                                </span>
                                <span className="font-semibold text-white">#{video.id}</span>
                              </div>
                            )}
                          </div>

                          {reservation.status === "confirmed" && canModifyReservation(reservation.projectionDate) && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditReservation(reservation.id, reservation.projectionDate, reservation.slotNumber)}
                                className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modify
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to cancel this reservation?")) {
                                    cancelReservationMutation.mutate({ id: reservation.id });
                                  }
                                }}
                                disabled={cancelReservationMutation.isPending}
                                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          )}

                          {reservation.status === "confirmed" && !canModifyReservation(reservation.projectionDate) && (
                            <div className="text-sm text-slate-400 text-center p-3 bg-white/5 rounded-lg border border-white/5">
                              <AlertCircle className="h-4 w-4 inline mr-1" />
                              Cannot modify or cancel within 24 hours of projection.
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-[#0f172a] border border-white/10 border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">No reservations</h3>
                    <p className="text-slate-500 mb-6">Create a video and book a projection slot.</p>
                    <Button onClick={() => setLocation("/create")} size="lg" className="bg-purple-600 hover:bg-purple-500 text-white neon-button">
                      <Film className="h-5 w-5 mr-2" />
                      Create Video
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="mt-8">
              {paymentsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
                  <p className="text-slate-500">Loading payments...</p>
                </div>
              ) : payments && payments.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {payments.map((payment) => (
                    <Card key={payment.id} className="bg-[#0f172a] border border-white/10 hover:border-emerald-500/50 transition-all duration-300 glass-panel">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-emerald-900 border border-emerald-500/30 flex items-center justify-center">
                              <CreditCard className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">Payment #{payment.id}</h3>
                              <p className="text-sm text-slate-500">{formatDate(payment.createdAt)}</p>
                            </div>
                          </div>
                          {getStatusBadge(payment.status, "payment")}
                        </div>

                        <div className="space-y-2 p-4 bg-[#1e293b]/50 rounded-lg border border-white/5">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Amount:</span>
                            <span className="text-2xl font-bold text-white">¥{payment.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-[#0f172a] border border-white/10 border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="h-10 w-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">No payment history</h3>
                    <p className="text-slate-500">History will appear here after you use paid services.</p>
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
