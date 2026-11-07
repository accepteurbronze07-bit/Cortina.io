export type AppLanguage = 'FR' | 'EN' | 'ES' | 'DE' | 'RU' | 'AR' | 'PT';
export type AppTheme = 'dark' | 'light';

export type NavigationView =
  | 'create'
  | 'montage'
  | 'caption-mask'
  | 'script-viral'
  | 'voice-studio'
  | 'latest-creation'
  | 'tutorial'
  | 'community'
  | 'subscription'
  | 'credits'
  | 'monetized-account'
  | 'settings'
  | 'profile'
  | 'support'
  | 'admin';

export interface BlurZone {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  blurAmount: number; // 0 - 30 px
  opacity: number; // 0 - 1
  enabled: boolean;
  style: 'pure-blur' | 'frosted' | 'black-gradient' | 'pixelate' | 'solid-dark';
  topBottomBlurEnabled?: boolean; // [✓] Superposition Floutage Haut & Bas (Style TikTok Pro)
  topBottomBlurPct?: number; // Height % of top & bottom blurred bands (e.g. 12% to 20%, default 16%)
  mirrorHorizontal?: boolean; // [✓] Effet Miroir (Inverser horizontalement les clips - Anti-Copyright)
}

export interface VideoClip {
  id: string;
  videoId?: string;
  url: string;
  title: string;
  author?: string;
  views: string;
  likes: string;
  duration: string;
  thumbnail: string;
  coverUrl?: string;
  isLocalFile?: boolean;
  localFile?: File;
  fileName?: string;
  fileBlobUrl?: string;
  mp4Url?: string;
  localPath?: string;
  localVideoUrl?: string;
  durationSeconds?: number;
  isHook: boolean;
  blurZone: BlurZone;
  mirrorHorizontal?: boolean;
  hasDetectedSubtitles?: boolean;
}

export type VoiceCatalogTab = 'FR' | 'EN' | 'ES' | 'PT_BR' | 'DE' | 'ZH' | 'KO' | 'JA' | 'ADS';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'M' | 'F';
  accent: string;
  style: string;
  geminiVoice:
    | 'Aoede'
    | 'Puck'
    | 'Charon'
    | 'Kore'
    | 'Fenrir'
    | 'Leda'
    | 'Orus'
    | 'Zephyr'
    | 'NONE';
  edgeVoice?: string;
  speechmaVoice?: string;
  avatar: string;
  badge?: string;
  pitch: number;
  rate: number;
  langTab?: VoiceCatalogTab;
  langCode?: string;
  isPro?: boolean;
  isNone?: boolean;
  characterPrompt?: string;
  samplePreviewText?: string;
  studioBassBoost?: boolean; // [✓] Boost Basses & Présence Studio (Micro Créateur) - default true
  voiceVolume?: number; // Volume de la Voix-off (50% à 200%, réglé par défaut sur 130%)
}

export type SubtitleCatalogTab = 'tendance' | 'classique' | 'nouveau';

export interface SubtitleStyle {
  id: string;
  subtitleTemplateId?: string;
  name: string;
  category: string;
  subTab?: SubtitleCatalogTab;
  textColor: string;
  highlightColor: string;
  fontFamily: string;
  badge: string;
  isPro?: boolean;
  isFree?: boolean;
  exampleWord: string;
  previewLine1?: string;
  previewLine2?: string;
  position: 'bottom' | 'center' | 'top';
  wordByWord?: boolean; // Mode Sous-titres "1 Mot par 1 Mot" (SANS -> DIPLÔME -> JE -> GAGNE)
  subtitleX?: number; // Position horizontale (10% à 90%, défaut 50%)
  subtitleY?: number; // Position verticale (10% à 90%, défaut 78%)
  subtitleScale?: number; // Zoom / Taille des sous-titres (50% à 200%, défaut 100%)
  coverCompetitorText?: boolean; // Fond couvrant sous le sous-titre pour masquer l'ancien texte concurrent
  hookBannerEnabled?: boolean; // [✓] Bannière d'Accroche Choc (Hook Banner 0-3s) - default true
  hookBannerText?: string; // ex: "TRANSFORMATION TOTALE ! ⚡", "¡TRANSFORMACIÓN BRUTAL! ⚡", "MIND-BLOWING RESULT! ⚡"
  hookBannerBgColor?: 'yellow' | 'red'; // Fond jaune ou rouge contrasté avec contour noir
}

export type SfxCatalogTab = 'tendance' | 'music_clip' | 'amusant' | 'sifflements';

export interface SoundEffectClip {
  id: string;
  name: string;
  duration: string;
  durationSeconds: number;
  tab: SfxCatalogTab;
  isPro?: boolean;
  sfxKey: string;
}

export interface BackgroundMusic {
  id: string;
  name: string;
  vibe: string;
  bpm: number;
  audioKey: string;
  category: string;
  recommendedVolume: number;
  selectedSfxIds?: string[];
  sfxEnabled?: boolean;
  musicEnabled?: boolean;
}

