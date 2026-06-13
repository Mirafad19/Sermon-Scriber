import React, { useState, useEffect, useRef } from "react";
import { Sermon, SocialSlide } from "./types";
import { DEMO_SERMON } from "./demoData";
import SermonHistory from "./components/SermonHistory";
import SlideCustomizer from "./components/SlideCustomizer";
import { 
  Mic, 
  Square, 
  Upload, 
  Play, 
  Sparkles, 
  FileText, 
  BookOpen, 
  Compass, 
  Layers, 
  Sliders, 
  Check, 
  Copy, 
  Calendar, 
  Volume2, 
  Database, 
  AlertCircle,
  Clock,
  Printer,
  ChevronRight,
  BookMarked,
  Presentation,
  X,
  Church,
  Plus
} from "lucide-react";

// Helper for parsing raw Markdown headings & bullets in summaries
function renderSummaryMarkdown(markdown: string) {
  if (!markdown) return "";
  return markdown
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("### ")) {
        return `<h4 class="text-sm font-bold text-amber-900 mt-5 mb-2 font-sans flex items-center gap-1.5 border-b border-amber-100 pb-1">${trimmed.replace("### ", "")}</h4>`;
      }
      if (trimmed.startsWith("## ")) {
        return `<h3 class="text-base font-extrabold text-slate-800 mt-6 mb-3 font-sans">${trimmed.replace("## ", "")}</h3>`;
      }
      if (trimmed.startsWith("# ")) {
        return `<h2 class="text-lg font-black text-slate-900 mt-7 mb-4 font-sans">${trimmed.replace("# ", "")}</h2>`;
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        return `<li class="ml-4 list-disc text-xs text-slate-600 mb-1.5 leading-relaxed">${trimmed.substring(2)}</li>`;
      }
      // Ordered list matching
      const orderedMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (orderedMatch) {
        return `<li class="ml-4 list-decimal text-xs text-slate-600 mb-1.5 leading-relaxed">${orderedMatch[2]}</li>`;
      }
      if (trimmed === "") {
        return '<div class="h-2"></div>';
      }
      return `<p class="text-xs text-slate-600 leading-relaxed mb-2">${trimmed}</p>`;
    })
    .join("");
}

