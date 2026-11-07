import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Download,
  Play,
  Pause,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  VolumeX,
  Film,
  Flame,
  Mic,
  Tv,
  Layers,
  Zap,
  Gauge,
  Move,
  ZoomIn,
  Plus,
  Minus,
  AlertCircle,
  History,
  RotateCcw,
  Bookmark,
  Undo2,
} from 'lucide-react';
import {
  VideoClip,
  VoiceOption,
  SubtitleStyle,
  BackgroundMusic,
  ScriptGenerationResult,
  NarrativeScriptStyle,
  NarrativeScenarioCode,
  AppLanguage,
  CompletedCreation,
  ScriptVersion,
  ScriptVersionSource,
} from '../../types';
import { translations } from '../../locales/translations';
import { ScriptVersionHistoryModal } from './ScriptVersionHistoryModal';
import {
  requestViralScript,
  requestScriptOptimization,
  requestScriptProofread,
} from '../../services/geminiService';
import { soundFx, cleanScriptForSpeech } from '../../utils/audioUtils';
import {
  assembleFinalVideoOnCanvas,
  AssembledVideoResult,
  triggerBlobDownload,
  computeSmartSubtitleAvoidance,
  resolvePlayableClipVideoSrc,
  prepareClipsForServerAssembly,
} from '../../utils/videoAssembler';
import { saveDraftToIndexedDb, syncOfflineDraftsWithServer } from '../../utils/indexedDbDrafts';
import { toast } from '../toast/ToastContext';

export function buildViralScriptPrompt(params: {
  videoDescription: string;
  niche: string;
  language: string; // 'es', 'fr', 'en', 'de', etc.
  ctaGoal: 'comments' | 'saves' | 'followers';
}) {
  const languageNames: Record<string, string> = {
    es: 'Español nativo (España / Latinoamérica)',
    fr: 'Français parlé naturel',
    en: 'Natural English (US/UK)',
    de: 'Natürliches Deutsch',
    zh: '中文 (Mandarin / 普通话)',
    ko: '한국어 (Korean)',
    ja: '日本語 (Japanese)',
    pt: 'Português natural',
  };

  const targetLang = languageNames[params.language] || 'Español nativo';

  return `
Tu es un maître de l'algorithme TikTok spécialisé dans la rétention à plus de 70% sur des vidéos de 61 secondes.

MISSION :
À partir de la description visuelle ci-dessous, rédige un script continu en ${targetLang} structuré avec des re-hooks chronométrés et un appel à l'action final.

DESCRIPTION DE LA VIDÉO :
"${params.videoDescription}"

CADENCE OBLIGATOIRE (CHRONOMÉTRÉE SUR 61 SECONDES) :
1. DE 0 À 3 SECONDES (LE HOOK) :
   - Commence par un choc visuel ou une affirmation provocante qui brise le scroll.
2. À ~15 SECONDES (LE RE-HOOK #1 - RUPTURE DU DÉCROCHAGE) :
   - Insère une phrase de relance ("Mais attendez de voir ce qu'on a découvert...", "Pero espera a ver...").
3. À ~30 SECONDES (LE RE-HOOK #2 - ÉLÉMENT IMPRÉVU) :
   - Insère une complication ou une tension inattendue pour retenir ceux qui s'ennuient à mi-chemin.
4. À ~45 SECONDES (LE RE-HOOK #3 - PRÉPARATION AU CLIMAX) :
   - Fais monter la curiosité sur la transformation finale ("Le résultat dans 10 secondes est juste fou...", "Lo que pasó al final...").
5. À ~58-61 SECONDES (L'APPEL À L'ACTION / CTA) :
   - Termine par un CTA ultra-naturel incitant aux commentaires ou à la sauvegarde (débat sur la note de 1 à 10, avis, ou sauvegarde).

RÈGLE DE DÉBIT ET FLUIDITÉ ORALE (ZÉRO TEMPS MORT) :
- Écris le script sous forme de flux parlé continu, vif et dynamique.
- Relie les idées avec des connecteurs fluides ("et", "mais", "alors que", "pendant que", "c'est là que" en français, ou leurs équivalents idiomatiques selon la langue cible : "y", "pero", "mientras que", "en ese momento" en espagnol / "and", "but", "while", "that's when" en anglais, etc.) plutôt que de couper par des phrases courtes et hachées.
- Privilégie les virgules plutôt que les points à répétition pour forcer le synthétiseur vocal à garder le rythme sans marquer de longues pauses.

RÈGLES STRICTES DE FORMAT :
- Longueur totale : entre 1 450 et 1 550 caractères (soit 165 à 180 mots) pour garantir une durée parlée de 61 à 64 secondes.
- Texte brut continu uniquement : PAS de mentions "(00:15)", PAS de titres "(Re-Hook)", PAS de parenthèses de mise en scène.
- La voix off doit lire le texte d'une seule traite de façon fluide et naturelle.
`.trim();
}