export type NarrativeScriptStyle =
  | 'financial_shock' // Style A : Financier & Choc (3M Vues • 2,03$ RPM)
  | 'mystery_bottom' // Style B : Mystère & Secret au Fond (17.8M Vues)
  | 'unexpected_discovery'; // Style C : Découverte Inattendue & Dégâts cachés sous le liner

export type NarrativeScenarioCode = 'A' | 'B' | 'C' | 'D' | 'E';

export interface ScriptGenerationResult {
  hookText: string;
  fullScript: string;
  visualAnalysis?: string;
  suggestedTitles: string[];
  hookBannerTexts?: string[];
  description: string;
  hashtags: string[];
  estimatedViralityScore: number;
  estimatedDuration: string;
  audioPacingTip?: string;
  narrativeStyle?: NarrativeScriptStyle;
  scenarioCode?: NarrativeScenarioCode;
  scenarioTitle?: string;
}

export type ScriptVersionSource =
  | 'ai_generation'
  | 'ai_regeneration'
  | 'ai_optimization'
  | 'ai_proofread'
  | 'manual_edit'
  | 'restore'
  | 'snapshot';

export interface ScriptVersion {
  id: string;
  versionNumber: number;
  timestamp: number;
  formattedDate: string;
  source: ScriptVersionSource;
  sourceLabel: string;
  hookText: string;
  fullScript: string;
  wordCount: number;
  estimatedViralityScore: number;
  narrativeStyle?: NarrativeScriptStyle;
  scenarioCode?: NarrativeScenarioCode;
  scenarioTitle?: string;
  hookBannerTexts?: string[];
  hashtags?: string[];
  description?: string;
}

export interface InvoiceRecord {
  id: string;
  date: string;
  amount: string;
  plan: string;
  method: string;
  status: string;
}

export interface VideoPerformancePoint {
  timeLabel: string;
  views: number;
  likes: number;
  shares: number;
  retentionRate?: number;
}

export interface VideoPerformanceStats {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  completionRate: string;
  rpm: string;
  history: VideoPerformancePoint[];
}

export interface CompletedCreation {
  id: string;
  title: string;
  script: string;
  duration: string;
  createdAt: string;
  viewsProjected: string;
  thumbnailUrl: string;
  tags: string[];
  hookText: string;
  voiceUsed: string;
  subtitleStyle: string;
  videoUrl?: string;
  performanceStats?: VideoPerformanceStats;
}

export type SubscriptionPlanId = 'TIK' | 'PRO' | 'ELITE';

export interface UserAccount {
  id?: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  authProvider?: 'email' | 'google' | 'facebook' | 'tiktok';
  role?: 'admin' | 'user';
  credits: number;
  maxCredits: number;
  isUnlimited?: boolean;
  plan: SubscriptionPlanId;
  billingCycle: 'monthly' | 'annual';
  memberSince: string;
  videosCreatedThisMonth: number;
  maxVideosMonth: number;
  hasMonetizedAccount: boolean;
  estimatedMonthlyEarnings: number;
  creations?: CompletedCreation[];
  invoices?: InvoiceRecord[];
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  referralCreditsEarned?: number;
  referrals?: Array<{
    id: string;
    referredEmail: string;
    referredName?: string;
    date: string;
    creditsRewarded: number;
    type?: 'sponsor_gain' | 'referee_bonus';
    status?: string;
  }>;
  theme?: AppTheme;
}

export interface PendingManualPayment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: SubscriptionPlanId;
  billingCycle: 'monthly' | 'annual';
  operator: 'orange' | 'moov' | 'wave' | 'mtn' | 'cinetpay' | 'fedapay' | 'card';
  senderPhone: string;
  transactionRef?: string;
  amountDisplay: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PaymentGatewayConfig {
  activeGateway: 'cinetpay' | 'paydunya' | 'fedapay' | 'direct_momo' | 'manual';
  cinetpayApiKey: string;
  cinetpaySiteId: string;
  paydunyaMasterKey: string;
  paydunyaPrivateKey?: string;
  paydunyaToken: string;
  fedapayPublicKey: string;
  fedapaySecretKey?: string;
  orangeMoneyNumber: string;
  moovMoneyNumber: string;
  waveNumber: string;
  mtnMoneyNumber: string;
  paymentLinkTik?: string;
  paymentLinkPro?: string;
  paymentLinkElite?: string;
  paymentLinks?: {
    TIK_monthly: string;
    TIK_annual: string;
    PRO_monthly: string;
    PRO_annual: string;
    ELITE_monthly: string;
    ELITE_annual: string;
  };
  whatsappSupport?: string;
  creatomateApiKey?: string;
  creatomateTemplateId?: string;
  makeWebhookUrl?: string;
  rapidApiKey?: string;
}

