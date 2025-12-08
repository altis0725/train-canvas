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
    <div className="flex h-screen bg-[#050a14] text-white overflow-hidden font-sans">

      {/* LEFT COLUMN: Preview Area */}
      <div className="w-[45%] h-full flex flex-col border-r border-white/10 bg-[#020617] relative">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2 text-slate-400 text-xs tracking-widest">
            {stepTitles.map((t, i) => (
              <span key={i} className={step === i + 1 ? "text-cyan-400 font-bold" : ""}>
                ステップ{i + 1}: {t} {i < 2 && " / "}
              </span>
            ))}
          </div>
        </div>

        {/* Main Preview */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(34,211,238,0.1)] bg-black group">
            {mainPreviewUrl ? (
              <video
                key={mainPreviewUrl}
                src={mainPreviewUrl}
                autoPlay
                loop
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full relative">
                <img
                  src="https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=1000"
                  className="w-full h-full object-cover opacity-50"
                  alt="Preview Base"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white/50" />
                </div>
              </div>
            )}

            {/* Overlay UI */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between text-xs text-white/70">
              <span>0:37</span>
              <div className="w-full mx-4 h-1 bg-white/20 rounded-full mt-1.5 overflow-hidden">
                <div className="w-1/3 h-full bg-cyan-500" />
              </div>
              <span>2:23</span>
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Selection Interface */}
      <div className="flex-1 h-full flex flex-col bg-[#050a14] relative">

        {/* Top Bar */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#050a14]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-lg font-bold font-orbitron">
            <span className="w-3 h-3 bg-cyan-500 rounded-full box-shadow-[0_0_10px_cyan]" />
            TrainCanvas
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><Settings className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><HelpCircle className="w-5 h-5" /></Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">

          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 font-sans tracking-tight">
              ステップ{step}：組み合わせるテンプレートを選択
            </h1>
            <p className="text-slate-400">
              ステップ1で選んだデザインに重ねる、2つ目のテンプレートを選んでください。
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2 rounded-sm text-sm font-medium transition-all duration-300 ${activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
                  : 'bg-[#1e293b] text-slate-400 hover:bg-[#2d3a50]'
                  }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-3 flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-10 h-10" /></div>
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
                    className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 border ${isSelected ? 'border-cyan-500 ring-1 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-transparent hover:border-slate-600'}`}
                  >
                    <div className="aspect-video bg-black relative">
                      <img src={template.thumbnailUrl} alt={template.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <p className="font-bold text-sm tracking-wide">{template.title}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Bottom Action Bar */}
        <div className="h-24 border-t border-white/10 flex items-center justify-end px-8 gap-4 bg-[#050a14]">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || createdVideoId != null}
            className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white px-8 h-12"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> 戻る
          </Button>

          {step === 3 && selectedTemplates.template3 ? (
            <Button
              onClick={handleCreateVideo}
              disabled={createVideoMutation.isPending || createdVideoId != null}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              {createVideoMutation.isPending ? '作成中...' : '動画を生成する'} <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => setStep(Math.min(3, step + 1))}
              disabled={
                (step === 1 && !selectedTemplates.template1) ||
                (step === 2 && !selectedTemplates.template2)
              }
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              次へ <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

      </div>

    </div>
  );
}

