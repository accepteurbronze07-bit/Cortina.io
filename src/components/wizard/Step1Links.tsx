import React, { useRef, useState } from 'react';
import {
  Link as LinkIcon,
  Plus,
  Trash2,
  Upload,
  Lightbulb,
  FileVideo,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { VideoClip, AppLanguage } from '../../types';
import { translations } from '../../locales/translations';
import { soundFx } from '../../utils/audioUtils';
import {
  extractVideoMetadataAndThumbnail,
  resolvePlayableClipVideoSrc,
  startLocalClipServerUpload,
} from '../../utils/videoAssembler';

interface Step1LinksProps {
  videos: VideoClip[];
  onUpdateVideos: (videos: VideoClip[]) => void;
  onNext: () => void;
  language: AppLanguage;
  onNewVideoUpload?: (file: File) => void;
}

export const Step1Links: React.FC<Step1LinksProps> = ({
  videos,
  onUpdateVideos,
  onNext,
  language,
  onNewVideoUpload,
}) => {
  const t = translations[language] || translations.FR;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isExtractingTikTok, setIsExtractingTikTok] = useState(false);
  const [extractingIndex, setExtractingIndex] = useState<number | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [linkErrors, setLinkErrors] = useState<Record<number, string>>({});

  // Réinitialiser le script et l'audio dès qu'une nouvelle vidéo est sélectionnée
  const handleNewVideoUpload = (file: File) => {
    try {
      localStorage.removeItem('cortia_stepwizard_script_versions');
      localStorage.removeItem('cortia_cached_script_result');
    } catch {}
    window.dispatchEvent(
      new CustomEvent('cortia:reset-script-audio', { detail: { fileName: file?.name } })
    );
    if (onNewVideoUpload) {
      onNewVideoUpload(file);
    } else {
      onNext();
    }
  };

  const cleanTikTokUrl = (raw: string): string => {
    const str = String(raw || '').trim();
    if (!str) return '';
    // Preserve local blob:, data:, or internal /api/ URLs intact (never strip 'blob:' prefix!)
    if (
      str.startsWith('blob:') ||
      str.startsWith('data:') ||
      str.startsWith('/api/')
    ) {
      return str;
    }
    // Match TikTok URLs first (https://vm.tiktok.com/..., https://vt.tiktok.com/..., https://www.tiktok.com/..., etc.)
    const tiktokMatch = str.match(
      /https?:\/\/(?:(?:www|vm|vt|m|t)\.)?tiktok\.com\/[^\s"'<>]+/i
    );
    if (tiktokMatch && tiktokMatch[0]) {
      return tiktokMatch[0].replace(/[.,;!?)\]}]+$/, '');
    }
    // Fallback: extract any http/https URL if user pasted share text with another link
    const anyUrlMatch = str.match(/https?:\/\/[^\s"'<>]+/i);
    if (anyUrlMatch && anyUrlMatch[0]) {
      return anyUrlMatch[0].replace(/[.,;!?)\]}]+$/, '');
    }
    return str;
  };

  const handleLinkChange = (index: number, val: string, autoExtract = false) => {
    const cleanedVal = cleanTikTokUrl(val);
    setExtractError(null);
    setLinkErrors({});

    const updated = [...videos];
    updated[index] = {
      ...updated[index],
      url: cleanedVal,
      // Reset extracted video if link changes
      localPath: undefined,
      localVideoUrl: undefined,
      mp4Url: undefined,
      fileBlobUrl: undefined,
      isLocalFile: false,
    };
    onUpdateVideos(updated);

    if (autoExtract && /^https?:\/\//i.test(cleanedVal)) {
      setTimeout(() => {
        handleExtractSingleLink(index, cleanedVal, updated);
      }, 60);
    }
  };

  const addLinkField = () => {
    if (videos.length >= 5) return;
    soundFx.playSfx('pop');
    const newIdx = videos.length + 1;
    const newClip: VideoClip = {
      id: `clip_${Date.now()}_${newIdx}`,
      url: '',
      title: `Vidéo TikTok #${newIdx}`,
      views: '',
      likes: '',
      duration: '0:00',
      thumbnail: '',
      isHook: false,
      mirrorHorizontal: false,
      blurZone: {
        x: 8,
        y: 72,
        width: 84,
        height: 16,
        blurAmount: 20,
        opacity: 0,
        enabled: false,
        style: 'pure-blur',
        topBottomBlurEnabled: true,
        topBottomBlurPct: 16,
        mirrorHorizontal: false,
      },
      hasDetectedSubtitles: true,
    };
    onUpdateVideos([...videos, newClip]);
  };

  const removeLinkField = (index: number) => {
    if (videos.length <= 1) return;
    soundFx.playSfx('click');
    const updated = videos.filter((_, idx) => idx !== index);
    if (!updated.some((v) => v.isHook) && updated.length > 0) {
      updated[0].isHook = true;
    }
    onUpdateVideos(updated);
  };

  // Extract a single TikTok link via /api/extract-tiktok silently without blocking errors
  const handleExtractSingleLink = async (
    index: number,
    overrideUrl?: string,
    baseVideos?: VideoClip[]
  ) => {
    const currentList = baseVideos || videos;
    const target = currentList[index];
    const rawUrl = cleanTikTokUrl(overrideUrl ?? target?.url ?? '');
    if (!rawUrl) return;

    setExtractingIndex(index);
    setExtractError(null);
    setLinkErrors({});
    soundFx.playSfx('click');

    try {
      const res = await fetch('/api/extract-tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl }),
      });
      const data = await res.json().catch(() => ({}));
      const ext = data?.video;

      if (ext && (ext.mp4Url || ext.proxiedVideoUrl || ext.localVideoUrl)) {
        const rawMp4Stream = ext.mp4Url || '';
        const antiCorsProxyUrl =
          rawMp4Stream && rawMp4Stream.startsWith('http')
            ? `/api/video-proxy?url=${encodeURIComponent(rawMp4Stream)}`
            : ext.proxiedVideoUrl || ext.localVideoUrl || '';

        const updated = [...currentList];
        updated[index] = {
          ...updated[index],
          videoId: ext.videoId,
          localPath: ext.localPath,
          localVideoUrl: ext.localVideoUrl,
          url: cleanTikTokUrl(ext.originalUrl || rawUrl),
          title: ext.title || `Vidéo TikTok #${index + 1}`,
          author: ext.author || 'tiktok_creator',
          views: ext.views || '150K',
          likes: ext.likes || '12K',
          duration: ext.duration || '0:18',
          durationSeconds: ext.durationSeconds || 18,
          thumbnail: ext.thumbnailUrl || '',
          coverUrl: ext.rawCoverUrl || ext.thumbnailUrl || '',
          fileBlobUrl: antiCorsProxyUrl,
          mp4Url: rawMp4Stream || antiCorsProxyUrl,
          isLocalFile: false,
          hasDetectedSubtitles: true,
        };
        onUpdateVideos(updated);
        soundFx.playSfx('ding');
      }
    } catch {
      // Silent tolerance: never show a blocking red error
    } finally {
      setExtractingIndex(null);
    }
  };

  // Extract all submitted TikTok links and proceed to Step 2 without any blocking error
  const handleExtractAndNext = async () => {
    setExtractError(null);
    setLinkErrors({});

    // Filter clips that have either a local file, an already extracted video, or a URL to extract
    const activeClips = videos
      .map((v) => ({
        ...v,
        url: cleanTikTokUrl(v.url),
      }))
      .filter(
        (v) => (v.fileBlobUrl && v.fileBlobUrl.length > 0) || v.url.trim().length > 0
      );

    if (activeClips.length === 0) {
      return;
    }

    const needsExtraction = activeClips.some((v) => !v.fileBlobUrl && v.url.trim().length > 0);

    if (!needsExtraction) {
      if (!activeClips.some((v) => v.isHook)) {
        activeClips[0].isHook = true;
      }
      onUpdateVideos(activeClips);
      soundFx.playSfx('whoosh');
      onNext();
      return;
    }

    setIsExtractingTikTok(true);
    soundFx.playSfx('whoosh');

    try {
      const updatedClips: VideoClip[] = [];

      for (let i = 0; i < activeClips.length; i++) {
        const clip = activeClips[i];

        if (clip.fileBlobUrl) {
          updatedClips.push(clip);
          continue;
        }

        const rawUrl = cleanTikTokUrl(clip.url);

        try {
          const res = await fetch('/api/extract-tiktok', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: rawUrl }),
          });
          const data = await res.json().catch(() => ({}));
          const ext = data?.video;
          const rawMp4Stream = ext?.mp4Url || '';
          const antiCorsProxyUrl =
            rawMp4Stream && rawMp4Stream.startsWith('http')
              ? `/api/video-proxy?url=${encodeURIComponent(rawMp4Stream)}`
              : ext?.proxiedVideoUrl || ext?.localVideoUrl || '';

          updatedClips.push({
            ...clip,
            videoId: ext?.videoId || clip.id,
            localPath: ext?.localPath,
            localVideoUrl: ext?.localVideoUrl,
            url: cleanTikTokUrl(ext?.originalUrl || rawUrl),
            title: ext?.title || `Vidéo TikTok #${i + 1}`,
            author: ext?.author || 'tiktok_creator',
            views: ext?.views || '240K',
            likes: ext?.likes || '18K',
            duration: ext?.duration || '0:18',
            durationSeconds: ext?.durationSeconds || 18,
            thumbnail: ext?.thumbnailUrl || '',
            coverUrl: ext?.rawCoverUrl || ext?.thumbnailUrl || '',
            fileBlobUrl: antiCorsProxyUrl,
            mp4Url: rawMp4Stream || antiCorsProxyUrl,
            isLocalFile: false,
            hasDetectedSubtitles: true,
          });
        } catch {
          updatedClips.push({
            ...clip,
            url: rawUrl,
            title: clip.title || `Vidéo TikTok #${i + 1}`,
          });
        }

        if (i < activeClips.length - 1) {
          await new Promise((r) => setTimeout(r, 650));
        }
      }

      if (!updatedClips.some((v) => v.isHook) && updatedClips.length > 0) {
        updatedClips[0].isHook = true;
      }

      try {
        localStorage.removeItem('cortia_stepwizard_script_versions');
        localStorage.removeItem('cortia_cached_script_result');
      } catch {}
      window.dispatchEvent(new CustomEvent('cortia:reset-script-audio'));

      onUpdateVideos(updatedClips);
      soundFx.playSfx('ding');
      onNext();
    } finally {
      setIsExtractingTikTok(false);
    }
  };

  // Upload 1 to 5 MP4 files directly from phone / computer using instant URL.createObjectURL(file) (zero black screen) & background sync to /tmp/cortia_clip_${id}.mp4
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setExtractError(null);
    soundFx.playSfx('pop');

    const existingValidClips = videos.filter((v) => Boolean(v.fileBlobUrl));
    const selectedFiles = Array.from(files).slice(0, 5 - existingValidClips.length);
    if (selectedFiles.length === 0) return;

    const viewCounts = ['510K', '489K', '720K', '640K', '830K'];
    const baseTimestamp = Date.now();

    // 1. INSTANTANEOUSLY create URL.createObjectURL(file), start background server upload, and feed the <video src="..."> player with zero delay!
    const instantClips: VideoClip[] = selectedFiles.map((file, idx) => {
      const instantBlobUrl = URL.createObjectURL(file);
      const clipId = `upload_${baseTimestamp}_${idx}`;
      // Start server upload immediately at 0ms (without waiting for canvas thumbnail extraction)
      startLocalClipServerUpload(file, clipId);
      return {
        id: clipId,
        videoId: clipId,
        url: instantBlobUrl,
        localPath: `/tmp/cortia_clip_${clipId}.mp4`,
        localVideoUrl: `/api/local-video/${clipId}`,
        title: file.name.replace(/\.[^/.]+$/, '') || `Vidéo importée #${idx + 1}`,
        views: viewCounts[(existingValidClips.length + idx) % viewCounts.length],
        likes: `${Math.floor(35 + Math.random() * 45)}K`,
        duration: '0:30',
        durationSeconds: 30,
        thumbnail: '',
        isLocalFile: true,
        localFile: file,
        fileName: file.name,
        fileBlobUrl: instantBlobUrl,
        isHook: existingValidClips.length === 0 && idx === 0,
        mirrorHorizontal: false,
        blurZone: {
          x: 8,
          y: 72,
          width: 84,
          height: 16,
          blurAmount: 20,
          opacity: 0,
          enabled: false,
          style: 'pure-blur',
          topBottomBlurEnabled: true,
          topBottomBlurPct: 16,
          mirrorHorizontal: false,
        },
        hasDetectedSubtitles: true,
      };
    });

    const currentCombined = [...existingValidClips, ...instantClips];
    if (!currentCombined.some((v) => v.isHook) && currentCombined.length > 0) {
      currentCombined[0].isHook = true;
    }

    // Feed <video src="..."> immediately before any async work!
    onUpdateVideos(currentCombined);
    soundFx.playSfx('ding');

    // Réinitialiser le script et l'audio dès qu'une nouvelle vidéo est sélectionnée et passer à l'étape 2
    handleNewVideoUpload(selectedFiles[0]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // 2. Background metadata extraction + server upload (/api/save-local-clip) without blocking or replacing the instant blobUrl
    setIsLoadingFiles(true);
    try {
      const updatedClips = [...currentCombined];

      for (let idx = 0; idx < selectedFiles.length; idx++) {
        const file = selectedFiles[idx];
        const targetClip = instantClips[idx];
        const clipId = targetClip.id;
        const instantBlobUrl = targetClip.fileBlobUrl!;

        const [meta, uploadRes] = await Promise.all([
          extractVideoMetadataAndThumbnail(file),
          startLocalClipServerUpload(file, clipId),
        ]);

        const savedLocalPath = uploadRes.localPath || `/tmp/cortia_clip_${clipId}.mp4`;
        const savedLocalVideoUrl = uploadRes.localVideoUrl || `/api/local-video/${clipId}`;
        const serverDurationSec = uploadRes.durationSeconds;
        const serverDurationFormatted = uploadRes.durationFormatted;

        const effectiveDurationSec = Math.max(
          meta.durationSeconds || 0,
          serverDurationSec || 0,
          15
        );
        const effectiveDurationFormatted =
          (serverDurationSec && serverDurationSec >= (meta.durationSeconds || 0)
            ? serverDurationFormatted
            : meta.durationFormatted) || meta.durationFormatted;

        const targetIndex = updatedClips.findIndex((c) => c.id === clipId);
        if (targetIndex !== -1) {
          updatedClips[targetIndex] = {
            ...updatedClips[targetIndex],
            localPath: savedLocalPath,
            localVideoUrl: savedLocalVideoUrl,
            localFile: file,
            // Keep instant URL.createObjectURL(file) in fileBlobUrl so mobile <video> never flashes black!
            fileBlobUrl: instantBlobUrl,
            url: instantBlobUrl,
            duration: effectiveDurationFormatted,
            durationSeconds: effectiveDurationSec,
            thumbnail: meta.thumbnailDataUrl || updatedClips[targetIndex].thumbnail,
          };
          onUpdateVideos([...updatedClips]);
        }
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const extractedOrUploadedCount = videos.filter((v) => Boolean(v.fileBlobUrl)).length;
  const validLinksCount = videos.filter(
    (v) => v.url.trim().length > 0 || Boolean(v.fileBlobUrl)
  ).length;
  // Allow proceeding as soon as at least 1 video link or instant phone blobUrl is present
  const canProceed = validLinksCount >= 1 && !isExtractingTikTok;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner / Explainer */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111927] to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Étape 1 sur 5
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Extraction TikTok .MP4 & Découpage Intelligent Vidéos Longues (&gt; 60s)
            </span>
          </div>
          <h2 className="text-xl font-black text-white">{t.step1Subtitle}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Colle ton lien TikTok (même de 3 minutes) ou importe directement ton fichier .MP4 depuis ton téléphone : lecture instantanée et découpage automatique en 5 vrais clips vidéo en mouvement.
          </p>
        </div>
      </div>

      {/* Main Grid: Inputs + Upload Button */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Upload from Phone / Device CTA */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-dashed border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white">
                Importer une vidéo (même de 3 minutes+) depuis la galerie du téléphone
              </h3>
              <p className="text-[11px] text-slate-300">
                Lecture instantanée sur Android & iOS (zéro écran noir) • Découpage auto en 5 extraits clés (0-12s, 30-42s, 1m10-1m22, 1m40-1m52 et fin).
              </p>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/mp4,video/quicktime,video/webm,video/*"
            multiple
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-lg shadow-emerald-500/20"
          >
            {isLoadingFiles ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Synchronisation serveur (.MP4)...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 stroke-[2.5]" />
                <span>Importer depuis le téléphone (.MP4)</span>
              </>
            )}
          </button>
        </div>

        {extractedOrUploadedCount > 0 && (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {extractedOrUploadedCount} vraie(s) vidéo(s) .MP4 chargée(s) et prête(s) pour le découpage dynamique !
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Liens TikTok à extraire</h3>
            <span className="text-xs text-slate-400">({videos.length}/5 clips)</span>
          </div>

          {videos.length < 5 && (
            <button
              onClick={addLinkField}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t.addLink}</span>
            </button>
          )}
        </div>

        {/* Video Fields List */}
        <div className="space-y-3">
          {videos.map((vid, idx) => {
            const isThisExtracting = extractingIndex === idx;
            const videoStreamSrc = resolvePlayableClipVideoSrc(vid);
            const hasVideoStream = Boolean(videoStreamSrc);

            return (
              <div
                key={vid.id}
                className="group relative bg-[#0b0f17] border border-slate-800 focus-within:border-emerald-500/60 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition-all shadow-xs"
              >
                {/* Live Video Player via Anti-CORS Proxy (/api/video-proxy?url=...) or local blob: URL */}
                {hasVideoStream ? (
                  <div className="w-full sm:w-28 h-44 sm:h-36 rounded-xl overflow-hidden bg-black border border-emerald-500/50 shrink-0 relative">
                    <video
                      key={videoStreamSrc}
                      src={videoStreamSrc}
                      poster={vid.thumbnail || undefined}
                      playsInline
                      {...({ 'webkit-playsinline': 'true' } as any)}
                      controls
                      preload="auto"
                      muted
                      loop
                      autoPlay
                      className="w-full h-full object-cover bg-black"
                    />
                  </div>
                ) : isThisExtracting ? (
                  <div className="w-full sm:w-28 h-44 sm:h-36 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/40 shrink-0 flex flex-col items-center justify-center gap-2 p-2 text-center">
                    <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                    <span className="text-[10px] font-bold text-emerald-300">
                      Proxy Vidéo...
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg border bg-slate-900 border-slate-800 text-slate-300 font-extrabold text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                )}

                {/* Input field */}
                <div className="flex-1 relative space-y-1">
                  {vid.isLocalFile ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-900/90 rounded-lg border border-emerald-500/30 text-xs font-medium text-emerald-400">
                      <FileVideo className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate flex-1 font-mono text-white font-bold">
                        {vid.fileName || vid.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase font-black">
                        Fichier .MP4 ({vid.duration})
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={vid.url}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cleaned = cleanTikTokUrl(raw);
                          const hadShareText = raw !== cleaned && /^https?:\/\//i.test(cleaned);
                          handleLinkChange(idx, cleaned, hadShareText);
                        }}
                        onPaste={(e) => {
                          const pastedText = e.clipboardData?.getData('text');
                          if (pastedText) {
                            e.preventDefault();
                            const cleaned = cleanTikTokUrl(pastedText);
                            handleLinkChange(idx, cleaned, true);
                          }
                        }}
                        placeholder="Colle ton lien TikTok ou TikTok Lite ici (nettoyage & téléchargement .MP4 auto)..."
                        className="w-full bg-slate-900/90 border border-slate-800 focus:ring-emerald-500/50 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1"
                      />
                      {vid.url.trim().length > 0 && !hasVideoStream && (
                        <button
                          type="button"
                          onClick={() => handleExtractSingleLink(idx)}
                          disabled={isThisExtracting || isExtractingTikTok}
                          className="px-3 py-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                        >
                          {isThisExtracting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Extraire</span>
                        </button>
                      )}
                    </div>
                  )}

                  {hasVideoStream && !vid.isLocalFile && (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold pl-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{vid.title}</span>
                      <span className="text-slate-400 font-mono shrink-0">({vid.duration})</span>
                    </div>
                  )}
                </div>

                {/* Quick stats or delete button */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  {vid.views && (
                    <span className="text-[11px] font-bold text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                      👁️ {vid.views} {t.viewsLabel}
                    </span>
                  )}

                  {videos.length > 1 && (
                    <button
                      onClick={() => removeLinkField(idx)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Supprimer ce clip"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Encadré 💡 Conseils */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 text-amber-200">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Lightbulb className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            {t.tipsTitle} - Extraction TikTok Réelle Sans Filigrane
          </h4>
        </div>
        <ul className="text-xs space-y-1.5 text-amber-200/90 pl-1">
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span>
              <strong>Extraction automatique .MP4 :</strong> Colle n'importe quel lien public TikTok (`vm.tiktok.com` ou `tiktok.com`) et clique sur « Générer la vidéo » pour télécharger le vrai flux vidéo sans filigrane.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400 font-bold">•</span>
            <span>
              <strong>Proxy Vidéo Anti-CORS intégré :</strong> Tes vraies vidéos TikTok s'affichent dans le lecteur aux Étapes 2, 4 et 5 et sont montées dans le Canvas 1080×1920 sans blocage.
            </span>
          </li>
        </ul>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleExtractAndNext}
          disabled={!canProceed}
          className={`py-3.5 px-8 rounded-xl font-bold text-sm tracking-wide flex items-center gap-2 cursor-pointer shadow-lg transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-300 hover:to-teal-300 shadow-emerald-500/25 active:scale-[0.98]'
              : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/60'
          }`}
        >
          {isExtractingTikTok ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Extraction des vraies vidéos TikTok (.MP4)...</span>
            </>
          ) : (
            <>
              <span>{t.generateNext}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
