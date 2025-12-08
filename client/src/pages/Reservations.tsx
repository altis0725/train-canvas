import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Loader2, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";


export default function Reservations() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  
  // Get videoId from URL query parameter or sessionStorage (after payment)
  const urlParams = new URLSearchParams(window.location.search);
  const videoIdParam = urlParams.get('videoId');
  const paymentStatus = urlParams.get('payment');
  
  // If payment was successful, get videoId from sessionStorage
  const storedVideoId = paymentStatus === 'success' 
    ? sessionStorage.getItem('pendingReservationVideoId')
    : null;
  
  // Debug logs
  console.log('[Reservations] URL videoIdParam:', videoIdParam);
  console.log('[Reservations] sessionStorage storedVideoId:', storedVideoId);
  console.log('[Reservations] paymentStatus:', paymentStatus);
  
  const [videoId, setVideoId] = useState<number | null>(
    videoIdParam ? parseInt(videoIdParam, 10) : 
    storedVideoId ? parseInt(storedVideoId, 10) : null
  );
  
  console.log('[Reservations] Final videoId:', videoId);
  
  // Show payment success message and clear sessionStorage after component mounts
  useEffect(() => {
    if (paymentStatus === 'success' && storedVideoId) {
      toast.success('決済が完了しました。投影日時を選択してください。');
      // Clear the stored videoId after showing the message
      // We don't clear it immediately to preserve it for the reservation creation
    }
  }, [paymentStatus, storedVideoId]);

  const { data: availableSlots, isLoading: slotsLoading } = trpc.reservations.getAvailableSlots.useQuery(
    { date: selectedDate ? new Date(selectedDate) : new Date() },
    { enabled: !!selectedDate }
  );

  const [, setLocation] = useLocation();

  const createReservationMutation = trpc.reservations.create.useMutation({
    onSuccess: () => {
      toast.success("予約が完了しました");
      // Navigate to MyPage reservations tab
      setTimeout(() => {
        setLocation('/mypage?tab=reservations');
      }, 1000);
    },
    onError: (error) => {
      toast.error("予約に失敗しました: " + error.message);
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
              <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-400" />
              <h1 className="text-2xl font-bold mb-2">ログインが必要です</h1>
              <p className="text-slate-600 mb-6">予約するにはログインしてください。</p>
              <Button asChild className="w-full">
                <a href={getLoginUrl()}>ログイン</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getSlotTime = (slotNumber: number) => {
    const hour = 9 + Math.floor((slotNumber - 1) / 4);
    const minute = ((slotNumber - 1) % 4) * 15;
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  };

  const handleReservation = () => {
    console.log('[handleReservation] selectedDate:', selectedDate);
    console.log('[handleReservation] selectedSlot:', selectedSlot);
    console.log('[handleReservation] videoId:', videoId);
    
    if (!selectedDate || selectedSlot === null) {
      toast.error("日付と時間を選択してください");
      return;
    }

    if (!videoId) {
      console.error('[handleReservation] videoId is null or undefined');
      toast.error("動画IDが指定されていません。動画作成ページから再度お試しください。");
      return;
    }

    console.log('[handleReservation] Creating reservation with:', {
      videoId,
      projectionDate: new Date(selectedDate),
      slotNumber: selectedSlot,
    });
    
    createReservationMutation.mutate({
      videoId: videoId,
      projectionDate: new Date(selectedDate),
      slotNumber: selectedSlot,
    });
  };

  // Generate next 30 days for calendar
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDates();

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900">投影予約</h1>
                <p className="text-lg text-slate-600">日付と時間を選択して予約を作成</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calendar Section */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  日付を選択
                </h2>
                
                <div className="grid grid-cols-7 gap-2">
                  {dates.map((date) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const isSelected = selectedDate === dateStr;
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`
                          aspect-square p-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isSelected 
                            ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg scale-105" 
                            : isToday
                            ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                          }
                        `}
                      >
                        <div className="text-xs">{date.getMonth() + 1}/{date.getDate()}</div>
                        <div className="text-[10px] opacity-70">
                          {["日", "月", "火", "水", "木", "金", "土"][date.getDay()]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time Slots Section */}
            <Card className="border-2">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  時間を選択
                </h2>

                {!selectedDate ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">まず日付を選択してください</p>
                  </div>
                ) : slotsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Array.from({ length: 36 }, (_, i) => i + 1).map((slot) => {
                      const isAvailable = availableSlots?.includes(slot);
                      const isSelected = selectedSlot === slot;
                      
                      return (
                        <button
                          key={slot}
                          onClick={() => isAvailable && setSelectedSlot(slot)}
                          disabled={!isAvailable}
                          className={`
                            w-full p-4 rounded-lg text-left transition-all duration-200 flex items-center justify-between
                            ${isSelected
                              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                              : isAvailable
                              ? "bg-white hover:bg-purple-50 border-2 border-slate-200 hover:border-purple-300"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5" />
                            <span className="font-semibold">{getSlotTime(slot)}</span>
                          </div>
                          {isAvailable ? (
                            <CheckCircle className={`h-5 w-5 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                          ) : (
                            <span className="text-xs">予約済み</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reservation Summary */}
          {selectedDate && selectedSlot && (
            <Card className="mt-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">予約内容の確認</h3>
                <div className="space-y-2 mb-6">
                  <p className="text-slate-700">
                    <span className="font-semibold">日付:</span> {new Date(selectedDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">時間:</span> {getSlotTime(selectedSlot)}
                  </p>
                  <p className="text-slate-700">
                    <span className="font-semibold">投影時間:</span> 15分間（3組×5回繰り返し）
                  </p>
                </div>
                <Button
                  onClick={handleReservation}
                  disabled={createReservationMutation.isPending}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  size="lg"
                >
                  {createReservationMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      予約中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      予約を確定する
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

    </div>
  );
}
