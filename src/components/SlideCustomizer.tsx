import React, { useState, useRef } from "react";
import { SocialSlide } from "../types";
import { 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Sparkles, 
  Square, 
  Smartphone,
  BookOpen,
  Quote,
  Pencil,
  Palette
} from "lucide-react";

interface SlideCustomizerProps {
  slides: SocialSlide[];
  onUpdateSlides: (updated: SocialSlide[]) => void;
  sermonTopic: string;
}

const THEME_MAP: Record<string, { bg: string; text: string; accent: string; label: string; canvasBg: string; canvasText: string; canvasAccent: string }> = {
  "midnight": {
    bg: "bg-slate-900 border-amber-500",
    text: "text-slate-100",
    accent: "text-amber-400",
    label: "Midnight Gold",
    canvasBg: "#1e293b",
    canvasText: "#f1f5f9",
    canvasAccent: "#fbbf24",
  },
  "warm-sunset": {
    bg: "bg-gradient-to-br from-rose-600 to-amber-500 border-orange-300",
    text: "text-white",
    accent: "text-amber-100",
    label: "Warm Sunset",
    canvasBg: "gradient:linear-gradient(135deg, #e11d48, #f59e0b)",
    canvasText: "#ffffff",
    canvasAccent: "#fef3c7",
  },
  "royal-gold": {
    bg: "bg-blue-950 border-amber-300",
    text: "text-amber-50",
    accent: "text-amber-300",
    label: "Royal Navy & Gold",
    canvasBg: "#030712",
    canvasText: "#fef3c7",
    canvasAccent: "#fcd34d",
  },
  "olive-branch": {
    bg: "bg-emerald-950 border-stone-400",
    text: "text-stone-100",
    accent: "text-emerald-300",
    label: "Olive Branch",
    canvasBg: "#022c22",
    canvasText: "#f5f5f4",
    canvasAccent: "#6ee7b7",
  },
  "ambient-teal": {
    bg: "bg-teal-900 border-cyan-400",
    text: "text-slate-50",
    accent: "text-cyan-300",
    label: "Teal Slate",
    canvasBg: "#115e59",
    canvasText: "#f8fafc",
    canvasAccent: "#67e8f9",
  }
};

