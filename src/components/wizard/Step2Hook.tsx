import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  ArrowRight,
  ArrowLeft,
  Flame,
  Clock,
  Eye,
  ArrowUp,
  ArrowDown,
  FileVideo,
} from 'lucide-react';
import { VideoClip, AppLanguage } from '../../types';
import { translations } from '../../locales/translations';
import { soundFx } from '../../utils/audioUtils';
import { resolvePlayableClipVideoSrc } from '../../utils/videoAssembler';

interface Step2HookProps {
  videos: VideoClip[];
  onUpdateVideos: (videos: VideoClip[]) => void;
  onNext: () => void;
  onPrev: () => void;
  language: AppLanguage;
}

export const Step2Hook: React.FC<Step2HookProps> = ({
  videos,
  onUpdateVideos,
  onNext,
  onPrev,
  language,
}) => {
  const t = translations[language] || translations.FR;
  const [unmutedVideoId, setUnmutedVideoId] = useState<string | null>(null);

  const selectHook = (id: string) => {
    soundFx.playSfx('ding');
    const updated = videos.map((v) => ({
      ...v,
      isHook: v.id === id,
    }));
    onUpdateVideos(updated);
  };

  const moveClip = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= videos.length) return;
    soundFx.playSfx('click');

    const updated = [...videos];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    onUpdateVideos(updated);
  };

  const currentHook = videos.find((v) => v.isHook) || videos[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111927] to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Étape 2 sur 5
            </span>
            <span className="text-xs text-slate-400 font-medium">Capture d’Attention & Rétention</span>
          </div>
          <h2 className="text-xl font-black text-white">
            {t.step2Title} - {t.step2Subtitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.hookChoiceDesc}</p>
        </div>

        {/* Selected Hook summary pill */}
        <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
          <Flame className="w-4 h-4 text-emerald-400 animate-pulse" />
          <div>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Hook sélectionné
            </p>
            <p className="text-xs font-extrabold text-white truncate max-w-[180px]">
              {currentHook?.title || 'Clip #1'}
            </p>
          </div>
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((vid, idx) => {
          const isSelected = vid.isHook;
          const isHighestViews = idx === 0 || vid.views.includes('720') || vid.views.includes('510');
          const isUnmuted = unmutedVideoId === vid.id;

          return (
            <div
              key={vid.id}
              onClick={() => selectHook(vid.id)}
              className={`group relative rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/10'
                  : 'bg-[#0f1522] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Top Media Area: Always real <video> stream (.mp4), never a static <img> */}
              <div className="relative aspect-[9/13] w-full overflow-hidden bg-slate-950">
                <video
                  src={resolvePlayableClipVideoSrc(vid)}
                  poster={vid.thumbnail || undefined}
                  playsInline
                  {...({ 'webkit-playsinline': 'true' } as any)}
                  controls
                  preload="auto"
                  muted={!isUnmuted}
                  loop
                  autoPlay
                  className="w-full h-full object-cover"
                />

                {/* Dark gradient shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md text-slate-200 border border-white/10 flex items-center gap-1">
                    {vid.isLocalFile && <FileVideo className="w-3 h-3 text-emerald-400" />}
                    Clip #{idx + 1}
                  </span>

                  {isHighestViews && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/90 text-slate-950 flex items-center gap-1 shadow-sm">
                      <Flame className="w-3 h-3 fill-slate-950" /> RECOMMANDÉ
                    </span>
                  )}
                </div>

                {/* Sound toggle / Play overlay */}
                {vid.fileBlobUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUnmutedVideoId(isUnmuted ? null : vid.id);
                    }}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"
                    title={isUnmuted ? 'Couper le son original' : 'Écouter le son original'}
                  >
                    <div className="w-11 h-11 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg">
                      {isUnmuted ? (
                        <Pause className="w-5 h-5 fill-slate-950" />
                      ) : (
                        <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                      )}
                    </div>
                  </button>
                )}

                {/* Metrics Pill on Video Bottom */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs pointer-events-none">
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-emerald-400 font-extrabold border border-emerald-500/20">
                    <Eye className="w-3 h-3" />
                    {vid.views} {t.viewsLabel}
                  </span>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-slate-300 font-medium">
                    <Clock className="w-3 h-3" />
                    {vid.duration}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                <div>
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                    {vid.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 truncate font-mono">
                    {vid.isLocalFile ? `Fichier MP4 : ${vid.fileName}` : vid.url}
                  </p>
                </div>

                {/* Hook Selector Button */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectHook(vid.id);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.hookSelected}</span>
                      </>
                    ) : (
                      <span>{t.selectHook}</span>
                    )}
                  </button>

                  {/* Ordering arrows */}
                  <div
                    className="flex items-center gap-0.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      disabled={idx === 0}
                      onClick={() => moveClip(idx, 'up')}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Monter le clip"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={idx === videos.length - 1}
                      onClick={() => moveClip(idx, 'down')}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Descendre le clip"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Montage Timeline Preview Box */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Ordre d'assemblage du remix
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {videos.length} clip(s) prêt(s) pour l'assemblage Canvas 9:16
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
            <span className="w-6 h-6 rounded-md bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">
                Hook d'ouverture
              </span>
              <p className="text-xs font-bold text-white truncate">{currentHook.title}</p>
            </div>
          </div>

          {videos
            .filter((v) => v.id !== currentHook.id)
            .map((other, idx) => (
              <div
                key={other.id}
                className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3"
              >
                <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 2}
                </span>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Clip suivant #{idx + 2}
                  </span>
                  <p className="text-xs font-semibold text-slate-200 truncate">{other.title}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => {
            soundFx.playSfx('click');
            onPrev();
          }}
          className="py-3 px-5 rounded-xl font-bold text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.prevStep}</span>
        </button>

        <button
          onClick={() => {
            soundFx.playSfx('whoosh');
            onNext();
          }}
          className="py-3.5 px-8 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Étape 3 : Voix & Sous-titres</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