const STEP5_VOICE_SPEED_PRESETS: Array<{ value: number; label: string; badge?: string }> = [
  { value: 1.0, label: '1.0x' },
  { value: 1.15, label: '1.15x' },
  { value: 1.2, label: '1.20x', badge: 'Défaut' },
  { value: 1.25, label: '1.25x TikTok Viral', badge: '🔥' },
  { value: 1.4, label: '1.4x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2.0, label: '2.0x' },
];

const STEP5_VOICE_VOLUME_PRESETS: Array<{ value: number; label: string; badge?: string }> = [
  { value: 80, label: '80% (Voix douce)' },
  { value: 100, label: '100% (Standard)' },
  { value: 130, label: '130% (Voix forte & claire)', badge: 'Défaut' },
  { value: 160, label: '160% (Boost TikTok - Recommandé)', badge: '🔥' },
  { value: 200, label: '200% (Maximum)' },
];

export const SCENARIO_VARIATION_OPTIONS: Array<{
  code: NarrativeScenarioCode;
  label: string;
  shortTitle: string;
  description: string;
}> = [
  {
    code: 'A',
    label: 'Scénario A',
    shortTitle: 'Urgence & Événement (24h)',
    description: "Mariage / fête demain et l'eau a tourné au vinaigre, sauvetage en 24h chrono.",
  },
  {
    code: 'B',
    label: 'Scénario B',
    shortTitle: 'Erreur & Catastrophe Chimique',
    description: 'Mélange de deux produits incompatibles ayant créé un marais toxique.',
  },
  {
    code: 'C',
    label: 'Scénario C',
    shortTitle: 'Secret du Fond',
    description: 'Objet de valeur ou anomalie engloutie que le propriétaire cherche au fond.',
  },
  {
    code: 'D',
    label: 'Scénario D',
    shortTitle: 'Le Défi Impossible',
    description: '3 entreprises ont refusé le chantier en disant que c’était mort, on relève le défi.',
  },
  {
    code: 'E',
    label: 'Scénario E',
    shortTitle: 'Transformation & Valeur',
    description: 'Maison abandonnée qui reprend vie, faisant bondir la valeur de la propriété.',
  },
];

export const NARRATIVE_STYLE_OPTIONS: Array<{
  id: NarrativeScriptStyle;
  code: string;
  title: string;
  badge: string;
  subtitle: string;
  structureHint: string;
}> = [
  {
    id: 'financial_shock',
    code: 'Style A',
    title: 'Financier & Choc (3M Vues • 2,03$ RPM)',
    badge: '💰 3M Vues',
    subtitle: "Ex: Budget d'urgence / Sauvetage choc + Déclencheur d'abonnement + Défi commentaire",
    structureHint:
      '[00:00-00:08] Hook choc inédit • [00:08-00:18] Diagnostic critique • [00:18-00:35] Question interactive • [00:35-00:59] Révélation & débat',
  },
  {
    id: 'mystery_bottom',
    code: 'Style B',
    title: 'Mystère & Secret Caché / Secret au Fond (17.8M Vues)',
    badge: '🔥 17.8M Vues',
    subtitle:
      'Histoire 100 % unique à chaque génération (rotation automatique Scénarios A à E, vocabulaire et CTA variés)',
    structureHint:
      '[00:00-00:08] Hook inédit A→E • [00:08-00:20] Tension sur place • [00:20-00:35] Question d’interaction • [00:35-00:50] Protocole choc • [00:50-00:59] Révélation & débat',
  },
  {
    id: 'unexpected_discovery',
    code: 'Style C',
    title: 'Découverte Inattendue & Dégâts cachés sous le liner',
    badge: '⚡ Suspense',
    subtitle:
      'Ex: Anomalie inquiétante découverte en cours de chantier, risque structurel et sauvetage millimétrique',
    structureHint:
      '[00:00-00:08] Découverte choc • [00:08-00:20] Risque structurel • [00:20-00:35] Question interactive • [00:35-00:50] Réparation chirurgicale • [00:50-00:59] Révélation finale',
  },
];

interface Step5ScriptViralProps {
  videos: VideoClip[];
  selectedLanguage: string;
  onLanguageChange?: (lang: string) => void;
  selectedVoice: VoiceOption;
  onVoiceChange?: (voice: VoiceOption) => void;
  selectedSubtitle: SubtitleStyle;
  onSubtitleChange?: (sub: SubtitleStyle) => void;
  selectedMusic: BackgroundMusic;
  onMusicChange?: (music: BackgroundMusic) => void;
  musicVolume: number;
  onMusicVolumeChange?: (vol: number) => void;
  onPrev: () => void;
  onCreationComplete: (creation: CompletedCreation) => void;
  appLanguage: AppLanguage;
  userCredits: number;
  onDeductCredit: () => void;
  onRequireUpgrade?: () => void;
  videoFile?: File | null;
  script?: string;
  setScript?: (script: string) => void;
  audioUrl?: string | null;
  setAudioUrl?: (url: string | null) => void;
}

export const Step5ScriptViral: React.FC<Step5ScriptViralProps> = ({
  videos,
  selectedLanguage,
  onLanguageChange,
  selectedVoice,
  onVoiceChange,
  selectedSubtitle,
  onSubtitleChange,
  selectedMusic,
  onMusicChange,
  musicVolume,
  onMusicVolumeChange,
  onPrev,
  onCreationComplete,
  appLanguage,
  userCredits,
  onDeductCredit,
  onRequireUpgrade,
  setScript,
  setAudioUrl,
}) => {
  const t = translations[appLanguage] || translations.FR;
  const [hasDeductedCreditForCurrentVideo, setHasDeductedCreditForCurrentVideo] = useState(false);

  // Automatic language detection from Step 3 voice/language selection
  const effectiveScriptLanguage = (() => {
    const code = (selectedVoice?.langCode || selectedLanguage || 'fr').toLowerCase();
    if (code.startsWith('en')) return 'en';
    if (code.startsWith('es')) return 'es';
    if (code.startsWith('de')) return 'de';
    if (code.startsWith('zh')) return 'zh';
    if (code.startsWith('ko')) return 'ko';
    if (code.startsWith('ja')) return 'ja';
    if (code.startsWith('pt')) return 'pt';
    return 'fr';
  })();

  // Mandatory Visual Analysis description (Zero Hallucination)
  const [visualDescription, setVisualDescription] = useState<string>('');

  // Background Music Volume state (0% to 100%, 0% = Mute)
  const [localBgmVolume, setLocalBgmVolume] = useState<number>(
    Number.isFinite(Number(musicVolume)) ? Math.max(0, Math.min(100, Number(musicVolume))) : 22
  );
  useEffect(() => {
    if (Number.isFinite(Number(musicVolume))) {
      setLocalBgmVolume(Math.max(0, Math.min(100, Number(musicVolume))));
    }
  }, [musicVolume]);

  const bgmVolume = Number.isFinite(Number(localBgmVolume))
    ? Math.max(0, Math.min(100, Number(localBgmVolume)))
    : 22;

  // Voiceover Speed state (1.0x to 2.0x, default 1.20x TikTok dynamic pace)
  const [localVoiceSpeed, setLocalVoiceSpeed] = useState<number>(
    Math.max(1.0, Math.min(2.0, Number(selectedVoice.rate) || 1.2))
  );
  const [generatedAtSpeed, setGeneratedAtSpeed] = useState<number>(
    Math.max(1.0, Math.min(2.0, Number(selectedVoice.rate) || 1.2))
  );
  const currentVoiceSpeed = Math.max(
    1.0,
    Math.min(2.0, Number(selectedVoice.rate) || localVoiceSpeed || 1.2)
  );

  // Voiceover Volume state (50% to 200%, default 130% "Voix forte & claire")
  const [localVoiceVolume, setLocalVoiceVolume] = useState<number>(
    Number.isFinite(Number(selectedVoice.voiceVolume))
      ? Math.max(50, Math.min(200, Math.round(Number(selectedVoice.voiceVolume))))
      : 130
  );
  useEffect(() => {
    if (Number.isFinite(Number(selectedVoice.voiceVolume))) {
      setLocalVoiceVolume(Math.max(50, Math.min(200, Math.round(Number(selectedVoice.voiceVolume)))));
    }
  }, [selectedVoice.voiceVolume]);

  const currentVoiceVolume = Number.isFinite(Number(localVoiceVolume))
    ? Math.max(50, Math.min(200, Math.round(Number(localVoiceVolume))))
    : 130;

  // Relative playbackRate on client <audio> elements (since server FFmpeg already applied atempo=${generatedAtSpeed})
  const getRelativePlaybackRate = () => {
    const base = Math.max(0.8, Math.min(2.0, generatedAtSpeed || 1.2));
    return Math.max(0.5, Math.min(2.0, currentVoiceSpeed / base));
  };

  // Script State & Narrative Style Selector + 5-Scenario Unique Rotation (A, B, C, D, E)
  const [narrativeStyle, setNarrativeStyle] = useState<NarrativeScriptStyle>('mystery_bottom');
  const [selectedScenarioCode, setSelectedScenarioCode] = useState<NarrativeScenarioCode | ''>('');
  const previousHooksRef = useRef<string[]>([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [scriptResult, setScriptResult] = useState<ScriptGenerationResult | null>(() => {
    try {
      const savedVersions = localStorage.getItem('cortia_stepwizard_script_versions');
      if (savedVersions) {
        const parsed: ScriptVersion[] = JSON.parse(savedVersions);
        if (parsed.length > 0 && parsed[0]?.fullScript) {
          const latest = parsed[0];
          return {
            hookText: latest.hookText,
            fullScript: latest.fullScript,
            estimatedViralityScore: latest.estimatedViralityScore,
            hookBannerTexts: latest.hookBannerTexts || (latest.hookText ? [latest.hookText] : []),
            suggestedTitles: latest.hookText ? [latest.hookText] : [],
            description: latest.description || '',
            hashtags: latest.hashtags || [],
            estimatedDuration: '01:00',
            narrativeStyle: latest.narrativeStyle,
            scenarioCode: latest.scenarioCode,
            scenarioTitle: latest.scenarioTitle,
          };
        }
      }
    } catch {}
    return null;
  });
  const [optimizationsLeft, setOptimizationsLeft] = useState(3);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [optimizationFocus, setOptimizationFocus] = useState<'hook' | 'pacing' | 'cta' | 'story'>(
    'hook'
  );

  // Script Version History state (saved in localStorage for cross-step persistence)
  const [scriptVersions, setScriptVersions] = useState<ScriptVersion[]>(() => {
    try {
      const saved = localStorage.getItem('cortia_stepwizard_script_versions');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error reading script versions from localStorage:', e);
    }
    return [];
  });
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [lastRestoredBanner, setLastRestoredBanner] = useState<string | null>(null);

  // Sync scriptVersions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cortia_stepwizard_script_versions', JSON.stringify(scriptVersions));
    } catch (e) {
      console.warn('Error saving script versions to localStorage:', e);
    }
  }, [scriptVersions]);

  // Helper to record a new script version
  const recordScriptVersion = (
    res: {
      hookText?: string;
      fullScript: string;
      estimatedViralityScore?: number;
      narrativeStyle?: NarrativeScriptStyle;
      scenarioCode?: NarrativeScenarioCode;
      scenarioTitle?: string;
      hookBannerTexts?: string[];
      hashtags?: string[];
      description?: string;
    },
    source: ScriptVersionSource,
    sourceLabel: string
  ) => {
    if (!res.fullScript || !res.fullScript.trim()) return;
    const now = new Date();
    const formattedDate = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const wordCount = res.fullScript.split(/\s+/).filter(Boolean).length;

    setScriptVersions((prev) => {
      // Avoid duplicate consecutive identical scripts from the same source
      if (prev.length > 0 && prev[0].fullScript.trim() === res.fullScript.trim() && prev[0].source === source) {
        return prev;
      }
      const nextVersionNumber = prev.length > 0 ? Math.max(...prev.map((v) => v.versionNumber)) + 1 : 1;
      const newVersion: ScriptVersion = {
        id: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        versionNumber: nextVersionNumber,
        timestamp: Date.now(),
        formattedDate,
        source,
        sourceLabel,
        hookText: res.hookText || '',
        fullScript: res.fullScript,
        wordCount,
        estimatedViralityScore: res.estimatedViralityScore ?? 92,
        narrativeStyle: res.narrativeStyle || narrativeStyle,
        scenarioCode: res.scenarioCode || (selectedScenarioCode ? (selectedScenarioCode as NarrativeScenarioCode) : undefined),
        scenarioTitle: res.scenarioTitle,
        hookBannerTexts: res.hookBannerTexts,
        hashtags: res.hashtags,
        description: res.description,
      };
      return [newVersion, ...prev].slice(0, 30);
    });
  };

  // Listen to Ctrl+S global event to save script into IndexedDB
  useEffect(() => {
    const handleGlobalSave = async () => {
      if (scriptResult?.fullScript) {
        try {
          await saveDraftToIndexedDb({
            topic: scriptResult.hookText || 'Script Montage Cortia',
            narrativeStyle,
            fullScript: scriptResult.fullScript,
            hashtags: scriptResult.hashtags || [],
          });
          toast.success('Script sauvegardé dans vos brouillons hors-ligne (IndexedDB) !', 'Script Sauvegardé');
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            syncOfflineDraftsWithServer().catch(() => {});
          }
        } catch (e) {
          console.warn('Auto save to IndexedDB error:', e);
          toast.error('Erreur lors de la sauvegarde du script en local.', 'Erreur Sauvegarde');
        }
      }
    };
    window.addEventListener('cortia:save-script', handleGlobalSave);
    return () => window.removeEventListener('cortia:save-script', handleGlobalSave);
  }, [scriptResult, narrativeStyle]);

  // Voiceover preview & auto-generated voiceover state
  const [isGeneratingVoicePreview, setIsGeneratingVoicePreview] = useState(false);
  const [voicePreviewUrl, setVoicePreviewUrl] = useState<string | null>(null);
  const [generatedVoiceId, setGeneratedVoiceId] = useState<string>(
    selectedVoice.id === 'voice_none' ? 'fr_leader_energique' : selectedVoice.id
  );
  const isStudioBassBoost = selectedVoice.studioBassBoost !== false;
  const [generatedStudioBoost, setGeneratedStudioBoost] = useState<boolean>(
    selectedVoice.studioBassBoost !== false
  );
  const [autoVoiceTrack, setAutoVoiceTrack] = useState<{
    blobUrl: string;
    audioBase64?: string;
    voiceFileId?: string;
    voiceId?: string;
    voiceSpeed?: number;
    studioBassBoost?: boolean;
    cleanedText: string;
    durationSeconds: number;
  } | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingVoiceAudio, setIsPlayingVoiceAudio] = useState(false);

  // Real Server FFmpeg (.MP4) + Canvas 9:16 Video Rendering State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderStepIndex, setRenderStepIndex] = useState(-1);
  const [renderProgressPct, setRenderProgressPct] = useState(0);
  const [assembledVideo, setAssembledVideo] = useState<AssembledVideoResult | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);

  // Video Preview Player State (Default to real server .MP4 <video controls> when rendered)
  const [previewMode, setPreviewMode] = useState<'interactive' | 'mp4'>('mp4');
  const [isInteractivePlaying, setIsInteractivePlaying] = useState(false);
  const [isInteractiveMuted, setIsInteractiveMuted] = useState(false);
  const [interactiveElapsedSec, setInteractiveElapsedSec] = useState(0);
  const interactiveVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const interactiveVoiceRef = audioRef;
  const interactiveBgmRef = useRef<HTMLAudioElement | null>(null);
  const [bgmWavUrl, setBgmWavUrl] = useState<string | null>(null);
  const step5PlayerBoxRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingSubStep5, setIsDraggingSubStep5] = useState(false);
  const step5PinchStartDistRef = useRef<number | null>(null);
  const step5PinchStartScaleRef = useRef<number>(100);

  // Modular Export Options (CapCut & Custom Export)
  // 1. Inclure les sous-titres sur la vidéo (Oui / Non)
  // 2. Inclure la voix-off (Oui / Non)
  const [includeSubtitles, setIncludeSubtitles] = useState<boolean>(true);
  const [includeVoiceover, setIncludeVoiceover] = useState<boolean>(true);

  const subX = Math.max(10, Math.min(90, Number(selectedSubtitle.subtitleX) || 50));
  const subY = Math.max(
    10,
    Math.min(
      90,
      Number(selectedSubtitle.subtitleY) ||
        (selectedSubtitle.position === 'top'
          ? 22
          : selectedSubtitle.position === 'center'
          ? 50
          : 78)
    )
  );
  const subScale = Math.max(50, Math.min(200, Number(selectedSubtitle.subtitleScale) || 100));
  const subCoverCompetitor = Boolean(selectedSubtitle.coverCompetitorText);
  const hookBannerEnabled = selectedSubtitle.hookBannerEnabled !== false;
  const hookBannerText =
    selectedSubtitle.hookBannerText !== undefined
      ? selectedSubtitle.hookBannerText
      : 'TRANSFORMATION TOTALE ! ⚡';
  const hookBannerBgColor: 'yellow' | 'red' =
    selectedSubtitle.hookBannerBgColor === 'red' ? 'red' : 'yellow';

  const primaryMaskZone =
    videos.find((v) => v.blurZone?.enabled)?.blurZone || videos[0]?.blurZone;
  const smartStep5Avoidance = computeSmartSubtitleAvoidance(
    selectedSubtitle.subtitleY,
    selectedSubtitle.position || 'bottom',
    primaryMaskZone,
    subCoverCompetitor
  );
  const effectiveSubY = smartStep5Avoidance.effectiveY;
  const effectiveCoverCompetitor = Boolean(
    subCoverCompetitor || smartStep5Avoidance.autoContrastBox
  );

  const updateStep5Subtitle = (patch: Partial<SubtitleStyle>) => {
    if (!onSubtitleChange) return;
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
    // Mark server render stale so next .MP4 download burns the new subtitle position/scale
    if (assembledVideo?.renderedOnServer) {
      setAssembledVideo((prev) => (prev ? { ...prev, renderedOnServer: false } : null));
    }
  };

  const isMusicEnabled = selectedMusic.musicEnabled !== false;
  const isSfxEnabled =
    selectedMusic.sfxEnabled !== false &&
    Array.isArray(selectedMusic.selectedSfxIds) &&
    selectedMusic.selectedSfxIds.length > 0;

  const [lastMp4BlobUrl, setLastMp4BlobUrl] = useState<string | null>(null);
  const lastMp4BlobRef = useRef<Blob | null>(null);
  const [lastDirectDownloadUrl, setLastDirectDownloadUrl] = useState<string | null>(null);
  const [isAutoAssemblingMp4, setIsAutoAssemblingMp4] = useState(false);

  const isMp4Ready = Boolean(lastMp4BlobUrl || assembledVideo?.videoUrl);
  const effectivePreviewMode: 'mp4' | 'interactive' =
    previewMode === 'mp4' && isMp4Ready ? 'mp4' : 'interactive';

  const handleToggleIncludeSubtitles = (nextVal: boolean) => {
    soundFx.playSfx('click');
    const boolVal = Boolean(nextVal);
    setIncludeSubtitles(boolVal);
    setLastMp4BlobUrl(null);
    lastMp4BlobRef.current = null;
    setLastDirectDownloadUrl(null);
    // Clear any previously rendered MP4 that had subtitles burned in so the player shows the clean raw video stream immediately
    setAssembledVideo(null);
    setPreviewMode('interactive');
    if (scriptResult?.fullScript) {
      triggerBackgroundServerMp4Render(
        scriptResult.fullScript,
        autoVoiceTrack,
        undefined,
        boolVal,
        includeVoiceover
      );
    }
  };

  const handleToggleIncludeVoiceover = (nextVal: boolean) => {
    soundFx.playSfx('click');
    const boolVal = Boolean(nextVal);
    setIncludeVoiceover(boolVal);
    setLastMp4BlobUrl(null);
    lastMp4BlobRef.current = null;
    setLastDirectDownloadUrl(null);
    setAssembledVideo(null);
    setPreviewMode('interactive');
    if (!boolVal) {
      audioRef.current?.pause();
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        setIsPlayingVoiceAudio(false);
      }
      if (interactiveVideoRef.current) {
        interactiveVideoRef.current.muted = isInteractiveMuted;
      }
    } else {
      if (interactiveVideoRef.current) {
        interactiveVideoRef.current.muted = true;
      }
      if (isInteractivePlaying && audioRef.current) {
        audioRef.current.muted = isInteractiveMuted;
        audioRef.current.play().catch(() => {});
      }
    }
    if (scriptResult?.fullScript) {
      triggerBackgroundServerMp4Render(
        scriptResult.fullScript,
        autoVoiceTrack,
        undefined,
        includeSubtitles,
        boolVal
      );
    }
  };

  const handleStep5BgmVolumeChange = (newVolPct: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(newVolPct) || 0)));
    setLocalBgmVolume(clamped);
    if (onMusicVolumeChange) {
      onMusicVolumeChange(clamped);
    }
    if (clamped > 0 && !isMusicEnabled && onMusicChange) {
      onMusicChange({
        ...selectedMusic,
        musicEnabled: true,
      });
    }
    if (interactiveBgmRef.current) {
      interactiveBgmRef.current.volume = clamped / 100;
      if (clamped === 0) {
        interactiveBgmRef.current.volume = 0;
      } else if (isInteractivePlaying && interactiveBgmRef.current.paused) {
        interactiveBgmRef.current.play().catch(() => {});
      }
    }
    if (assembledVideo?.renderedOnServer) {
      setAssembledVideo((prev) => (prev ? { ...prev, renderedOnServer: false } : null));
    }
  };

  // Real-time update of interactiveBgmRef volume whenever bgmVolume changes
  useEffect(() => {
    if (interactiveBgmRef.current) {
      interactiveBgmRef.current.volume = isMusicEnabled ? bgmVolume / 100 : 0;
    }
  }, [bgmVolume, isMusicEnabled]);

  // Pre-synthesize background music WAV URL for synchronized interactive playback (if musicEnabled)
  useEffect(() => {
    try {
      if (!isMusicEnabled) {
        setBgmWavUrl(null);
        return;
      }
      const url = soundFx.getMusicWavBlobUrl(selectedMusic.id, 18);
      setBgmWavUrl(url);
    } catch {
      // ignore
    }
  }, [selectedMusic.id, isMusicEnabled]);

  // Order clips so the chosen Hook is first
  const playableClips = videos.filter((v) => Boolean(v.fileBlobUrl));
  const clipPool = playableClips.length > 0 ? playableClips : videos;
  const hookClip = clipPool.find((v) => v.isHook) || clipPool[0];
  const otherClips = clipPool.filter((v) => v.id !== hookClip.id);
  const orderedClips = [hookClip, ...otherClips];

  // Réinitialiser le script et l'audio dès qu'une nouvelle vidéo est sélectionnée ou importée
  useEffect(() => {
    const handleResetScriptAudio = () => {
      setScriptResult(null);
      setScriptVersions([]);
      setVoicePreviewUrl(null);
      setAutoVoiceTrack(null);
      setAssembledVideo(null);
      setLastMp4BlobUrl(null);
      if (setScript) setScript('');
      if (setAudioUrl) setAudioUrl(null);
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.src = '';
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlayingVoiceAudio(false);
      try {
        localStorage.removeItem('cortia_stepwizard_script_versions');
        localStorage.removeItem('cortia_cached_script_result');
      } catch {}
    };

    window.addEventListener('cortia:reset-script-audio', handleResetScriptAudio);
    return () => window.removeEventListener('cortia:reset-script-audio', handleResetScriptAudio);
  }, [setScript, setAudioUrl]);

  // Détection automatique du changement de vidéo principale : réinitialiser l'ancien script et l'ancien audio
  const lastHookVideoIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentId = hookClip?.id || hookClip?.url || null;
    if (lastHookVideoIdRef.current && currentId && lastHookVideoIdRef.current !== currentId) {
      setScriptResult(null);
      setScriptVersions([]);
      setVoicePreviewUrl(null);
      setAutoVoiceTrack(null);
      setAssembledVideo(null);
      setLastMp4BlobUrl(null);
      if (setScript) setScript('');
      if (setAudioUrl) setAudioUrl(null);
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.src = '';
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      setIsPlayingVoiceAudio(false);
      try {
        localStorage.removeItem('cortia_stepwizard_script_versions');
        localStorage.removeItem('cortia_cached_script_result');
      } catch {}
    }
    lastHookVideoIdRef.current = currentId;
  }, [hookClip?.id, hookClip?.url, setScript, setAudioUrl]);

  // Mandatory 01:01 (61 seconds) duration for TikTok Creator Rewards monetization (>1 min)
  const totalPreviewDuration = 61;
  const numClipsCount = Math.max(1, orderedClips.length);
  const currentSecInTimeline = interactiveElapsedSec % totalPreviewDuration;

  // 3-Act Chronological Segmentation at 1.0x REAL NATURAL SPEED (Never repeats the beginning at 00:33, never fast-forwards!)
  // - Acte 1 (00:00 -> 00:15 = 15s) : Extrait de 5-7.5s à vitesse réelle 1.0x au Début (0s)
  // - Acte 2 (00:15 -> 00:42 = 27s) : Extraits à vitesse réelle 1.0x au Milieu (~40% de la durée)
  // - Acte 3 (00:42 -> 01:01 = 19s) : Extrait de 6-7s à vitesse réelle 1.0x à la FIN / VRAI RENDU FINAL (les dernières secondes du clip)
  let currentActNumber: 1 | 2 | 3 = 1;
  let actProgress = 0;
  let actTotalDurSec = 15;
  let actPhaseBadge = '00:00-00:15 • DÉBUT (1.0x)';

  if (currentSecInTimeline < 15) {
    currentActNumber = 1;
    actTotalDurSec = 15;
    actProgress = currentSecInTimeline / 15;
    actPhaseBadge = '00:00-00:15 • HOOK & DÉBUT (1.0x)';
  } else if (currentSecInTimeline < 42) {
    currentActNumber = 2;
    actTotalDurSec = 27;
    actProgress = (currentSecInTimeline - 15) / 27;
    actPhaseBadge = '00:15-00:42 • MILIEU ACTION (1.0x)';
  } else {
    currentActNumber = 3;
    actTotalDurSec = 19;
    actProgress = (currentSecInTimeline - 42) / 19;
    actPhaseBadge = '00:42-01:01 • ✨ RENDU FINAL (1.0x)';
  }

  const activeClipIndex = Math.min(
    numClipsCount - 1,
    Math.floor(actProgress * numClipsCount)
  );
  const clipSlotDurInActSec = actTotalDurSec / numClipsCount;
  const clipProgressInAct = Math.max(
    0,
    Math.min(1, actProgress * numClipsCount - activeClipIndex)
  );
  const clipElapsedInActSec = clipProgressInAct * clipSlotDurInActSec;
  const activeLiveClip = orderedClips[activeClipIndex] || hookClip;

  const cleanedSpokenScript = cleanScriptForSpeech(scriptResult?.fullScript || '');
  const spokenWords = cleanScriptForSpeech(assembledVideo?.cleanedText || cleanedSpokenScript)
    .split(/\s+/)
    .filter((w) => Boolean(w) && !/^\d{1,2}:\d{2}$/.test(w));

  const RENDER_STEPS = [
    {
      title: 'Découpage Narratif 3 Actes à Vitesse Naturelle 1.0x (Début → Milieu → Fin)',
      detail: 'Vitesse réelle 1.0x • Sans accélérer l’image',
    },
    {
      title: 'Superposition Floutage Haut & Bas (Duplication 2 calques boxblur=25:5)',
      detail: `Haut/Bas ${hookClip.blurZone?.topBottomBlurPct ?? 16}% + Miroir ${hookClip.mirrorHorizontal ? 'Oui' : 'Optionnel'}`,
    },
    {
      title: includeVoiceover
        ? `Synthèse Voix-off IA (${selectedVoice.name} • Vitesse ${currentVoiceSpeed.toFixed(2)}x calibrée à 00:59)`
        : "Conservation du son d'ambiance original des clips (Sans voix-off IA)",
      detail: includeVoiceover
        ? `Langue : ${selectedLanguage.toUpperCase()} • Sans chiffres de minutage`
        : "Voix-off désactivée (Non) • Son d'origine",
    },
    {
      title: includeSubtitles
        ? `Incrustation des sous-titres (${selectedSubtitle.name} • Position Y:${subY}% • Taille ${subScale}%)`
        : 'Exportation vidéo propre sans aucun sous-titre incrusté (Spécial CapCut)',
      detail: includeSubtitles
        ? 'Synchronisation 00:00 → 00:59'
        : 'Sous-titres désactivés (Non)',
    },
    {
      title: `Mixage Audio 61s : ${includeVoiceover ? 'Voix-off' : 'Ambiance originale'} + ${
        isMusicEnabled && bgmVolume > 0 ? `Musique (${selectedMusic.name})` : 'Sans Musique (0%)'
      } + ${isSfxEnabled && includeVoiceover ? `${selectedMusic.selectedSfxIds?.length} SFX` : 'Sans SFX'}`,
      detail: isMusicEnabled ? `Musique à ${bgmVolume}%` : 'Musique désactivée (0%)',
    },
    {
      title: 'Encodage serveur FFmpeg .MP4 01:01 ultra-rapide (< 90s • 720×1280 HD TikTok • CRF 22)',
      detail: 'Fichier cortia-video.mp4 (01:01) ultra-fluide et net',
    },
  ];

  // Keep interactive video element at 1.0x natural real-time speed inside each act's window (Beginning 0s, Middle 40%, End dur - clipSlotDurInActSec)
  useEffect(() => {
    const vidEl = interactiveVideoRef.current;
    if (!vidEl || effectivePreviewMode !== 'interactive') return;
    vidEl.playbackRate = 1.0; // Strictly 1.0x natural video playback speed!
    const dur = vidEl.duration;
    if (dur && isFinite(dur) && dur > 1.5) {
      let anchorStartSec = 0;
      if (currentActNumber === 1) {
        anchorStartSec = 0.08;
      } else if (currentActNumber === 2) {
        anchorStartSec = Math.max(0, Math.min(Math.max(0, dur - clipSlotDurInActSec), dur * 0.4));
      } else {
        // Act 3 (00:42 -> 01:01): Exclusively the last 6-7 seconds of the clip at 1.0x speed!
        anchorStartSec = Math.max(0, dur - clipSlotDurInActSec);
      }
      const desiredTime = Math.max(
        0.08,
        Math.min(dur - 0.15, anchorStartSec + clipElapsedInActSec)
      );
      if (Math.abs(vidEl.currentTime - desiredTime) > 1.35) {
        try {
          vidEl.currentTime = desiredTime;
        } catch {
          // ignore seek error while loading
        }
      }
    }
  }, [
    interactiveElapsedSec,
    activeClipIndex,
    currentActNumber,
    clipElapsedInActSec,
    clipSlotDurInActSec,
    effectivePreviewMode,
  ]);

  // Synchronized loop timer for the Interactive Preview Player (never 0:00 / 0:00, never black screen)
  useEffect(() => {
    if (!scriptResult || effectivePreviewMode !== 'interactive') return;

    const voiceEl = audioRef.current;
    const bgmEl = interactiveBgmRef.current;
    const vidEl = interactiveVideoRef.current;

    if (isInteractivePlaying) {
      if (vidEl) {
        vidEl.muted = includeVoiceover ? true : isInteractiveMuted;
        if (vidEl.paused) {
          vidEl.play().catch(() => {});
        }
      }
      if (!includeVoiceover) {
        voiceEl?.pause();
      } else if (voiceEl && voiceEl.paused) {
        voiceEl.playbackRate = getRelativePlaybackRate();
        voiceEl.volume = Math.min(currentVoiceVolume / 100, 1.0);
        soundFx.applyElementVolumeWithWebAudioGain(voiceEl, currentVoiceVolume);
        voiceEl.muted = isInteractiveMuted;
        voiceEl.play().catch(() => {});
      } else if (voiceEl) {
        voiceEl.volume = Math.min(currentVoiceVolume / 100, 1.0);
        soundFx.applyElementVolumeWithWebAudioGain(voiceEl, currentVoiceVolume);
      }
      if (bgmEl && isMusicEnabled && bgmVolume > 0 && bgmEl.paused) {
        bgmEl.volume = bgmVolume / 100;
        bgmEl.muted = isInteractiveMuted;
        bgmEl.play().catch(() => {});
      } else if (bgmEl && (!isMusicEnabled || bgmVolume === 0)) {
        bgmEl.volume = 0;
        bgmEl.pause();
      } else if (bgmEl) {
        bgmEl.volume = bgmVolume / 100;
      }
    } else {
      vidEl?.pause();
      voiceEl?.pause();
      bgmEl?.pause();
    }
  }, [
    scriptResult,
    assembledVideo,
    effectivePreviewMode,
    isInteractivePlaying,
    isInteractiveMuted,
    activeClipIndex,
    currentActNumber,
    currentVoiceSpeed,
    currentVoiceVolume,
    generatedAtSpeed,
    bgmVolume,
    isMusicEnabled,
    includeVoiceover,
  ]);

  useEffect(() => {
    if (!scriptResult || effectivePreviewMode !== 'interactive' || !isInteractivePlaying) return;

    const interval = setInterval(() => {
      setInteractiveElapsedSec((prev) => {
        const next = prev + 0.1;
        if (next >= totalPreviewDuration) {
          const voiceEl = audioRef.current;
          if (voiceEl) {
            voiceEl.currentTime = 0;
            voiceEl.play().catch(() => {});
          }
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [scriptResult, assembledVideo, effectivePreviewMode, isInteractivePlaying, totalPreviewDuration]);

  const formatTimeMinSec = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${r < 10 ? '0' : ''}${r}`;
  };

  // Toggle Studio Bass Boost & Presence ([✓] Boost Basses & Présence Studio - Micro Créateur) at Step 5
  const handleToggleStep5StudioBassBoost = async (nextBoost: boolean) => {
    soundFx.playSfx('click');
    if (onVoiceChange) {
      onVoiceChange({
        ...selectedVoice,
        rate: currentVoiceSpeed,
        studioBassBoost: nextBoost,
      });
    }
    if (assembledVideo?.renderedOnServer) {
      setAssembledVideo((prev) => (prev ? { ...prev, renderedOnServer: false } : null));
    }
    if (scriptResult?.fullScript) {
      await triggerAutoVoiceoverGeneration(scriptResult.fullScript, currentVoiceSpeed, nextBoost);
    }
  };

  // Update Voiceover Speed (1.0x to 2.0x) at Step 5
  const handleStep5VoiceSpeedChange = async (
    newSpeed: number,
    resynthesizeNow: boolean = false
  ) => {
    const clamped = Math.round(Math.max(1.0, Math.min(2.0, newSpeed)) * 100) / 100;
    setLocalVoiceSpeed(clamped);
    if (onVoiceChange) {
      onVoiceChange({
        ...selectedVoice,
        rate: clamped,
        studioBassBoost: isStudioBassBoost,
      });
    }

    const relRate = Math.max(0.5, Math.min(2.0, clamped / Math.max(0.8, generatedAtSpeed || 1.2)));
    if (audioRef.current) {
      audioRef.current.playbackRate = relRate;
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.playbackRate = relRate;
    }

    if (resynthesizeNow && scriptResult?.fullScript) {
      await triggerAutoVoiceoverGeneration(scriptResult.fullScript, clamped, isStudioBassBoost);
    }
  };

  // Update Voiceover Volume (50% to 200%) at Step 5 with live Web Audio API GainNode boost (>100%)
  const handleStep5VoiceVolumeChange = (newVolPct: number) => {
    const clamped = Math.max(50, Math.min(200, Math.round(Number(newVolPct) || 130)));
    setLocalVoiceVolume(clamped);
    if (onVoiceChange) {
      onVoiceChange({
        ...selectedVoice,
        rate: currentVoiceSpeed,
        voiceVolume: clamped,
        studioBassBoost: isStudioBassBoost,
      });
    }
    if (voiceAudioRef.current) {
      voiceAudioRef.current.volume = Math.min(clamped / 100, 1.0);
      soundFx.applyElementVolumeWithWebAudioGain(voiceAudioRef.current, clamped);
    }
    if (audioRef.current) {
      audioRef.current.volume = Math.min(clamped / 100, 1.0);
      soundFx.applyElementVolumeWithWebAudioGain(audioRef.current, clamped);
    }
    if (assembledVideo?.renderedOnServer) {
      setAssembledVideo((prev) => (prev ? { ...prev, renderedOnServer: false } : null));
    }
  };

  // Helper to automatically call /api/generate-voice as soon as Step 5 generates or optimizes the script
  const triggerAutoVoiceoverGeneration = async (
    rawScript: string,
    overrideSpeed?: number,
    overrideBoost?: boolean
  ) => {
    // Nettoyage du script avant d'appeler l'API Speechma
    const cleanScript = rawScript
      .replace(/\n+/g, ' ')       // Remplace les retours à la ligne par un espace simple
      .replace(/\s+/g, ' ')       // Évite les doubles espaces
      .trim();
    const cleaned = cleanScriptForSpeech(cleanScript);
    if (!cleaned) return null;
    const speedToUse = Math.max(
      0.8,
      Math.min(2.0, Number(overrideSpeed || currentVoiceSpeed) || 1.2)
    );
    const boostToUse = overrideBoost !== undefined ? overrideBoost : isStudioBassBoost;
    const effectiveVoiceId =
      !selectedVoice.id || selectedVoice.id === 'voice_none'
        ? 'fr_leader_energique'
        : selectedVoice.id;
    const effectiveGeminiVoice =
      !selectedVoice.geminiVoice || selectedVoice.geminiVoice === 'NONE'
        ? 'Fenrir'
        : selectedVoice.geminiVoice;

    setIsGeneratingVoicePreview(true);
    try {
      const track = await soundFx.generateFullVoiceover(
        cleaned,
        effectiveGeminiVoice,
        selectedVoice.langCode || selectedLanguage,
        selectedVoice.characterPrompt,
        effectiveVoiceId,
        speedToUse,
        boostToUse
      );
      setGeneratedAtSpeed(speedToUse);
      setGeneratedVoiceId(effectiveVoiceId);
      setGeneratedStudioBoost(boostToUse);
      setAutoVoiceTrack(track);
      setVoicePreviewUrl(track.blobUrl);
      if (audioRef.current) {
        audioRef.current.src = track.blobUrl;
        audioRef.current.playbackRate = 1.0;
        audioRef.current.volume = Math.min(currentVoiceVolume / 100, 1.0);
        soundFx.applyElementVolumeWithWebAudioGain(audioRef.current, currentVoiceVolume);
      }
      const audio = new Audio(track.blobUrl);
      audio.playbackRate = 1.0;
      audio.volume = Math.min(currentVoiceVolume / 100, 1.0);
      soundFx.applyElementVolumeWithWebAudioGain(audio, currentVoiceVolume);
      audio.onended = () => setIsPlayingVoiceAudio(false);
      voiceAudioRef.current = audio;
      return track;
    } catch (err) {
      console.warn('Auto voiceover synthesis warning:', err);
      return null;
    } finally {
      setIsGeneratingVoicePreview(false);
    }
  };

  // Re-synthesize voiceover automatically if the user changes the selected character voice or studioBassBoost in Step 3 and returns to Step 5
  useEffect(() => {
    const effectiveId =
      !selectedVoice.id || selectedVoice.id === 'voice_none'
        ? 'fr_leader_energique'
        : selectedVoice.id;
    if (
      scriptResult?.fullScript &&
      (effectiveId !== generatedVoiceId || isStudioBassBoost !== generatedStudioBoost)
    ) {
      if (assembledVideo?.renderedOnServer) {
        setAssembledVideo((prev) => (prev ? { ...prev, renderedOnServer: false } : null));
      }
      triggerAutoVoiceoverGeneration(scriptResult.fullScript, currentVoiceSpeed, isStudioBassBoost);
    }
  }, [selectedVoice.id, isStudioBassBoost]);

  // Extract real base64 JPEG frames from the loaded video clip for Gemini Vision zero-hallucination analysis
  const extractVisualFramesFromClips = async (): Promise<string[]> => {
    const frames: string[] = [];
    for (const clip of orderedClips.slice(0, 3)) {
      if (clip.thumbnail?.startsWith('data:image/')) {
        frames.push(clip.thumbnail);
      }
    }

    const primaryClip = orderedClips[0];
    const videoSrc =
      primaryClip?.fileBlobUrl || primaryClip?.localVideoUrl || primaryClip?.mp4Url;
    if (!videoSrc) return frames.slice(0, 4);

    try {
      const captured = await new Promise<string[]>((resolve) => {
        const tempVid = document.createElement('video');
        tempVid.crossOrigin = 'anonymous';
        tempVid.muted = true;
        tempVid.playsInline = true;
        tempVid.preload = 'auto';
        const out: string[] = [];
        const timeout = setTimeout(() => {
          tempVid.src = '';
          resolve(out);
        }, 2800);

        tempVid.onloadedmetadata = async () => {
          const dur = Number.isFinite(tempVid.duration) && tempVid.duration > 1 ? tempVid.duration : 10;
          const sampleTimes = [
            Math.max(0.2, dur * 0.15),
            Math.max(1.0, dur * 0.5),
            Math.max(2.0, dur * 0.85),
          ];
          const canvas = document.createElement('canvas');
          const w = 360;
          const h = 640;
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');

          for (const tSec of sampleTimes) {
            try {
              await new Promise<void>((seekRes) => {
                const onSeeked = () => {
                  tempVid.removeEventListener('seeked', onSeeked);
                  seekRes();
                };
                tempVid.addEventListener('seeked', onSeeked);
                tempVid.currentTime = Math.min(dur - 0.1, tSec);
              });
              if (ctx) {
                ctx.drawImage(tempVid, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
                if (dataUrl && dataUrl.startsWith('data:image/jpeg')) {
                  out.push(dataUrl);
                }
              }
            } catch {
              // ignore individual seek failure
            }
          }
          clearTimeout(timeout);
          tempVid.src = '';
          resolve(out);
        };

        tempVid.onerror = () => {
          clearTimeout(timeout);
          resolve(out);
        };

        tempVid.src = videoSrc;
      });

      for (const f of captured) {
        if (!frames.includes(f)) frames.push(f);
      }
    } catch {
      // ignore frame capture fallback
    }

    return frames.slice(0, 4);
  };

  // Switch target language & voice (FR, EN, ES, DE, ZH, KO, JA)
  const handleSwitchScriptLanguage = (
    targetLang: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ko' | 'ja' | 'pt',
    autoRegenerate: boolean = false
  ) => {
    soundFx.playSfx('click');
    if (onLanguageChange) {
      onLanguageChange(targetLang);
    }
    if (onVoiceChange && selectedVoice.langCode !== targetLang) {
      if (targetLang === 'en') {
        onVoiceChange({
          ...selectedVoice,
          id: 'en_matthew_speechma',
          name: 'Matthew — Viral US Storyteller (Speechma)',
          langCode: 'en',
          gender: 'M',
          rate: 1.2,
          style: 'Hyper-réaliste & Percutant (TikTok US)',
          geminiVoice: 'Fenrir',
        });
      } else if (targetLang === 'es') {
        onVoiceChange({
          ...selectedVoice,
          id: 'es_alvaro_speechma',
          name: 'Alvaro — Narrateur Viral Espagnol (es-ES-AlvaroNeural)',
          langCode: 'es',
          gender: 'M',
          rate: 1.1,
          pitch: 1.0,
          style: 'Chaleureux, dynamique & ultra-engageant (1.10x)',
          geminiVoice: 'Orus',
          edgeVoice: 'es-ES-AlvaroNeural',
          speechmaVoice: 'Alvaro',
        });
      } else if (targetLang === 'de') {
        onVoiceChange({
          ...selectedVoice,
          id: 'de_klaus_speechma',
          name: 'Klaus — Narrateur Allemand Viral (Speechma)',
          langCode: 'de',
          gender: 'M',
          rate: 1.15,
          style: 'Direct, percutant et dynamique (1.15x)',
          geminiVoice: 'Fenrir',
        });
      } else if (targetLang === 'zh') {
        onVoiceChange({
          ...selectedVoice,
          id: 'zh_yunxi_speechma',
          name: 'Yunxi — Narrateur Chinois Viral (Speechma)',
          langCode: 'zh',
          gender: 'M',
          rate: 1.1,
          style: 'Naturel, captivant et rythmé (1.10x)',
          geminiVoice: 'Fenrir',
        });
      } else if (targetLang === 'ko') {
        onVoiceChange({
          ...selectedVoice,
          id: 'ko_injoon_speechma',
          name: 'InJoon — Narrateur Coréen Viral (Speechma)',
          langCode: 'ko',
          gender: 'M',
          rate: 1.15,
          style: 'Expressif, dynamique et engageant (1.15x)',
          geminiVoice: 'Fenrir',
        });
      } else if (targetLang === 'ja') {
        onVoiceChange({
          ...selectedVoice,
          id: 'ja_keita_speechma',
          name: 'Keita — Narrateur Japonais Viral (Speechma)',
          langCode: 'ja',
          gender: 'M',
          rate: 1.15,
          style: 'Captivant, net et immersif (1.15x)',
          geminiVoice: 'Fenrir',
        });
      } else {
        onVoiceChange({
          ...selectedVoice,
          id: 'fr_henri_speechma',
          name: 'Henri — Voix Réaliste Française (Speechma)',
          langCode: 'fr',
          gender: 'M',
          rate: 1.2,
          style: 'Énergique, fluide & naturel (Storytelling FR)',
          geminiVoice: 'Fenrir',
        });
      }
    }
    if (autoRegenerate) {
      handleGenerateScript(narrativeStyle, selectedScenarioCode, targetLang);
    }
  };

  // 1. Generate 100% unique viral script (Mandatory Visual Analysis + 9-Block 61s Structure + Auto Language)
  const handleGenerateScript = async (
    overrideStyle?: NarrativeScriptStyle,
    overrideScenarioCode?: NarrativeScenarioCode | '',
    overrideLanguage?: string
  ) => {
    const styleToUse: NarrativeScriptStyle =
      overrideStyle === 'financial_shock' ||
      overrideStyle === 'mystery_bottom' ||
      overrideStyle === 'unexpected_discovery'
        ? overrideStyle
        : narrativeStyle;

    const scenarioToUse: NarrativeScenarioCode | undefined =
      overrideScenarioCode !== undefined
        ? overrideScenarioCode || undefined
        : selectedScenarioCode || undefined;

    const langToUse = (overrideLanguage || effectiveScriptLanguage || 'fr').toLowerCase();

    setIsGeneratingScript(true);
    setScriptError(null);
    soundFx.playSfx('whoosh');

    try {
      const visualFrames = await extractVisualFramesFromClips();
      const links = orderedClips.map((v) => v.url || v.fileName || v.title);
      const clipsPayload = orderedClips.map((v, idx) => ({
        id: v.id,
        videoId: v.videoId,
        localPath: v.localPath,
        localVideoUrl: v.localVideoUrl,
        title: visualDescription.trim() && idx === 0 ? visualDescription.trim() : v.title,
        author: v.author,
        url: v.url,
        mp4Url: v.mp4Url,
        fileBlobUrl: v.fileBlobUrl,
        thumbnail: v.thumbnail,
        coverUrl: v.coverUrl || v.thumbnail,
        views: v.views,
        likes: v.likes,
        duration: v.duration,
        isHook: v.isHook,
        thumbnailDataUrl:
          visualFrames[idx] ||
          (v.thumbnail?.startsWith('data:image/') ? v.thumbnail : undefined),
      }));

      const effectiveTopic = visualDescription.trim() || hookClip.title;

      const res = await requestViralScript({
        links,
        clips: clipsPayload,
        topic: effectiveTopic,
        hookVideoTitle: effectiveTopic,
        visualDescription: visualDescription.trim() || undefined,
        visualFrames,
        language: langToUse,
        narrativeStyle: styleToUse,
        scenarioCode: scenarioToUse,
        previousHooks: previousHooksRef.current,
        ctaGoal: 'comments',
      });

      if (res.hookText) {
        previousHooksRef.current = Array.from(
          new Set([res.hookText, ...previousHooksRef.current])
        ).slice(0, 12);
      }

      if (res.hookBannerTexts?.[0] && onSubtitleChange) {
        onSubtitleChange({
          ...selectedSubtitle,
          hookBannerText: res.hookBannerTexts[0],
        });
      }

      setScriptResult(res);
      recordScriptVersion(
        res,
        scriptVersions.length === 0 ? 'ai_generation' : 'ai_regeneration',
        scenarioToUse
          ? `Génération IA (${SCENARIO_VARIATION_OPTIONS.find((s) => s.code === scenarioToUse)?.label || 'Scénario ' + scenarioToUse})`
          : 'Génération IA Gemini'
      );
      setVoicePreviewUrl(null);
      setAutoVoiceTrack(null);
      setAssembledVideo(null);
      setLastMp4BlobUrl(null);
      lastMp4BlobRef.current = null;
      setRenderError(null);
      setHasDeductedCreditForCurrentVideo(false);
      soundFx.playSfx('cash');

      // Automatically synthesize voiceover AND assemble the 61-second final .MP4 video on the server so it plays immediately in the player without black screen
      triggerAutoVoiceoverGeneration(res.fullScript, currentVoiceSpeed).then((track) => {
        triggerBackgroundServerMp4Render(res.fullScript, track, res.hookBannerTexts?.[0]);
      });
    } catch (err: any) {
      console.error(err);
      setScriptError(
        err?.message || 'Erreur lors de la génération du script viral.'
      );
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 2. Optimize script (up to 3 times)
  const handleOptimizeScript = async () => {
    if (optimizationsLeft <= 0 || !scriptResult) return;
    setIsOptimizing(true);
    soundFx.playSfx('pop');

    try {
      const res = await requestScriptOptimization({
        script: scriptResult.fullScript,
        iteration: 4 - optimizationsLeft,
        focus: optimizationFocus,
        language: selectedLanguage,
      });

      const newOptimizedResult: ScriptGenerationResult = {
        ...scriptResult,
        fullScript: res.optimizedScript,
        hookText: res.newHook || scriptResult.hookText,
        estimatedViralityScore: Math.min(99, scriptResult.estimatedViralityScore + 2),
      };
      setScriptResult(newOptimizedResult);
      recordScriptVersion(
        newOptimizedResult,
        'ai_optimization',
        `Optimisation IA (${optimizationFocus.toUpperCase()})`
      );
      setVoicePreviewUrl(null);
      setAutoVoiceTrack(null);
      setOptimizationsLeft((prev) => prev - 1);
      soundFx.playSfx('ding');

      // Automatically re-synthesize voiceover & re-assemble 61s .MP4 for the optimized script
      triggerAutoVoiceoverGeneration(res.optimizedScript, currentVoiceSpeed).then((track) => {
        triggerBackgroundServerMp4Render(res.optimizedScript, track);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 2b. Proofread & fix spelling/grammar mistakes in the script ("✨ Corriger les fautes & Grammaire")
  const [isProofreading, setIsProofreading] = useState(false);
  const [proofreadSuccessBadge, setProofreadSuccessBadge] = useState(false);

  const handleProofreadScript = async () => {
    if (!scriptResult || isProofreading) return;
    setIsProofreading(true);
    setProofreadSuccessBadge(false);
    soundFx.playSfx('pop');

    try {
      const res = await requestScriptProofread({
        script: scriptResult.fullScript,
        language: selectedLanguage,
      });

      const updatedScript = res.correctedScript || scriptResult.fullScript;
      const proofreadResult: ScriptGenerationResult = {
        ...scriptResult,
        fullScript: updatedScript,
        hookText: res.newHook || scriptResult.hookText,
      };
      setScriptResult(proofreadResult);
      recordScriptVersion(
        proofreadResult,
        'ai_proofread',
        'Correction IA Grammaire & Style'
      );
      setVoicePreviewUrl(null);
      setAutoVoiceTrack(null);
      setAssembledVideo(null);
      setProofreadSuccessBadge(true);
      soundFx.playSfx('ding');

      // Re-synthesize continuous 00:00 -> 01:00 AI voiceover & 61s .MP4 with the corrected text
      triggerAutoVoiceoverGeneration(updatedScript, currentVoiceSpeed).then((track) => {
        triggerBackgroundServerMp4Render(updatedScript, track);
      });
      setTimeout(() => setProofreadSuccessBadge(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProofreading(false);
    }
  };

  // Listen to standalone AI Voiceover reading the cleaned script
  const handlePlayScriptVoiceover = async () => {
    if (!scriptResult) return;

    if (selectedVoice.isNone || selectedVoice.geminiVoice === 'NONE') {
      soundFx.playSfx('click');
      return;
    }

    if (voicePreviewUrl && voiceAudioRef.current) {
      if (isPlayingVoiceAudio) {
        voiceAudioRef.current.pause();
        setIsPlayingVoiceAudio(false);
      } else {
        voiceAudioRef.current.playbackRate = getRelativePlaybackRate();
        voiceAudioRef.current.volume = Math.min(currentVoiceVolume / 100, 1.0);
        soundFx.applyElementVolumeWithWebAudioGain(voiceAudioRef.current, currentVoiceVolume);
        await voiceAudioRef.current.play();
        setIsPlayingVoiceAudio(true);
      }
      return;
    }

    setIsGeneratingVoicePreview(true);
    try {
      const effectiveVoiceId =
        !selectedVoice.id || selectedVoice.id === 'voice_none'
          ? 'fr_leader_energique'
          : selectedVoice.id;
      const track = await soundFx.generateFullVoiceover(
        scriptResult.fullScript,
        selectedVoice.geminiVoice,
        selectedVoice.langCode || selectedLanguage,
        selectedVoice.characterPrompt,
        effectiveVoiceId,
        currentVoiceSpeed,
        isStudioBassBoost
      );
      setGeneratedAtSpeed(currentVoiceSpeed);
      setGeneratedVoiceId(effectiveVoiceId);
      setGeneratedStudioBoost(isStudioBassBoost);
      setAutoVoiceTrack(track);
      setVoicePreviewUrl(track.blobUrl);
      if (audioRef.current) {
        audioRef.current.src = track.blobUrl;
        audioRef.current.playbackRate = 1.0;
        audioRef.current.volume = Math.min(currentVoiceVolume / 100, 1.0);
        soundFx.applyElementVolumeWithWebAudioGain(audioRef.current, currentVoiceVolume);
      }
      const audio = new Audio(track.blobUrl);
      audio.playbackRate = 1.0;
      audio.volume = Math.min(currentVoiceVolume / 100, 1.0);
      soundFx.applyElementVolumeWithWebAudioGain(audio, currentVoiceVolume);
      audio.onended = () => setIsPlayingVoiceAudio(false);
      voiceAudioRef.current = audio;
      setIsPlayingVoiceAudio(true);
      await audio.play();
    } catch (err) {
      console.error('Voiceover preview error:', err);
    } finally {
      setIsGeneratingVoicePreview(false);
    }
  };

  // 3. Real Server-Side FFmpeg (.MP4) Montage Assembly + Interactive Synchronized Player
  const handleStartRender = async () => {
    if (!scriptResult) return;
    if (!hasDeductedCreditForCurrentVideo && userCredits <= 0) {
      onRequireUpgrade?.();
      return;
    }

    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      setIsPlayingVoiceAudio(false);
    }

    setIsRendering(true);
    setRenderError(null);
    setAssembledVideo(null);
    setRenderStepIndex(0);
    setRenderProgressPct(5);
    setInteractiveElapsedSec(0);
    setIsInteractivePlaying(false);

    // Play the first user-checked Sound Effect from Step 3 ONLY if sfxEnabled is true and at least 1 SFX is checked
    if (isSfxEnabled && selectedMusic.selectedSfxIds?.[0]) {
      soundFx.playSfx(selectedMusic.selectedSfxIds[0]);
    }

    setTimeout(async () => {
      try {
        const effectiveVoiceId =
          !selectedVoice.id || selectedVoice.id === 'voice_none'
            ? 'fr_leader_energique'
            : selectedVoice.id;
        const canReuseCurrentTrack =
          autoVoiceTrack &&
          autoVoiceTrack.audioBase64 &&
          generatedVoiceId === effectiveVoiceId &&
          generatedStudioBoost === isStudioBassBoost &&
          Math.abs(generatedAtSpeed - currentVoiceSpeed) < 0.03;

        // Trigger external Make.com Webhook / Creatomate render in parallel if configured in Admin
        const externalRenderPromise = fetch('/api/render-external', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videos: videos.map((v) => ({
              id: v.id,
              title: v.title,
              url: v.url,
              mp4Url:
                v.mp4Url ||
                (v.fileBlobUrl ? `${window.location.origin}${v.fileBlobUrl}` : v.url),
              isHook: v.isHook,
              blurZone: v.blurZone,
            })),
            scriptText: cleanScriptForSpeech(scriptResult.fullScript),
            hookText: scriptResult.hookText,
            voiceName: selectedVoice.geminiVoice,
            subtitleStyle: selectedSubtitle.name,
            language: selectedLanguage,
          }),
        })
          .then((r) => r.json())
          .catch(() => null);

        const canvasEl = canvasRef.current || document.createElement('canvas');
        const result = await assembleFinalVideoOnCanvas({
          canvas: canvasEl,
          videos,
          scriptText: scriptResult.fullScript,
          selectedVoice: {
            ...selectedVoice,
            rate: currentVoiceSpeed,
          },
          selectedSubtitle,
          selectedMusic: {
            ...selectedMusic,
            musicEnabled: isMusicEnabled && bgmVolume > 0,
          },
          musicVolume: bgmVolume,
          language: selectedLanguage,
          includeSubtitles,
          includeVoiceover,
          preGeneratedVoiceTrack: canReuseCurrentTrack ? autoVoiceTrack : null,
          onProgress: (stepIdx, pct) => {
            setRenderStepIndex(stepIdx);
            setRenderProgressPct(pct);
          },
        });

        const externalData = await externalRenderPromise;
        if (externalData?.creatomateVideoUrl) {
          result.videoUrl = externalData.creatomateVideoUrl;
          result.downloadUrl = externalData.creatomateVideoUrl;
          result.fileExtension = 'mp4';
        }

        setGeneratedAtSpeed(currentVoiceSpeed);
        setAssembledVideo(result);
        if (result.videoBlob && result.videoBlob.size > 10000) {
          const typed = new Blob([result.videoBlob], { type: 'video/mp4' });
          lastMp4BlobRef.current = typed;
          setLastMp4BlobUrl(URL.createObjectURL(typed));
        }
        if (result.downloadUrl) {
          setLastDirectDownloadUrl(result.downloadUrl);
          if (!result.videoBlob) {
            fetch('/api/final-video.mp4', { credentials: 'same-origin', cache: 'no-store' })
              .then((r) => (r.ok ? r.blob() : null))
              .then((b) => {
                if (b && b.size > 10000) {
                  const typed = new Blob([b], { type: 'video/mp4' });
                  lastMp4BlobRef.current = typed;
                  setLastMp4BlobUrl(URL.createObjectURL(typed));
                }
              })
              .catch(() => {});
          }
        }
        setVoicePreviewUrl(result.voiceoverUrl);
        setPreviewMode('mp4');
        setIsRendering(false);
        if (!hasDeductedCreditForCurrentVideo) {
          setHasDeductedCreditForCurrentVideo(true);
          onDeductCredit();
        }
        if (isSfxEnabled) {
          soundFx.playSfx('chaching');
        }

        const creation: CompletedCreation = {
          id: `video_${Date.now()}`,
          title: scriptResult.suggestedTitles[0] || hookClip.title,
          script: scriptResult.fullScript,
          duration: `01:01 (61s)`,
          createdAt: 'À l’instant',
          viewsProjected: '350K - 800K',
          thumbnailUrl: hookClip.thumbnail,
          tags: scriptResult.hashtags || ['#tiktokgrowth', '#viral'],
          hookText: scriptResult.hookText,
          voiceUsed: `${selectedVoice.name} (${currentVoiceSpeed.toFixed(2)}x)`,
          subtitleStyle: selectedSubtitle.name,
          videoUrl: result.videoUrl,
        };
        onCreationComplete(creation);
      } catch (err: any) {
        console.error('Error assembling final video:', err);
        setRenderError(
          err?.message ||
            'Erreur lors du montage FFmpeg (.MP4). Vérifiez que tous vos liens sont des vidéos TikTok valides.'
        );
        setIsRendering(false);
      }
    }, 100);
  };

  // Automatic background 61-second FFmpeg .MP4 assembly as soon as the script is generated or when subtitle/voiceover toggles change
  const triggerBackgroundServerMp4Render = async (
    rawScriptText: string,
    voiceTrackToUse?: {
      blobUrl: string;
      audioBase64?: string;
      voiceFileId?: string;
      cleanedText: string;
    } | null,
    bannerOverride?: string,
    overrideIncludeSubtitles?: boolean,
    overrideIncludeVoiceover?: boolean
  ) => {
    setIsAutoAssemblingMp4(true);
    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 300000);
    const effectiveSubtitles =
      overrideIncludeSubtitles !== undefined
        ? Boolean(overrideIncludeSubtitles)
        : Boolean(includeSubtitles);
    const effectiveVoiceover =
      overrideIncludeVoiceover !== undefined
        ? Boolean(overrideIncludeVoiceover)
        : Boolean(includeVoiceover);

    try {
      const effectiveVoiceId =
        !selectedVoice.id || selectedVoice.id === 'voice_none'
          ? 'fr_leader_energique'
          : selectedVoice.id;
      const effectiveGeminiVoice =
        !selectedVoice.geminiVoice || selectedVoice.geminiVoice === 'NONE'
          ? 'Fenrir'
          : selectedVoice.geminiVoice;
      const effectiveTemplateId =
        selectedSubtitle.subtitleTemplateId || selectedSubtitle.id || 'brown-fox-box';
      const cleaned = voiceTrackToUse?.cleanedText || cleanScriptForSpeech(rawScriptText);
      const bannerTxt = bannerOverride || hookBannerText;

      const preparedVideos = await prepareClipsForServerAssembly(orderedClips);
      const useDirectStreamCopy = !effectiveSubtitles || !effectiveVoiceover;
      const ffmpegArgs = useDirectStreamCopy
        ? ['-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-threads', '2']
        : [
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
          ];

      const assembleRes = await fetch('/api/assemble-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          videos: preparedVideos,
          scriptText: cleaned,
          voiceName: effectiveGeminiVoice,
          voiceId: effectiveVoiceId,
          characterStylePrompt: selectedVoice.characterPrompt,
          voiceSpeed: currentVoiceSpeed,
          voiceRate: currentVoiceSpeed,
          voiceVolume: currentVoiceVolume,
          studioBassBoost: isStudioBassBoost,
          language: selectedVoice.langCode || selectedLanguage,
          voiceAudioBase64:
            effectiveVoiceover && !voiceTrackToUse?.voiceFileId
              ? voiceTrackToUse?.audioBase64 || ''
              : '',
          voiceFileId: effectiveVoiceover ? voiceTrackToUse?.voiceFileId || '' : '',
          includeSubtitles: Boolean(effectiveSubtitles),
          showSubtitles: Boolean(effectiveSubtitles),
          includeVoiceover: Boolean(effectiveVoiceover),
          useDirectStreamCopy,
          ffmpegArgs,
          ffmpegPreset: 'ultrafast',
          ffmpegCrf: 22,
          ffmpegThreads: 2,
          subtitleTemplateId: effectiveSubtitles ? effectiveTemplateId : 'none',
          subtitleX: subX,
          subtitleY: effectiveSubY,
          subtitleScale: subScale,
          hookBannerEnabled: Boolean(effectiveSubtitles && hookBannerEnabled),
          hookBannerText: effectiveSubtitles ? bannerTxt : '',
          hookBannerBgColor,
          subtitleStyle: effectiveSubtitles
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
                subtitleX: subX,
                subtitleY: effectiveSubY,
                subtitleScale: subScale,
                coverCompetitorText: effectiveCoverCompetitor,
                hookBannerEnabled: Boolean(hookBannerEnabled),
                hookBannerText: bannerTxt,
                hookBannerBgColor,
              }
            : null,
          musicId: selectedMusic.id,
          bgmVolume,
          musicVolume: bgmVolume,
          musicEnabled: isMusicEnabled && bgmVolume > 0,
          sfxEnabled: isSfxEnabled && effectiveVoiceover,
          selectedSfxIds:
            isSfxEnabled && effectiveVoiceover ? selectedMusic.selectedSfxIds || [] : [],
        }),
      });

      const data = await assembleRes.json().catch(() => ({}));
      if (assembleRes.ok && data.success && data.videoUrl) {
        const dlUrl =
          data.downloadUrl ||
          `/api/download-final-video?file=${encodeURIComponent(
            data.videoUrl.split('/').pop() || ''
          )}`;
        setLastDirectDownloadUrl(dlUrl);
        setGeneratedAtSpeed(currentVoiceSpeed);
        setAssembledVideo({
          videoUrl: data.videoUrl,
          downloadUrl: dlUrl,
          mimeType: 'video/mp4',
          fileExtension: 'mp4',
          voiceoverUrl: data.voiceoverUrl || voiceTrackToUse?.blobUrl || voicePreviewUrl || '',
          cleanedText: data.cleanedText || cleaned,
          durationSeconds: 61,
          renderedOnServer: true,
        });
        setIsInteractivePlaying(false);
        setPreviewMode('mp4');
      }
    } catch (bgErr) {
      console.warn('Background 61s MP4 assembly warning:', bgErr);
    } finally {
      clearTimeout(timeoutId);
      setIsAutoAssemblingMp4(false);
    }
  };

  // --- Script Version History Restoration & Management ---
  const handleRestoreVersion = (version: ScriptVersion) => {
    const restoredResult: ScriptGenerationResult = {
      hookText: version.hookText,
      fullScript: version.fullScript,
      estimatedViralityScore: version.estimatedViralityScore,
      hookBannerTexts: version.hookBannerTexts || (version.hookText ? [version.hookText] : []),
      suggestedTitles: version.hookText ? [version.hookText] : [],
      description: version.description || '',
      hashtags: version.hashtags || [],
      estimatedDuration: '01:00',
      narrativeStyle: version.narrativeStyle,
      scenarioCode: version.scenarioCode,
      scenarioTitle: version.scenarioTitle,
    };

    setScriptResult(restoredResult);

    // Sync banner text if subtitle template has banner enabled
    if (version.hookBannerTexts?.[0] && onSubtitleChange) {
      onSubtitleChange({
        ...selectedSubtitle,
        hookBannerText: version.hookBannerTexts[0],
      });
    }

    if (version.narrativeStyle) {
      setNarrativeStyle(version.narrativeStyle);
    }
    if (version.scenarioCode) {
      setSelectedScenarioCode(version.scenarioCode);
    }

    // Reset voice & video previews and regenerate with restored script
    setVoicePreviewUrl(null);
    setAutoVoiceTrack(null);
    setAssembledVideo(null);
    setLastMp4BlobUrl(null);
    lastMp4BlobRef.current = null;
    setRenderError(null);

    triggerAutoVoiceoverGeneration(version.fullScript, currentVoiceSpeed).then((track) => {
      triggerBackgroundServerMp4Render(version.fullScript, track, version.hookBannerTexts?.[0]);
    });

    recordScriptVersion(
      restoredResult,
      'restore',
      `Restauration de la v${version.versionNumber}`
    );

    setLastRestoredBanner(`Version v${version.versionNumber} restaurée avec succès !`);
    soundFx.playSfx('ding');
    toast.success(`Version v${version.versionNumber} restaurée dans l'éditeur et audio actualisé !`, 'Version Restaurée');
    setTimeout(() => setLastRestoredBanner(null), 5000);
  };

  const handleDeleteVersion = (id: string) => {
    setScriptVersions((prev) => prev.filter((v) => v.id !== id));
    soundFx.playSfx('pop');
    toast.info('Version supprimée de l\'historique.', 'Historique');
  };

  const handleClearVersionHistory = () => {
    setScriptVersions([]);
    try {
      localStorage.removeItem('cortia_stepwizard_script_versions');
    } catch {}
    soundFx.playSfx('pop');
    toast.info('L\'historique des versions a été réinitialisé.', 'Historique Vidé');
  };

  const handleCreateManualSnapshot = (label = 'Instantané manuel') => {
    if (!scriptResult?.fullScript) return;
    recordScriptVersion(
      scriptResult,
      'snapshot',
      label
    );
    soundFx.playSfx('cash');
    setLastRestoredBanner(`Instantané « ${label} » sauvegardé !`);
    toast.success(`Instantané « ${label} » enregistré dans l'historique !`, 'Instantané Créé');
    setTimeout(() => setLastRestoredBanner(null), 4000);
  };

  const handleQuickUndoPreviousVersion = () => {
    if (scriptVersions.length < 2) return;
    const previous = scriptVersions[1];
    if (previous) {
      handleRestoreVersion(previous);
    }
  };

  // 4. Download the real server-assembled .MP4 file (01:01 / 61s) via /api/assemble-video -> immediate <a href={blobUrl} download="cortia-video.mp4">
  const getFinalDownloadHref = () => {
    if (lastDirectDownloadUrl) return lastDirectDownloadUrl;
    if (!assembledVideo) return '/api/final-video.mp4?download=1';
    if (
      assembledVideo.downloadUrl &&
      assembledVideo.downloadUrl.startsWith('/api/download-final-video')
    ) {
      return assembledVideo.downloadUrl;
    }
    if (assembledVideo.videoUrl && assembledVideo.videoUrl.includes('/renders/')) {
      const filePart = assembledVideo.videoUrl.split('/renders/').pop()?.split('?')[0] || '';
      if (filePart) {
        return `/api/download-final-video?file=${encodeURIComponent(filePart)}`;
      }
    }
    return assembledVideo.downloadUrl || assembledVideo.videoUrl || '/api/final-video.mp4?download=1';
  };

  // Trigger hidden server attachment download iframe (/api/final-video.mp4?download=1) so mobile browsers inside iframes save directly to phone Downloads/Gallery
  const triggerServerAttachmentDownload = (url = '/api/final-video.mp4?download=1') => {
    try {
      const hiddenIframe = document.createElement('iframe');
      hiddenIframe.style.display = 'none';
      hiddenIframe.src = url;
      document.body.appendChild(hiddenIframe);
      setTimeout(() => {
        try {
          document.body.removeChild(hiddenIframe);
        } catch {
          // ignore
        }
      }, 60000);
    } catch {
      // ignore
    }
  };

  // Helper to trigger automatic .MP4 Blob download + optional mobile navigator.share to phone gallery
  const downloadAndShareMp4Blob = async (
    rawBlob: Blob,
    filename = 'montage_viral_61s.mp4'
  ) => {
    const mp4Blob = new Blob([rawBlob], { type: 'video/mp4' });
    lastMp4BlobRef.current = mp4Blob;
    if (lastMp4BlobUrl && lastMp4BlobUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(lastMp4BlobUrl);
      } catch {
        // ignore
      }
    }
    const blobUrl = URL.createObjectURL(mp4Blob);
    setLastMp4BlobUrl(blobUrl);
    setPreviewMode('mp4');

    // 1. Trigger automatic download in browser / phone Downloads via <a download="montage_viral_61s.mp4">
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = blobUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    toast.success(`La vidéo "${filename}" a été téléchargée avec succès !`, 'Téléchargement Réussi');

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');

    // 2. On mobile, also trigger Content-Disposition: attachment server stream AND native navigator.share({ files }) so saving to phone gallery works 100%
    if (isMobile) {
      triggerServerAttachmentDownload('/api/final-video.mp4?download=1');
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          const videoFile = new File([mp4Blob], filename, { type: 'video/mp4' });
          if (!navigator.canShare || navigator.canShare({ files: [videoFile] })) {
            await navigator.share({
              files: [videoFile],
              title: filename,
            });
          }
        }
      } catch {
        // Ignore AbortError if user dismisses the native mobile share sheet
      }
    }
  };

  // Bouton vert "📲 Télécharger la vidéo .MP4 sur mon téléphone" :
  // Déclenche un téléchargement immédiat côté navigateur via un élément HTML <a> standard avec try / catch / finally strict (Zéro plantage / Zéro blocage)
  const handleDirectSaveToPhone = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isDownloadingVideo) return;
    setIsDownloadingVideo(true);
    setRenderError(null);
    soundFx.playSfx('cash');

    try {
      // Si sous-titres + voix-off sont désactivés, téléchargement immédiat du MP4 brut sans traitement serveur
      if (!includeSubtitles && !includeVoiceover) {
        const videoUrl = resolveCleanCapCutVideoUrl();
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = 'montage_capcut.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // Si le Blob .MP4 est déjà prêt en mémoire, téléchargement immédiat via <a>
      if (
        assembledVideo?.renderedOnServer &&
        lastMp4BlobRef.current &&
        lastMp4BlobRef.current.size > 10000
      ) {
        await downloadAndShareMp4Blob(lastMp4BlobRef.current, 'montage_viral_61s.mp4');
        return;
      }

      // Si une URL vidéo assemblée est déjà disponible, déclenche immédiatement <a> + téléchargement Blob
      if (assembledVideo?.renderedOnServer && (assembledVideo.videoUrl || lastMp4BlobUrl)) {
        const directHref = lastMp4BlobUrl || getFinalDownloadHref();
        const a = document.createElement('a');
        a.href = directHref;
        a.download = 'montage_viral_61s.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      // Sinon, lance l'assemblage rapide (ou '-c copy' en <3s si sans sous-titres)
      await handleDownloadVideo(e);
    } catch (err: any) {
      console.error('Direct phone MP4 download error:', err);
      // Fallback de sécurité immédiat via <a> pour ne jamais planter ni bloquer l'utilisateur
      try {
        const fallbackUrl = lastMp4BlobUrl || assembledVideo?.videoUrl || resolveCleanCapCutVideoUrl();
        const a = document.createElement('a');
        a.href = fallbackUrl;
        a.download = 'montage_viral_61s.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        // ignore
      }
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  // Résout l'URL directe du fichier MP4 brut d'origine (ou du blob vidéo déjà chargé dans le lecteur) sans aucun traitement FFmpeg serveur
  const resolveCleanCapCutVideoUrl = (): string => {
    const primaryClip = activeLiveClip || hookClip || orderedClips[0];
    // 1. Blob local déjà chargé depuis le téléphone (URL.createObjectURL)
    if (primaryClip?.fileBlobUrl && primaryClip.fileBlobUrl.startsWith('blob:')) {
      return primaryClip.fileBlobUrl;
    }
    // 2. Fichier MP4 brut déjà sauvegardé dans /tmp/cortia_clip_${id}.mp4
    if (primaryClip?.localVideoUrl && primaryClip.localVideoUrl.startsWith('/api/local-video/')) {
      const base = primaryClip.localVideoUrl.split('?')[0];
      return `${base}?download=1&filename=montage_capcut.mp4`;
    }
    // 3. Flux vidéo déjà chargé dans le lecteur <video> (Proxy Anti-CORS ou blob)
    const playableSrc =
      interactiveVideoRef.current?.currentSrc ||
      resolvePlayableClipVideoSrc(primaryClip) ||
      lastMp4BlobUrl ||
      assembledVideo?.videoUrl;
    if (playableSrc) {
      if (playableSrc.startsWith('blob:')) {
        return playableSrc;
      }
      if (playableSrc.includes('/api/video-proxy?')) {
        return playableSrc.includes('download=1')
          ? playableSrc
          : `${playableSrc}&download=1&filename=montage_capcut.mp4`;
      }
      if (playableSrc.startsWith('/api/')) {
        const sep = playableSrc.includes('?') ? '&' : '?';
        return `${playableSrc}${sep}download=1&filename=montage_capcut.mp4`;
      }
      return playableSrc;
    }
    return '/api/capcut-clean-video.mp4?download=1&filename=montage_capcut.mp4';
  };

  // Téléchargement direct et instantané de la vidéo propre pour CapCut (0 traitement FFmpeg serveur, 0 blocage)
  const handleDownloadCleanCapCut = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsDownloadingVideo(true);
    setRenderError(null);
    try {
      setIncludeSubtitles(false);
      setIncludeVoiceover(false);
      setAssembledVideo(null);
      setLastMp4BlobUrl(null);
      lastMp4BlobRef.current = null;
      setPreviewMode('interactive');
      if (interactiveVoiceRef.current) {
        interactiveVoiceRef.current.pause();
        interactiveVoiceRef.current.muted = true;
      }
      if (interactiveVideoRef.current) {
        interactiveVideoRef.current.muted = isInteractiveMuted;
      }
      if (isSfxEnabled) {
        soundFx.playSfx('cash');
      }

      const videoUrl = resolveCleanCapCutVideoUrl();
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = 'montage_capcut.mp4';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Téléchargement de la vidéo brute sans texte (pour CapCut) lancé !', 'Téléchargement Réussi');
    } catch (err: any) {
      console.error('Clean CapCut direct download error:', err);
    } finally {
      // Remet systématiquement l'état de chargement à false pour que le bouton ne reste jamais figé
      setIsDownloadingVideo(false);
    }
  };

  const handleDownloadVideo = async (
    e?: React.MouseEvent,
    forceCleanCapCut?: boolean
  ) => {
    if (e) e.preventDefault();

    // Si l'utilisateur clique sur "Télécharger la vidéo sans texte et sans voix robotique" (ou si sous-titres + voix-off sont désactivés),
    // déclenche immédiatement le téléchargement direct du MP4 brut via <a> sans aucun traitement FFmpeg serveur !
    if (forceCleanCapCut || (!includeSubtitles && !includeVoiceover)) {
      handleDownloadCleanCapCut(e);
      return;
    }

    if (!scriptResult) return;
    if (!hasDeductedCreditForCurrentVideo && userCredits <= 0) {
      onRequireUpgrade?.();
      return;
    }
    if (!hasDeductedCreditForCurrentVideo) {
      setHasDeductedCreditForCurrentVideo(true);
      onDeductCredit();
    }

    const useSubtitles = Boolean(includeSubtitles);
    const useVoiceover = Boolean(includeVoiceover);

    setIsDownloadingVideo(true);
    setRenderError(null);
    if (isSfxEnabled) {
      soundFx.playSfx('cash');
    }

    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 300000);

    try {
      const effectiveVoiceId =
        !selectedVoice.id || selectedVoice.id === 'voice_none'
          ? 'fr_leader_energique'
          : selectedVoice.id;
      const effectiveGeminiVoice =
        !selectedVoice.geminiVoice || selectedVoice.geminiVoice === 'NONE'
          ? 'Fenrir'
          : selectedVoice.geminiVoice;
      const effectiveTemplateId =
        selectedSubtitle.subtitleTemplateId || selectedSubtitle.id || 'brown-fox-box';

      // If server already rendered the .MP4 file with the exact same settings, fetch('/api/final-video.mp4') and download immediately
      if (
        !forceCleanCapCut &&
        assembledVideo?.renderedOnServer &&
        assembledVideo?.videoUrl &&
        generatedVoiceId === effectiveVoiceId &&
        generatedStudioBoost === isStudioBassBoost &&
        Math.abs(generatedAtSpeed - currentVoiceSpeed) < 0.03
      ) {
        const res = await fetch('/api/final-video.mp4', { cache: 'no-store' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 10000) {
            await downloadAndShareMp4Blob(blob, 'montage_viral_61s.mp4');
            return;
          }
        }
        const targetUrl = getFinalDownloadHref();
        setLastDirectDownloadUrl(targetUrl);
        await triggerBlobDownload({
          url: targetUrl,
          filename: 'montage_viral_61s.mp4',
          fallbackMimeType: 'video/mp4',
        });
      } else {
        // Ensure we have the exact character voiceover track generated for selectedVoice.id + currentVoiceSpeed + isStudioBassBoost (only if useVoiceover is true)
        let trackToUse = autoVoiceTrack;
        if (
          useVoiceover &&
          (!trackToUse ||
            (!trackToUse.voiceFileId && !trackToUse.audioBase64) ||
            generatedVoiceId !== effectiveVoiceId ||
            generatedStudioBoost !== isStudioBassBoost ||
            Math.abs(generatedAtSpeed - currentVoiceSpeed) >= 0.03)
        ) {
          trackToUse = await triggerAutoVoiceoverGeneration(
            scriptResult.fullScript,
            currentVoiceSpeed,
            isStudioBassBoost
          );
        }

        const preparedVideos = await prepareClipsForServerAssembly(orderedClips);
        const useDirectStreamCopy = !useSubtitles || !useVoiceover;
        const ffmpegArgs = useDirectStreamCopy
          ? ['-c', 'copy', '-threads', '1']
          : ['-preset', 'ultrafast', '-crf', '28', '-threads', '1'];

        const assembleRes = await fetch('/api/assemble-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: abortCtrl.signal,
          body: JSON.stringify({
            videos: preparedVideos,
            scriptText: assembledVideo?.cleanedText || cleanedSpokenScript,
            voiceName: effectiveGeminiVoice,
            voiceId: effectiveVoiceId,
            characterStylePrompt: selectedVoice.characterPrompt,
            voiceSpeed: currentVoiceSpeed,
            voiceRate: currentVoiceSpeed,
            voiceVolume: currentVoiceVolume,
            studioBassBoost: isStudioBassBoost,
            language: selectedVoice.langCode || selectedLanguage,
            voiceAudioBase64:
              useVoiceover && !trackToUse?.voiceFileId
                ? trackToUse?.audioBase64 || ''
                : '',
            voiceFileId: useVoiceover ? trackToUse?.voiceFileId || '' : '',
            includeSubtitles: Boolean(useSubtitles),
            showSubtitles: Boolean(useSubtitles),
            includeVoiceover: Boolean(useVoiceover),
            useDirectStreamCopy,
            ffmpegArgs,
            ffmpegPreset: 'ultrafast',
            ffmpegCrf: 28,
            ffmpegThreads: 1,
            subtitleTemplateId: useSubtitles ? effectiveTemplateId : 'none',
            subtitleX: subX,
            subtitleY: effectiveSubY,
            subtitleScale: subScale,
            hookBannerEnabled: Boolean(useSubtitles && hookBannerEnabled),
            hookBannerText: useSubtitles ? hookBannerText : '',
            hookBannerBgColor,
            subtitleStyle: useSubtitles
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
                  subtitleX: subX,
                  subtitleY: effectiveSubY,
                  subtitleScale: subScale,
                  coverCompetitorText: effectiveCoverCompetitor,
                  hookBannerEnabled: Boolean(hookBannerEnabled),
                  hookBannerText,
                  hookBannerBgColor,
                }
              : null,
            musicId: selectedMusic.id,
            bgmVolume,
            musicVolume: bgmVolume,
            musicEnabled: isMusicEnabled && bgmVolume > 0,
            sfxEnabled: isSfxEnabled && useVoiceover,
            selectedSfxIds:
              isSfxEnabled && useVoiceover ? selectedMusic.selectedSfxIds || [] : [],
          }),
        });

        const data = await assembleRes.json().catch(() => ({}));
        if (!assembleRes.ok || !data.success || !data.videoUrl) {
          throw new Error(
            data.error ||
              `Échec de l'assemblage FFmpeg (.MP4) (HTTP ${assembleRes.status}). Vérifiez les liens TikTok fournis.`
          );
        }

        const dlUrl =
          data.downloadUrl ||
          `/api/download-final-video?file=${encodeURIComponent(
            data.videoUrl.split('/').pop() || ''
          )}`;

        setLastDirectDownloadUrl(dlUrl);
        setAssembledVideo({
          videoUrl: data.videoUrl,
          downloadUrl: dlUrl,
          mimeType: 'video/mp4',
          fileExtension: 'mp4',
          voiceoverUrl: data.voiceoverUrl || trackToUse?.blobUrl || voicePreviewUrl || '',
          cleanedText: data.cleanedText || cleanedSpokenScript,
          durationSeconds: 61,
          renderedOnServer: true,
        });
        setPreviewMode('mp4');

        // Récupère le fichier vidéo final via fetch('/api/final-video.mp4') en Blob et déclenche le téléchargement automatique + navigator.share sur mobile
        let fileRes = await fetch('/api/final-video.mp4', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (!fileRes.ok) {
          fileRes = await fetch(dlUrl, { credentials: 'same-origin', cache: 'no-store' });
        }
        if (!fileRes.ok) {
          throw new Error(
            `Impossible de récupérer le fichier vidéo .MP4 compilé (HTTP ${fileRes.status}).`
          );
        }
        const rawBlob = await fileRes.blob();
        if (rawBlob.size < 10000) {
          throw new Error(
            'Le fichier .MP4 généré est invalide ou trop léger. Vérifiez vos liens vidéo TikTok.'
          );
        }
        await downloadAndShareMp4Blob(rawBlob, 'montage_viral_61s.mp4');
      }
    } catch (err: any) {
      console.error('MP4 download/render error:', err);
      // Fallback de téléchargement direct via <a> pour éviter tout blocage
      try {
        const fallbackHref =
          lastMp4BlobUrl || assembledVideo?.videoUrl || resolveCleanCapCutVideoUrl();
        const a = document.createElement('a');
        a.href = fallbackHref;
        a.download = 'montage_viral_61s.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        setRenderError(
          err?.message ||
            'Erreur lors du rendu ou du téléchargement du fichier .MP4. Vérifiez vos liens TikTok.'
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setIsDownloadingVideo(false);
    }
  };

  const handleDownloadAudioWav = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!assembledVideo?.voiceoverUrl || isDownloadingAudio) return;
    setIsDownloadingAudio(true);
    soundFx.playSfx('click');

    try {
      await triggerBlobDownload({
        url: assembledVideo.voiceoverUrl,
        filename: 'cortia-piste-audio.wav',
        fallbackMimeType: 'audio/wav',
      });
    } catch (err) {
      console.error('Background WAV blob download error:', err);
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  const copyToClipboard = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    soundFx.playSfx('click');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Compute current synchronized subtitle phrase for the Interactive Live Player (Draggable with finger & Zoomable 50%-200%)
  const renderLiveAnimatedSubtitles = () => {
    if (!includeSubtitles || spokenWords.length === 0) return null;

    const progress = Math.max(
      0,
      Math.min(0.999, (interactiveElapsedSec % totalPreviewDuration) / totalPreviewDuration)
    );
    const currentGlobalWordIdx = Math.floor(progress * spokenWords.length);

    const styleId =
      selectedSubtitle.subtitleTemplateId || selectedSubtitle.id || 'brown-fox-box';
    const isWordByWord = Boolean(
      selectedSubtitle.wordByWord ||
        styleId === 'word-by-word' ||
        styleId === 'viral_1word_flash'
    );

    const wrapDraggableSubtitle = (innerContent: React.ReactNode) => (
      <div
        onPointerDown={(e) => {
          e.stopPropagation();
          setIsDraggingSubStep5(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        style={{
          left: `${subX}%`,
          top: `${effectiveSubY}%`,
          transform: `translate(-50%, -50%) scale(${subScale / 100})`,
          zIndex: 35,
          filter: 'none',
          WebkitFilter: 'none',
        }}
        title="Glisse avec le doigt pour déplacer les sous-titres (ou pince à 2 doigts pour zoomer)"
        className={`absolute z-30 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing px-3 py-1.5 rounded-2xl max-w-[92%] ${
          effectiveCoverCompetitor
            ? 'bg-[#05080f]/95 border border-emerald-400/75 shadow-2xl'
            : 'border border-dashed border-white/25 hover:border-emerald-400/80'
        }`}
      >
        {innerContent}
      </div>
    );

    // 0. MODE "1 MOT PAR 1 MOT" (word-by-word / viral_1word_flash)
    if (isWordByWord) {
      const singleWord = (spokenWords[currentGlobalWordIdx] || spokenWords[0] || '').toUpperCase();
      return wrapDraggableSubtitle(
        <span
          key={currentGlobalWordIdx}
          className="font-black text-2xl sm:text-3xl tracking-wider uppercase text-white text-center select-none transition-transform duration-75 scale-105 whitespace-nowrap"
          style={{
            WebkitTextStroke: '2.5px #000000',
            textShadow: '0 4px 12px rgba(0,0,0,0.98), 0 0 6px rgba(0,0,0,0.95)',
          }}
        >
          {singleWord}
        </span>
      );
    }

    // Two-line CapCut styles (quick-cyan, hormozi-yellow, pink-magenta, minimal-clean)
    const isTwoLine =
      styleId === 'quick-cyan' ||
      styleId === 'capcut_2line_cyan' ||
      styleId === 'hormozi-yellow' ||
      styleId === 'hormozi' ||
      styleId === 'pink-magenta' ||
      styleId === 'capcut_pink_pro' ||
      styleId === 'minimal-clean' ||
      styleId === 'minimal';

    const wordsPerPhrase = isTwoLine ? 4 : 3;
    const phraseIndex = Math.floor(currentGlobalWordIdx / wordsPerPhrase);
    const phraseStart = phraseIndex * wordsPerPhrase;
    const phraseWords = spokenWords.slice(phraseStart, phraseStart + wordsPerPhrase);
    const activeWordInPhrase = currentGlobalWordIdx - phraseStart;

    const isCasePreserved = styleId === 'capcut_classic_pro';
    const formattedWords = phraseWords.map((w) => (isCasePreserved ? w : w.toUpperCase()));

    if (isTwoLine && formattedWords.length >= 2) {
      const mid = Math.ceil(formattedWords.length / 2);
      const line1 = formattedWords.slice(0, mid).join(' ');
      const line2 = formattedWords.slice(mid).join(' ');

      const isMinimal = styleId === 'minimal-clean' || styleId === 'minimal';
      const line2Class =
        styleId === 'hormozi-yellow' || styleId === 'hormozi'
          ? 'text-yellow-400'
          : styleId === 'pink-magenta' || styleId === 'capcut_pink_pro'
          ? 'text-pink-500'
          : isMinimal
          ? 'text-sky-400'
          : 'text-cyan-400';

      const strokeStyle = isMinimal
        ? {}
        : {
            WebkitTextStroke: '1.5px #000000',
            textShadow: '0 2px 6px rgba(0,0,0,0.95)',
          };

      return wrapDraggableSubtitle(
        <div className="flex flex-col items-center justify-center text-center leading-tight whitespace-nowrap">
          <span
            className={`text-white ${
              isMinimal
                ? 'font-bold text-xs sm:text-sm tracking-wider drop-shadow-md'
                : 'font-black text-lg sm:text-xl tracking-tight'
            }`}
            style={strokeStyle}
          >
            {line1}
          </span>
          <span
            className={`${line2Class} ${
              isMinimal
                ? 'font-bold text-xs sm:text-sm tracking-wider drop-shadow-md'
                : 'font-black text-lg sm:text-xl tracking-tight scale-105'
            }`}
            style={strokeStyle}
          >
            {line2}
          </span>
        </div>
      );
    }

    // 1. brown-fox-box / capcut_box_cyan (White & cyan on rounded black background)
    if (styleId === 'brown-fox-box' || styleId === 'capcut_box_cyan') {
      return wrapDraggableSubtitle(
        <div className="px-4 py-2 rounded-2xl bg-black/95 border border-slate-800 shadow-2xl flex flex-wrap items-center justify-center gap-1.5 text-center">
          {formattedWords.map((word, idx) => {
            const isCurrent =
              idx === activeWordInPhrase || idx === formattedWords.length - 1;
            return (
              <span
                key={idx}
                className={`font-black text-base sm:text-lg tracking-tight ${
                  isCurrent ? 'text-cyan-400 scale-105' : 'text-white'
                }`}
              >
                {word}
              </span>
            );
          })}
        </div>
      );
    }

    // 2. brown-fox-glow / capcut_glow_cyan (White & cyan with glowing halo)
    if (styleId === 'brown-fox-glow' || styleId === 'capcut_glow_cyan') {
      return wrapDraggableSubtitle(
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-center">
          {formattedWords.map((word, idx) => {
            const isCurrent =
              idx === activeWordInPhrase || idx === formattedWords.length - 1;
            return (
              <span
                key={idx}
                className={`font-black text-base sm:text-lg tracking-tight ${
                  isCurrent ? 'text-cyan-300 scale-110' : 'text-white'
                }`}
                style={{
                  textShadow: isCurrent
                    ? '0 0 12px rgba(34,211,238,1), 0 0 24px rgba(6,182,212,0.95)'
                    : '0 0 10px rgba(255,255,255,0.85), 0 2px 4px rgba(0,0,0,0.9)',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      );
    }

    // 5. yellow-glow / capcut_yellow_glow (THE QUICK - Jaune lumineux)
    if (styleId === 'yellow-glow' || styleId === 'capcut_yellow_glow') {
      return wrapDraggableSubtitle(
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-center">
          {formattedWords.map((word, idx) => {
            const isCurrent = idx === activeWordInPhrase;
            return (
              <span
                key={idx}
                className={`font-black text-lg sm:text-xl tracking-wide text-yellow-300 ${
                  isCurrent ? 'scale-110' : ''
                }`}
                style={{
                  textShadow:
                    '0 0 14px rgba(250,204,21,0.95), 0 0 26px rgba(234,179,8,0.85), 0 2px 4px rgba(0,0,0,0.9)',
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      );
    }

    // Fallback clean white
    return wrapDraggableSubtitle(
      <div className="px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-xs flex flex-wrap items-center justify-center gap-1.5 text-center">
        {formattedWords.map((word, idx) => (
          <span
            key={idx}
            className="font-semibold text-base sm:text-lg text-white drop-shadow-md"
          >
            {word}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111927] to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Étape 5 sur 5 (Finale)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Montage .MP4 Serveur FFmpeg (H.264 + AAC) & Aperçu Temps Réel
            </span>
          </div>
          <h2 className="text-xl font-black text-white">{t.step5Title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Génère le script viral par IA, écoute la voix-off nettoyée et télécharge le vrai fichier .MP4 assemblé par FFmpeg sur le serveur.
          </p>
        </div>

        {scriptResult && (
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Score Viral IA
              </p>
              <p className="text-sm font-black text-white font-mono">
                {scriptResult.estimatedViralityScore} / 100
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Visual Analysis (Zero Hallucination) + Automatic Language Detection Panel */}
      <div className="bg-[#0f1522] border border-emerald-500/35 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                👁️ Analyse Visuelle Obligatoire (Zéro Hallucination)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                ⏱️ Structure d&apos;Élite 61s (165 à 175 mots)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gemini analyse automatiquement les images réelles de ta vidéo pour détecter la thématique exacte (animaux, cuisine, artisanat, auto, nettoyage...) et composer une narration 100 % captivante, sans aucun élément inventé.
            </p>
          </div>

          {/* Automatic Language Detection & Multi-Market Selector synced with Step 3 */}
          <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
              🌍 Langue Détectée &amp; Marché Cible :
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { code: 'fr' as const, label: '🇫🇷 Français' },
                { code: 'en' as const, label: '🇺🇸 Anglais (US)' },
                { code: 'es' as const, label: '🇪🇸 Espagnol' },
                { code: 'de' as const, label: '🇩🇪 Allemand' },
                { code: 'zh' as const, label: '🇨🇳 Chinois (中文)' },
                { code: 'ko' as const, label: '🇰🇷 Coréen (한국어)' },
                { code: 'ja' as const, label: '🇯🇵 Japonais (日本語)' },
              ].map((langOpt) => {
                const isLangActive = effectiveScriptLanguage === langOpt.code;
                return (
                  <button
                    key={langOpt.code}
                    type="button"
                    disabled={isGeneratingScript}
                    onClick={() => handleSwitchScriptLanguage(langOpt.code, Boolean(scriptResult))}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                      isLangActive
                        ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 border-emerald-300 shadow-md shadow-emerald-500/20'
                        : 'bg-[#0b101b] border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {langOpt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visual Action Description Input + 1-Click Universal Scene Presets (Zero Hallucination) */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <span>🎯 Action visuelle exacte à l&apos;écran (optionnel — renforce le Zéro Hallucination) :</span>
            </label>
            <span className="text-[10px] font-mono text-emerald-400">
              + Extraction auto de 3 images clés de la vidéo importée
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={visualDescription}
              onChange={(e) => setVisualDescription(e.target.value)}
              placeholder={`Ex: Toilettage d’un chiot avec bain moussant, ou cuisine d’un plat croustillant (laisse vide pour analyse visuelle auto de « ${hookClip.title} »)`}
              className="flex-1 bg-[#0b0f17] border border-slate-700/90 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-hidden"
            />
            {scriptResult && (
              <button
                type="button"
                disabled={isGeneratingScript}
                onClick={() => handleGenerateScript(narrativeStyle, selectedScenarioCode)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all"
              >
                🔄 Régénérer selon cette scène
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-slate-400 mr-1">Scènes rapides :</span>
            {[
              {
                label: '🐶 Toilettage & Chiots',
                value:
                  'Toilettage canin, coupe de poils, bain moussant et transformation spectaculaire d’un chien ou chiot adorable',
              },
              {
                label: '🍳 Cuisine & Recettes',
                value:
                  'Préparation culinaire rapide, découpe précise d’ingrédients frais, cuisson crépitante et dressage gourmand',
              },
              {
                label: '🚗 Detailing & Auto',
                value:
                  'Rénovation automobile complète, lavage canon à mousse, décontamination carrosserie et polissage miroir',
              },
              {
                label: '🧼 Nettoyage Extrême',
                value:
                  'Nettoyage haute pression intensif, injection-extraction de surface encrassée, mousse active et transformation avant-après',
              },
              {
                label: '🔨 Artisanat & Restauration',
                value:
                  'Restauration d’un objet ancien, ponçage méticuleux du bois, travail des métaux et finition artisanale parfaite',
              },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  soundFx.playSfx('click');
                  setVisualDescription(preset.value);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  visualDescription === preset.value
                    ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                    : 'bg-[#0b101b] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 9-Block Elite Psychological Structure Overview (00:00 -> 01:01 / 165-175 words) */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-1">
          {[
            { time: '00:00-00:05', title: 'HOOK CHOC + CTA' },
            { time: '00:05-00:15', title: 'ANECDOTE TERRAIN' },
            { time: '00:15-00:20', title: 'RE-HOOK #1' },
            { time: '00:20-00:30', title: 'ERREUR CRITIQUE' },
            { time: '00:30-00:35', title: 'RE-HOOK #2' },
            { time: '00:35-00:45', title: 'ACTION ASMR' },
            { time: '00:45-00:50', title: 'RE-HOOK #3' },
            { time: '00:50-00:55', title: 'TRANSFORMATION' },
            { time: '00:55-01:01', title: 'CTA DÉBAT FINAL' },
          ].map((b) => (
            <div
              key={b.time}
              className="bg-[#0b101b] border border-slate-800/90 rounded-lg p-1.5 text-center"
            >
              <p className="text-[9px] font-mono font-black text-cyan-400">{b.time}</p>
              <p className="text-[9px] font-extrabold text-slate-200 truncate mt-0.5">{b.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Part 1: Viral Script AI Generator */}
      {!scriptResult ? (
        <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 mx-auto shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0d121d] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
          </div>

          <div className="max-w-lg mx-auto">
            <h3 className="text-lg font-black text-white">Prêt à générer le script viral (165 à 175 mots)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Gemini analysera visuellement tes{' '}
              {orderedClips.length} vraie(s) vidéo(s) (« {visualDescription.trim() || hookClip.title} ») et rédigera le script
              calibré à 01:01 en{' '}
              {effectiveScriptLanguage === 'en'
                ? 'ANGLAIS US'
                : effectiveScriptLanguage === 'es'
                ? 'ESPAGNOL'
                : effectiveScriptLanguage === 'de'
                ? 'ALLEMAND (DEUTSCH)'
                : effectiveScriptLanguage === 'zh'
                ? 'CHINOIS MANDARIN (中文)'
                : effectiveScriptLanguage === 'ko'
                ? 'CORÉEN (한국어)'
                : effectiveScriptLanguage === 'ja'
                ? 'JAPONAIS (日本語)'
                : 'FRANÇAIS'}.
            </p>
          </div>

          {/* Narrative Style Selector (Style A: 3M Financial Shock, Style B: 17.8M Mystery & Secret at Bottom, Style C: Unexpected Discovery) */}
          <div className="text-left max-w-2xl mx-auto space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                Option de Style Narratif Viral (Calibré à 01:01) :
              </span>
              <span className="text-[11px] font-bold text-emerald-400">
                165-175 mots • 9 Blocs Psychologiques
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {NARRATIVE_STYLE_OPTIONS.map((opt) => {
                const isSelected = narrativeStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      setNarrativeStyle(opt.id);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400 shadow-lg shadow-emerald-500/10'
                        : 'bg-[#0b101b] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            isSelected
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {opt.code}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white">
                          {opt.title}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{opt.subtitle}</p>
                    <p className="text-[10px] text-cyan-300/90 font-mono mt-1.5">
                      {opt.structureHint}
                    </p>
                  </button>
                );
              })}
            </div>
            {/* 5 Unique Narrative Scenarios Selector (Scénarios A, B, C, D, E — Zéro doublon audio) */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Angle Narratif 100 % Unique (5 Scénarios Anti-Doublon) :
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playSfx('click');
                    setSelectedScenarioCode('');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                    selectedScenarioCode === ''
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-xs'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  🎲 Rotation Automatique (A → E)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {SCENARIO_VARIATION_OPTIONS.map((sc) => {
                  const isScSelected = selectedScenarioCode === sc.code;
                  return (
                    <button
                      key={sc.code}
                      type="button"
                      onClick={() => {
                        soundFx.playSfx('click');
                        setSelectedScenarioCode(sc.code);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isScSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm'
                          : 'bg-[#0b101b] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            isScSelected
                              ? 'bg-cyan-400 text-slate-950'
                              : 'bg-slate-800 text-cyan-300'
                          }`}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-[11px] font-extrabold text-white leading-tight">
                        {sc.shortTitle}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {sc.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {scriptError && (
            <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 font-semibold">
              {scriptError}
            </div>
          )}

          <button
            onClick={() => handleGenerateScript(narrativeStyle, selectedScenarioCode)}
            disabled={isGeneratingScript}
            className="py-4 px-8 rounded-2xl font-black text-sm tracking-wide text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            {isGeneratingScript ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Analyse visuelle Gemini &amp; rédaction 61s (165-175 mots)...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>
                  {t.generateScriptBtn} ({effectiveScriptLanguage.toUpperCase()} • Zéro Hallucination)
                </span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Generated Script Presentation */
        <div className="space-y-5">
          {/* Script Box */}
          <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            {/* Verified Visual Analysis Banner (Zero Hallucination) */}
            {scriptResult.visualAnalysis && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/40 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    👁️ Analyse Visuelle Gemini Vérifiée (Zéro Hallucination) :
                  </span>
                  <p className="text-xs text-slate-200 font-medium leading-relaxed">
                    {scriptResult.visualAnalysis}
                  </p>
                </div>
              </div>
            )}

            {/* Narrative Style Switcher + 5 Unique Scenarios Switcher (Scénarios A, B, C, D, E) */}
            <div className="bg-[#0b101b] border border-amber-500/30 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  Template Narratif &amp; Angle 100 % Unique (Zéro doublon audio) :
                </span>
                <button
                  type="button"
                  disabled={isGeneratingScript}
                  onClick={() => {
                    soundFx.playSfx('whoosh');
                    setSelectedScenarioCode('');
                    handleGenerateScript(narrativeStyle, '');
                  }}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingScript ? 'animate-spin' : ''}`} />
                  <span>🎲 Générer une Nouvelle Histoire 100 % Inédite (Scénario suivant)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {NARRATIVE_STYLE_OPTIONS.map((opt) => {
                  const isActive = narrativeStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isGeneratingScript}
                      onClick={() => {
                        soundFx.playSfx('click');
                        setNarrativeStyle(opt.id);
                        handleGenerateScript(opt.id, '');
                      }}
                      className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-sm'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isActive
                                ? 'bg-emerald-400 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {opt.code}
                          </span>
                          <span className="text-[10px] font-black text-amber-300">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs font-extrabold leading-snug">{opt.title}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{opt.subtitle}</p>
                    </button>
                  );
                })}
              </div>

              {/* Quick 5-Scenario Bar (A: Urgence 24h, B: Erreur Chimique, C: Secret du Fond, D: Défi Impossible, E: Valeur Maison) */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider mr-1">
                    Forcer un Scénario :
                  </span>
                  {SCENARIO_VARIATION_OPTIONS.map((sc) => {
                    const isCurrentScenario = scriptResult.scenarioCode === sc.code;
                    return (
                      <button
                        key={sc.code}
                        type="button"
                        disabled={isGeneratingScript}
                        onClick={() => {
                          soundFx.playSfx('click');
                          setSelectedScenarioCode(sc.code);
                          handleGenerateScript(narrativeStyle, sc.code);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
                          isCurrentScenario
                            ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-xs'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                        }`}
                      >
                        {sc.label} : {sc.shortTitle}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Script Narratif Complet (01:01 • 61s • {effectiveScriptLanguage.toUpperCase()})
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-[10px] font-black text-cyan-300">
                    💰 01:01 (61s) — Éligible Monétisation TikTok
                  </span>
                  {scriptResult.scenarioTitle && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[10px] font-black text-amber-300">
                      ✨ {scriptResult.scenarioTitle}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-extrabold text-white">
                  Hook : « {scriptResult.hookText} »
                </h3>
              </div>

              {/* Optimize script + Instant Listen to Speechma Voiceover */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlayScriptVoiceover}
                  disabled={isGeneratingVoicePreview}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  {isGeneratingVoicePreview ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthèse Speechma ({currentVoiceSpeed.toFixed(2)}x)...</span>
                    </>
                  ) : isPlayingVoiceAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause Voix Speechma ({selectedVoice.name} • {currentVoiceSpeed.toFixed(2)}x)</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>🔊 Écouter la voix Speechma générée ({selectedVoice.name})</span>
                    </>
                  )}
                </button>

                <select
                  value={optimizationFocus}
                  onChange={(e) => setOptimizationFocus(e.target.value as any)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-hidden"
                >
                  <option value="hook">⚡ Hook plus percutant</option>
                  <option value="pacing">⏩ Rythme accéléré</option>
                  <option value="cta">🎯 CTA ultra-viral</option>
                  <option value="story">🔥 Storytelling captivant</option>
                </select>

                <button
                  onClick={handleOptimizeScript}
                  disabled={optimizationsLeft <= 0 || isOptimizing}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    optimizationsLeft > 0
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                  <span>
                    {t.optimiseScriptBtn} ({optimizationsLeft}/3)
                  </span>
                </button>
              </div>
            </div>

            {/* Step 5 Voiceover Speed Slider (1.0x to 2.0x) */}
            <div className="bg-[#0b101b] border border-cyan-500/30 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-extrabold text-white">
                    Vitesse de la Voix-off (Accélérateur 1.0x à 2.0x) :
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-black">
                    {currentVoiceSpeed.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Musique : {isMusicEnabled ? `✓ Oui (${selectedMusic.name})` : '✗ Non'}</span>
                  <span>•</span>
                  <span>SFX : {isSfxEnabled ? `✓ Oui (${(selectedMusic.selectedSfxIds || ['sfx_bass_impact', 'sfx_scene_switch']).length})` : '✗ Non'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400">1.0x</span>
                <input
                  type="range"
                  min={1.0}
                  max={2.0}
                  step={0.05}
                  value={currentVoiceSpeed}
                  onChange={(e) => handleStep5VoiceSpeedChange(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-cyan-400 font-bold">2.0x</span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  {STEP5_VOICE_SPEED_PRESETS.map((preset) => {
                    const isActive = Math.abs(currentVoiceSpeed - preset.value) < 0.02;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleStep5VoiceSpeedChange(preset.value)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-sm'
                            : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Quick 1-Word-by-1-Word Viral Flash Toggle at Step 5 */}
                <label className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      selectedSubtitle.wordByWord ||
                        selectedSubtitle.id === 'word-by-word' ||
                        selectedSubtitle.id === 'viral_1word_flash'
                    )}
                    onChange={(e) => {
                      if (!onSubtitleChange) return;
                      soundFx.playSfx('click');
                      const checked = e.target.checked;
                      const nextId = checked
                        ? 'word-by-word'
                        : selectedSubtitle.id === 'word-by-word' ||
                          selectedSubtitle.id === 'viral_1word_flash'
                        ? 'brown-fox-box'
                        : selectedSubtitle.id;
                      onSubtitleChange({
                        ...selectedSubtitle,
                        id: nextId,
                        subtitleTemplateId: nextId,
                        name: checked
                          ? 'Affichage 1 Mot par 1 Mot (Style Viral Flash)'
                          : selectedSubtitle.name,
                        wordByWord: checked,
                      });
                    }}
                    className="w-3.5 h-3.5 accent-amber-400 rounded cursor-pointer"
                  />
                  <span className="text-[11px] font-extrabold text-amber-300">
                    ⚡ Sous-titres 1 Mot par 1 Mot (Style Viral Flash)
                  </span>
                </label>

                {/* Option "Voix Dynamique & Basses Renforcées" (Checked by default) at Step 5 */}
                <label
                  onClick={() => handleToggleStep5StudioBassBoost(!isStudioBassBoost)}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border cursor-pointer select-none transition-all ${
                    isStudioBassBoost
                      ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300 shadow-xs'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all shrink-0 ${
                      isStudioBassBoost
                        ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                        : 'bg-slate-950 border-slate-600 text-transparent'
                    }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  <span className="text-[11px] font-extrabold">
                    🎙️ Boost Basses &amp; Présence Studio (Micro Créateur)
                  </span>
                </label>
              </div>
            </div>

            {/* Step 5 Voiceover Volume Slider (50% to 200%) + Quick Presets */}
            <div className="bg-[#0b101b] border border-cyan-500/35 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-extrabold text-white">
                    Volume de la Voix-off (50% à 200%) :
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-black">
                    {currentVoiceVolume}%
                  </span>
                  {currentVoiceVolume >= 130 && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black">
                      🔊 Boost WebAudio + FFmpeg ({(currentVoiceVolume / 100).toFixed(2)}x)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      handleStep5VoiceVolumeChange(currentVoiceVolume - 10);
                    }}
                    className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 flex items-center justify-center font-black text-xs cursor-pointer"
                    title="Réduire le volume de la voix (-10%)"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      handleStep5VoiceVolumeChange(currentVoiceVolume + 10);
                    }}
                    className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 flex items-center justify-center font-black text-xs cursor-pointer"
                    title="Augmenter le volume de la voix (+10%)"
                  >
                    +
                  </button>
                  <span className="text-[11px] text-slate-400 truncate max-w-[180px] ml-1">
                    Voix : {selectedVoice.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400">50%</span>
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={5}
                  value={currentVoiceVolume}
                  onChange={(e) => handleStep5VoiceVolumeChange(parseInt(e.target.value, 10))}
                  className="flex-1 accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-cyan-400 font-bold">200%</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                {STEP5_VOICE_VOLUME_PRESETS.map((preset) => {
                  const isActive = currentVoiceVolume === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => {
                        soundFx.playSfx('click');
                        handleStep5VoiceVolumeChange(preset.value);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border flex items-center gap-1 ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-xs'
                          : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>{preset.label}</span>
                      {preset.badge && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-black ${
                            isActive
                              ? 'bg-slate-950/20 text-slate-950'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                        >
                          {preset.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5 Background Music Volume Slider (0% to 100%) + Mute 0% Button */}
            <div className="bg-[#0b101b] border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-extrabold text-white">
                    Volume de la Musique de Fond (0% à 100%) :
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-black">
                    {isMusicEnabled ? `${bgmVolume}%` : '0% (Muet)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      handleStep5BgmVolumeChange(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition-all ${
                      !isMusicEnabled || bgmVolume === 0
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    🔇 Muet 0%
                  </button>
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                    Piste : {selectedMusic.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400">0%</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={isMusicEnabled ? bgmVolume : 0}
                  onChange={(e) => handleStep5BgmVolumeChange(parseInt(e.target.value, 10))}
                  className="flex-1 accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-emerald-400 font-bold">100%</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                {[0, 5, 10, 15, 22, 35, 50, 75, 100].map((pct) => {
                  const isActive = (isMusicEnabled ? bgmVolume : 0) === pct;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        soundFx.playSfx('click');
                        handleStep5BgmVolumeChange(pct);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-xs'
                          : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {pct === 0 ? '0% Muet' : `${pct}%`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Script Textarea + Version History + Grammar & Spelling Correction Toolbar */}
            <div className="space-y-2">
              {/* Restoration Banner Notification */}
              {lastRestoredBanner && (
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{lastRestoredBanner}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastRestoredBanner(null)}
                    className="text-purple-300 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    Script Voix-off continu (00:00 → 01:00 sur les 3 vidéos)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                    {scriptResult.fullScript.split(/\s+/).filter(Boolean).length} mots
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Quick Undo / Restore Previous Version if 2+ exist */}
                  {scriptVersions.length >= 2 && (
                    <button
                      type="button"
                      onClick={handleQuickUndoPreviousVersion}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={`Restaurer la v${scriptVersions[1]?.versionNumber} (${scriptVersions[1]?.sourceLabel})`}
                    >
                      <Undo2 className="w-3.5 h-3.5 text-purple-400" />
                      <span className="hidden sm:inline">Annuler</span>
                      <span className="text-[10px] text-purple-300 font-mono">v{scriptVersions[1]?.versionNumber}</span>
                    </button>
                  )}

                  {/* Manual Snapshot Bookmark Button */}
                  <button
                    type="button"
                    onClick={() => handleCreateManualSnapshot()}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Sauvegarder un instantané manuel de cette version du script"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Instantané</span>
                  </button>

                  {/* Version History Modal Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsVersionHistoryOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Voir l'historique complet des versions et restaurer un état précédent en cas d'erreur IA"
                  >
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    <span>Historique</span>
                    {scriptVersions.length > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-400 text-slate-950 font-black">
                        {scriptVersions.length}
                      </span>
                    )}
                  </button>

                  {proofreadSuccessBadge && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Corrigé
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleProofreadScript}
                    disabled={isProofreading}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isProofreading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">Correction...</span>
                      </>
                    ) : (
                      <>
                        <span>✨ Corriger</span>
                        <span className="hidden md:inline">les fautes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={6}
                  value={scriptResult.fullScript}
                  onChange={(e) => {
                    setVoicePreviewUrl(null);
                    setScriptResult({ ...scriptResult, fullScript: e.target.value });
                  }}
                  onBlur={() => {
                    if (scriptResult?.fullScript) {
                      const latest = scriptVersions[0];
                      if (!latest || latest.fullScript.trim() !== scriptResult.fullScript.trim()) {
                        recordScriptVersion(
                          scriptResult,
                          'manual_edit',
                          'Modification manuelle'
                        );
                      }
                    }
                  }}
                  className="w-full bg-[#0b0f17] border border-slate-800/80 focus:border-emerald-500/50 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-hidden"
                />

                <button
                  onClick={() => copyToClipboard(scriptResult.fullScript, 'script')}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="Copier le script"
                >
                  {copiedField === 'script' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Cleaned Spoken Text Preview Banner + 1-Click Copy for CapCut TTS (Voix Julio) */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-purple-500/15 border-2 border-emerald-400/40 space-y-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Script Prêt pour Synthèse Vocale CapCut (Voix Julio • Phrases Courtes 5-8 mots)
                </span>
                <span className="text-[11px] font-mono font-bold text-cyan-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {spokenWords.length} mots • 01:01 (61s)
                </span>
              </div>
              <p className="text-xs text-slate-200 italic line-clamp-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                « {cleanedSpokenScript} »
              </p>
              <button
                type="button"
                onClick={() => copyToClipboard(cleanedSpokenScript, 'capcut_script_top')}
                className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer border-2 ${
                  copiedField === 'capcut_script_top'
                    ? 'bg-emerald-400 text-slate-950 border-emerald-200 shadow-lg shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-cyan-300/60 shadow-lg shadow-cyan-500/20'
                }`}
              >
                {copiedField === 'capcut_script_top' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      ✓ Script copié ({spokenWords.length} mots) — Colle-le dans CapCut (Voix Julio) !
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      📋 Copier le script complet (170 mots) — Spécial CapCut (Voix Julio)
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Suggested Titles, Description & Hashtags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Viral Titles */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  3 Titres Viraux Recommandés
                </span>
                <div className="space-y-1.5">
                  {scriptResult.suggestedTitles.map((title, idx) => (
                    <div
                      key={idx}
                      onClick={() => copyToClipboard(title, `title_${idx}`)}
                      className="p-2 rounded-lg bg-[#0b0f17] border border-slate-800/70 hover:border-emerald-500/40 text-xs font-semibold text-slate-200 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                    >
                      <span className="truncate">{title}</span>
                      {copiedField === `title_${idx}` ? (
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Description & Hashtags */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Description & Hashtags
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${scriptResult.description}\n\n${scriptResult.hashtags.join(' ')}`,
                        'desc'
                      )
                    }
                    className="text-[10px] text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'desc' ? 'Copié !' : 'Copier tout'}
                  </button>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">{scriptResult.description}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {scriptResult.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Part 2: Live Rendering or Synchronized 9:16 Video Player + Server .MP4 Export */}
          {isRendering ? (
            /* Live Canvas 1080x1920 Monitor + Server FFmpeg Progress Checklist */
            <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                  <h3 className="text-sm font-bold text-white">
                    Montage .MP4 Serveur 01:01 (FFmpeg H.264 + AAC) en cours... ({renderStepIndex + 1}/
                    {RENDER_STEPS.length})
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {renderProgressPct}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${renderProgressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                {/* Live 1080x1920 Canvas Monitor */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative w-full max-w-[240px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-2xl bg-black">
                    <canvas
                      ref={canvasRef}
                      width={1080}
                      height={1920}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black flex items-center gap-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-white" /> FFMPEG .MP4 01:01
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-2 text-center">
                    Encodage H.264 + AAC (01:01 / 61s) sur le serveur en cours
                  </p>
                </div>

                {/* Checkbox step list */}
                <div className="md:col-span-7 space-y-2">
                  {RENDER_STEPS.map((step, idx) => {
                    const isDone = renderStepIndex > idx;
                    const isCurrent = renderStepIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-white line-through decoration-emerald-500/40 opacity-80'
                            : isCurrent
                            ? 'bg-slate-900 border-emerald-500 text-white shadow-md'
                            : 'bg-[#0b0f17] border-slate-800/80 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                          )}
                          <span className="text-xs font-semibold">{step.title}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                          {step.detail}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Part 3: Step 5 Video Player (Source TikTok muted={true} + Auto Voiceover audioRef.current.play() + Background Music + Server .MP4 Export) */
            <div className="bg-[#0f1522] border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {assembledVideo
                        ? 'Vidéo finale .MP4 (01:01) assemblée prête à publier !'
                        : 'Aperçu Vidéo Synchronisé 01:01 (Voix-off IA + Musique + Sous-titres)'}
                    </h3>
                    <p className="text-xs text-emerald-400 font-medium">
                      Appuie sur Play (▶) pour écouter la voix-off IA ({selectedVoice.name} • {currentVoiceSpeed.toFixed(2)}x) + musique ({isMusicEnabled ? selectedMusic.name : 'Désactivée'}) sur 01:01
                    </p>
                  </div>
                </div>

                {/* Mode Switcher: Interactive Synchronized Player vs Server .MP4 File */}
                <div className="flex flex-wrap items-center gap-2">
                  {assembledVideo && (
                    <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewMode('interactive');
                          setIsInteractivePlaying(true);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          previewMode === 'interactive'
                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Aperçu Interactif Live</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInteractivePlaying(false);
                          setPreviewMode('mp4');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          previewMode === 'mp4'
                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>Fichier .MP4 Serveur (01:01)</span>
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStartRender}
                    className="text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>{assembledVideo ? 'Relancer le montage' : `${t.generateFinalVideo} (1 crédit)`}</span>
                  </button>
                </div>
              </div>

              {/* Hidden <audio> elements for the real .WAV voiceover (audioRef) and synthesized background music */}
              <audio
                ref={audioRef}
                src={assembledVideo?.voiceoverUrl || voicePreviewUrl || undefined}
                loop
                preload="auto"
              />
              {bgmWavUrl && isMusicEnabled && (
                <audio
                  ref={interactiveBgmRef}
                  src={bgmWavUrl}
                  loop
                  preload="auto"
                />
              )}

              {/* 9:16 Vertical Video Player Container (Supports Finger Drag & Pinch-to-Zoom on Subtitles) */}
              <div className="flex flex-col items-center gap-4">
                <div
                  ref={step5PlayerBoxRef}
                  onPointerMove={(e) => {
                    if (!isDraggingSubStep5 || !step5PlayerBoxRef.current) return;
                    const rect = step5PlayerBoxRef.current.getBoundingClientRect();
                    const nx = Math.round(
                      Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100))
                    );
                    const ny = Math.round(
                      Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100))
                    );
                    updateStep5Subtitle({ subtitleX: nx, subtitleY: ny });
                  }}
                  onPointerUp={() => setIsDraggingSubStep5(false)}
                  onPointerLeave={() => setIsDraggingSubStep5(false)}
                  onTouchStart={(e) => {
                    if (e.touches.length === 2) {
                      const dx = e.touches[0].clientX - e.touches[1].clientX;
                      const dy = e.touches[0].clientY - e.touches[1].clientY;
                      step5PinchStartDistRef.current = Math.hypot(dx, dy);
                      step5PinchStartScaleRef.current = subScale;
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 2 && step5PinchStartDistRef.current) {
                      const dx = e.touches[0].clientX - e.touches[1].clientX;
                      const dy = e.touches[0].clientY - e.touches[1].clientY;
                      const dist = Math.hypot(dx, dy);
                      const ratio = dist / Math.max(10, step5PinchStartDistRef.current);
                      const nextScale = Math.round(
                        Math.max(50, Math.min(200, step5PinchStartScaleRef.current * ratio))
                      );
                      updateStep5Subtitle({ subtitleScale: nextScale });
                    }
                  }}
                  onTouchEnd={() => {
                    step5PinchStartDistRef.current = null;
                  }}
                  className="relative w-full max-w-[310px] sm:max-w-[330px] aspect-[9/16] rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl bg-[#090d16] touch-none"
                >
                  {effectivePreviewMode === 'mp4' ? (
                    /* Lecteur Vidéo <video controls controlsList="nodownload=false"> avec le vrai fichier .MP4 final assemblé par FFmpeg (720x1280 H.264 61s) */
                    <video
                      key={lastMp4BlobUrl || assembledVideo?.videoUrl || '/api/final-video.mp4'}
                      src={lastMp4BlobUrl || assembledVideo?.videoUrl || '/api/final-video.mp4?inline=1'}
                      playsInline
                      {...({ 'webkit-playsinline': 'true', controlsList: 'nodownload=false' } as any)}
                      controls
                      preload="auto"
                      loop
                      onLoadedMetadata={(e) => {
                        const v = e.currentTarget;
                        if (v.currentTime === 0) {
                          try {
                            v.currentTime = 0.08;
                          } catch {
                            // ignore
                          }
                        }
                        v.play().catch(() => {
                          try {
                            v.currentTime = 0.08;
                          } catch {
                            // ignore
                          }
                        });
                      }}
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    /* Lecteur Vidéo <video controls controlsList="nodownload=false"> temps réel via Proxy Anti-CORS (/api/video-proxy?url=...) */
                    <div className="relative w-full h-full select-none">
                      {isAutoAssemblingMp4 && (
                        <div className="absolute bottom-14 left-3 right-3 z-40 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-emerald-500/50 text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-2 pointer-events-none shadow-lg">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
                          <span>Assemblage FFmpeg de la vidéo finale 61s (.MP4) en cours...</span>
                        </div>
                      )}
                      <video
                        ref={interactiveVideoRef}
                        key={resolvePlayableClipVideoSrc(activeLiveClip) || activeLiveClip?.id}
                        src={resolvePlayableClipVideoSrc(activeLiveClip)}
                        playsInline
                        {...({ 'webkit-playsinline': 'true', controlsList: 'nodownload=false' } as any)}
                        controls
                        preload="auto"
                        muted={includeVoiceover ? true : isInteractiveMuted}
                        loop
                        autoPlay
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget;
                          if (v.currentTime === 0) {
                            try {
                              v.currentTime = 0.08;
                            } catch {
                              // ignore
                            }
                          }
                        }}
                        onPlay={async () => {
                          setIsInteractivePlaying(true);
                          if (!audioRef.current?.src && scriptResult?.fullScript) {
                            await triggerAutoVoiceoverGeneration(scriptResult.fullScript);
                          }
                          if (audioRef.current && includeVoiceover) {
                            audioRef.current.playbackRate = getRelativePlaybackRate();
                            audioRef.current.muted = isInteractiveMuted;
                            audioRef.current.play().catch(() => {});
                          }
                          if (interactiveBgmRef.current && isMusicEnabled && bgmVolume > 0) {
                            interactiveBgmRef.current.volume = bgmVolume / 100;
                            interactiveBgmRef.current.muted = isInteractiveMuted;
                            interactiveBgmRef.current.play().catch(() => {});
                          }
                        }}
                        onPause={() => {
                          setIsInteractivePlaying(false);
                          audioRef.current?.pause();
                          interactiveBgmRef.current?.pause();
                        }}
                        className="w-full h-full object-cover cursor-pointer transition-transform duration-200"
                        style={{
                          transform: Boolean(
                            activeLiveClip?.mirrorHorizontal ||
                              activeLiveClip?.blurZone?.mirrorHorizontal
                          )
                            ? 'scaleX(-1)'
                            : 'none',
                        }}
                      />

                      {/* Duplicated Top & Bottom Gaussian Blur Bands (Style TikTok Pro - No grey box in center) */}
                      {activeLiveClip?.blurZone?.topBottomBlurEnabled !== false && (
                        <>
                          <div
                            className="absolute top-0 left-0 right-0 pointer-events-none z-10 border-b border-white/10"
                            style={{
                              height: `${activeLiveClip?.blurZone?.topBottomBlurPct ?? 16}%`,
                              backdropFilter: 'blur(22px) saturate(135%)',
                              WebkitBackdropFilter: 'blur(22px) saturate(135%)',
                              backgroundColor: 'transparent',
                            }}
                          />
                          <div
                            className="absolute bottom-0 left-0 right-0 pointer-events-none z-10 border-t border-white/10"
                            style={{
                              height: `${activeLiveClip?.blurZone?.topBottomBlurPct ?? 16}%`,
                              backdropFilter: 'blur(22px) saturate(135%)',
                              WebkitBackdropFilter: 'blur(22px) saturate(135%)',
                              backgroundColor: 'transparent',
                            }}
                          />
                        </>
                      )}

                      {/* Optional Pure Transparent Blur Zone (No opaque grey box) */}
                      {activeLiveClip?.blurZone?.enabled && (
                        <div
                          style={{
                            left: `${activeLiveClip.blurZone.x}%`,
                            top: `${activeLiveClip.blurZone.y}%`,
                            width: `${activeLiveClip.blurZone.width}%`,
                            height: `${activeLiveClip.blurZone.height}%`,
                            backdropFilter: `blur(${Math.max(
                              12,
                              activeLiveClip.blurZone.blurAmount || 18
                            )}px) saturate(130%)`,
                            WebkitBackdropFilter: `blur(${Math.max(
                              12,
                              activeLiveClip.blurZone.blurAmount || 18
                            )}px) saturate(130%)`,
                            backgroundColor:
                              activeLiveClip.blurZone.style === 'solid-dark' &&
                              (activeLiveClip.blurZone.opacity ?? 0) > 0
                                ? `rgba(11, 15, 23, ${(
                                    (activeLiveClip.blurZone.opacity ?? 0) / 100
                                  ).toFixed(2)})`
                                : 'transparent',
                          }}
                          className="absolute rounded-2xl pointer-events-none z-10"
                        />
                      )}

                      {/* BANNIÈRE D'ACCROCHE CHOC (HOOK BANNER 00:00 - 00:03.5) */}
                      {includeSubtitles &&
                        hookBannerEnabled &&
                        hookBannerText.trim() &&
                        (currentSecInTimeline <= 3.5 || !isInteractivePlaying) && (
                          <div
                            style={{
                              top: '9%',
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
                          </div>
                        )}

                      {/* Live Synchronized Animated Subtitles */}
                      {renderLiveAnimatedSubtitles()}

                      {/* Top Clip & Chronological Narrative Act Status Pill */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 z-30 pointer-events-none">
                        <span
                          className={`px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border text-[10px] font-black truncate ${
                            currentActNumber === 3
                              ? 'border-amber-400/50 text-amber-300'
                              : currentActNumber === 2
                              ? 'border-cyan-400/50 text-cyan-300'
                              : 'border-emerald-400/50 text-emerald-400'
                          }`}
                        >
                          Clip {activeClipIndex + 1}/{orderedClips.length} • {actPhaseBadge}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-white shrink-0">
                          {formatTimeMinSec(interactiveElapsedSec)} /{' '}
                          {formatTimeMinSec(totalPreviewDuration)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* GRAND BOUTON VERT DE TÉLÉCHARGEMENT DIRECT SOUS LE LECTEUR VIDÉO */}
                <div className="w-full max-w-md pt-2">
                  <button
                    type="button"
                    onClick={handleDirectSaveToPhone}
                    disabled={isDownloadingVideo}
                    className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base tracking-wide text-slate-950 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 hover:from-emerald-300 hover:to-green-400 disabled:opacity-75 border-2 border-emerald-300 shadow-2xl shadow-emerald-500/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer text-center"
                  >
                    {isDownloadingVideo ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin stroke-[2.5]" />
                        <span>Téléchargement du fichier .MP4 en cours...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 stroke-[2.5]" />
                        <span>📲 Télécharger la vidéo .MP4 sur mon téléphone</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Step 5 : Bannière d'Accroche Choc (Hook Banner 0-3s) — Uniquement visible si les sous-titres sont activés */}
                {onSubtitleChange && includeSubtitles && (
                  <div className="w-full max-w-2xl p-4 rounded-2xl bg-[#0b101b] border border-yellow-500/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-400" />
                        <div>
                          <span className="text-xs font-black text-yellow-400 uppercase tracking-wider block">
                            Bannière d'Accroche Choc (Hook Banner 0-3s)
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Gravée en haut de l'écran de 00:00 à 00:03.5 + sélection auto de la scène la plus dynamique du Clip #1
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          soundFx.playSfx('pop');
                          updateStep5Subtitle({ hookBannerEnabled: !hookBannerEnabled });
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                          hookBannerEnabled
                            ? 'bg-yellow-500/20 border-yellow-400 text-yellow-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            hookBannerEnabled
                              ? 'bg-yellow-400 border-yellow-400 text-slate-950'
                              : 'bg-slate-950 border-slate-600 text-transparent'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>[✓] Bannière d'Accroche Choc (Hook Banner 0-3s)</span>
                      </button>
                    </div>

                    {hookBannerEnabled && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-300">
                            Fond contrasté & contour noir :
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                soundFx.playSfx('click');
                                updateStep5Subtitle({ hookBannerBgColor: 'yellow' });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border-2 cursor-pointer transition-all ${
                                hookBannerBgColor === 'yellow'
                                  ? 'bg-yellow-400 text-slate-950 border-white shadow-sm'
                                  : 'bg-yellow-400/20 text-yellow-300 border-yellow-500/40'
                              }`}
                            >
                              🟨 Jaune Choc + Contour Noir
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                soundFx.playSfx('click');
                                updateStep5Subtitle({ hookBannerBgColor: 'red' });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border-2 cursor-pointer transition-all ${
                                hookBannerBgColor === 'red'
                                  ? 'bg-red-600 text-white border-white shadow-sm'
                                  : 'bg-red-600/20 text-red-300 border-red-500/40'
                              }`}
                            >
                              🟥 Rouge Choc + Contour Noir
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(
                            new Set([
                              ...(scriptResult?.hookBannerTexts || []),
                              'TRANSFORMATION TOTALE ! ⚡',
                              'REGARDE BIEN CE DÉTAIL ! 😱',
                              'TU NE CROIRAS PAS CE QUI SE PASSE...',
                              '¡TRANSFORMACIÓN BRUTAL! ⚡',
                              'MIND-BLOWING RESULT! ⚡',
                              'UNGLAUBLICHES ERGEBNIS! ⚡',
                            ])
                          ).map((preset) => {
                            const isSelected = hookBannerText === preset;
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  soundFx.playSfx('pop');
                                  updateStep5Subtitle({
                                    hookBannerText: preset,
                                    hookBannerEnabled: true,
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-yellow-400 text-slate-950 border-yellow-300 shadow-sm'
                                    : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-yellow-400/60 hover:text-yellow-300'
                                }`}
                              >
                                {preset}
                              </button>
                            );
                          })}
                        </div>

                        <input
                          type="text"
                          value={hookBannerText}
                          onChange={(e) =>
                            updateStep5Subtitle({
                              hookBannerText: e.target.value.toUpperCase(),
                              hookBannerEnabled: true,
                            })
                          }
                          placeholder="Ex: TRANSFORMATION TOTALE ! ⚡"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-yellow-400 text-xs font-black uppercase text-white tracking-wider outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 5 Interactive Subtitle Position & Zoom Controls (50% to 200% + Competitor Text Cover) — Uniquement visible si les sous-titres sont activés */}
                {onSubtitleChange && includeSubtitles && (
                  <div className="w-full max-w-2xl p-4 rounded-2xl bg-[#0b101b] border border-amber-500/35 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Move className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                          Déplacer au doigt & Zoomer les Sous-titres (50% à 200%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playSfx('click');
                            updateStep5Subtitle({ subtitleScale: Math.max(50, subScale - 10) });
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black cursor-pointer border border-slate-700"
                          title="Réduire la taille (-10%)"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-mono text-xs font-black text-amber-300">
                          Zoom : {subScale}%
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playSfx('click');
                            updateStep5Subtitle({ subtitleScale: Math.min(200, subScale + 10) });
                          }}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black cursor-pointer border border-slate-700"
                          title="Agrandir la taille (+10%)"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 font-bold flex items-center gap-1">
                            <ZoomIn className="w-3 h-3 text-amber-400" /> Taille (50-200%)
                          </span>
                          <span className="font-mono text-amber-400 font-bold">{subScale}%</span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={200}
                          step={5}
                          value={subScale}
                          onChange={(e) =>
                            updateStep5Subtitle({ subtitleScale: parseInt(e.target.value, 10) })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-amber-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 font-bold">Hauteur (Y)</span>
                          <span className="font-mono text-cyan-400 font-bold">{subY}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={90}
                          value={subY}
                          onChange={(e) =>
                            updateStep5Subtitle({ subtitleY: parseInt(e.target.value, 10) })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-300 font-bold">Gauche/Droite (X)</span>
                          <span className="font-mono text-cyan-400 font-bold">{subX}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={90}
                          value={subX}
                          onChange={(e) =>
                            updateStep5Subtitle({ subtitleX: parseInt(e.target.value, 10) })
                          }
                          className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playSfx('click');
                            updateStep5Subtitle({ subtitleX: 50, subtitleY: 22, position: 'top' });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                            subY <= 30
                              ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                              : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}
                        >
                          ⬆️ Haut (22%)
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playSfx('pop');
                            updateStep5Subtitle({
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
                            updateStep5Subtitle({
                              subtitleX: 50,
                              subtitleY: 78,
                              position: 'bottom',
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                            subY >= 68
                              ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                              : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}
                        >
                          ⬇️ Bas TikTok (78%)
                        </button>
                      </div>

                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={subCoverCompetitor}
                          onChange={(e) => {
                            soundFx.playSfx('click');
                            updateStep5Subtitle({ coverCompetitorText: e.target.checked });
                          }}
                          className="w-3.5 h-3.5 accent-emerald-400 rounded cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-300">
                          Fond Noir Couvrant (Masquer texte dessous)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Options Modulaires à l'Étape d'Exportation (Spécial CapCut & Montage Sur Mesure) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0b101b] border-2 border-cyan-500/40 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                        Options Modulaires d'Exportation Vidéo (Spécial CapCut)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Active ou désactive les sous-titres et la voix-off avant d'exporter ton fichier .MP4
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-[10px] font-black text-cyan-300 self-start sm:self-auto">
                    ⚡ Compatible CapCut 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* 1. Interrupteur : Inclure les sous-titres sur la vidéo (Oui / Non) */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      includeSubtitles
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-amber-500/10 border-amber-500/45'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white block">
                          1. Inclure les sous-titres sur la vidéo (Oui / Non)
                        </span>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {includeSubtitles
                            ? `Oui : Sous-titres incrustés (${selectedSubtitle.name})`
                            : 'Non : Exporte la vidéo propre sans aucun texte incrusté (idéal pour CapCut).'}
                        </p>
                      </div>

                      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleIncludeSubtitles(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            includeSubtitles
                              ? 'bg-emerald-400 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleIncludeSubtitles(false)}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            !includeSubtitles
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Non
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Interrupteur : Inclure la voix-off (Oui / Non) */}
                  <div
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                      includeVoiceover
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : 'bg-amber-500/10 border-amber-500/45'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-white block">
                          2. Inclure la voix-off (Oui / Non)
                        </span>
                        <p className="text-[11px] text-slate-300 leading-snug">
                          {includeVoiceover
                            ? `Oui : Voix-off active (${selectedVoice.name} • ${currentVoiceSpeed.toFixed(2)}x)`
                            : "Non : Garde uniquement le son d'ambiance original sans voix robotique."}
                        </p>
                      </div>

                      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleIncludeVoiceover(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            includeVoiceover
                              ? 'bg-emerald-400 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleIncludeVoiceover(false)}
                          className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                            !includeVoiceover
                              ? 'bg-amber-400 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Non
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Bouton : Copier le script complet (170 mots) + Télécharger la vidéo propre sans texte et sans voix robotique pour CapCut (Voix Julio) */}
                <div className="pt-1 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(cleanedSpokenScript, 'capcut_full_script')}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 ${
                      copiedField === 'capcut_full_script'
                        ? 'bg-emerald-400 text-slate-950 border-emerald-200 shadow-lg shadow-emerald-500/25'
                        : 'bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-cyan-600/90 hover:from-purple-500 hover:to-cyan-500 text-white border-cyan-400/50 shadow-lg shadow-cyan-500/15'
                    }`}
                  >
                    {copiedField === 'capcut_full_script' ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>
                          ✓ Script complet copié ({spokenWords.length} mots) — Prêt à coller dans CapCut (Voix Julio) !
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 stroke-[2.5]" />
                        <span>
                          📋 Copier le script complet (170 mots) — Coller dans la synthèse vocale CapCut (Voix Julio)
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCleanCapCut}
                    disabled={isDownloadingVideo}
                    className="w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-lg shadow-amber-500/10 disabled:opacity-60"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      🎬 Télécharger la vidéo sans texte et sans voix robotique (Spécial CapCut + Voix Julio)
                    </span>
                  </button>
                </div>
              </div>

              {/* Big Download Button + Direct "Enregistrer dans le téléphone" Button */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    disabled={isDownloadingVideo}
                    className="w-full py-4 px-5 rounded-2xl font-black text-sm sm:text-base tracking-wide text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-75 shadow-xl shadow-emerald-500/35 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {isDownloadingVideo ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin stroke-[2.5]" />
                        <span>Rendu FFmpeg ~5s & Téléchargement .MP4...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 stroke-[2.5]" />
                        <span>
                          {t.downloadFinalVideo} (.
                          {(assembledVideo?.fileExtension || 'mp4').toUpperCase()})
                        </span>
                      </>
                    )}
                  </button>

                  {/* Direct "Télécharger la vidéo .MP4 sur mon téléphone" button via fetch('/api/final-video.mp4') Blob + navigator.share */}
                  <button
                    type="button"
                    onClick={handleDirectSaveToPhone}
                    disabled={isDownloadingVideo}
                    className="w-full py-4 px-5 rounded-2xl font-black text-sm sm:text-base tracking-wide text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-75 border border-cyan-400/40 shadow-xl shadow-cyan-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer text-center"
                  >
                    <Download className="w-5 h-5 stroke-[2.5]" />
                    <span>📲 Télécharger la vidéo .MP4 sur mon téléphone</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Vrai fichier cortia-video.mp4 (720×1280 HD •{' '}
                    {includeVoiceover
                      ? `Voix ${selectedVoice.name}`
                      : "Son d'ambiance original (Sans voix-off)"}{' '}
                    •{' '}
                    {includeSubtitles
                      ? `Sous-titres ${selectedSubtitle.name}`
                      : 'Vidéo propre sans sous-titres (CapCut)'}{' '}
                    • Musique {isMusicEnabled ? `${bgmVolume}%` : '0%'})
                  </span>
                  {(assembledVideo?.voiceoverUrl || voicePreviewUrl) && (
                    <>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.preventDefault();
                          const wavUrl = assembledVideo?.voiceoverUrl || voicePreviewUrl;
                          if (!wavUrl || isDownloadingAudio) return;
                          setIsDownloadingAudio(true);
                          try {
                            await triggerBlobDownload({
                              url: wavUrl,
                              filename: 'cortia-piste-audio.wav',
                              fallbackMimeType: 'audio/wav',
                            });
                            toast.success('Piste audio .WAV téléchargée avec succès !', 'Téléchargement Audio');
                          } finally {
                            setIsDownloadingAudio(false);
                          }
                        }}
                        disabled={isDownloadingAudio}
                        className="text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                      >
                        {isDownloadingAudio ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Téléchargement audio en cours...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Télécharger aussi la piste Audio (.WAV)</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
      </div>

      {/* Script Version History Modal with Diffing & Restore */}
      <ScriptVersionHistoryModal
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        versions={scriptVersions}
        currentScriptText={scriptResult?.fullScript || ''}
        onRestoreVersion={handleRestoreVersion}
        onDeleteVersion={handleDeleteVersion}
        onClearHistory={handleClearVersionHistory}
        onCreateSnapshot={handleCreateManualSnapshot}
      />
    </div>
  );
};
