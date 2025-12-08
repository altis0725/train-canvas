import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Film, ChevronRight, Check, Loader2, Sparkles, ArrowLeft, Calendar, Play } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";


export default function CreateVideo() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedTemplates, setSelectedTemplates] = useState({
    template1: null as number | null,
    template2: null as number | null,
    template3: null as number | null,
  });

  const { data: templates1, isLoading: loading1 } = trpc.templates.getByCategory.useQuery(
    { category: 1 },
    { enabled: step >= 1 }
  );

  const { data: templates2, isLoading: loading2 } = trpc.templates.getByCategory.useQuery(
    { category: 2 },
    { enabled: step >= 2 }
  );

  const { data: templates3, isLoading: loading3 } = trpc.templates.getByCategory.useQuery(
    { category: 3 },
    { enabled: step >= 3 }
  );

  const [createdVideoId, setCreatedVideoId] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<{ title: string; videoUrl: string } | null>(null);

  const createVideoMutation = trpc.videos.create.useMutation({
    onSuccess: (data) => {
      setCreatedVideoId(data.videoId);
      toast.success("動画を作成しました！");
    },
    onError: (error) => {
      toast.error("動画の作成に失敗しました: " + error.message);
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">ログインが必要です</h1>
            <p className="text-slate-600 mb-8">動画を作成するにはログインしてください。</p>
          </div>
        </div>
      </div>
    );
  }

  const handleTemplateSelect = (category: 1 | 2 | 3, templateId: number) => {
    if (category === 1) {
      setSelectedTemplates({ ...selectedTemplates, template1: templateId });
      setStep(2);
    } else if (category === 2) {
      setSelectedTemplates({ ...selectedTemplates, template2: templateId });
      setStep(3);
    } else if (category === 3) {
      setSelectedTemplates({ ...selectedTemplates, template3: templateId });
    }
  };

  const handleCreateVideo = () => {
    if (!selectedTemplates.template1 || !selectedTemplates.template2 || !selectedTemplates.template3) {
      toast.error("全てのテンプレートを選択してください");
      return;
    }

    createVideoMutation.mutate({
      template1Id: selectedTemplates.template1,
      template2Id: selectedTemplates.template2,
      template3Id: selectedTemplates.template3,
    });
  };

  const getCurrentTemplates = () => {
    if (step === 1) return templates1;
    if (step === 2) return templates2;
    if (step === 3) return templates3;
    return [];
  };

  const isLoading = loading1 || loading2 || loading3;
  
  const stepTitles = ["オープニング", "メインコンテンツ", "エンディング"];
  const stepDescriptions = [
    "視聴者の注目を集める印象的なオープニングを選択",
    "メッセージを伝えるメインコンテンツを選択",
    "記憶に残るエンディングを選択"
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      
      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm mb-4">
              <Sparkles className="h-4 w-4" />
              <span>3ステップで簡単作成</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              動画を作成
            </h1>
            <p className="text-xl text-slate-600">
              3段階のテンプレートを選択して、30秒の動画を作成します
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-16">
            {[1, 2, 3].map((s, index) => (
              <div key={s} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                      step > s
                        ? "bg-green-500 text-white shadow-lg scale-110"
                        : step === s
                        ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl scale-125"
                        : "bg-white text-slate-400 border-2 border-slate-200"
                    }`}
                  >
                    {step > s ? <Check className="h-6 w-6" /> : s}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${step === s ? "text-blue-600" : "text-slate-500"}`}>
                    {stepTitles[index]}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`w-24 h-1 mx-4 rounded-full transition-all duration-300 ${
                    step > s ? "bg-green-500" : "bg-slate-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Title */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              ステップ {step}: {stepTitles[step - 1]}
            </h2>
            <p className="text-lg text-slate-600">
              {stepDescriptions[step - 1]}
            </p>
          </div>

          {/* Template Selection */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-slate-600">テンプレートを読み込んでいます...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {getCurrentTemplates()?.map((template) => {
                const isSelected = 
                  (step === 1 && selectedTemplates.template1 === template.id) ||
                  (step === 2 && selectedTemplates.template2 === template.id) ||
                  (step === 3 && selectedTemplates.template3 === template.id);
                
                return (
                  <Card
                    key={template.id}
                    className={`group cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                      isSelected
                        ? "border-2 border-blue-500 shadow-xl ring-4 ring-blue-100"
                        : "border-2 border-transparent hover:border-blue-200"
                    }`}
                    onClick={() => handleTemplateSelect(step as 1 | 2 | 3, template.id)}
                  >
                    <CardContent className="p-0">
                      {template.thumbnailUrl && (
                        <div className="relative overflow-hidden rounded-t-lg">
                          <img
                            src={template.thumbnailUrl}
                            alt={template.title}
                            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                              <div className="bg-white rounded-full p-3 shadow-lg">
                                <Check className="h-8 w-8 text-blue-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <Film className="h-5 w-5 text-blue-600" />
                          {template.title}
                        </h3>
                        {template.description && (
                          <p className="text-slate-600 mb-4 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            {template.duration}秒
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewTemplate({ title: template.title, videoUrl: template.videoUrl });
                              }}
                              className="h-8 px-3"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              プレビュー
                            </Button>
                            {isSelected && (
                              <span className="text-blue-600 font-semibold text-sm flex items-center gap-1">
                                <Check className="h-4 w-4" />
                                選択中
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Success Message with Reservation Option */}
          {createdVideoId && (
            <Card className="mb-8 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">動画作成完了！</h3>
                <p className="text-slate-600 mb-2">この動画を電車車両で投影しませんか？</p>
                <p className="text-sm text-slate-500 mb-6">※ 投影予約には5,000円の決済が必要です</p>
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setLocation('/mypage')}
                  >
                    マイページへ
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => {
                      sessionStorage.setItem('pendingReservationVideoId', createdVideoId.toString());
                      createCheckoutMutation.mutate({ videoId: createdVideoId });
                    }}
                    disabled={createCheckoutMutation.isPending}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    {createCheckoutMutation.isPending ? '処理中...' : '投影予約（5,000円）'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          {!createdVideoId && (
          <div className="flex justify-between max-w-2xl mx-auto">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1 || createVideoMutation.isPending}
              className="px-8"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              戻る
            </Button>

            {step === 3 && selectedTemplates.template3 ? (
              <Button
                size="lg"
                onClick={handleCreateVideo}
                disabled={createVideoMutation.isPending}
                className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {createVideoMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    作成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    動画を作成
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => setStep(Math.min(3, step + 1))}
                disabled={
                  (step === 1 && !selectedTemplates.template1) ||
                  (step === 2 && !selectedTemplates.template2)
                }
                className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                次へ
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )}
          </div>
          )}
        </div>
      </main>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5 text-blue-600" />
              {previewTemplate?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {previewTemplate && (
              <video
                src={previewTemplate.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              >
                お使いのブラウザは動画再生に対応していません。
              </video>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
