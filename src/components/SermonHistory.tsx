import React, { useState } from "react";
import { Sermon } from "../types";
import { 
  Search, 
  Calendar, 
  BookOpen, 
  Layers, 
  Trash2, 
  FileText, 
  Plus 
} from "lucide-react";

interface SermonHistoryProps {
  sermons: Sermon[];
  activeId: string | null;
  onSelectSermon: (id: string) => void;
  onDeleteSermon: (id: string, e: React.MouseEvent) => void;
  onNewSermon: () => void;
}

export default function SermonHistory({
  sermons,
  activeId,
  onSelectSermon,
  onDeleteSermon,
  onNewSermon
}: SermonHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSermons = sermons.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.topic.toLowerCase().includes(q) ||
      s.keyScripture.toLowerCase().includes(q) ||
      s.transcript.toLowerCase().includes(q)
    );
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Sermon Date";
    }
  };

  return (
    <div id="sermon-history-container" className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Search Header and Action */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers size={16} className="text-amber-500" />
            Sermon Vault
          </h3>
          <button
            onClick={onNewSermon}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus size={12} /> New Sermon
          </button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search topic or scripture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:border-amber-500"
          />
        </div>
      </div>

      {/* Sermons List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[450px] lg:max-h-[600px]">
        {filteredSermons.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileText size={32} className="opacity-40 mb-2" />
            <p className="text-xs">No transcripts cataloged.</p>
          </div>
        ) : (
          filteredSermons.map((sermon) => {
            const isActive = sermon.id === activeId;
            return (
              <div
                key={sermon.id}
                onClick={() => onSelectSermon(sermon.id)}
                className={`group relative p-3 text-left transition cursor-pointer flex justify-between items-start ${
                  isActive 
                    ? "bg-amber-50/80 border-l-4 border-amber-500" 
                    : "hover:bg-slate-50/80 border-l-4 border-transparent"
                }`}
              >
                <div className="space-y-1 flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    <Calendar size={10} />
                    <span>{formatDate(sermon.date)}</span>
                    {sermon.audioDuration && (
                      <span className="bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono text-[9px]">
                        {sermon.audioDuration}
                      </span>
                    )}
                  </div>
                  
                  <h4 className={`text-xs font-bold truncate ${isActive ? "text-amber-900" : "text-slate-800"}`}>
                    {sermon.topic}
                  </h4>
                  
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <BookOpen size={10} className="text-amber-500" />
                    <span className="truncate">{sermon.keyScripture}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => onDeleteSermon(sermon.id, e)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                  title="Delete record"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
        <span className="text-[10px] text-slate-400 font-mono">
          {filteredSermons.length} sermons locked in history
        </span>
      </div>
    </div>
  );
}
