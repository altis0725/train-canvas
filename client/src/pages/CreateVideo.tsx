import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Film, ChevronRight, Check, Loader2, Sparkles, ArrowLeft, Calendar, Play, Settings, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

// Filter categories
const CATEGORIES = [
  { id: 'all', label: 'すべて' },
  { id: 'geometric', label: '幾何学' },
  { id: 'nature', label: '自然' },
  { id: 'abstract', label: '抽象' },
  { id: 'season', label: '季節' },
];

export default function CreateVideo() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [selectedTemplates, setSelectedTemplates] = useState({
    template1: null as number | null,
    template2: null as number | null,
    template3: null as number | null,
  });
  const [activeCategory, setActiveCategory] = useState('all');

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

  // For the main preview area
  const [mainPreviewUrl, setMainPreviewUrl] = useState<string | null>(null);

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

  /*
    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex flex-col bg-[#050a14] text-white">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4 font-orbitron text-glow">LOGIN REQUIRED</h1>
              <p className="text-slate-400 mb-8">動画を作成するにはログインしてください。</p>
            </div>
          </div>
        </div>
      );
    }
  */

  const handleTemplateSelect = (category: 1 | 2 | 3, templateId: number, videoUrl?: string) => {
    if (category === 1) {
      setSelectedTemplates({ ...selectedTemplates, template1: templateId });
      if (videoUrl) setMainPreviewUrl(videoUrl);
      // Auto advance for flow smoothness if desired, but sticking to manual "Next" for now
    } else if (category === 2) {
      setSelectedTemplates({ ...selectedTemplates, template2: templateId });
      if (videoUrl) setMainPreviewUrl(videoUrl);
    } else if (category === 3) {
      setSelectedTemplates({ ...selectedTemplates, template3: templateId });
      if (videoUrl) setMainPreviewUrl(videoUrl);
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
    const temps = step === 1 ? templates1 : step === 2 ? templates2 : templates3;
    if (!temps) return [];

    if (activeCategory === 'all') return temps;
    // Mock category filtering since backend might not support it yet
    // In a real app we'd filter by template.tags or similar
    return temps;
  };

  const isLoading = loading1 || loading2 || loading3;

  const stepTitles = ["ベース選択", "テンプレート選択", "確認"];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-[#020617] text-white lg:overflow-hidden font-sans selection:bg-cyan-500/30">

      {/* LEFT COLUMN: Preview Area */}
      <div className="w-full lg:w-[45%] h-auto lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-cyan-900/30 bg-[#050a14] relative shrink-0">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* Progress Stepper */}
        <div className="relative z-10 p-4 lg:p-8">
          <div className="flex justify-between items-center max-w-md mx-auto relative">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-cyan-900/50 -z-10" />

            {stepTitles.map((t, i) => {
              const isActive = step >= i + 1;
              const isCurrent = step === i + 1;
              return (
                <div key={i} className="flex flex-col items-center gap-1 lg:gap-2">
                  <div className={`
                    w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-[10px] lg:text-xs font-bold transition-all duration-300 border-2
                    ${isActive
                      ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_cyan]'
                      : 'bg-[#0f172a] border-cyan-900 text-cyan-700'
                    }
                  `}>
                    {isActive ? <Check className="w-3 h-3 lg:w-4 lg:h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] lg:text-xs tracking-wider transition-colors duration-300 ${isCurrent ? 'text-cyan-400 font-bold text-glow' : 'text-slate-500'}`}>
                    {t}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Preview Monitor */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative z-10">
          <div className="relative w-full aspect-video max-w-2xl group">

            {/* Cyber Frame Elements */}
            <div className="absolute -top-1 -left-1 w-6 h-6 lg:w-8 lg:h-8 border-t-2 border-l-2 border-cyan-500 z-20" />
            <div className="absolute -top-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 border-t-2 border-r-2 border-cyan-500 z-20" />
            <div className="absolute -bottom-1 -left-1 w-6 h-6 lg:w-8 lg:h-8 border-b-2 border-l-2 border-cyan-500 z-20" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 lg:w-8 lg:h-8 border-b-2 border-r-2 border-cyan-500 z-20" />

            <div className="relative w-full h-full bg-black overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              {/* Scan Line Animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-[10px] w-full animate-cyber-scan pointer-events-none z-10" />

              {mainPreviewUrl ? (
                <video
                  key={mainPreviewUrl}
                  src={mainPreviewUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-[#050a14]">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center opacity-20 grayscale" />
                  <div className="relative z-10 flex flex-col items-center p-4 border border-cyan-500/30 bg-black/50 backdrop-blur-sm rounded-xl">
                    <Play className="w-12 h-12 text-cyan-500/70 mb-2" />
                    <p className="text-cyan-500/70 font-mono text-sm">WAITING FOR INPUT...</p>
                  </div>
                </div>
              )}

              {/* Overlay UI */}
              <div className="absolute bottom-0 left-0 right-0 p-2 lg:p-4 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between font-mono text-[10px] lg:text-xs text-cyan-400/80">
                <div className="flex gap-4">
                  <span>REC</span>
                  <span>[00:00:00:00]</span>
                </div>
                <div className="flex gap-2">
                  <span>HD</span>
                  <span>60FPS</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-8 text-center hidden lg:block">
            <h2 className="text-xl font-bold font-orbitron text-white mb-1 tracking-wider">PREVIEW MONITOR</h2>
            <p className="text-cyan-500/60 text-sm">Real-time projection visualization</p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Selection Interface */}
      <div className="flex-1 flex flex-col bg-[#020617] relative lg:h-full">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/10 blur-[100px] pointer-events-none" />

        {/* Top Bar - Hidden on mobile, shown on desktop */}
        <header className="hidden lg:flex h-16 border-b border-white/5 items-center justify-between px-8 bg-[#020617]/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 text-lg font-bold font-orbitron text-white">
            <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan]" />
            TrainCanvas <span className="text-cyan-500 text-xs ml-1">v2.0</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30"><Settings className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-cyan-400 hover:bg-cyan-950/30"><HelpCircle className="w-5 h-5" /></Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 lg:overflow-y-auto p-4 lg:p-8 scrollbar-hide relative z-10 pb-32 lg:pb-8">

          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold mb-2 font-sans tracking-tight text-white flex items-center gap-2 lg:gap-3">
              <span className="text-cyan-500 font-orbitron text-3xl lg:text-4xl">0{step}</span>
              {step === 1 ? 'ベース映像' : step === 2 ? '効果' : '最終確認'}
            </h1>
            <p className="text-slate-400 pl-10 lg:pl-14 text-sm lg:text-base">
              {step === 1 ? 'ベースとなる背景映像を選んでください。' :
                step === 2 ? '重ねるエフェクトを選んでください。' :
                  '選択した組み合わせを確認してください。'}
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 lg:gap-3 mb-6 lg:mb-8 flex-wrap pl-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 lg:px-5 py-1.5 lg:py-2 rounded-full text-xs lg:text-sm font-medium transition-all duration-300 border ${activeCategory === cat.id
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-[#0f172a] text-slate-400 border-white/5 hover:border-white/20 hover:text-slate-200'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6 pb-20">
            {isLoading ? (
              <div className="col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-cyan-500 w-10 h-10 mb-4" />
                <p className="text-slate-500 animate-pulse">Scanning database...</p>
              </div>
            ) : (
              getCurrentTemplates()?.map(template => {
                const isSelected =
                  (step === 1 && selectedTemplates.template1 === template.id) ||
                  (step === 2 && selectedTemplates.template2 === template.id) ||
                  (step === 3 && selectedTemplates.template3 === template.id);

                return (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(step as 1 | 2 | 3, template.id, template.videoUrl)}
                    className={`
                      group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 
                      border-2 bg-[#0f172a]
                      ${isSelected
                        ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.2)] scale-[1.02]'
                        : 'border-white/5 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                      }
                    `}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img
                        src={template.thumbnailUrl ?? undefined}
                        alt={template.title}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />

                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-cyan-500 text-black p-1 rounded-full shadow-[0_0_10px_cyan]">
                          <Check className="w-3 h-3 lg:w-4 lg:h-4" />
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <p className={`font-bold text-xs lg:text-sm tracking-wide ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                          {template.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                          Click to preview
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Bottom Action Bar */}
        <div className="fixed lg:absolute bottom-0 left-0 right-0 h-20 lg:h-24 border-t border-white/5 flex items-center justify-between px-6 lg:px-10 bg-[#020617]/95 backdrop-blur z-50 lg:z-20">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || createdVideoId != null}
            className="border-slate-800 bg-transparent text-slate-400 hover:bg-slate-900 hover:text-white px-4 lg:px-8 h-10 lg:h-12 rounded-full text-xs lg:text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 戻る
          </Button>

          <div className="flex gap-4">
            {step === 3 && selectedTemplates.template3 ? (
              <Button
                onClick={handleCreateVideo}
                disabled={createVideoMutation.isPending || createdVideoId != null}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-6 lg:px-10 h-10 lg:h-12 rounded-full shadow-[0_0_25px_rgba(6,182,212,0.4)] border-none font-bold tracking-wide transition-all hover:scale-105 text-xs lg:text-sm"
              >
                {createVideoMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> GENERATING...
                  </>
                ) : (
                  <>
                    GENERATE VIDEO <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => setStep(Math.min(3, step + 1))}
                disabled={
                  (step === 1 && !selectedTemplates.template1) ||
                  (step === 2 && !selectedTemplates.template2)
                }
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 lg:px-10 h-10 lg:h-12 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)] border-none font-bold tracking-wide transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 text-xs lg:text-sm"
              >
                NEXT STEP <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

