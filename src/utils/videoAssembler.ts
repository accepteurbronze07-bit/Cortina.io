import {
  VideoClip,
  VoiceOption,
  SubtitleStyle,
  BackgroundMusic,
  BlurZone,
} from '../types';
import { soundFx } from './audioUtils';

export interface AssembledVideoResult {
  videoBlob?: Blob;
  videoUrl: string;
  downloadUrl?: string;
  mimeType: string;
  fileExtension: string;
  voiceoverUrl: string;
  cleanedText: string;
  durationSeconds: number;
  renderedOnServer?: boolean;
}

// Remplace ta ligne d'audio simple par ce filtre silenceremove :
export const audioFilter = 'silenceremove=stop_periods=-1:stop_duration=0.2:stop_threshold=-35dB';

// Dans ta commande FFmpeg :
export function buildFfmpegAudioMuxCommand(
  inputVideoPath: string,
  voiceoverAudioPath: string,
  outputVideoPath: string
) {
  return `ffmpeg -y -i "${inputVideoPath}" -i "${voiceoverAudioPath}" -filter_complex "[1:a]${audioFilter}[a_clean]" -map 0:v -map "[a_clean]" -c:v copy -c:a aac -b:a 192k -shortest "${outputVideoPath}"`;
}

// Downloads any video (.MP4) or audio (.WAV) in the background via fetch() -> res.blob() -> URL.createObjectURL(blob) -> invisible <a download="cortia-video.mp4"> AND native Android navigator.share({ files })
export async function triggerBlobDownload(params: {
  url: string;
  filename: string;
  fallbackMimeType?: string;
  blob?: Blob;
}): Promise<void> {
  const { url, filename, fallbackMimeType = 'video/mp4', blob: providedBlob } = params;
  if (!url && !providedBlob) {
    throw new Error('URL de téléchargement manquante');
  }

  let typedBlob: Blob;

  if (providedBlob) {
    typedBlob =
      providedBlob.type && providedBlob.type !== 'application/octet-stream'
        ? providedBlob
        : new Blob([providedBlob], { type: fallbackMimeType });
  } else {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Erreur téléchargement HTTP ${response.status}`);
    }

    const rawBlob = await response.blob();
    const mime =
      rawBlob.type && rawBlob.type !== 'application/octet-stream'
        ? rawBlob.type
        : fallbackMimeType;
    typedBlob = new Blob([rawBlob], { type: mime });
  }

  const objectUrl = URL.createObjectURL(typedBlob);

  // 1. Trigger standard <a download="cortia-video.mp4">
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // 2. On Android / Mobile phones inside AI Studio preview iframe, also invoke native navigator.share({ files }) so saving to gallery/files works 100%
  try {
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    if (
      isMobileDevice &&
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof File !== 'undefined'
    ) {
      const shareFile = new File([typedBlob], filename, {
        type: typedBlob.type || fallbackMimeType,
      });
      const canShareFiles =
        typeof navigator.canShare === 'function'
          ? navigator.canShare({ files: [shareFile] })
          : true;

      if (canShareFiles) {
        await navigator
          .share({
            files: [shareFile],
            title: filename,
          })
          .catch(() => {
            // User dismissed native share sheet or browser already downloaded via <a>
          });
      }
    }
  } catch {
    // Fallback already handled by <a download>
  }

  setTimeout(() => {
    try {
      URL.revokeObjectURL(objectUrl);
    } catch {
      // ignore
    }
  }, 45000);
}

// Extracts real thumbnail frame and duration from a user-uploaded .mp4 file
export async function extractVideoMetadataAndThumbnail(file: File): Promise<{
  blobUrl: string;
  thumbnailDataUrl: string;
  durationFormatted: string;
  durationSeconds: number;
}> {
  const blobUrl = URL.createObjectURL(file);

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = blobUrl;

    let resolved = false;
    const finish = (thumb: string, durSec: number) => {
      if (resolved) return;
      resolved = true;
      const mins = Math.floor(durSec / 60);
      const secs = Math.floor(durSec % 60);
      const durationFormatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      resolve({
        blobUrl,
        thumbnailDataUrl: thumb,
        durationFormatted,
        durationSeconds: durSec,
      });
    };

    const timeout = setTimeout(() => {
      const fallbackDur =
        Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 15;
      finish(
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        fallbackDur
      );
    }, 15000);

    video.onloadedmetadata = () => {
      const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 15;
      video.currentTime = Math.min(1.5, dur * 0.1);
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 540;
        canvas.height = 960;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawMediaCover(ctx, video, video.videoWidth || 540, video.videoHeight || 960, 540, 960);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 15;
          finish(dataUrl, dur);
          return;
        }
      } catch {
        // Fallback if canvas capture fails
      }
      const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 15;
      finish(
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        dur
      );
    };

    video.onerror = () => {
      clearTimeout(timeout);
      finish(
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        15
      );
    };
  });
}

// Helper to draw a video or image covering the 1080x1920 canvas (object-fit: cover) with optional horizontal mirror
export function drawMediaCover(
  ctx: CanvasRenderingContext2D,
  media: HTMLVideoElement | HTMLImageElement,
  mediaWidth: number,
  mediaHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  extraScale: number = 1.0,
  mirrorHorizontal: boolean = false
) {
  const mw = mediaWidth || canvasWidth;
  const mh = mediaHeight || canvasHeight;
  const scale = Math.max(canvasWidth / mw, canvasHeight / mh) * extraScale;
  const drawW = mw * scale;
  const drawH = mh * scale;
  const offsetX = (canvasWidth - drawW) / 2;
  const offsetY = (canvasHeight - drawH) / 2;

  if (mirrorHorizontal) {
    ctx.save();
    ctx.translate(canvasWidth, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(media, offsetX, offsetY, drawW, drawH);
    ctx.restore();
  } else {
    ctx.drawImage(media, offsetX, offsetY, drawW, drawH);
  }
}

// Rounded rectangle path helper
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

// Draw 2-Layer Duplicated Video (Layer 1: Fullscreen Blurred 1080x1920, Layer 2: Center Sharp Overlay) + Optional Pure Blur Zone onto 1080x1920 canvas
export function drawCaptionMaskOnCanvas(
  ctx: CanvasRenderingContext2D,
  blurZone: BlurZone,
  media: HTMLVideoElement | HTMLImageElement,
  mediaWidth: number,
  mediaHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  extraScale: number = 1.0
) {
  if (!blurZone) return;

  const isMirrored = Boolean(blurZone.mirrorHorizontal);
  const topBottomEnabled = blurZone.topBottomBlurEnabled !== false;
  const topBottomPct = Math.max(8, Math.min(28, Number(blurZone.topBottomBlurPct) || 16));

  if (topBottomEnabled) {
    const bandH = (topBottomPct / 100) * canvasHeight;

    // Top blurred band from Layer 1
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvasWidth, bandH);
    ctx.rect(0, canvasHeight - bandH, canvasWidth, bandH);
    ctx.clip();
    ctx.filter = 'blur(28px) brightness(0.92) saturate(125%)';
    drawMediaCover(
      ctx,
      media,
      mediaWidth,
      mediaHeight,
      canvasWidth,
      canvasHeight,
      extraScale * 1.06,
      isMirrored
    );
    ctx.filter = 'none';
    ctx.restore();
  }

  // Optional custom targeted zone (Pure transparent blur without grey background by default)
  if (!blurZone.enabled) return;

  const bx = (blurZone.x / 100) * canvasWidth;
  const by = (blurZone.y / 100) * canvasHeight;
  const bw = (blurZone.width / 100) * canvasWidth;
  const bh = (blurZone.height / 100) * canvasHeight;

  ctx.save();
  roundRectPath(ctx, bx, by, bw, bh, 28);
  ctx.clip();

  // Draw pure blurred underlying video inside clipped mask region (no grey box!)
  const blurPx = Math.max(10, (blurZone.blurAmount || 20) * 2.0);
  ctx.filter = `blur(${blurPx}px) saturate(125%)`;
  drawMediaCover(
    ctx,
    media,
    mediaWidth,
    mediaHeight,
    canvasWidth,
    canvasHeight,
    extraScale * 1.04,
    isMirrored
  );
  ctx.filter = 'none';

  if (blurZone.style === 'black-gradient') {
    const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.90)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw, bh);
  } else if (blurZone.style === 'solid-dark') {
    ctx.fillStyle = 'rgba(11, 15, 23, 0.92)';
    ctx.fillRect(bx, by, bw, bh);
  }

  ctx.restore();
  ctx.filter = 'none';
}

// Smart Avoidance Helper ("Repères d'évitement intelligents"):
// When a manual Caption Mask (blurZone.enabled) is active in the center or bottom,
// computes optimal subtitle Y positions slightly above or below the mask (or enables a crisp high-contrast box on top of the blurred mask).
export function computeSmartSubtitleAvoidance(
  rawSubtitleY: number | undefined,
  subtitlePosition: 'top' | 'center' | 'bottom' = 'bottom',
  blurZone?: BlurZone,
  coverCompetitorText?: boolean
): {
  effectiveY: number;
  aboveMaskY: number;
  belowMaskY: number;
  isOverlappingMask: boolean;
  avoidedAutomatically: boolean;
  autoContrastBox: boolean;
} {
  const defaultYPercent =
    subtitlePosition === 'top' ? 22 : subtitlePosition === 'center' ? 50 : 78;
  const hasExplicitY =
    rawSubtitleY !== undefined &&
    rawSubtitleY !== null &&
    Number.isFinite(Number(rawSubtitleY));
  let yPct = Math.max(10, Math.min(90, hasExplicitY ? Number(rawSubtitleY) : defaultYPercent));

  const topBottomEnabled = blurZone?.topBottomBlurEnabled !== false;
  const topBottomPct = topBottomEnabled
    ? Math.max(8, Math.min(28, Number(blurZone?.topBottomBlurPct) || 16))
    : 0;
  const safeTopMin = Math.max(14, topBottomPct + 6);
  const safeBottomMax = Math.min(86, 100 - topBottomPct - 6);

  const maskY = Math.max(0, Math.min(95, Number(blurZone?.y) ?? 72));
  const maskH = Math.max(6, Math.min(50, Number(blurZone?.height) ?? 16));
  const maskTop = maskY;
  const maskBottom = Math.min(98, maskY + maskH);
  const clearance = 7;

  const aboveMaskY = Math.max(14, Math.min(86, Math.round(maskTop - clearance)));
  const belowMaskY = Math.max(14, Math.min(86, Math.round(maskBottom + clearance)));

  let isOverlappingMask = false;
  let avoidedAutomatically = false;
  let autoContrastBox = Boolean(coverCompetitorText);

  if (blurZone && blurZone.enabled) {
    isOverlappingMask = yPct >= maskTop - clearance && yPct <= maskBottom + clearance;
    const isDefaultPos =
      !hasExplicitY || Math.abs(yPct - 78) <= 2 || Math.abs(yPct - 50) <= 2;

    if (isOverlappingMask) {
      if (isDefaultPos) {
        if (maskTop >= 52 && aboveMaskY >= safeTopMin) {
          yPct = aboveMaskY;
          avoidedAutomatically = true;
          isOverlappingMask = false;
        } else if (belowMaskY <= safeBottomMax) {
          yPct = belowMaskY;
          avoidedAutomatically = true;
          isOverlappingMask = false;
        } else if (aboveMaskY >= 14) {
          yPct = aboveMaskY;
          avoidedAutomatically = true;
          isOverlappingMask = false;
        } else {
          autoContrastBox = true;
        }
      } else {
        // User positioned subtitles directly over the already-blurred mask -> force crisp contrast box
        autoContrastBox = true;
      }
    }
  }

  return {
    effectiveY: Math.max(10, Math.min(90, yPct)),
    aboveMaskY,
    belowMaskY,
    isOverlappingMask,
    avoidedAutomatically,
    autoContrastBox,
  };
}

// Draw synchronized animated subtitles on the 1080x1920 canvas AFTER all blurs (Supports "1 Mot par 1 Mot" Viral Flash + all CapCut templates + Smart Caption Mask Avoidance)
export function drawAnimatedSubtitlesOnCanvas(
  ctx: CanvasRenderingContext2D,
  words: string[],
  elapsedSec: number,
  totalDurationSec: number,
  subtitleStyle: SubtitleStyle,
  canvasWidth: number,
  canvasHeight: number,
  activeBlurZone?: BlurZone
) {
  const cleanWords = (words || []).filter((w) => Boolean(w) && !/^\d{1,2}:\d{2}$/.test(w));
  if (cleanWords.length === 0) return;

  // Strictly guarantee zero blur filter when drawing the subtitle layer!
  ctx.filter = 'none';

  const progress = Math.max(0, Math.min(0.999, elapsedSec / Math.max(1, totalDurationSec)));
  const currentGlobalWordIndex = Math.floor(progress * cleanWords.length);

  // Word pop animation factor
  const wordDuration = totalDurationSec / Math.max(1, cleanWords.length);
  const wordElapsed = elapsedSec - currentGlobalWordIndex * wordDuration;
  const popProgress = Math.min(1, Math.max(0, wordElapsed / Math.min(0.18, wordDuration)));
  const scaleBounce = 1 + Math.sin(popProgress * Math.PI) * 0.12;

  // Custom X & Y position (10% to 90%) + Smart Avoidance against Caption Mask + Zoom Scale (50% to 200%)
  const smartPlacement = computeSmartSubtitleAvoidance(
    subtitleStyle.subtitleY,
    subtitleStyle.position || 'bottom',
    activeBlurZone,
    subtitleStyle.coverCompetitorText
  );
  const xPercent = Math.max(10, Math.min(90, Number(subtitleStyle.subtitleX) || 50));
  const yPercent = smartPlacement.effectiveY;
  const userScale = Math.max(0.5, Math.min(2.0, (Number(subtitleStyle.subtitleScale) || 100) / 100));

  const centerX = canvasWidth * (xPercent / 100);
  const centerY = canvasHeight * (yPercent / 100);

  const styleId = subtitleStyle.subtitleTemplateId || subtitleStyle.id || 'brown-fox-box';
  const isWordByWord = Boolean(
    subtitleStyle.wordByWord ||
      styleId === 'word-by-word' ||
      styleId === 'viral_1word_flash'
  );
  const coverCompetitor = Boolean(
    subtitleStyle.coverCompetitorText || smartPlacement.autoContrastBox
  );

  // ============================================================================
  // MODE SOUS-TITRES "1 MOT PAR 1 MOT" AVEC FOND NOIR CONTRASTÉ
  // ============================================================================
  if (isWordByWord) {
    const singleWord = (cleanWords[currentGlobalWordIndex] || '').toUpperCase();
    if (!singleWord) return;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(scaleBounce * userScale, scaleBounce * userScale);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const fontSize = Math.round(canvasWidth * 0.08);
    ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;

    const measuredW = ctx.measureText(singleWord).width;
    const maxAllowed = (canvasWidth * 0.88) / userScale;
    if (measuredW > maxAllowed) {
      const shrink = maxAllowed / measuredW;
      ctx.scale(shrink, shrink);
    }

    // Always draw high-contrast black background pill behind word-by-word subtitles
    const padX = 32;
    const padY = 20;
    ctx.fillStyle = 'rgba(5, 8, 15, 0.94)';
    roundRectPath(
      ctx,
      -measuredW / 2 - padX,
      -fontSize / 2 - padY,
      measuredW + padX * 2,
      fontSize + padY * 2,
      24
    );
    ctx.fill();

    // Thick black outline + crisp drop shadow + bold white fill
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(10, Math.round(fontSize * 0.2));
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 12;
    ctx.strokeText(singleWord, 0, 0);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(singleWord, 0, 0);

    ctx.restore();
    return;
  }

  // Two-line CapCut styles: quick-cyan, hormozi-yellow, pink-magenta, minimal-clean
  const isTwoLine =
    styleId === 'quick-cyan' ||
    styleId === 'capcut_2line_cyan' ||
    styleId === 'hormozi-yellow' ||
    styleId === 'hormozi' ||
    styleId === 'pink-magenta' ||
    styleId === 'capcut_pink_pro' ||
    styleId === 'minimal-clean' ||
    styleId === 'minimal';

  // Group into phrases of 3 words for single-line CapCut templates or 4 words for two-line templates
  const wordsPerPhrase = isTwoLine ? 4 : 3;
  const phraseIndex = Math.floor(currentGlobalWordIndex / wordsPerPhrase);
  const phraseStart = phraseIndex * wordsPerPhrase;
  const phraseWords = cleanWords.slice(phraseStart, phraseStart + wordsPerPhrase);
  const activeWordInPhrase = currentGlobalWordIndex - phraseStart;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(scaleBounce * userScale, scaleBounce * userScale);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const isCasePreserved = styleId === 'capcut_classic_pro';
  const formattedWords = phraseWords.map((w) => (isCasePreserved ? w : w.toUpperCase()));

  if (isTwoLine && formattedWords.length >= 2) {
    const mid = Math.ceil(formattedWords.length / 2);
    const line1Text = formattedWords.slice(0, mid).join(' ');
    const line2Text = formattedWords.slice(mid).join(' ');

    const isMinimal = styleId === 'minimal-clean' || styleId === 'minimal';
    const fontSize = Math.round(canvasWidth * (isMinimal ? 0.048 : 0.068));
    const lineHeight = fontSize * 1.18;
    ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;

    const maxW = Math.max(ctx.measureText(line1Text).width, ctx.measureText(line2Text).width);
    const maxAllowed = (canvasWidth * 0.88) / userScale;
    if (maxW > maxAllowed) {
      const shrink = maxAllowed / maxW;
      ctx.scale(shrink, shrink);
    }

    if (coverCompetitor) {
      const padX = 34;
      const padY = 20;
      ctx.fillStyle = 'rgba(5, 8, 15, 0.94)';
      roundRectPath(
        ctx,
        -maxW / 2 - padX,
        -lineHeight - padY,
        maxW + padX * 2,
        lineHeight * 2 + padY * 2,
        24
      );
      ctx.fill();
    }

    const line2Color =
      styleId === 'hormozi-yellow' || styleId === 'hormozi'
        ? '#FFFF00'
        : styleId === 'pink-magenta' || styleId === 'capcut_pink_pro'
        ? '#FF00FF'
        : isMinimal
        ? '#38BDF8'
        : '#00FFFF'; // quick-cyan / capcut_2line_cyan

    // Stroke + Fill Line 1 (White)
    if (!isMinimal) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(8, Math.round(fontSize * 0.18));
      ctx.strokeText(line1Text, 0, -lineHeight / 2);
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(line1Text, 0, -lineHeight / 2);

    // Stroke + Fill Line 2 (Highlight Color: Cyan / Yellow / Pink / Sky)
    if (!isMinimal) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(8, Math.round(fontSize * 0.18));
      ctx.strokeText(line2Text, 0, lineHeight / 2);
    }
    ctx.fillStyle = line2Color;
    ctx.fillText(line2Text, 0, lineHeight / 2);

    ctx.restore();
    return;
  }

  // Single-line CapCut styles (brown-fox-box, brown-fox-glow, yellow-glow)
  const fontSize = Math.round(canvasWidth * 0.065);
  ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';

  const spaceWidth = Math.round(fontSize * 0.34);
  const wordWidths = formattedWords.map((w) => ctx.measureText(w).width);
  const totalWidth =
    wordWidths.reduce((acc, w) => acc + w, 0) +
    Math.max(0, formattedWords.length - 1) * spaceWidth;

  const maxLineWidth = (canvasWidth * 0.88) / userScale;
  if (totalWidth > maxLineWidth) {
    const shrink = maxLineWidth / totalWidth;
    ctx.scale(shrink, shrink);
  }

  // 1. brown-fox-box / capcut_box_cyan or coverCompetitor: Rounded solid black box behind text
  const isBoxCyan = styleId === 'brown-fox-box' || styleId === 'capcut_box_cyan';
  if (isBoxCyan || coverCompetitor) {
    const padX = 32;
    const padY = 22;
    ctx.fillStyle = 'rgba(5, 8, 15, 0.94)';
    roundRectPath(
      ctx,
      -totalWidth / 2 - padX,
      -fontSize / 2 - padY,
      totalWidth + padX * 2,
      fontSize + padY * 2,
      24
    );
    ctx.fill();
  }

  let cursorX = -totalWidth / 2;
  formattedWords.forEach((word, idx) => {
    const wWidth = wordWidths[idx];
    const isCurrentWord = idx === activeWordInPhrase || idx === formattedWords.length - 1;

    ctx.save();

    if (isBoxCyan) {
      ctx.fillStyle = isCurrentWord ? '#00FFFF' : '#FFFFFF';
      ctx.fillText(word, cursorX, 0);
    } else if (styleId === 'brown-fox-glow' || styleId === 'capcut_glow_cyan') {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(8, Math.round(fontSize * 0.16));
      ctx.strokeText(word, cursorX, 0);
      ctx.fillStyle = isCurrentWord ? '#00FFFF' : '#FFFFFF';
      ctx.fillText(word, cursorX, 0);
    } else if (styleId === 'yellow-glow' || styleId === 'capcut_yellow_glow') {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(8, Math.round(fontSize * 0.16));
      ctx.strokeText(word, cursorX, 0);
      ctx.fillStyle = '#FFFF00';
      ctx.fillText(word, cursorX, 0);
    } else {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(8, Math.round(fontSize * 0.16));
      ctx.strokeText(word, cursorX, 0);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(word, cursorX, 0);
    }

    ctx.restore();
    cursorX += wWidth + spaceWidth;
  });

  ctx.restore();
}

// Helper to load video or image clip asset for canvas rendering
interface LoadedClipAsset {
  clip: VideoClip;
  videoEl?: HTMLVideoElement;
  imageEl?: HTMLImageElement;
  width: number;
  height: number;
}

export function resolvePlayableClipVideoSrc(clip?: VideoClip | null): string {
  if (!clip) return '';
  // 1. Local phone MP4 file imported via URL.createObjectURL(file)
  if (clip.isLocalFile && clip.fileBlobUrl && clip.fileBlobUrl.startsWith('blob:')) {
    return clip.fileBlobUrl;
  }
  // 2. Extracted TikWM / TikTok CDN stream -> ALWAYS route through Anti-CORS Proxy (/api/video-proxy?url=...)
  if (clip.mp4Url && (clip.mp4Url.startsWith('http://') || clip.mp4Url.startsWith('https://'))) {
    return `/api/video-proxy?url=${encodeURIComponent(clip.mp4Url)}`;
  }
  // 3. Already a proxied /api/video-proxy?url=... or blob: URL
  if (clip.fileBlobUrl) {
    if (
      clip.fileBlobUrl.startsWith('/api/video-proxy?url=') ||
      clip.fileBlobUrl.startsWith('blob:')
    ) {
      return clip.fileBlobUrl;
    }
    if (clip.fileBlobUrl.startsWith('http://') || clip.fileBlobUrl.startsWith('https://')) {
      return `/api/video-proxy?url=${encodeURIComponent(clip.fileBlobUrl)}`;
    }
  }
  // 4. Local server video fallback if available
  if (clip.localVideoUrl && clip.localVideoUrl.startsWith('/api/local-video/')) {
    return clip.localVideoUrl;
  }
  return '';
}

async function loadClipAsset(clip: VideoClip): Promise<LoadedClipAsset> {
  const playableSrc = resolvePlayableClipVideoSrc(clip);
  if (playableSrc) {
    return new Promise((resolve) => {
      const vid = document.createElement('video');
      if (!playableSrc.startsWith('blob:')) {
        vid.crossOrigin = 'anonymous';
      }
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = 'auto';
      vid.src = playableSrc;

      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        const vw = vid.videoWidth || 720;
        const vh = vid.videoHeight || 1280;
        resolve({
          clip,
          videoEl: vid,
          width: vw,
          height: vh,
        });
      };

      const timer = setTimeout(done, 4500);
      vid.onloadedmetadata = () => {
        try {
          if (vid.currentTime === 0) {
            vid.currentTime = 0.05;
          }
        } catch {
          // ignore seek error
        }
      };
      vid.onloadeddata = () => {
        clearTimeout(timer);
        done();
      };
      vid.oncanplay = () => {
        clearTimeout(timer);
        done();
      };
      vid.onerror = () => {
        clearTimeout(timer);
        done();
      };
      vid.load();
    });
  }

  // Fallback to image if no local video blob URL
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve({
        clip,
        imageEl: img,
        width: img.naturalWidth || 1080,
        height: img.naturalHeight || 1920,
      });
    };
    img.onerror = () => {
      resolve({
        clip,
        width: 1080,
        height: 1920,
      });
    };
    img.src = clip.thumbnail;
  });
}

// Pick best supported video MIME type for MediaRecorder
function getSupportedVideoMimeType(): { mimeType: string; ext: string } {
  const candidates = [
    { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { mimeType: 'video/mp4', ext: 'mp4' },
    { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: '', ext: 'mp4' };
}

export interface LocalClipUploadResult {
  localPath?: string;
  localVideoUrl?: string;
  videoDataUrl?: string;
  durationSeconds?: number;
  durationFormatted?: string;
}

const inFlightLocalUploads = new Map<string, Promise<LocalClipUploadResult>>();
const completedLocalUploads = new Map<string, LocalClipUploadResult>();

// Starts and caches a local phone video upload to /api/save-local-clip?id=...
export function startLocalClipServerUpload(
  fileOrBlob: Blob,
  clipId: string
): Promise<LocalClipUploadResult> {
  const safeId = String(clipId || `upload_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');
  const existing = inFlightLocalUploads.get(safeId);
  if (existing) return existing;

  const task = (async (): Promise<LocalClipUploadResult> => {
    // Also read base64 dataUrl for clips <= 35MB so the server always has an inline backup if /tmp was reset
    let inlineDataUrl: string | undefined;
    if (fileOrBlob.size > 0 && fileOrBlob.size <= 35 * 1024 * 1024) {
      try {
        inlineDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(fileOrBlob);
        });
      } catch {
        inlineDataUrl = undefined;
      }
    }

    try {
      const uploadRes = await fetch(`/api/save-local-clip?id=${encodeURIComponent(safeId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Clip-Id': safeId,
        },
        body: fileOrBlob,
      });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (uploadRes.ok && uploadData.success) {
        const result: LocalClipUploadResult = {
          localPath: uploadData.localPath || `/tmp/cortia_clip_${safeId}.mp4`,
          localVideoUrl: uploadData.localVideoUrl || `/api/local-video/${safeId}`,
          videoDataUrl: inlineDataUrl,
          durationSeconds: Number(uploadData.durationSeconds) || undefined,
          durationFormatted: uploadData.durationFormatted || undefined,
        };
        completedLocalUploads.set(safeId, result);
        return result;
      }
    } catch {
      // Fallback to dataUrl if <= 80MB
    }

    if (fileOrBlob.size > 80 * 1024 * 1024) {
      return {};
    }

    try {
      const videoDataUrl =
        inlineDataUrl ||
        (await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(fileOrBlob);
        }));
      if (videoDataUrl) {
        try {
          const saveRes = await fetch('/api/save-local-clip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: safeId, videoDataUrl }),
          });
          const saveData = await saveRes.json().catch(() => ({}));
          if (saveRes.ok && saveData.success) {
            const result: LocalClipUploadResult = {
              localPath: saveData.localPath || `/tmp/cortia_clip_${safeId}.mp4`,
              localVideoUrl: saveData.localVideoUrl || `/api/local-video/${safeId}`,
              videoDataUrl,
              durationSeconds: Number(saveData.durationSeconds) || undefined,
              durationFormatted: saveData.durationFormatted || undefined,
            };
            completedLocalUploads.set(safeId, result);
            return result;
          }
        } catch {
          // Return videoDataUrl directly for /api/assemble-video Priority 2
        }
        return { videoDataUrl };
      }
    } catch {
      // ignore
    }
    return {};
  })();

  inFlightLocalUploads.set(safeId, task);
  task.finally(() => {
    inFlightLocalUploads.delete(safeId);
  });
  return task;
}

// Helper: upload a local blob: URL or File to /api/save-local-clip as binary (supports 3+ minute phone videos up to 300MB)
// Also verifies that the cached file still exists on the server so a server restart never causes a missing clip / black video fallback!
export async function ensureBlobUploadedOrDataUrl(
  blobUrl: string,
  clipId: string,
  localFile?: File
): Promise<LocalClipUploadResult> {
  const safeId = String(clipId || `upload_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');
  if (inFlightLocalUploads.has(safeId)) {
    return inFlightLocalUploads.get(safeId)!;
  }
  if (completedLocalUploads.has(safeId)) {
    const cached = completedLocalUploads.get(safeId)!;
    try {
      const checkRes = await fetch(`/api/local-video/${encodeURIComponent(safeId)}`, {
        method: 'HEAD',
      });
      if (checkRes.ok) {
        return cached;
      }
    } catch {
      // Server file missing or unreachable -> re-upload below
    }
    completedLocalUploads.delete(safeId);
  }
  if (localFile) {
    return startLocalClipServerUpload(localFile, safeId);
  }
  if (!blobUrl || !blobUrl.startsWith('blob:')) return {};
  try {
    const res = await fetch(blobUrl);
    const blob = await res.blob();
    return await startLocalClipServerUpload(blob, safeId);
  } catch {
    return {};
  }
}

// Prepare all VideoClip objects for /api/assemble-video, awaiting any in-flight local phone video upload and ensuring no blob: URL is ever sent as a remote http link
export async function prepareClipsForServerAssembly(clips: VideoClip[]) {
  return Promise.all(
    clips.map(async (c) => {
      const cid = String(c.videoId || c.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
      const isLocal =
        Boolean(c.isLocalFile) ||
        cid.startsWith('upload_') ||
        Boolean(c.localFile) ||
        Boolean(c.fileBlobUrl && c.fileBlobUrl.startsWith('blob:')) ||
        Boolean(c.url && c.url.startsWith('blob:'));

      let uploaded: LocalClipUploadResult = {};
      if (isLocal) {
        uploaded = await ensureBlobUploadedOrDataUrl(
          c.fileBlobUrl || c.url || '',
          cid || c.id,
          c.localFile
        );
      }

      const safeLocalPath =
        c.localPath ||
        uploaded.localPath ||
        (isLocal && cid ? `/tmp/cortia_clip_${cid}.mp4` : undefined);
      const safeLocalVideoUrl =
        c.localVideoUrl ||
        uploaded.localVideoUrl ||
        (isLocal && cid ? `/api/local-video/${cid}` : undefined);

      // Never pass a browser blob: URL (or a corrupted blob URL stripped of 'blob:') as a remote TikTok URL
      const safeUrl = isLocal
        ? safeLocalVideoUrl || ''
        : c.url && !c.url.startsWith('blob:')
        ? c.url
        : '';

      return {
        id: c.id,
        videoId: c.videoId || cid,
        localPath: safeLocalPath,
        localVideoUrl: safeLocalVideoUrl,
        title: c.title,
        duration: uploaded.durationFormatted || c.duration,
        durationSeconds: uploaded.durationSeconds || c.durationSeconds,
        url: safeUrl,
        mp4Url: isLocal ? safeLocalVideoUrl : c.mp4Url,
        fileBlobUrl: isLocal ? safeLocalVideoUrl || c.fileBlobUrl : c.fileBlobUrl,
        videoDataUrl: uploaded.videoDataUrl,
        isHook: c.isHook,
        mirrorHorizontal: Boolean(c.blurZone?.mirrorHorizontal || c.mirrorHorizontal),
        blurZone: {
          ...c.blurZone,
          topBottomBlurEnabled: c.blurZone?.topBottomBlurEnabled !== false,
          topBottomBlurPct: c.blurZone?.topBottomBlurPct ?? 16,
          mirrorHorizontal: Boolean(c.blurZone?.mirrorHorizontal || c.mirrorHorizontal),
        },
      };
    })
  );
}

// High-Speed & High-Quality FFmpeg video configuration (720x1280 TikTok HD, CRF 22, 2500k bitrate, ultrafast preset, 2 threads for <90s render)
export const ULTRA_LIGHT_FFMPEG_ARGS = [
  '-preset',
  'ultrafast',
  '-crf',
  '22',
  '-b:v',
  '2500k',
  '-maxrate',
  '3500k',
  '-bufsize',
  '5000k',
  '-pix_fmt',
  'yuv420p',
  '-threads',
  '2',
] as const;
export const DIRECT_STREAM_COPY_ARGS = ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-threads', '2'] as const;
export const ASSEMBLY_REQUEST_TIMEOUT_MS = 300000; // 300 seconds

// Main function: Assembles user clips + Top/Bottom Layer Blur + Mirror + Gemini TTS Voiceover + Animated Subtitles into a real H.264 + AAC .MP4 via /api/assemble-video (with live Canvas preview & fallback)
export async function assembleFinalVideoOnCanvas(params: {
  canvas: HTMLCanvasElement;
  videos: VideoClip[];
  scriptText: string;
  selectedVoice: VoiceOption;
  selectedSubtitle: SubtitleStyle;
  selectedMusic: BackgroundMusic;
  musicVolume: number;
  language: string;
  includeSubtitles?: boolean;
  includeVoiceover?: boolean;
  preGeneratedVoiceTrack?: {
    blobUrl: string;
    audioBase64?: string;
    voiceFileId?: string;
    voiceId?: string;
    voiceSpeed?: number;
    studioBassBoost?: boolean;
    cleanedText: string;
    durationSeconds: number;
  } | null;
  onProgress: (stepIndex: number, progressPercent: number) => void;
}): Promise<AssembledVideoResult> {
  const {
    canvas,
    videos,
    scriptText,
    selectedVoice,
    selectedSubtitle,
    selectedMusic,
    musicVolume,
    language,
    includeSubtitles = true,
    includeVoiceover = true,
    preGeneratedVoiceTrack,
    onProgress,
  } = params;

  // Order clips so the chosen Hook is first, using all clips with playable video stream (TikTok proxy or local MP4)
  const playableClips = videos.filter((v) => Boolean(v.fileBlobUrl));
  const pool = playableClips.length > 0 ? playableClips : videos;
  const hookClip = pool.find((v) => v.isHook) || pool[0];
  const otherClips = pool.filter((v) => v.id !== hookClip.id);
  const orderedClips = [hookClip, ...otherClips];

  // Step 0: Load video/image assets for live canvas monitor and preserve vertical 9:16 dimensions
  onProgress(0, 12);
  const loadedAssets = await Promise.all(orderedClips.map((c) => loadClipAsset(c)));

  const primaryWidth = loadedAssets[0]?.width || 1080;
  const primaryHeight = loadedAssets[0]?.height || 1920;
  const isSourceVertical = primaryHeight > primaryWidth && primaryWidth >= 360;
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const cleanupLoadedAssets = () => {
    for (const asset of loadedAssets) {
      if (asset?.videoEl) {
        try {
          asset.videoEl.pause();
          asset.videoEl.removeAttribute('src');
          asset.videoEl.load();
        } catch {
          // ignore cleanup errors
        }
      }
    }
  };

  // Step 1: Caption Mask ready
  onProgress(1, 26);

  // Step 2: Reuse pre-generated voiceover from Step 5 script generation (matching selectedVoice.id & speed) or synthesize now (if includeVoiceover is true)
  onProgress(2, 42);
  const effectiveVoiceSpeed = selectedVoice.rate || 1.2;
  const effectiveVoiceId =
    !selectedVoice.id || selectedVoice.id === 'voice_none'
      ? 'fr_leader_energique'
      : selectedVoice.id;
  const effectiveGeminiVoice =
    !selectedVoice.geminiVoice || selectedVoice.geminiVoice === 'NONE'
      ? 'Fenrir'
      : selectedVoice.geminiVoice;

  const isStudioBoostEnabled = selectedVoice.studioBassBoost !== false;
  const canReusePreGenerated =
    preGeneratedVoiceTrack &&
    preGeneratedVoiceTrack.blobUrl &&
    (preGeneratedVoiceTrack.voiceFileId || preGeneratedVoiceTrack.audioBase64) &&
    (!preGeneratedVoiceTrack.voiceId || preGeneratedVoiceTrack.voiceId === effectiveVoiceId) &&
    (preGeneratedVoiceTrack.studioBassBoost ?? true) === isStudioBoostEnabled;

  const voiceTrack =
    includeVoiceover === false
      ? {
          blobUrl: '',
          audioBase64: '',
          voiceFileId: '',
          voiceId: effectiveVoiceId,
          voiceSpeed: effectiveVoiceSpeed,
          studioBassBoost: isStudioBoostEnabled,
          cleanedText: scriptText,
          durationSeconds: 61,
        }
      : canReusePreGenerated
      ? preGeneratedVoiceTrack
      : await soundFx.generateFullVoiceover(
          scriptText,
          effectiveGeminiVoice,
          selectedVoice.langCode || language,
          selectedVoice.characterPrompt,
          effectiveVoiceId,
          effectiveVoiceSpeed,
          isStudioBoostEnabled
        );

  const words = voiceTrack.cleanedText.split(/\s+/).filter(Boolean);
  // Mandatory 01:01 (61 seconds) duration for TikTok Creator Rewards monetization (>1 min)
  const estDurationSec = 61;

  // Start playing assets on the live Canvas monitor while server FFmpeg renders the .MP4
  for (const asset of loadedAssets) {
    if (asset.videoEl) {
      asset.videoEl.currentTime = 0;
      asset.videoEl.play().catch(() => {});
    }
  }

  let previewActive = true;
  const previewStart = performance.now();
  const drawLiveMonitor = () => {
    if (!previewActive) return;
    const elapsedSec = ((performance.now() - previewStart) / 1000) % estDurationSec;
    const clipSlotDuration = estDurationSec / Math.max(2, loadedAssets.length * 2);
    const currentClipIdx = Math.floor(elapsedSec / clipSlotDuration) % Math.max(1, loadedAssets.length);
    const activeAsset = loadedAssets[currentClipIdx];
    const clipMirrored = Boolean(
      activeAsset?.clip?.blurZone?.mirrorHorizontal || activeAsset?.clip?.mirrorHorizontal
    );

    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, W, H);

    if (activeAsset?.videoEl && activeAsset.videoEl.readyState >= 2) {
      drawMediaCover(
        ctx,
        activeAsset.videoEl,
        activeAsset.videoEl.videoWidth || W,
        activeAsset.videoEl.videoHeight || H,
        W,
        H,
        1.0,
        clipMirrored
      );
      drawCaptionMaskOnCanvas(
        ctx,
        activeAsset.clip.blurZone,
        activeAsset.videoEl,
        activeAsset.videoEl.videoWidth || W,
        activeAsset.videoEl.videoHeight || H,
        W,
        H,
        1.0
      );
    } else if (activeAsset?.imageEl) {
      drawMediaCover(
        ctx,
        activeAsset.imageEl,
        activeAsset.width,
        activeAsset.height,
        W,
        H,
        1.02,
        clipMirrored
      );
      drawCaptionMaskOnCanvas(
        ctx,
        activeAsset.clip.blurZone,
        activeAsset.imageEl,
        activeAsset.width,
        activeAsset.height,
        W,
        H,
        1.02
      );
    }

    if (includeSubtitles !== false) {
      drawAnimatedSubtitlesOnCanvas(
        ctx,
        words,
        elapsedSec,
        estDurationSec,
        selectedSubtitle,
        W,
        H,
        activeAsset?.clip.blurZone
      );

      // Draw Shock Hook Banner (00:00 - 00:03.5) at top of canvas monitor
      if (selectedSubtitle.hookBannerEnabled !== false && elapsedSec <= 3.5) {
        const bannerTxt = String(selectedSubtitle.hookBannerText || 'TRANSFORMATION TOTALE ! ⚡')
          .trim()
          .toUpperCase();
        if (bannerTxt) {
          const bgIsRed = selectedSubtitle.hookBannerBgColor === 'red';
          ctx.save();
          ctx.font = '900 32px "Arial Black", "Impact", sans-serif';
          const metrics = ctx.measureText(bannerTxt);
          const padX = 28;
          const boxW = Math.min(W - 40, metrics.width + padX * 2);
          const boxH = 56;
          const boxX = (W - boxW) / 2;
          const boxY = 74;

          roundRectPath(ctx, boxX, boxY, boxW, boxH, 12);
          ctx.fillStyle = bgIsRed ? '#DC2626' : '#FACC15';
          ctx.fill();
          ctx.lineWidth = 5;
          ctx.strokeStyle = '#000000';
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#000000';
          ctx.strokeText(bannerTxt, W / 2, boxY + boxH / 2 + 2, boxW - 20);
          ctx.fillStyle = bgIsRed ? '#FFFFFF' : '#020617';
          ctx.fillText(bannerTxt, W / 2, boxY + boxH / 2 + 2, boxW - 20);
          ctx.restore();
        }
      }
    }

    requestAnimationFrame(drawLiveMonitor);
  };
  requestAnimationFrame(drawLiveMonitor);

  // Step 3 & 4: Prepare payload for server-side FFmpeg assembly (/api/assemble-video)
  onProgress(3, 58);
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  const abortCtrl = new AbortController();
  const timeoutHandle = setTimeout(() => abortCtrl.abort(), ASSEMBLY_REQUEST_TIMEOUT_MS);

  try {
    const serverVideosPayload = await prepareClipsForServerAssembly(orderedClips);

    onProgress(4, 72);
    let tickerPct = 74;
    progressInterval = setInterval(() => {
      tickerPct = Math.min(96, tickerPct + 4);
      onProgress(5, tickerPct);
    }, 350);

    const effectiveTemplateId =
      selectedSubtitle.subtitleTemplateId || selectedSubtitle.id || 'brown-fox-box';
    const safeBgmVol = Number.isFinite(Number(musicVolume))
      ? Math.max(0, Math.min(100, Number(musicVolume)))
      : 22;
    const safeVoiceVol = Number.isFinite(Number(selectedVoice.voiceVolume))
      ? Math.max(50, Math.min(200, Number(selectedVoice.voiceVolume)))
      : 130;

    // When subtitles or voiceover are disabled, force direct concatenation without re-encoding (-c copy)
    const useDirectStreamCopy = includeSubtitles === false || includeVoiceover === false;
    const ffmpegArgs = useDirectStreamCopy
      ? [...DIRECT_STREAM_COPY_ARGS]
      : [...ULTRA_LIGHT_FFMPEG_ARGS];

    const serverRes = await fetch('/api/assemble-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: abortCtrl.signal,
      body: JSON.stringify({
        videos: serverVideosPayload,
        scriptText: voiceTrack.cleanedText,
        voiceName: effectiveGeminiVoice,
        voiceId: effectiveVoiceId,
        audioFilter,
        characterStylePrompt: selectedVoice.characterPrompt,
        voiceSpeed: effectiveVoiceSpeed,
        voiceRate: effectiveVoiceSpeed,
        voiceVolume: safeVoiceVol,
        studioBassBoost: isStudioBoostEnabled,
        language: selectedVoice.langCode || language,
        voiceAudioBase64:
          includeVoiceover !== false && !voiceTrack.voiceFileId
            ? voiceTrack.audioBase64 || ''
            : '',
        voiceFileId: includeVoiceover !== false ? voiceTrack.voiceFileId || '' : '',
        includeSubtitles: Boolean(includeSubtitles !== false),
        showSubtitles: Boolean(includeSubtitles !== false),
        includeVoiceover: Boolean(includeVoiceover !== false),
        useDirectStreamCopy,
        ffmpegArgs,
        ffmpegPreset: 'ultrafast',
        ffmpegCrf: 22,
        ffmpegThreads: 2,
        subtitleTemplateId: includeSubtitles !== false ? effectiveTemplateId : 'none',
        subtitleX: selectedSubtitle.subtitleX ?? 50,
        subtitleY: selectedSubtitle.subtitleY ?? 78,
        subtitleScale: selectedSubtitle.subtitleScale ?? 100,
        hookBannerEnabled:
          Boolean(includeSubtitles !== false) && selectedSubtitle.hookBannerEnabled !== false,
        hookBannerText:
          includeSubtitles !== false
            ? selectedSubtitle.hookBannerText || 'TRANSFORMATION TOTALE ! ⚡'
            : '',
        hookBannerBgColor: selectedSubtitle.hookBannerBgColor || 'yellow',
        subtitleStyle:
          includeSubtitles !== false
            ? {
                id: effectiveTemplateId,
                subtitleTemplateId: effectiveTemplateId,
                name: selectedSubtitle.name,
                position: selectedSubtitle.position,
                wordByWord: Boolean(
                  selectedSubtitle.wordByWord ||
                    effectiveTemplateId === 'word-by-word' ||
                    effectiveTemplateId === 'viral_1word_flash'
                ),
                subtitleX: selectedSubtitle.subtitleX ?? 50,
                subtitleY: selectedSubtitle.subtitleY ?? 78,
                subtitleScale: selectedSubtitle.subtitleScale ?? 100,
                coverCompetitorText: Boolean(selectedSubtitle.coverCompetitorText),
                hookBannerEnabled: selectedSubtitle.hookBannerEnabled !== false,
                hookBannerText: selectedSubtitle.hookBannerText || 'TRANSFORMATION TOTALE ! ⚡',
                hookBannerBgColor: selectedSubtitle.hookBannerBgColor || 'yellow',
              }
            : null,
        musicId: selectedMusic.id,
        bgmVolume: safeBgmVol,
        musicVolume: safeBgmVol,
        musicEnabled: selectedMusic.musicEnabled !== false,
        sfxEnabled: selectedMusic.sfxEnabled !== false,
        selectedSfxIds:
          selectedMusic.sfxEnabled !== false ? selectedMusic.selectedSfxIds || [] : [],
      }),
    });

    const serverData = await serverRes.json().catch(() => ({}));
    if (!serverRes.ok || !serverData.success || !serverData.videoUrl) {
      throw new Error(
        serverData.error ||
          `Échec du rendu vidéo FFmpeg (.MP4) sur le serveur (HTTP ${serverRes.status}). Vérifiez les liens TikTok fournis.`
      );
    }

    onProgress(5, 100);

    const resolvedDownloadUrl =
      serverData.downloadUrl ||
      `/api/download-final-video?file=${encodeURIComponent(
        serverData.videoUrl.split('/').pop() || ''
      )}`;

    return {
      videoUrl: serverData.videoUrl,
      downloadUrl: resolvedDownloadUrl,
      mimeType: 'video/mp4',
      fileExtension: 'mp4',
      voiceoverUrl: serverData.voiceoverUrl || voiceTrack.blobUrl,
      cleanedText: serverData.cleanedText || voiceTrack.cleanedText,
      durationSeconds: 61,
      renderedOnServer: true,
    };
  } catch (serverErr: any) {
    throw new Error(
      serverErr?.message ||
        'Erreur lors du montage FFmpeg (.MP4). Vérifiez que tous les liens sont de vraies vidéos TikTok (.mp4) et non des diaporamas photos.'
    );
  } finally {
    clearTimeout(timeoutHandle);
    if (progressInterval) clearInterval(progressInterval);
    previewActive = false;
    cleanupLoadedAssets();
  }
}