export default function SlideCustomizer({ slides, onUpdateSlides, sermonTopic }: SlideCustomizerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<"square" | "story">("square"); // square (1:1) vs story (9:16)
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const currentSlide = slides[currentIndex] || slides[0];

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleThemeChange = (themeName: string) => {
    const updated = [...slides];
    updated[currentIndex] = { ...currentSlide, theme: themeName };
    onUpdateSlides(updated);
  };

  const handleFieldChange = (field: keyof SocialSlide, value: any) => {
    const updated = [...slides];
    updated[currentIndex] = { ...currentSlide, [field]: value };
    onUpdateSlides(updated);
  };

  const handleBulletChange = (bulletIndex: number, text: string) => {
    const updatedBullets = [...currentSlide.bullets];
    updatedBullets[bulletIndex] = text;
    const updated = [...slides];
    updated[currentIndex] = { ...currentSlide, bullets: updatedBullets };
    onUpdateSlides(updated);
  };

  const handleAddBullet = () => {
    if (currentSlide.bullets.length < 3) {
      const updatedBullets = [...currentSlide.bullets, "New message point..."];
      const updated = [...slides];
      updated[currentIndex] = { ...currentSlide, bullets: updatedBullets };
      onUpdateSlides(updated);
    }
  };

  const handleRemoveBullet = (bulletIdx: number) => {
    const updatedBullets = currentSlide.bullets.filter((_, idx) => idx !== bulletIdx);
    const updated = [...slides];
    updated[currentIndex] = { ...currentSlide, bullets: updatedBullets };
    onUpdateSlides(updated);
  };

  const handleCopyText = () => {
    const bulletsFormatted = currentSlide.bullets.map(b => `• ${b}`).join("\n");
    const scriptureText = currentSlide.scripture ? `📖 Scripture: ${currentSlide.scripture}\n` : "";
    const quoteText = currentSlide.quote ? `\n"${currentSlide.quote}"\n` : "";
    
    const formatted = `✨ ${currentSlide.title} ✨\n${currentSlide.subTitle ? `${currentSlide.subTitle}\n` : ""}\n${bulletsFormatted}\n${quoteText}${scriptureText}\n— Preached at Church | Sermon: "${sermonTopic}"`;
    
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Highly robust canvas-based PNG export
  const exportAsPng = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set dimensions based on ratio
    const width = 1080;
    const height = aspectRatio === "square" ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    const themeConfig = THEME_MAP[currentSlide.theme] || THEME_MAP.midnight;

    // Draw background
    if (themeConfig.canvasBg.startsWith("gradient:")) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#e11d48"); // Rose-600
      grad.addColorStop(1, "#f59e0b"); // Amber-500
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = themeConfig.canvasBg;
    }
    ctx.fillRect(0, 0, width, height);

    // Draw borders/decorations
    ctx.lineWidth = 14;
    ctx.strokeStyle = themeConfig.canvasAccent;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Set up text formatting
    ctx.textBaseline = "top";

    // Header/Subtitle
    ctx.fillStyle = themeConfig.canvasAccent;
    ctx.font = "bold 28px sans-serif";
    const subText = (currentSlide.subTitle || "SUNDAY SERMON HIGHLIGHTS").toUpperCase();
    ctx.fillText(subText, 100, 100);

    // Slide Number Tracker
    ctx.font = "italic 24px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`Slide ${currentIndex + 1} of ${slides.length}`, width - 100, 100);
    ctx.textAlign = "left";

    // Draw Main Title with Wrap Text
    ctx.fillStyle = themeConfig.canvasText;
    ctx.font = "bold 56px sans-serif";
    const titleY = wrapText(ctx, currentSlide.title, 100, 180, width - 200, 72);

    // Draw Quote block
    let quoteY = titleY + 60;
    if (currentSlide.quote) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      const boxHeight = 180;
      ctx.fillRect(100, quoteY, width - 200, boxHeight);
      ctx.strokeStyle = themeConfig.canvasAccent;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(100, quoteY);
      ctx.lineTo(100, quoteY + boxHeight);
      ctx.stroke();

      ctx.fillStyle = themeConfig.canvasAccent;
      ctx.font = "bold 56px Georgia, serif";
      ctx.fillText(`"`, 120, quoteY + 20);

      ctx.fillStyle = themeConfig.canvasText;
      ctx.font = "italic 32px Georgia, serif";
      wrapText(ctx, currentSlide.quote, 160, quoteY + 30, width - 300, 42);
      quoteY += boxHeight + 60;
    }

    // Bullet points (or notes)
    ctx.fillStyle = themeConfig.canvasText;
    ctx.font = "32px sans-serif";
    let bulletY = quoteY;
    currentSlide.bullets.forEach((b) => {
      ctx.fillStyle = themeConfig.canvasAccent;
      ctx.fillText("•", 100, bulletY);
      
      ctx.fillStyle = themeConfig.canvasText;
      const finalY = wrapText(ctx, b, 130, bulletY, width - 230, 45);
      bulletY = finalY + 30;
    });

    // Bible Verse indicator at the bottom
    let footerY = height - 160;
    if (currentSlide.scripture) {
      ctx.fillStyle = themeConfig.canvasAccent;
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(`Scripture: ${currentSlide.scripture}`, 100, footerY);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "italic 24px sans-serif";
    ctx.fillText("Sermon Scriber", 100, height - 110);

    // Trigger download
    const imgUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `sermon_slide_${currentSlide.slideNumber}_${currentSlide.theme}.png`;
    link.href = imgUrl;
    link.click();
  };

  // Utility to auto wrap long text in canvas
  function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  }

  const activeTheme = THEME_MAP[currentSlide.theme] || THEME_MAP.midnight;

  return (
    <div id="slide-customizer-root" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Visual Live Editor Frame (Left 7 Columns) */}
      <div className="lg:col-span-7 flex flex-col items-center">
        
        {/* Dimensions Toggle / Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 shadow-xs border border-slate-200">
          <button
            onClick={() => setAspectRatio("square")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              aspectRatio === "square"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Square size={14} /> Square (Feed 1:1)
          </button>
          <button
            onClick={() => setAspectRatio("story")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              aspectRatio === "story"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Smartphone size={14} /> Story (9:16)
          </button>
        </div>

        {/* Live Presentation Simulated Slide Card */}
        <div 
          className={`relative border-8 rounded-2xl p-8 flex flex-col justify-between shadow-2xl transition-all duration-300 overflow-hidden ${activeTheme.bg} ${activeTheme.text}`}
          style={{
            width: "100%",
            maxWidth: "460px",
            aspectRatio: aspectRatio === "square" ? "1/1" : "9/16"
          }}
        >
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.05),transparent)] pointer-events-none" />

          {/* Top Header Row */}
          <div className="flex justify-between items-start z-10">
            <div>
              <span className={`text-[10px] tracking-widest font-bold uppercase ${activeTheme.accent}`}>
                {currentSlide.subTitle || "Sermon Highlight"}
              </span>
            </div>
            <div className="text-xs font-mono opacity-60">
              Slide {currentIndex + 1}/{slides.length}
            </div>
          </div>

          {/* Main Card Content */}
          <div className="my-auto space-y-6 z-10">
            {/* Slide Title */}
            {isEditing ? (
              <input
                type="text"
                value={currentSlide.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-600 rounded px-2 py-1 text-lg font-bold text-white focus:outline-hidden focus:border-amber-400"
              />
            ) : (
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
                {currentSlide.title}
              </h3>
            )}

            {/* Pulled Quote Banner */}
            {currentSlide.quote && (
              <div className="border-l-4 pl-4 py-2 bg-white/5 rounded-r-lg">
                <Quote size={20} className={`${activeTheme.accent} mb-1 opacity-70`} />
                {isEditing ? (
                  <textarea
                    value={currentSlide.quote}
                    onChange={(e) => handleFieldChange("quote", e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded px-2 py-1 text-sm font-serif italic text-white focus:outline-hidden focus:border-amber-400"
                    rows={2}
                  />
                ) : (
                  <p className="text-sm md:text-md italic font-serif opacity-90 leading-relaxed">
                    "{currentSlide.quote}"
                  </p>
                )}
              </div>
            )}

            {/* Bullet Points */}
            <ul className="space-y-3">
              {currentSlide.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className={`text-lg font-semibold ${activeTheme.accent}`}>•</span>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="flex gap-1 items-center">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => handleBulletChange(idx, e.target.value)}
                          className="w-full bg-slate-800/50 border border-slate-600 rounded px-2 py-0.5 text-xs text-white focus:outline-hidden focus:border-amber-400"
                        />
                        <button 
                          onClick={() => handleRemoveBullet(idx)}
                          className="text-red-400 hover:text-red-500 text-xs px-1"
                          title="Remove Point"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs md:text-sm font-light opacity-85 leading-snug">
                        {bullet}
                      </p>
                    )}
                  </div>
                </li>
              ))}
              {isEditing && currentSlide.bullets.length < 3 && (
                <button
                  onClick={handleAddBullet}
                  className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 mt-2 font-mono"
                >
                  + Add Bullet Point
                </button>
              )}
            </ul>
          </div>

          {/* Bottom Footer block */}
          <div className="flex justify-between items-center z-10 pt-4 border-t border-white/10">
            {currentSlide.scripture && (
              <div className="flex items-center gap-1 text-[11px] font-semibold opacity-90">
                <BookOpen size={12} className={activeTheme.accent} />
                <span>{currentSlide.scripture}</span>
              </div>
            )}
            <span className="text-[9px] font-mono tracking-wider opacity-40 uppercase">
              Sermon Scriber
            </span>
          </div>
        </div>

        {/* Deck Navigation Controls */}
        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={18} />
          </button>
          
          <span className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Slide {currentIndex + 1} of {slides.length}
          </span>

          <button
            onClick={handleNext}
            disabled={currentIndex === slides.length - 1}
            className="p-3 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Editor sidebar and Theme customization (Right 5 Columns) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          
          {/* Header Actions */}
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Palette className="text-amber-500" size={18} />
                Slide Settings
              </h4>
              <p className="text-xs text-slate-500">Customize look, layout & copy</p>
            </div>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isEditing 
                  ? "bg-amber-500 text-white border-amber-600" 
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Pencil size={12} /> {isEditing ? "Save Edits" : "Edit Slide"}
            </button>
          </div>

          {/* Theme Presets Row */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Apply Color Palette
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(THEME_MAP).map(([key, config]) => {
                const isSelected = currentSlide.theme === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleThemeChange(key)}
                    className={`flex flex-col items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? "border-slate-800 ring-2 ring-amber-400 bg-slate-50" 
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-[11px] font-medium text-slate-700 w-full truncate mb-1">
                      {config.label}
                    </div>
                    <div className="flex gap-1 w-full h-3 rounded-full overflow-hidden mt-1">
                      <div className={`flex-1 ${config.bg.split(' ')[0]}`} />
                      <div className="w-2 bg-amber-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            {/* Quick action buttons */}
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Publishing Actions
            </label>

            <button
              onClick={exportAsPng}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
            >
              <Download size={16} /> Export High-Res PNG (Card)
            </button>

            <button
              onClick={handleCopyText}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow-xs"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-400" /> Copied Caption!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Social Media Caption
                </>
              )}
            </button>
          </div>

          {/* Social Caption Preview Box */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
            <span className="text-[10.5px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1 mb-2">
              <Sparkles size={11} className="text-amber-500 animate-pulse" /> Included Caption Template
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed max-h-36 overflow-y-auto font-mono whitespace-pre-wrap">
              ✨ {currentSlide.title} ✨
              {"\n"}{currentSlide.subTitle ? `${currentSlide.subTitle}\n` : ""}
              {"\n"}{currentSlide.bullets.map(b => `• ${b}`).join("\n")}
              {"\n\n"}{currentSlide.quote ? `"${currentSlide.quote}"\n\n` : ""}
              {currentSlide.scripture ? `📖 Scripture: ${currentSlide.scripture}\n` : ""}
              — Preached at Church | Sermon: "{sermonTopic}"
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
