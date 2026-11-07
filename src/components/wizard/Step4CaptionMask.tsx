import React, { useState, useRef, useEffect } from 'react';
import {
  EyeOff,
  Eye,
  Sliders,
  Move,
  Copy,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  ShieldCheck,
  FileVideo,
  FlipHorizontal,
  Check,
  Type,
  ZoomIn,
  Plus,
  Minus,
} from 'lucide-react';
import { VideoClip, BlurZone, SubtitleStyle, AppLanguage } from '../../types';
import { translations } from '../../locales/translations';
import { soundFx } from '../../utils/audioUtils';
import {
  computeSmartSubtitleAvoidance,
  resolvePlayableClipVideoSrc,
} from '../../utils/videoAssembler';

interface Step4CaptionMaskProps {
  videos: VideoClip[];
  onUpdateVideos: (videos: VideoClip[]) => void;
  selectedSubtitle?: SubtitleStyle;
  onSubtitleChange?: (sub: SubtitleStyle) => void;
  onNext: () => void;
  onPrev: () => void;
  language: AppLanguage;
}

const DEMO_FLASH_WORDS = ['SANS', 'DIPLÔME', 'JE', 'GAGNE', '350€', 'PAR', 'JOUR'];

export const Step4CaptionMask: React.FC<Step4CaptionMaskProps> = ({
  videos,
  onUpdateVideos,
  selectedSubtitle,
  onSubtitleChange,
  onNext,
  onPrev,
  language,
}) => {
  const t = translations[language] || translations.FR;
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isMaskPreviewVisible, setIsMaskPreviewVisible] = useState(true);
  const [dragMode, setDragMode] = useState<'none' | 'move' | 'resize' | 'subtitle'>('none');
  const [flashWordIdx, setFlashWordIdx] = useState(0);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const fgVideoRef = useRef<HTMLVideoElement>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(100);

  // Cycle demo 1-word-by-1-word viral flash preview (SANS -> DIPLÔME -> JE -> GAGNE)
  useEffect(() => {
    const timer = setInterval(() => {
      setFlashWordIdx((prev) => (prev + 1) % DEMO_FLASH_WORDS.length);
    }, 520);
    return () => clearInterval(timer);
  }, []);

  const activeClip = videos[activeClipIndex] || videos[0];
  const rawZone = activeClip?.blurZone;
  const blurZone: BlurZone = {
    x: rawZone?.x ?? 8,
    y: rawZone?.y ?? 72,
    width: rawZone?.width ?? 84,
    height: rawZone?.height ?? 16,
    blurAmount: rawZone?.blurAmount ?? 20,
    opacity: rawZone?.opacity ?? 0,
    enabled: rawZone?.enabled ?? false,
    style: rawZone?.style || 'pure-blur',
    topBottomBlurEnabled: rawZone?.topBottomBlurEnabled !== false,
    topBottomBlurPct: rawZone?.topBottomBlurPct ?? 16,
    mirrorHorizontal: Boolean(rawZone?.mirrorHorizontal || activeClip?.mirrorHorizontal),
  };

  const topBottomBlurEnabled = blurZone.topBottomBlurEnabled !== false;
  const topBottomBlurPct = Math.max(8, Math.min(28, Number(blurZone.topBottomBlurPct) || 16));
  const isMirrored = Boolean(blurZone.mirrorHorizontal || activeClip?.mirrorHorizontal);
  const allClipsMirrored =
    videos.length > 0 &&
    videos.every((v) => Boolean(v.blurZone?.mirrorHorizontal || v.mirrorHorizontal));

  const activeSubTplId = selectedSubtitle?.subtitleTemplateId || selectedSubtitle?.id || 'brown-fox-box';
  const isWordByWordActive = Boolean(
    selectedSubtitle?.wordByWord ||
      activeSubTplId === 'word-by-word' ||
      activeSubTplId === 'viral_1word_flash'
  );
  const subX = Math.max(10, Math.min(90, Number(selectedSubtitle?.subtitleX) || 50));
  const subY = Math.max(
    10,
    Math.min(
      90,
      Number(selectedSubtitle?.subtitleY) ||
        (selectedSubtitle?.position === 'top'
          ? 22
          : selectedSubtitle?.position === 'center'
          ? 50
          : 78)
    )
  );
  const subScale = Math.max(50, Math.min(200, Number(selectedSubtitle?.subtitleScale) || 100));
  const subCoverCompetitor = Boolean(selectedSubtitle?.coverCompetitorText);
  const hookBannerEnabled = selectedSubtitle?.hookBannerEnabled !== false;
  const hookBannerText =
    selectedSubtitle?.hookBannerText !== undefined
      ? selectedSubtitle.hookBannerText
      : 'TRANSFORMATION TOTALE ! ⚡';
  const hookBannerBgColor: 'yellow' | 'red' =
    selectedSubtitle?.hookBannerBgColor === 'red' ? 'red' : 'yellow';

  const smartAvoidance = computeSmartSubtitleAvoidance(
    selectedSubtitle?.subtitleY,
    selectedSubtitle?.position || 'bottom',
    blurZone,
    subCoverCompetitor
  );
  const effectiveSubY = smartAvoidance.effectiveY;
  const effectiveCoverBox = Boolean(subCoverCompetitor || smartAvoidance.autoContrastBox);

  const updateStep4Subtitle = (patch: Partial<SubtitleStyle>) => {
    if (!onSubtitleChange || !selectedSubtitle) return;
    const nextY = patch.subtitleY ?? effectiveSubY;
    const derivedPos: 'top' | 'center' | 'bottom' =
      nextY <= 35 ? 'top' : nextY <= 62 ? 'center' : 'bottom';
    onSubtitleChange({
      ...selectedSubtitle,
      subtitleX: subX,
      subtitleY: effectiveSubY,
      subtitleScale: subScale,
      coverCompetitorText: subCoverCompetitor,
      hookBannerEnabled,
      hookBannerText,
      hookBannerBgColor,
      position: derivedPos,
      ...patch,
    });
  };

  const updateBlurZone = (patch: Partial<BlurZone>) => {
    const updated = [...videos];
    const nextZone: BlurZone = {
      ...blurZone,
      ...patch,
    };
    updated[activeClipIndex] = {
      ...updated[activeClipIndex],
      mirrorHorizontal: Boolean(nextZone.mirrorHorizontal),
      blurZone: nextZone,
    };
    onUpdateVideos(updated);

    // Smart Avoidance: if the user enables or moves the manual Caption Mask in the center or bottom,
    // automatically position the default subtitle slightly above or below the mask for optimal readability!
    if (nextZone.enabled && onSubtitleChange && selectedSubtitle) {
      const nextSmart = computeSmartSubtitleAvoidance(
        selectedSubtitle.subtitleY,
        selectedSubtitle.position || 'bottom',
        nextZone,
        selectedSubtitle.coverCompetitorText
      );
      if (nextSmart.avoidedAutomatically && nextSmart.effectiveY !== subY) {
        updateStep4Subtitle({ subtitleY: nextSmart.effectiveY });
      }
    }
  };

  const handleToggleTopBottomBlurAll = (enabled: boolean, pct: number = topBottomBlurPct) => {
    soundFx.playSfx('click');
    const updated = videos.map((v) => ({
      ...v,
      blurZone: {
        ...(v.blurZone || blurZone),
        topBottomBlurEnabled: enabled,
        topBottomBlurPct: pct,
      },
    }));
    onUpdateVideos(updated);
  };

  const handleChangeTopBottomPctAll = (pct: number) => {
    const clamped = Math.max(8, Math.min(28, pct));
    const updated = videos.map((v) => ({
      ...v,
      blurZone: {
        ...(v.blurZone || blurZone),
        topBottomBlurEnabled: true,
        topBottomBlurPct: clamped,
      },
    }));
    onUpdateVideos(updated);
  };

  const handleToggleMirrorCurrentClip = (checked: boolean) => {
    soundFx.playSfx('click');
    updateBlurZone({ mirrorHorizontal: checked });
  };

  const handleToggleMirrorAllClips = (checked: boolean) => {
    soundFx.playSfx('pop');
    const updated = videos.map((v) => ({
      ...v,
      mirrorHorizontal: checked,
      blurZone: {
        ...(v.blurZone || blurZone),
        mirrorHorizontal: checked,
      },
    }));
    onUpdateVideos(updated);
  };

  const applyToAllVideos = () => {
    soundFx.playSfx('ding');
    const currentZone = { ...blurZone };
    const updated = videos.map((v) => ({
      ...v,
      mirrorHorizontal: Boolean(currentZone.mirrorHorizontal),
      blurZone: { ...currentZone },
    }));
    onUpdateVideos(updated);
  };

  // Drag / Resize handlers directly on the 9:16 video preview for optional custom zone & Draggable Subtitles
  const handlePointerDownMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragMode('move');
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragMode('resize');
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerDownSubtitle = (e: React.PointerEvent) => {
    e.stopPropagation();
    setDragMode('subtitle');
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === 'none' || !previewBoxRef.current) return;

    const rect = previewBoxRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;

    if (dragMode === 'subtitle') {
      const boundedSubX = Math.max(10, Math.min(90, Math.round(relX)));
      const boundedSubY = Math.max(10, Math.min(90, Math.round(relY)));
      updateStep4Subtitle({ subtitleX: boundedSubX, subtitleY: boundedSubY });
    } else if (dragMode === 'move') {
      const boundedX = Math.max(
        0,
        Math.min(100 - blurZone.width, Math.round(relX - blurZone.width / 2))
      );
      const boundedY = Math.max(
        2,
        Math.min(98 - blurZone.height, Math.round(relY - blurZone.height / 2))
      );
      updateBlurZone({ x: boundedX, y: boundedY });
    } else if (dragMode === 'resize') {
      const newWidth = Math.max(25, Math.min(100 - blurZone.x, Math.round(relX - blurZone.x)));
      const newHeight = Math.max(8, Math.min(98 - blurZone.y, Math.round(relY - blurZone.y)));
      updateBlurZone({ width: newWidth, height: newHeight });
    }
  };

  const handlePointerUp = () => {
    if (dragMode !== 'none') {
      setDragMode('none');
      soundFx.playSfx('pop');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" onPointerUp={handlePointerUp}>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111927] to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
              Étape 4 sur 5
            </span>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              Calque Flouté Haut & Bas + Effet Miroir Anti-Copyright
            </span>
          </div>
          <h2 className="text-xl font-black text-white">
            Superposition Floutage Haut & Bas, Effet Miroir & Sous-titres 1 Mot
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Duplication de calque 1080×1920 avec fond flouté en haut et en bas (sans rectangle gris au milieu), inversion miroir horizontale et sous-titres 1 mot par 1 mot.
          </p>
        </div>

        <button
          onClick={applyToAllVideos}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-sky-400 hover:text-sky-300 transition-all flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Appliquer ces réglages à tous les clips ({videos.length})</span>
        </button>
      </div>

      {/* Main editor area: 2 columns (Video preview on left, controls on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 9:16 Video Canvas with Duplicated Layer Top/Bottom Blur + Mirror + 1-Word Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* Clip Selector Tabs */}
          <div className="w-full flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {videos.map((vid, idx) => {
              const clipMirrored = Boolean(
                vid.blurZone?.mirrorHorizontal || vid.mirrorHorizontal
              );
              return (
                <button
                  key={vid.id}
                  onClick={() => {
                    soundFx.playSfx('click');
                    setActiveClipIndex(idx);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeClipIndex === idx
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {vid.isLocalFile && <FileVideo className="w-3.5 h-3.5" />}
                  <span>Clip #{idx + 1}</span>
                  {vid.isHook && <span className="text-[10px] uppercase font-black">(Hook)</span>}
                  {clipMirrored && (
                    <span className="text-[10px] px-1 rounded bg-purple-500/30 text-purple-200">
                      ⇄
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Vertical 9:16 Phone Mockup with 2-Layer Duplicated Video (Layer 1: Fullscreen Blurred, Layer 2: Center Sharp Overlay) */}
          <div className="relative w-full max-w-[295px] sm:max-w-[320px] aspect-[9/16] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-black select-none">
            <div
              ref={previewBoxRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  pinchStartDistRef.current = Math.hypot(dx, dy);
                  pinchStartScaleRef.current = subScale;
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 2 && pinchStartDistRef.current) {
                  const dx = e.touches[0].clientX - e.touches[1].clientX;
                  const dy = e.touches[0].clientY - e.touches[1].clientY;
                  const dist = Math.hypot(dx, dy);
                  const ratio = dist / Math.max(10, pinchStartDistRef.current);
                  const nextScale = Math.round(
                    Math.max(50, Math.min(200, pinchStartScaleRef.current * ratio))
                  );
                  updateStep4Subtitle({ subtitleScale: nextScale });
                }
              }}
              onTouchEnd={() => {
                pinchStartDistRef.current = null;
              }}
              className="relative w-full h-full overflow-hidden touch-none"
            >
              {/* CALQUE 1 (Fond 1080x1920 plein écran avec flou gaussien esthétique boxblur=25:5) */}
              <video
                ref={bgVideoRef}
                key={`bg_${resolvePlayableClipVideoSrc(activeClip) || activeClip.id}`}
                src={resolvePlayableClipVideoSrc(activeClip)}
                poster={activeClip.thumbnail || undefined}
                playsInline
                {...({ 'webkit-playsinline': 'true' } as any)}
                preload="auto"
                muted
                loop
                autoPlay
                style={{
                  transform: `${isMirrored ? 'scaleX(-1) ' : ''}scale(1.08)`,
                  filter:
                    topBottomBlurEnabled && isMaskPreviewVisible
                      ? 'blur(22px) brightness(0.92) saturate(125%)'
                      : 'none',
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* CALQUE 2 (Vidéo nette superposée au centre, découpée en haut et en bas selon topBottomBlurPct) */}
              <video
                ref={fgVideoRef}
                key={`fg_${resolvePlayableClipVideoSrc(activeClip) || activeClip.id}`}
                src={resolvePlayableClipVideoSrc(activeClip)}
                poster={activeClip.thumbnail || undefined}
                playsInline
                {...({ 'webkit-playsinline': 'true' } as any)}
                controls
                preload="auto"
                muted
                loop
                autoPlay
                onTimeUpdate={() => {
                  if (
                    bgVideoRef.current &&
                    fgVideoRef.current &&
                    Math.abs(bgVideoRef.current.currentTime - fgVideoRef.current.currentTime) > 0.25
                  ) {
                    bgVideoRef.current.currentTime = fgVideoRef.current.currentTime;
                  }
                }}
                style={{
                  transform: isMirrored ? 'scaleX(-1)' : 'none',
                  clipPath:
                    topBottomBlurEnabled && isMaskPreviewVisible
                      ? `inset(${topBottomBlurPct}% 0% ${topBottomBlurPct}% 0%)`
                      : 'none',
                }}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />

              {/* Subtle Top & Bottom Blurred Band Guides (Pure Gaussian Blur without any grey opaque box) */}
              {topBottomBlurEnabled && isMaskPreviewVisible && (
                <>
                  <div
                    style={{
                      height: `${topBottomBlurPct}%`,
                      backdropFilter: 'blur(22px) saturate(125%)',
                      WebkitBackdropFilter: 'blur(22px) saturate(125%)',
                    }}
                    className="absolute top-0 inset-x-0 border-b border-dashed border-sky-400/50 pointer-events-none flex items-end justify-center pb-1"
                  >
                    <span className="text-[9px] font-mono font-bold text-sky-300/90 bg-black/45 px-2 py-0.5 rounded-full">
                      Calque Haut Flouté ({topBottomBlurPct}%)
                    </span>
                  </div>

                  <div
                    style={{
                      height: `${topBottomBlurPct}%`,
                      backdropFilter: 'blur(22px) saturate(125%)',
                      WebkitBackdropFilter: 'blur(22px) saturate(125%)',
                    }}
                    className="absolute bottom-0 inset-x-0 border-t border-dashed border-sky-400/50 pointer-events-none flex items-start justify-center pt-1"
                  >
                    <span className="text-[9px] font-mono font-bold text-sky-300/90 bg-black/45 px-2 py-0.5 rounded-full">
                      Calque Bas Flouté ({topBottomBlurPct}%)
                    </span>
                  </div>
                </>
              )}

              {/* Optional Targeted Pure Transparent Blur Box (ONLY if user explicitly enables blurZone.enabled) */}
              {blurZone.enabled && isMaskPreviewVisible && (
                <div
                  onPointerDown={handlePointerDownMove}
                  style={{
                    left: `${blurZone.x}%`,
                    top: `${blurZone.y}%`,
                    width: `${blurZone.width}%`,
                    height: `${blurZone.height}%`,
                    backdropFilter: `blur(${blurZone.blurAmount}px) saturate(125%)`,
                    WebkitBackdropFilter: `blur(${blurZone.blurAmount}px) saturate(125%)`,
                    backgroundColor:
                      blurZone.style === 'black-gradient'
                        ? 'rgba(0, 0, 0, 0.82)'
                        : blurZone.style === 'solid-dark'
                        ? 'rgba(11, 15, 23, 0.90)'
                        : 'transparent',
                  }}
                  className="absolute rounded-xl border border-dashed border-cyan-400/80 flex flex-col items-center justify-center p-1 cursor-grab active:cursor-grabbing z-20"
                >
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/60 text-[9px] font-bold text-cyan-300 pointer-events-none">
                    <Move className="w-2.5 h-2.5" />
                    <span>Flou Pur Ciblé ({blurZone.width}% × {blurZone.height}%)</span>
                  </div>

                  {/* Bottom-Right Resize Handle */}
                  <div
                    onPointerDown={handlePointerDownResize}
                    title="Redimensionner la zone de flou pur"
                    className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 border border-slate-950 flex items-center justify-center cursor-nwse-resize shadow-lg"
                  >
                    <span className="text-[9px] font-black leading-none">↘</span>
                  </div>
                </div>
              )}

              {/* Smart Avoidance Visual Guides (Repères d'évitement intelligents) when manual Caption Mask is active */}
              {blurZone.enabled && isMaskPreviewVisible && (
                <>
                  {smartAvoidance.aboveMaskY >= 14 && (
                    <div
                      style={{ top: `${smartAvoidance.aboveMaskY}%` }}
                      className="absolute inset-x-3 border-t border-dashed border-emerald-400/60 z-20 pointer-events-none flex justify-end"
                    >
                      <span className="text-[8px] font-mono font-bold text-emerald-300 bg-slate-950/80 px-1.5 py-0.2 rounded -mt-2.5 border border-emerald-500/30">
                        ⚡ Repère Évitement Haut ({smartAvoidance.aboveMaskY}%)
                      </span>
                    </div>
                  )}
                  {smartAvoidance.belowMaskY <= 86 && (
                    <div
                      style={{ top: `${smartAvoidance.belowMaskY}%` }}
                      className="absolute inset-x-3 border-t border-dashed border-emerald-400/60 z-20 pointer-events-none flex justify-end"
                    >
                      <span className="text-[8px] font-mono font-bold text-emerald-300 bg-slate-950/80 px-1.5 py-0.2 rounded -mt-2.5 border border-emerald-500/30">
                        ⚡ Repère Évitement Bas ({smartAvoidance.belowMaskY}%)
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* BANNIÈRE D'ACCROCHE CHOC (HOOK BANNER 0-3.5s) EN HAUT DE L'ÉCRAN */}
              {hookBannerEnabled && hookBannerText.trim() && (
                <div
                  style={{
                    top: '7%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 36,
                    filter: 'none',
                    WebkitFilter: 'none',
                  }}
                  className="absolute w-[90%] flex flex-col items-center pointer-events-none select-none"
                >
                  <div
                    className={`px-3 py-1.5 rounded-xl border-[2.5px] border-black shadow-[0_4px_0_#000,0_8px_16px_rgba(0,0,0,0.85)] text-center ${
                      hookBannerBgColor === 'red' ? 'bg-red-600' : 'bg-yellow-400'
                    }`}
                  >
                    <span
                      className="block font-black text-xs sm:text-sm uppercase tracking-wide text-white leading-tight"
                      style={{
                        WebkitTextStroke: '1.3px #000000',
                        textShadow:
                          '0 2px 0 #000000, -1px -1px 0 #000000, 1px -1px 0 #000000, -1px 1px 0 #000000, 1px 1px 0 #000000',
                      }}
                    >
                      {hookBannerText}
                    </span>
                  </div>
                  <span className="mt-1 text-[8px] font-mono font-bold text-yellow-300 bg-black/85 px-2 py-0.5 rounded-full border border-yellow-400/40">
                    ⚡ Hook Banner Choc (00:00 → 00:03.5)
                  </span>
                </div>
              )}

              {/* ÉTAPE 2 : Calque des Nouveaux Sous-titres gravé APRÈS le flou (zIndex: 35, 100% net sans aucun flou par-dessus) */}
              <div
                onPointerDown={handlePointerDownSubtitle}
                style={{
                  left: `${subX}%`,
                  top: `${effectiveSubY}%`,
                  transform: `translate(-50%, -50%) scale(${subScale / 100})`,
                  zIndex: 35,
                  filter: 'none',
                  WebkitFilter: 'none',
                }}
                title="Glisse avec le doigt pour déplacer les sous-titres (ou pince à 2 doigts pour zoomer)"
                className={`absolute z-30 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing px-3 py-1.5 rounded-2xl transition-shadow ${
                  effectiveCoverBox
                    ? 'bg-[#05080f]/95 border border-amber-400/80 shadow-2xl'
                    : 'border border-dashed border-amber-400/75 bg-black/25 hover:bg-black/40'
                }`}
              >
                <span className="text-[8px] font-mono font-bold text-amber-300 bg-black/80 px-1.5 py-0.5 rounded-full mb-0.5 pointer-events-none">
                  ✥ Net après flou ({subX}%, {effectiveSubY}%) • {subScale}%
                </span>
                {isWordByWordActive ? (
                  <span
                    key={flashWordIdx}
                    className="font-black text-2xl sm:text-3xl tracking-wider text-white uppercase select-none transition-transform duration-100 scale-105 whitespace-nowrap"
                    style={{
                      WebkitTextStroke: '2.4px #000000',
                      textShadow:
                        '0 3px 0 #000000, -2px -2px 0 #000000, 2px -2px 0 #000000, -2px 2px 0 #000000, 2px 2px 0 #000000, 0 5px 14px rgba(0,0,0,0.95)',
                    }}
                  >
                    {DEMO_FLASH_WORDS[flashWordIdx]}
                  </span>
                ) : activeSubTplId === 'brown-fox-box' || activeSubTplId === 'capcut_box_cyan' ? (
                  <div className="px-3.5 py-1.5 rounded-xl bg-black/95 border border-slate-800 shadow-2xl flex items-center gap-1.5 whitespace-nowrap">
                    <span className="font-black text-base sm:text-lg text-white uppercase">
                      SANS DIPLÔME
                    </span>
                    <span className="font-black text-base sm:text-lg text-cyan-400 uppercase">
                      JE GAGNE
                    </span>
                  </div>
                ) : activeSubTplId === 'brown-fox-glow' || activeSubTplId === 'capcut_glow_cyan' ? (
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span
                      className="font-black text-base sm:text-lg text-white uppercase"
                      style={{ textShadow: '0 0 10px rgba(255,255,255,0.85)' }}
                    >
                      SANS DIPLÔME
                    </span>
                    <span
                      className="font-black text-base sm:text-lg text-cyan-300 uppercase"
                      style={{
                        textShadow:
                          '0 0 14px rgba(34,211,238,1), 0 0 26px rgba(6,182,212,0.95)',
                      }}
                    >
                      JE GAGNE
                    </span>
                  </div>
                ) : activeSubTplId === 'yellow-glow' || activeSubTplId === 'capcut_yellow_glow' ? (
                  <span
                    className="font-black text-lg sm:text-xl text-yellow-300 uppercase whitespace-nowrap"
                    style={{
                      textShadow:
                        '0 0 14px rgba(250,204,21,0.95), 0 0 26px rgba(234,179,8,0.85), 0 2px 4px rgba(0,0,0,0.9)',
                    }}
                  >
                    SANS DIPLÔME JE GAGNE
                  </span>
                ) : activeSubTplId === 'minimal-clean' || activeSubTplId === 'minimal' ? (
                  <div className="flex flex-col items-center leading-snug whitespace-nowrap">
                    <span className="font-bold text-xs sm:text-sm text-white uppercase drop-shadow-md">
                      SANS DIPLÔME
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-sky-400 uppercase drop-shadow-md">
                      JE GAGNE
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center leading-tight whitespace-nowrap">
                    <span
                      className="font-black text-base sm:text-lg text-white uppercase"
                      style={{
                        WebkitTextStroke: '1.5px #000000',
                        textShadow: '0 2px 6px rgba(0,0,0,0.95)',
                      }}
                    >
                      SANS DIPLÔME
                    </span>
                    <span
                      className={`font-black text-base sm:text-lg uppercase ${
                        activeSubTplId === 'pink-magenta' || activeSubTplId === 'capcut_pink_pro'
                          ? 'text-pink-500'
                          : activeSubTplId === 'quick-cyan' || activeSubTplId === 'capcut_2line_cyan'
                          ? 'text-cyan-400'
                          : 'text-yellow-400'
                      }`}
                      style={{
                        WebkitTextStroke: '1.5px #000000',
                        textShadow: '0 2px 6px rgba(0,0,0,0.95)',
                      }}
                    >
                      JE GAGNE
                    </span>
                  </div>
                )}
              </div>

              {/* Top status badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-30 pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black px-2 py-1 rounded bg-slate-950/85 text-sky-400 border border-sky-500/30 truncate max-w-[140px]">
                    {activeClip.title}
                  </span>
                  {isMirrored && (
                    <span className="text-[10px] font-black px-2 py-1 rounded bg-purple-950/90 text-purple-300 border border-purple-500/40">
                      ⇄ Miroir Actif
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsMaskPreviewVisible(!isMaskPreviewVisible)}
                  className="p-1.5 rounded-lg bg-slate-950/85 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
                  title="Afficher/Masquer l'aperçu du floutage"
                >
                  {isMaskPreviewVisible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Calque 1 plein écran flouté (`boxblur=25:5`) + Calque 2 net superposé au centre (`overlay`).
          </p>
        </div>

        {/* Right Column: Controls for Top/Bottom Layer Blur, Horizontal Mirror, 1-Word Subtitles & Optional Pure Blur */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. SUPERPOSITION & FLOUTAGE HAUT ET BAS (DUPLICATION DE CALQUE STYLE TIKTOK PRO) */}
          <div className="bg-[#0f1522] border-2 border-sky-500/40 rounded-2xl p-5 shadow-lg space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  1. Superposition Floutage Haut & Bas (Style TikTok Pro)
                </h3>
              </div>

              {/* Checkbox Checked by Default: [✓] Superposition Floutage Haut & Bas */}
              <button
                type="button"
                onClick={() => handleToggleTopBottomBlurAll(!topBottomBlurEnabled, topBottomBlurPct)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                  topBottomBlurEnabled
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-xs'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    topBottomBlurEnabled
                      ? 'bg-sky-400 border-sky-400 text-slate-950'
                      : 'bg-slate-950 border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Superposition Floutage Haut & Bas (Style TikTok Pro)</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Duplique automatiquement la vidéo dans FFmpeg : <strong>Calque 1</strong> en plein écran 1080×1920 avec flou gaussien esthétique (<code className="text-sky-300">boxblur=25:5</code>) et <strong>Calque 2</strong> net superposé au centre (<code className="text-sky-300">overlay</code>), sans jamais ajouter de rectangle gris au milieu de l'image.
            </p>

            {topBottomBlurEnabled && (
              <div className="p-3.5 rounded-xl bg-[#0b101b] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-bold">
                    Hauteur des bandes floutées en Haut et en Bas :
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/40 font-mono text-xs font-black text-sky-300">
                    {topBottomBlurPct}% en Haut & {topBottomBlurPct}% en Bas
                  </span>
                </div>

                <input
                  type="range"
                  min={10}
                  max={25}
                  step={1}
                  value={topBottomBlurPct}
                  onChange={(e) => handleChangeTopBottomPctAll(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-sky-400"
                />

                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { pct: 12, label: '12% (Léger)' },
                      { pct: 16, label: '16% (TikTok Pro Recommandé)' },
                      { pct: 20, label: '20% (Cinéma Large)' },
                      { pct: 24, label: '24% (Max)' },
                    ].map((preset) => (
                      <button
                        key={preset.pct}
                        type="button"
                        onClick={() => {
                          soundFx.playSfx('click');
                          handleChangeTopBottomPctAll(preset.pct);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-all ${
                          topBottomBlurPct === preset.pct
                            ? 'bg-sky-400 text-slate-950 border-sky-300'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. EFFET MIROIR HORIZONTAL ([✓] Effet Miroir - Inverser les clips gauche/droite - Anti-Copyright) */}
          <div className="bg-[#0f1522] border border-purple-500/35 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <FlipHorizontal className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  2. Effet Miroir Horizontal (Anti-Copyright)
                </h3>
              </div>

              {/* Master Checkbox: Apply Mirror to ALL clips */}
              <button
                type="button"
                onClick={() => handleToggleMirrorAllClips(!allClipsMirrored)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                  allClipsMirrored
                    ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-xs'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border ${
                    allClipsMirrored
                      ? 'bg-purple-400 border-purple-400 text-slate-950'
                      : 'bg-slate-950 border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Effet Miroir (Inverser horizontalement tous les clips)</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Inverse gauche/droite (<code className="text-purple-300">scaleX(-1)</code> dans l'aperçu et filtre <code className="text-purple-300">hflip</code> dans FFmpeg) pour rendre chaque clip 100 % unique face à l'algorithme TikTok.
            </p>

            {/* Individual Clip Mirror Checkboxes */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {videos.map((vid, idx) => {
                const clipMirror = Boolean(
                  vid.blurZone?.mirrorHorizontal || vid.mirrorHorizontal
                );
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      const updated = [...videos];
                      updated[idx] = {
                        ...updated[idx],
                        mirrorHorizontal: !clipMirror,
                        blurZone: {
                          ...(updated[idx].blurZone || blurZone),
                          mirrorHorizontal: !clipMirror,
                        },
                      };
                      onUpdateVideos(updated);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                      clipMirror
                        ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                        : 'bg-[#0b101b] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        clipMirror
                          ? 'bg-purple-400 border-purple-400 text-slate-950'
                          : 'bg-slate-950 border-slate-700 text-transparent'
                      }`}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                    <span>Clip #{idx + 1} Miroir ⇄</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. DÉPLACER & ZOOMER LES SOUS-TITRES SUR L'ÉCRAN (50% À 200%) + MODE 1 MOT PAR 1 MOT */}
          {onSubtitleChange && selectedSubtitle && (
            <div className="bg-[#0f1522] border border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    3. Déplacer & Zoomer les Sous-titres (50% à 200%) + Mode 1 Mot
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playSfx('pop');
                    const nextWordByWord = !isWordByWordActive;
                    updateStep4Subtitle({
                      id: nextWordByWord
                        ? 'word-by-word'
                        : selectedSubtitle.id === 'word-by-word' ||
                          selectedSubtitle.id === 'viral_1word_flash'
                        ? 'brown-fox-box'
                        : selectedSubtitle.id,
                      subtitleTemplateId: nextWordByWord
                        ? 'word-by-word'
                        : selectedSubtitle.id === 'word-by-word' ||
                          selectedSubtitle.id === 'viral_1word_flash'
                        ? 'brown-fox-box'
                        : selectedSubtitle.subtitleTemplateId || selectedSubtitle.id,
                      name: nextWordByWord
                        ? 'Affichage 1 Mot par 1 Mot (Style Viral Flash)'
                        : selectedSubtitle.name,
                      wordByWord: nextWordByWord,
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                    isWordByWordActive
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isWordByWordActive
                        ? 'bg-amber-400 border-amber-400 text-slate-950'
                        : 'bg-slate-950 border-slate-600 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span>Affichage 1 Mot par 1 Mot (Style Viral Flash)</span>
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Déplace directement les sous-titres avec le doigt sur l'aperçu vidéo à gauche ou ajuste leur taille ci-dessous (tu peux aussi les placer au milieu pour cacher l'ancien texte concurrent).
              </p>

              {/* Zoom / Taille des sous-titres (50% à 200%) + Boutons - / + */}
              <div className="p-3.5 rounded-xl bg-[#0b101b] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                    Zoom / Taille des sous-titres (50% à 200%) :
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playSfx('click');
                        updateStep4Subtitle({ subtitleScale: Math.max(50, subScale - 10) });
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black cursor-pointer border border-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-mono text-xs font-black text-amber-300 min-w-[54px] text-center">
                      {subScale}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playSfx('click');
                        updateStep4Subtitle({ subtitleScale: Math.min(200, subScale + 10) });
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black cursor-pointer border border-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={50}
                  max={200}
                  step={5}
                  value={subScale}
                  onChange={(e) =>
                    updateStep4Subtitle({ subtitleScale: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-amber-400"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 font-bold">Position Verticale (Y)</span>
                      <span className="font-mono text-amber-400 font-bold">{subY}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={subY}
                      onChange={(e) =>
                        updateStep4Subtitle({ subtitleY: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-amber-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 font-bold">Position Horizontale (X)</span>
                      <span className="font-mono text-amber-400 font-bold">{subX}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={subX}
                      onChange={(e) =>
                        updateStep4Subtitle({ subtitleX: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-amber-400"
                    />
                  </div>
                </div>

                {/* Quick Position Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      updateStep4Subtitle({ subtitleX: 50, subtitleY: 22, position: 'top' });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                      subY <= 30
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    ⬆️ Haut (22%)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('pop');
                      updateStep4Subtitle({
                        subtitleX: 50,
                        subtitleY: 50,
                        subtitleScale: Math.max(125, subScale),
                        coverCompetitorText: true,
                        position: 'center',
                      });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer border ${
                      subY > 35 && subY < 65
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                    }`}
                  >
                    🎯 Milieu 50% (Cache l'ancien texte concurrent)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      updateStep4Subtitle({ subtitleX: 50, subtitleY: 78, position: 'bottom' });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                      effectiveSubY >= 68
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    ⬇️ Bas TikTok (78%)
                  </button>

                  {blurZone.enabled && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playSfx('pop');
                          updateStep4Subtitle({
                            subtitleX: 50,
                            subtitleY: smartAvoidance.aboveMaskY,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer border bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25"
                      >
                        ⚡ Évitement Haut du Masque ({smartAvoidance.aboveMaskY}%)
                      </button>
                      {smartAvoidance.belowMaskY <= 86 && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playSfx('pop');
                            updateStep4Subtitle({
                              subtitleX: 50,
                              subtitleY: smartAvoidance.belowMaskY,
                            });
                          }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer border bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25"
                        >
                          ⚡ Évitement Bas du Masque ({smartAvoidance.belowMaskY}%)
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Checkbox: Fond Noir Couvrant sous le sous-titre */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={effectiveCoverBox}
                    onChange={(e) => {
                      soundFx.playSfx('click');
                      updateStep4Subtitle({ coverCompetitorText: e.target.checked });
                    }}
                    className="w-3.5 h-3.5 accent-emerald-400 rounded cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-300">
                    Fond Noir Contrasté Net sous mes sous-titres (gravé APRÈS le flou avec Outline=3 sans aucun flou sur le texte)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 3B. BANNIÈRE D'ACCROCHE CHOC (HOOK BANNER 00:00 - 00:03.5) */}
          {selectedSubtitle && onSubtitleChange && (
            <div className="bg-[#0f1522] border border-yellow-500/35 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    Bannière d'Accroche Choc (Hook Banner 0-3s)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Affichée en haut de l'écran de <span className="text-white font-bold">00:00 à 00:03.5</span> en grosses lettres grasses (fond jaune ou rouge contrasté avec contour noir) pour stopper le scroll immédiatement et empêcher le décrochage à 0:02.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playSfx('pop');
                    updateStep4Subtitle({ hookBannerEnabled: !hookBannerEnabled });
                  }}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                    hookBannerEnabled
                      ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-500/10'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      hookBannerEnabled
                        ? 'bg-yellow-400 border-yellow-400 text-slate-950'
                        : 'bg-slate-950 border-slate-600 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span>[✓] Bannière d'Accroche Choc (Hook Banner 0-3s)</span>
                </button>
              </div>

              {hookBannerEnabled && (
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  {/* Couleur du fond : Jaune Choc ou Rouge Choc avec contour noir */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-300">
                      Couleur du badge & contour noir :
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playSfx('click');
                          updateStep4Subtitle({ hookBannerBgColor: 'yellow' });
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase border-2 cursor-pointer transition-all ${
                          hookBannerBgColor === 'yellow'
                            ? 'bg-yellow-400 text-slate-950 border-white shadow-md scale-105'
                            : 'bg-yellow-400/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-400/30'
                        }`}
                      >
                        🟨 Fond Jaune Choc + Contour Noir
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playSfx('click');
                          updateStep4Subtitle({ hookBannerBgColor: 'red' });
                        }}
                        className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase border-2 cursor-pointer transition-all ${
                          hookBannerBgColor === 'red'
                            ? 'bg-red-600 text-white border-white shadow-md scale-105'
                            : 'bg-red-600/20 text-red-300 border-red-500/40 hover:bg-red-600/30'
                        }`}
                      >
                        🟥 Fond Rouge Choc + Contour Noir
                      </button>
                    </div>
                  </div>

                  {/* Titres chocs prédéfinis / générés par l'IA */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      Choisir un titre d'accroche percutant (00:00 - 00:03.5) :
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'TRANSFORMATION TOTALE ! ⚡',
                        'REGARDE BIEN CE DÉTAIL ! 😱',
                        'TU NE CROIRAS PAS CE QUI SE PASSE...',
                        '¡TRANSFORMACIÓN BRUTAL! ⚡',
                        'MIND-BLOWING RESULT! ⚡',
                        'UNGLAUBLICHES ERGEBNIS! ⚡',
                      ].map((preset) => {
                        const isSelected = hookBannerText === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              soundFx.playSfx('pop');
                              updateStep4Subtitle({
                                hookBannerText: preset,
                                hookBannerEnabled: true,
                              });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wide border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-md'
                                : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-yellow-400/60 hover:text-yellow-300'
                            }`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Champ personnalisé */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block">
                      Ou personnaliser le texte de la Bannière d'Accroche (0-3.5s) :
                    </label>
                    <input
                      type="text"
                      value={hookBannerText}
                      onChange={(e) =>
                        updateStep4Subtitle({
                          hookBannerText: e.target.value.toUpperCase(),
                          hookBannerEnabled: true,
                        })
                      }
                      placeholder="Ex: TRANSFORMATION TOTALE ! ⚡"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-yellow-400 text-xs font-black uppercase text-white tracking-wider outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. FLOU PUR TRANSPARENT SUR UNE ZONE PRÉCISE (SI BESOIN — SANS FOND GRIS) */}
          <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                4. Zone de Flou Pur Ciblée (Optionnelle — Sans fond gris)
              </h3>

              <button
                type="button"
                onClick={() => {
                  soundFx.playSfx('click');
                  updateBlurZone({
                    enabled: !blurZone.enabled,
                    style: 'pure-blur',
                    opacity: 0,
                  });
                }}
                className={`px-3 py-1 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                  blurZone.enabled
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                    blurZone.enabled
                      ? 'bg-cyan-400 border-cyan-400 text-slate-950'
                      : 'bg-slate-950 border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Ajouter un flou pur transparent sur une zone précise</span>
              </button>
            </div>

            {blurZone.enabled && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Position Verticale (Y)</span>
                      <span className="font-mono text-cyan-400 font-bold">{blurZone.y}%</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="88"
                      value={blurZone.y}
                      onChange={(e) => updateBlurZone({ y: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Hauteur de la zone</span>
                      <span className="font-mono text-cyan-400 font-bold">{blurZone.height}%</span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="40"
                      value={blurZone.height}
                      onChange={(e) => updateBlurZone({ height: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Largeur de la zone</span>
                      <span className="font-mono text-cyan-400 font-bold">{blurZone.width}%</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="100"
                      value={blurZone.width}
                      onChange={(e) => {
                        const w = parseInt(e.target.value, 10);
                        const newX = Math.max(0, Math.min(100 - w, Math.round((100 - w) / 2)));
                        updateBlurZone({ width: w, x: newX });
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Intensité Boxblur</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {blurZone.blurAmount} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="6"
                      max="30"
                      value={blurZone.blurAmount}
                      onChange={(e) =>
                        updateBlurZone({ blurAmount: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
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
          <span>Étape 5 : Script Viral & Téléchargement</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