export default function App() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [activeSermonId, setActiveSermonId] = useState<string | null>(null);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioFile, setAudioFile] = useState<Blob | File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>("");
  
  // Custom user parameters
  const [pastorThemeFocus, setPastorThemeFocus] = useState<string>("devotional"); // 'devotional' | 'doctrinal' | 'evangelistic'
  const [specialScriptures, setSpecialScriptures] = useState<string>("");
  const [customPastoralPrompt, setCustomPastoralPrompt] = useState<string>("");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Active view tab in active workspace
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "takeaways" | "slides">("summary");
  
  // Full screen Projector Simulation view
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [projectorIndex, setProjectorIndex] = useState(0);

  // UI state
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Refs for audio capturing
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize and load history from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("sermon_scriber_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSermons(parsed);
        if (parsed.length > 0) {
          setActiveSermonId(parsed[0].id);
        }
      } catch (e) {
        console.error("Could not parse saved history:", e);
      }
    } else {
      // Pre-populate with our glorious demo sermon so the workspace starts filled with beautiful data
      setSermons([DEMO_SERMON]);
      setActiveSermonId(DEMO_SERMON.id);
    }
  }, []);

  // Save history helper
  const saveSermonsToHistory = (newList: Sermon[]) => {
    setSermons(newList);
    localStorage.setItem("sermon_scriber_history", JSON.stringify(newList));
  };

  // Recording triggers
  const startRecording = async () => {
    setProcessingError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup Web Audio API wave visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 64;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          const draw = () => {
            if (!ctx) return;
            analyser.getByteFrequencyData(dataArray);
            
            // Draw clean background
            ctx.fillStyle = "#1e293b"; // Slate 800
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw subtle center line
            ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();

            // Draw frequency bars
            const barWidth = (canvas.width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              barHeight = dataArray[i] / 2;
              
              ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + barHeight / 150})`; // Amber glow
              ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth - 2, barHeight);
              
              x += barWidth;
            }
            animationFrameRef.current = requestAnimationFrame(draw);
          };
          draw();
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioFile(audioBlob);
        setAudioFileName("Live Mic Recording.webm");
        
        // Stop all track media streams securely
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Mic error:", err);
      setProcessingError("Microphone permission denied or unsupported in current view. Please upload a recorded file or explore the sample demo sermon.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Convert files/blobs to base64 securely
  const convertBlobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        try {
          const resultString = reader.result as string;
          const rawBase64 = resultString.split(",")[1];
          resolve(rawBase64);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // Handle uploaded local sermon files
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioFileName(file.name);
      setProcessingError(null);
    }
  };

  // Call the full stack backend API
  const handleProcessSermon = async () => {
    if (!audioFile) {
      setProcessingError("Please record pulpit audio or drag in a sermon file first.");
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    setProcessingStep("Translating audio packet stream to base64 encoding...");

    try {
      const base64Audio = await convertBlobToBase64(audioFile);
      
      setProcessingStep("Contacting server: Sending audio stream to Gemini Deep Transcription Engine...");

      // Build a beautiful structured custom pastoral instructions based on variables
      const toneMap: Record<string, string> = {
        "devotional": "Focus intensely on faith encouragement, hope, personal spiritual growth, and unearned grace.",
        "doctrinal": "Focus on biblical theology, verse-by-verse historical exposition, doctrinal accuracy, and church teachings.",
        "evangelistic": "Focus on active life application, practical weekly steps, community outreach, and sharing the message with family."
      };

      const customPromptText = `Analyze this church sermon audio file. Transcribe the transcript exactly.
Generate:
1. Topic / sermon title.
2. The primary key Scriptures highlighted or related to the message.
3. A detailed pastoral Markdown summary of 3-4 paragraphs.
4. A set of 4 Key Lessons/takeaways.
5. 5 visual Slide cards for social media.
Additional context:
- Sermon style focus: ${toneMap[pastorThemeFocus]}
${specialScriptures ? `- Emphasize this scripture context: ${specialScriptures}` : ""}
${customPastoralPrompt ? `- Custom instruction directives: ${customPastoralPrompt}` : ""}
`;

      const response = await fetch("/api/transcribe-sermon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio: base64Audio,
          mimeType: audioFile.type || "audio/webm",
          customPrompt: customPromptText
        }),
      });

      if (!response.ok) {
        const errPayload = await response.json().catch(() => ({}));
        throw new Error(errPayload.error || `Server returned error status (${response.status})`);
      }

      setProcessingStep("Formatting theological structures, takeaways and social presentation slide cards...");
      const result = await response.json();

      // Format current timestamp for date
      const roundedMinutes = Math.floor(recordingDuration / 60);
      const roundedSeconds = recordingDuration % 60;
      const durationFmt = roundedMinutes > 0 ? `${roundedMinutes}m ${roundedSeconds}s` : "File upload";

      const finalSermon: Sermon = {
        id: "sermon-" + Date.now(),
        date: new Date().toISOString(),
        topic: result.topic || "Untitled Sunday Sermon",
        keyScripture: result.keyScripture || "Ephesians 2:8-10",
        audioDuration: durationFmt,
        transcript: result.transcript,
        summary: result.summary,
        keyTakeaways: result.keyTakeaways || [],
        socialSlides: result.socialSlides || []
      };

      const updatedList = [finalSermon, ...sermons];
      saveSermonsToHistory(updatedList);
      setActiveSermonId(finalSermon.id);
      setIsProcessing(false);
      setAudioFile(null);
      setAudioFileName("");
      
    } catch (err: any) {
      console.error(err);
      setIsProcessing(false);
      setProcessingError(err.message || "Failed to process sermon. Check server logs or try uploading a shorter audio clip.");
    }
  };

  const handleSelectSermon = (id: string) => {
    setActiveSermonId(id);
    setProcessingError(null);
  };

  const handleDeleteSermon = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this serialized sermon from your vault? This cannot be undone.")) {
      const filtered = sermons.filter(s => s.id !== id);
      saveSermonsToHistory(filtered);
      
      if (activeSermonId === id) {
        setActiveSermonId(filtered.length > 0 ? filtered[0].id : null);
      }
    }
  };

  const handleNewSermonWorkspace = () => {
    setActiveSermonId(null);
    setAudioFile(null);
    setAudioFileName("");
    setProcessingError(null);
  };

  const handleCopyTranscript = () => {
    if (activeSermon) {
      navigator.clipboard.writeText(activeSermon.transcript);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  const handleUpdateSlides = (updatedSlides: SocialSlide[]) => {
    if (activeSermonId) {
      const updatedList = sermons.map(s => {
        if (s.id === activeSermonId) {
          return { ...s, socialSlides: updatedSlides };
        }
        return s;
      });
      saveSermonsToHistory(updatedList);
    }
  };

  // Launch Full projector slideshow mode
  const launchProjector = (idx: number) => {
    setProjectorIndex(idx);
    setIsProjectorMode(true);
  };

  const handleNextProjector = () => {
    if (activeSermon && projectorIndex < activeSermon.socialSlides.length - 1) {
      setProjectorIndex(projectorIndex + 1);
    }
  };

  const handlePrevProjector = () => {
    if (projectorIndex > 0) {
      setProjectorIndex(projectorIndex - 1);
    }
  };

  // Keyboard navigation for full screen slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isProjectorMode) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        handleNextProjector();
      } else if (e.key === "ArrowLeft") {
        handlePrevProjector();
      } else if (e.key === "Escape") {
        setIsProjectorMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isProjectorMode, projectorIndex]);

  const activeSermon = sermons.find(s => s.id === activeSermonId);

  // Formatting date for current active sermon
  const formatDateFull = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-800 flex flex-col font-sans transition-all selection:bg-amber-100 antialiased">
      
      {/* Immersive Projector Mode Backdrop */}
      {isProjectorMode && activeSermon && (
        <div id="projector-fullscreen" className="fixed inset-0 bg-slate-950 z-50 flex flex-col justify-between p-12 transition-all">
          
          {/* Top Bar */}
          <div className="flex justify-between items-center text-slate-400 font-mono text-sm">
            <div className="flex items-center gap-2">
              <Church size={18} className="text-amber-500 animate-pulse" />
              <span className="tracking-wide uppercase text-slate-200">Church Digital Projector Display</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Slide {projectorIndex + 1} of {activeSermon.socialSlides.length}</span>
              <button 
                onClick={() => setIsProjectorMode(false)}
                className="flex items-center gap-1.5 bg-slate-800 text-white hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition"
              >
                <X size={14} /> Close Display [ESC]
              </button>
            </div>
          </div>

          {/* Huge Dynamic Slide */}
          <div className="max-w-4xl mx-auto w-full flex flex-col justify-center items-center flex-1 text-center py-8">
            {(() => {
              const slide = activeSermon.socialSlides[projectorIndex];
              if (!slide) return null;
              
              // Map presentation styling classes for extreme beauty on projector screens
              const presentationThemes: Record<string, string> = {
                midnight: "bg-slate-900 border-amber-500 text-amber-100",
                "warm-sunset": "bg-gradient-to-br from-rose-700 via-orange-600 to-amber-500 border-orange-200 text-white",
                "royal-gold": "bg-slate-950 border-amber-400 text-amber-50",
                "olive-branch": "bg-emerald-950 border-stone-400 text-stone-100",
                "ambient-teal": "bg-teal-950 border-cyan-400 text-cyan-50"
              };

              const activeThemeClass = presentationThemes[slide.theme] || presentationThemes.midnight;

              return (
                <div className={`w-full max-w-3xl aspect-[16/10] border-4 rounded-3xl p-12 flex flex-col justify-between shadow-2xl transition-all duration-300 text-left ${activeThemeClass}`}>
                  <div className="space-y-2">
                    <span className="text-xs font-bold tracking-widest uppercase opacity-60">
                      {slide.subTitle || activeSermon.topic}
                    </span>
                    <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
                      {slide.title}
                    </h2>
                  </div>

                  {slide.quote && (
                    <div className="border-l-4 border-amber-400 pl-6 py-2 bg-white/5 rounded-r-xl">
                      <p className="text-xl italic font-serif leading-relaxed opacity-90">
                        "{slide.quote}"
                      </p>
                    </div>
                  )}

                  <ul className="space-y-3">
                    {slide.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-3">
                        <span className="text-2xl font-bold text-amber-400">•</span>
                        <p className="text-lg font-light opacity-90">{b}</p>
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-center border-t border-white/10 pt-4 text-sm font-semibold opacity-70">
                    {slide.scripture && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400">📖</span>
                        <span>{slide.scripture}</span>
                      </div>
                    )}
                    <span className="text-xs tracking-wider uppercase font-mono">
                      Sermon: {activeSermon.topic}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Bottom Bar Navigation */}
          <div className="flex justify-between items-center text-slate-400 max-w-xl mx-auto w-full">
            <button
              onClick={handlePrevProjector}
              disabled={projectorIndex === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous Slide
            </button>
            <span className="text-xs font-mono">
              Use Spacebar or Left/Right Arrow keys
            </span>
            <button
              onClick={handleNextProjector}
              disabled={projectorIndex === activeSermon.socialSlides.length - 1}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next Slide →
            </button>
          </div>

        </div>
      )}

      {/* Styled Top Header Row containing sacred temple themes */}
      <header className="bg-slate-900 text-white border-b-2 border-amber-500 py-6 px-4 md:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 rounded-xl shadow-inner text-slate-900">
              <Church size={28} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight font-sans flex items-center gap-1.5">
                Sermon Scriber <span className="text-amber-400 font-mono text-[10px] bg-amber-400/20 px-2 py-0.5 rounded-full uppercase tracking-widest font-normal">Vault Edition</span>
              </h1>
              <p className="text-xs text-slate-300">Convert pulpit speech, theology, and bible references into pastoral notes and social slide decks.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
            <Database size={14} className="text-amber-400 animate-pulse" />
            <div className="text-right">
              <div className="text-[10px] font-mono leading-none text-slate-400">STATUS</div>
              <div className="text-xs font-bold text-slate-200">{sermons.length} Archived Sermons</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Historical Vault Navigation (3 Columns) */}
        <div className="lg:col-span-3 lg:sticky lg:top-8 space-y-4">
          <SermonHistory
            sermons={sermons}
            activeId={activeSermonId}
            onSelectSermon={handleSelectSermon}
            onDeleteSermon={handleDeleteSermon}
            onNewSermon={handleNewSermonWorkspace}
          />

          <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-950">
              <Volume2 size={13} className="text-amber-500" />
              Wally's Audio Link
            </h4>
            <p className="text-[11px] leading-relaxed opacity-90">
              Connect a standard 3.5mm input or auxiliary cord to your laptop's mic jack to stream audio straight from the pastor's wireless microphone receiver into this logger.
            </p>
          </div>
        </div>

        {/* Right Dashboard Workspace (9 Columns) */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Active Processing Loader */}
          {isProcessing && (
            <div className="bg-white rounded-2xl p-8 border border-amber-300 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin" />
                <Sparkles size={24} className="text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800">Transcribing Sermon</h3>
                <p className="text-xs text-slate-500 max-w-md font-mono">{processingStep}</p>
              </div>
              <div className="flex gap-2 text-[10px] font-mono text-slate-400 bg-slate-50 px-4 py-2 rounded-lg max-w-sm">
                <span>Please keep this window open while Gemini analyzes the theological structure and formats the slide files...</span>
              </div>
            </div>
          )}

          {/* Main Workspace Frame */}
          {!isProcessing && (
            <>
              {/* If we have no active selected sermon (New Sermon setup mode) */}
              {!activeSermonId ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-8">
                  <div className="border-b border-slate-100 pb-4 text-center max-w-xl mx-auto space-y-2">
                    <h2 className="text-xl font-black text-slate-900">Sermon Transcription Portal</h2>
                    <p className="text-xs text-slate-500">Record a live Sunday preaching session or upload pre-recorded sermon files to automatically produce transcript logs, pastoral summaries, and slide packages.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    
                    {/* Audio Capture Control Box */}
                    <div className="border border-slate-200 rounded-2xl p-6 space-y-6 bg-slate-50/50">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">1. Secure Pulpit Audio</h3>
                        <p className="text-[11px] text-slate-400">Capture speech directly or feed in pre-saved voice waves.</p>
                      </div>

                      {/* Live microphone recorder box */}
                      <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col items-center justify-center space-y-4">
                        {isRecording ? (
                          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase tracking-wider animate-pulse">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                            Live Pulpit Streaming
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                            Microphone Node Status: Idle
                          </div>
                        )}

                        {/* Frequency Meter Visualizer */}
                        <canvas
                          ref={canvasRef}
                          width={260}
                          height={50}
                          className="w-full h-12 bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
                        />

                        {isRecording ? (
                          <div className="flex flex-col items-center space-y-3">
                            <div className="text-2xl font-bold font-mono tracking-widest flex items-center gap-1.5">
                              <Clock size={18} className="text-rose-500 animate-spin" />
                              {Math.floor(recordingDuration / 60).toString().padStart(2, "0")}:
                              {(recordingDuration % 60).toString().padStart(2, "0")}
                            </div>
                            
                            <button
                              onClick={stopRecording}
                              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase rounded-lg flex items-center gap-2 transition shadow-lg cursor-pointer"
                            >
                              <Square size={12} /> Halt Audio Recorder
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={startRecording}
                            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold uppercase rounded-lg flex items-center gap-2 transition shadow-lg cursor-pointer"
                          >
                            <Mic size={14} /> Start Pulpit Recording
                          </button>
                        )}
                      </div>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-mono tracking-widest uppercase">OR UPLOAD FILE</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      {/* File Drag in upload container */}
                      <div className="border-2 border-dashed border-slate-200 hover:border-amber-400 rounded-xl p-6 text-center cursor-pointer bg-white transition relative">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className="space-y-2 flex flex-col items-center">
                          <Upload size={24} className="text-slate-400" />
                          <div className="text-xs font-medium text-slate-700">
                            {audioFileName ? (
                              <span className="text-emerald-600 font-bold">{audioFileName}</span>
                            ) : (
                              "Click to browse audio files..."
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">Supports WebM, WAV, MP3, M4A up to 25MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Customize Prompts & Tone panel */}
                    <div className="border border-slate-200 rounded-2xl p-6 space-y-6">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Sliders size={15} className="text-amber-500" />
                          2. Pulpit Analysis Focus
                        </h3>
                        <p className="text-[11px] text-slate-400">Target specific theology summary goals.</p>
                      </div>

                      {/* Switch sermon style tones */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                          Grace and Sermon Tone
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "devotional", label: "Devotional", desc: "Hope & Grace" },
                            { id: "doctrinal", label: "Doctrinal", desc: "Verse-to-Verse" },
                            { id: "evangelistic", label: "Outreach", desc: "Practical Life" }
                          ].map((tone) => (
                            <button
                              key={tone.id}
                              onClick={() => setPastorThemeFocus(tone.id)}
                              className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition ${
                                pastorThemeFocus === tone.id
                                  ? "border-amber-500 bg-amber-50 text-slate-800"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <span className="text-xs font-bold leading-none">{tone.label}</span>
                              <span className="text-[8.5px] text-slate-400 uppercase mt-1 tracking-wider leading-none">{tone.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scripture Reference injection textbox */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                            Primary Scriptures Read
                          </label>
                          <span className="text-[9px] text-slate-400 font-mono">Optional background context</span>
                        </div>
                        <input
                          type="text"
                          placeholder="e.g. Genesis 1:1, Romans 12:1-2"
                          value={specialScriptures}
                          onChange={(e) => setSpecialScriptures(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 text-slate-700"
                        />
                      </div>

                      {/* Custom Prompt Context */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                          Supplementary Scribe Directives
                        </label>
                        <textarea
                          placeholder="Provide specific notes you'd like the AI to emphasize (e.g., 'Emphasize the Greek root word used for grace' or 'Include slides specifically for youth outreach')."
                          value={customPastoralPrompt}
                          onChange={(e) => setCustomPastoralPrompt(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-amber-500 text-slate-700"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submission and Action Block */}
                  {processingError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs flex gap-2 items-start max-w-2xl mx-auto">
                      <AlertCircle className="text-red-500 shrink-0" size={16} />
                      <p>{processingError}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    <button
                      onClick={handleProcessSermon}
                      disabled={!audioFile}
                      className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold uppercase text-xs tracking-wider rounded-xl transition shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={16} /> Parse, Summarize & Build Slide Deck
                    </button>
                    
                    <button
                      onClick={() => {
                        setSermons([DEMO_SERMON, ...sermons]);
                        setActiveSermonId(DEMO_SERMON.id);
                        setProcessingError(null);
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold uppercase text-xs tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Try Scribe Demo instantly
                    </button>
                  </div>
                </div>
              ) : (
                
                // Active workspace for a loaded sermon
                <div className="space-y-6">
                  
                  {/* Sermon title details banner */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    
                    <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-slate-300 pointer-events-none uppercase">
                      Archived Recording Log
                    </div>

                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 tracking-wide uppercase">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-amber-500" />
                          {formatDateFull(activeSermon?.date)}
                        </span>
                        <span>•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          Duration Check: {activeSermon?.audioDuration || "Uploaded stream"}
                        </span>
                      </div>

                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 leading-tight">
                        {activeSermon?.topic}
                      </h2>

                      <div className="flex items-center gap-1.5 text-xs text-amber-900 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 w-fit">
                        <BookMarked size={14} className="text-amber-500 shrink-0" />
                        <span>Featured Reading: {activeSermon?.keyScripture}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => launchProjector(0)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow-xs"
                      >
                        <Presentation size={13} /> Project Slideshow
                      </button>
                      <button
                        onClick={handleNewSermonWorkspace}
                        className="flex-1 md:flex-none border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold px-4 py-2 transition"
                      >
                        New Scribe
                      </button>
                    </div>
                  </div>

                  {/* Tab Navigation header */}
                  <div className="flex border-b border-slate-200">
                    {[
                      { id: "summary", label: "Pastoral Summary", icon: FileText },
                      { id: "takeaways", label: "Church Lessons", icon: BookMarked },
                      { id: "slides", label: "Social Slides & Visuals", icon: Presentation },
                      { id: "transcript", label: "Full Scribe Transcript", icon: Volume2 }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center gap-1.5 px-4 md:px-6 py-3 border-b-2 text-xs font-extrabold tracking-wide uppercase transition cursor-pointer ${
                            isActive
                              ? "border-amber-500 text-amber-600"
                              : "border-transparent text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          <Icon size={14} /> {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tabs Workspace content panels */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8">
                    
                    {/* Pastoral Summary Screen */}
                    {activeTab === "summary" && activeSermon && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-md font-bold text-slate-900">Pastoral Overview & Structural Summary</h3>
                          <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition"
                          >
                            <Printer size={12} /> Print Sermon Bulletin
                          </button>
                        </div>
                        
                        {/* Summary rendered via simplified custom parser */}
                        <div 
                          className="prose prose-amber prose-xs max-w-none text-slate-700 leading-relaxed space-y-4"
                          dangerouslySetInnerHTML={{ __html: renderSummaryMarkdown(activeSermon.summary) }}
                        />
                      </div>
                    )}

                    {/* Church lessons / Action Items takeaways Tab */}
                    {activeTab === "takeaways" && activeSermon && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-md font-bold text-slate-900">Key Takeaways & Lessons for Life Application</h3>
                          <p className="text-xs text-slate-400 mt-1">4 core spiritual messages for the church congregation to reflect upon this week.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activeSermon.keyTakeaways && activeSermon.keyTakeaways.map((takeaway, idx) => (
                            <div 
                              key={idx} 
                              className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/50 flex gap-3"
                            >
                              <div className="p-1 px-2.5 bg-amber-200 rounded-lg text-amber-950 font-bold font-mono text-xs text-center shrink-0 w-8 h-8 flex items-center justify-center">
                                {idx + 1}
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-amber-900">Lesson {idx + 1}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed font-light">{takeaway}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                          <h4 className="text-xs font-bold text-slate-800 mb-1">Weekly Bulletin Thought</h4>
                          <p className="text-xs text-slate-500 italic leading-relaxed">
                            "Let us carry these values in our hearts. Encourage one another, pray over these scriptures, and live out your purposeful masterpiece design day by day."
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Live Social Slides & PNG Designer Tab */}
                    {activeTab === "slides" && activeSermon && (
                      <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4 flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <h3 className="text-md font-bold text-slate-900">Social Media slide cards & Quotes</h3>
                            <p className="text-xs text-slate-400">Preview, edit text details, toggle church palettes, and export slide designs directly as image files.</p>
                          </div>
                          
                          <button
                            onClick={() => launchProjector(0)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg uppercase cursor-pointer"
                          >
                            <Presentation size={12} /> Play Slideshow
                          </button>
                        </div>

                        {activeSermon.socialSlides && activeSermon.socialSlides.length > 0 ? (
                          <SlideCustomizer
                            slides={activeSermon.socialSlides}
                            onUpdateSlides={handleUpdateSlides}
                            sermonTopic={activeSermon.topic}
                          />
                        ) : (
                          <div className="text-center p-8 text-slate-400">
                            No slides generated for this recording.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Exact Word Scribe Transcript Tab */}
                    {activeTab === "transcript" && activeSermon && (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-md font-bold text-slate-900">Exact Pulpit Scriptorium Transcript</h3>
                            <p className="text-xs text-slate-400">Complete word-for-word transcript extracted from sermon audio.</p>
                          </div>

                          <button
                            onClick={handleCopyTranscript}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer transition"
                          >
                            {copiedTranscript ? (
                              <>
                                <Check size={12} className="text-green-500" /> Copied Scribe!
                              </>
                            ) : (
                              <>
                                <Copy size={12} /> Copy Transcript Text
                              </>
                            )}
                          </button>
                        </div>

                        <div className="p-5 bg-slate-50/60 border border-slate-200 rounded-xl max-h-96 overflow-y-auto whitespace-pre-wrap text-xs text-slate-600 leading-relaxed font-serif">
                          {activeSermon.transcript}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>

      {/* Humble visual footer details */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 px-4 md:px-8 text-center mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 Sermon Scriber. Created with care for churches to amplify the Gospel message.</p>
          <div className="flex gap-4 font-mono text-[10px]">
            <span>Microphone Cord Connected</span>
            <span>•</span>
            <span>Gemini Deep Theological Intelligence</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
