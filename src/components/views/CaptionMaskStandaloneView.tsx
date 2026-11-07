import React, { useState, useRef } from 'react';
import { EyeOff, Upload, Sliders, FileVideo } from 'lucide-react';
import { AppLanguage, BlurZone } from '../../types';
import { soundFx } from '../../utils/audioUtils';

export const CaptionMaskStandaloneView: React.FC<{ language: AppLanguage }> = () => {
  const [blurZone, setBlurZone] = useState<BlurZone>({
    x: 8,
    y: 68,
    width: 84,
    height: 18,
    blurAmount: 16,
    opacity: 0.95,
    enabled: true,
    style: 'frosted',
  });

  const [localVideoBlobUrl, setLocalVideoBlobUrl] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const thumbnail =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';

  const handleApplyPreset = (y: number, h: number) => {
    soundFx.playSfx('click');
    setBlurZone({ ...blurZone, y, height: h });
  };

  const handleUploadVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundFx.playSfx('pop');
    const url = URL.createObjectURL(file);
    setLocalVideoBlobUrl(url);
    setLocalFileName(file.name);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-black text-sky-400 uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 border border-sky-500/30">
              Caption Mask (TIK)
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">Floutage des Sous-Titres Concurrents</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Importe une vidéo .MP4 et ajuste la zone de floutage pour masquer les anciens écrits.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUploadVideo}
          accept="video/mp4,video/quicktime,video/webm,video/*"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-sky-500/20"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>Importer une vidéo (.MP4)</span>
        </button>
      </div>

      {/* Editor Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: 9:16 Video preview */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[280px] aspect-[9/16] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black">
            {localVideoBlobUrl ? (
              <video
                src={localVideoBlobUrl}
                muted
                loop
                playsInline
                autoPlay
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <img src={thumbnail} alt="Video" className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-24 flex justify-center px-4">
                  <span className="bg-black/80 text-white/70 px-2 py-1 rounded text-xs uppercase font-black">
                    ANCIENS ÉCRITS À MASQUER
                  </span>
                </div>
              </>
            )}

            {/* Mask overlay */}
            <div
              style={{
                left: `${blurZone.x}%`,
                top: `${blurZone.y}%`,
                width: `${blurZone.width}%`,
                height: `${blurZone.height}%`,
                backdropFilter: `blur(${blurZone.blurAmount}px)`,
                backgroundColor:
                  blurZone.style === 'black-gradient'
                    ? 'rgba(0,0,0,0.92)'
                    : 'rgba(15, 23, 42, 0.72)',
              }}
              className="absolute rounded-xl border-2 border-sky-400/80 shadow-2xl flex items-center justify-center p-2 text-center"
            >
              <span className="text-[10px] font-bold text-sky-300">Zone Floutée Proprement</span>
            </div>
          </div>
          {localFileName && (
            <p className="text-xs text-sky-400 font-mono mt-2 flex items-center gap-1">
              <FileVideo className="w-3.5 h-3.5" /> {localFileName}
            </p>
          )}
        </div>

        {/* Right: Controls */}
        <div className="md:col-span-7 space-y-4">
          <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              Réglages de la zone
            </h3>

            {/* Presets */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleApplyPreset(68, 18)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Bas (Sous-titres)
              </button>
              <button
                onClick={() => handleApplyPreset(44, 20)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Milieu (Textes)
              </button>
              <button
                onClick={() => handleApplyPreset(12, 16)}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Haut (Titres)
              </button>
            </div>

            {/* Position Y Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Position Y</span>
                <span className="font-mono text-sky-400 font-bold">{blurZone.y}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="85"
                value={blurZone.y}
                onChange={(e) => setBlurZone({ ...blurZone, y: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Height Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Hauteur</span>
                <span className="font-mono text-sky-400 font-bold">{blurZone.height}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                value={blurZone.height}
                onChange={(e) => setBlurZone({ ...blurZone, height: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Blur Intensity */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Intensité du Flou</span>
                <span className="font-mono text-sky-400 font-bold">{blurZone.blurAmount} px</span>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                value={blurZone.blurAmount}
                onChange={(e) =>
                  setBlurZone({ ...blurZone, blurAmount: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
