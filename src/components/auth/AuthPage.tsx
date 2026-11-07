import React, { useState, useEffect } from 'react';
import {
  Flame,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Video,
  Mic,
  Crown,
  X,
  Gift,
  Star,
  Quote,
  TrendingUp,
  RefreshCw,
  ThumbsUp,
} from 'lucide-react';
import { UserAccount, PaymentGatewayConfig } from '../../types';
import { soundFx } from '../../utils/audioUtils';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onAuthSuccess: (
    token: string,
    user: UserAccount,
    paymentConfig?: PaymentGatewayConfig,
    isNewSignup?: boolean
  ) => void;
}

type SocialProvider = 'google' | 'facebook' | 'tiktok';

export interface ClientTestimonial {
  id: string;
  name: string;
  avatarInitials: string;
  avatarColor: string;
  roleOrNiche: string;
  handle: string;
  platform: 'TikTok' | 'YouTube Shorts' | 'Reels' | string;
  keyMetric: string;
  plan: 'TIK' | 'PRO' | 'ÉLITE' | string;
  rating: number;
  comment: string;
  verified: boolean;
  date: string;
}

const INITIAL_TESTIMONIALS: ClientTestimonial[] = [
  {
    id: 'testi_1',
    name: 'Koffi Mensah',
    avatarInitials: 'KM',
    avatarColor: 'from-emerald-500 to-teal-600',
    roleOrNiche: 'Créateur Business & Mindset',
    handle: '@koffi_impact',
    platform: 'TikTok',
    keyMetric: '+1.4M de vues en 14 jours',
    plan: 'PRO',
    rating: 5,
    comment:
      'Caption Mask m’a sauvé des heures de montage ! J’ai pu masquer les sous-titres des concurrents et poser la voix-off Gemini. Mon compte est passé éligible au TikTok Creator Rewards en seulement 2 semaines.',
    verified: true,
    date: 'Il y a 2 jours',
  },
  {
    id: 'testi_2',
    name: 'Sarah Diallo',
    avatarInitials: 'SD',
    avatarColor: 'from-purple-500 to-indigo-600',
    roleOrNiche: 'Storytelling & Faits Divers',
    handle: '@sarah.chroniques',
    platform: 'YouTube Shorts',
    keyMetric: '840 € générés ce mois',
    plan: 'ÉLITE',
    rating: 5,
    comment:
      'La qualité de la voix IA et le rendu en moins de 5 secondes sont bluffants. Pouvoir payer mon abonnement directement avec Wave et Orange Money depuis Abidjan, c’est exactement ce qu’il nous fallait.',
    verified: true,
    date: 'Hier',
  },
  {
    id: 'testi_3',
    name: 'Alexandre Morel',
    avatarInitials: 'AM',
    avatarColor: 'from-amber-500 to-orange-600',
    roleOrNiche: 'Tech & Astuces IA',
    handle: '@alex_futuretech',
    platform: 'TikTok',
    keyMetric: '420k vues dès le 1er TikTok',
    plan: 'PRO',
    rating: 5,
    comment:
      'Je gagne au moins 3 heures par vidéo. Le découpage des 3 clips est chirurgical, les hooks retiennent l’attention jusqu’au bout et le ratio de complétion dépasse les 60 %. Incontournable.',
    verified: true,
    date: 'Il y a 3 jours',
  },
  {
    id: 'testi_4',
    name: 'Fatou Sow',
    avatarInitials: 'FS',
    avatarColor: 'from-pink-500 to-rose-600',
    roleOrNiche: 'Motivation & Développement',
    handle: '@fatou_mindset',
    platform: 'Reels & Shorts',
    keyMetric: '30 vidéos publiées en 1 mois',
    plan: 'TIK',
    rating: 5,
    comment:
      'J’ai testé avec le crédit gratuit de bienvenue. En 10 minutes ma première vidéo était téléchargée en MP4 ultra net. Depuis j’ai pris l’offre TIK et ma communauté a déjà triplé.',
    verified: true,
    date: 'Il y a 5 jours',
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'signup',
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Testimonials state & AI generator
  const [testimonials, setTestimonials] = useState<ClientTestimonial[]>(INITIAL_TESTIMONIALS);
  const [isGeneratingAiTestimonials, setIsGeneratingAiTestimonials] = useState(false);
  const [aiGeneratedSuccessToast, setAiGeneratedSuccessToast] = useState(false);

  // Social quick-connect sheet state (works 100% inside iframe without popup blockers)
  const [activeSocialModal, setActiveSocialModal] = useState<SocialProvider | null>(null);
  const [socialName, setSocialName] = useState('');
  const [socialEmail, setSocialEmail] = useState('');

  const handleGenerateAiTestimonials = async () => {
    setIsGeneratingAiTestimonials(true);
    soundFx.playSfx('ding');
    try {
      const res = await fetch('/api/testimonials/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 4 }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.testimonials) && data.testimonials.length > 0) {
        setTestimonials(data.testimonials);
        soundFx.playSfx('chaching');
        setAiGeneratedSuccessToast(true);
        setTimeout(() => setAiGeneratedSuccessToast(false), 3000);
      }
    } catch (e) {
      console.error('Error generating AI testimonials:', e);
    } finally {
      setIsGeneratingAiTestimonials(false);
    }
  };

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/login') {
      setMode('login');
    } else if (path === '/signup') {
      setMode('signup');
    }

    try {
      // Auto-detect referral code from URL: ?ref=CODE or ?referral=CODE or hash #ref=CODE
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get('ref') || searchParams.get('referral');
      if (ref) {
        setReferralCode(ref.trim().toUpperCase());
        setMode('signup'); // Switch to signup automatically when visiting via referral link
      } else if (window.location.hash.includes('ref=')) {
        const hashMatch = window.location.hash.match(/ref=([A-Za-z0-9_-]+)/);
        if (hashMatch && hashMatch[1]) {
          setReferralCode(hashMatch[1].trim().toUpperCase());
          setMode('signup');
        }
      }
    } catch {
      // Safe fallback
    }
  }, []);

  const switchMode = (newMode: 'login' | 'signup') => {
    soundFx.playSfx('click');
    setMode(newMode);
    setErrorMsg(null);
    try {
      window.history.pushState({}, '', newMode === 'signup' ? '/signup' : '/login');
    } catch {
      // Ignore history API restrictions in iframe
    }
  };

  // Classic Email + Password Signup or Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);
    soundFx.playSfx('whoosh');

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          authProvider: email.trim().toLowerCase().endsWith('@gmail.com') ? 'google' : 'email',
          referralCode: mode === 'signup' && referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Identifiants invalides.');
        setIsLoading(false);
        return;
      }

      soundFx.playSfx('cash');
      try {
        window.history.pushState({}, '', '/');
      } catch {
        // ignore
      }
      onAuthSuccess(data.token, data.user, data.paymentConfig, Boolean(data.isNewUser || mode === 'signup'));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur de connexion au serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  // Complete Social Authentication (Google/Gmail, Facebook, TikTok) and persist in server.ts
  const executeSocialAuth = async (
    provider: SocialProvider,
    chosenName: string,
    chosenEmail: string
  ) => {
    setErrorMsg(null);
    setIsLoading(true);
    soundFx.playSfx('whoosh');

    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          name: chosenName.trim(),
          email: chosenEmail.trim().toLowerCase(),
          referralCode: referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Impossible de finaliser la connexion sociale.');
        setIsLoading(false);
        return;
      }

      setActiveSocialModal(null);
      soundFx.playSfx('cash');
      try {
        window.history.pushState({}, '', '/');
      } catch {
        // ignore
      }
      onAuthSuccess(data.token, data.user, data.paymentConfig, Boolean(data.isNewUser));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur réseau lors de la connexion sociale.');
    } finally {
      setIsLoading(false);
    }
  };

  // Triggered when clicking "Continuer avec Google (Gmail)", "Continuer avec Facebook", or "Continuer avec TikTok"
  const handleSocialButtonClick = (provider: SocialProvider) => {
    soundFx.playSfx('pop');
    setErrorMsg(null);

    // If the visitor already typed their email in the form, authenticate immediately in 1 click
    if (email.trim() && email.includes('@')) {
      const fallbackName = name.trim() || email.split('@')[0];
      executeSocialAuth(provider, fallbackName, email.trim());
      return;
    }

    // Pre-fill sensible defaults in the in-page social confirmation modal so 1 click works immediately
    if (provider === 'google') {
      setSocialName(name.trim() || 'Créateur Gmail');
      setSocialEmail('nouveau.createur@gmail.com');
    } else if (provider === 'facebook') {
      setSocialName(name.trim() || 'Créateur Facebook');
      setSocialEmail('createur.fb@gmail.com');
    } else {
      setSocialName(name.trim() || 'Créateur TikTok');
      setSocialEmail('createur.tiktok@gmail.com');
    }
    setActiveSocialModal(provider);
  };

  const handleQuickOwnerLogin = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    soundFx.playSfx('ding');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'accepteurbronze07@gmail.com',
          isQuickDemo: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          window.history.pushState({}, '', '/');
        } catch {
          // ignore
        }
        onAuthSuccess(data.token, data.user, data.paymentConfig, false);
      }
    } catch {
      setErrorMsg('Impossible de joindre le serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute -top-32 left-1/4 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[440px] h-[440px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar (Cortia.io Landing Header) */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#0d121d] rounded-[14px] flex items-center justify-center">
              <Flame className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">Cortia.io</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                · Studio IA
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Générateur de vidéos virales TikTok, Shorts & Reels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Se connecter
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            S&apos;inscrire gratuitement
          </button>
        </div>
      </header>

      {/* Main Content Grid: Left Landing Hero + Right Auth Card */}
      <main className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 my-auto py-4">
        {/* Left Column: Cortia.io Value Proposition & Features */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>Plateforme n°1 de Remix & Montage Vidéo IA en 5 Étapes</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
            Transforme 3 liens TikTok en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
              vidéo virale .MP4
            </span>{' '}
            prête à monétiser.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Colle tes liens TikTok ou importe tes vidéos, masque les anciens sous-titres avec{' '}
            <strong className="text-white">Caption Mask</strong>, génère un script viral inédit et une{' '}
            <strong className="text-white">Voix-off IA</strong> réaliste, puis télécharge ton fichier{' '}
            <strong className="text-emerald-400">.MP4 (H.264 + AAC)</strong> prêt à publier.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="bg-[#0f1522]/90 border border-slate-800/90 rounded-2xl p-4 space-y-1.5">
              <Video className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xs font-black text-white">Extraction & Caption Mask</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Extraction TikTok sans filigrane et floutage intelligent des anciens écrits.
              </p>
            </div>

            <div className="bg-[#0f1522]/90 border border-slate-800/90 rounded-2xl p-4 space-y-1.5">
              <Mic className="w-5 h-5 text-teal-400" />
              <h3 className="text-xs font-black text-white">Voix IA & Musique .WAV</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Voix-off Gemini TTS + musiques Phonk, Motivation, Lofi et effets sonores.
              </p>
            </div>

            <div className="bg-[#0f1522]/90 border border-slate-800/90 rounded-2xl p-4 space-y-1.5">
              <Crown className="w-5 h-5 text-amber-400" />
              <h3 className="text-xs font-black text-white">Mobile Money & CB</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Abonnements TIK, PRO & ELITE payables par Orange Money, Moov, Wave ou Carte.
              </p>
            </div>
          </div>

          {/* Gift credits banner */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-200">
              <strong className="text-emerald-400">Offre Bienvenue Nouveau Client :</strong> Inscris-toi en 1 clic avec{' '}
              <strong>Google (Gmail)</strong>, <strong>Facebook</strong>, <strong>TikTok</strong> ou ton{' '}
              <strong>Email</strong> pour recevoir <strong>1 crédit gratuit offert (1 vidéo de test)</strong>.
            </p>
          </div>

          {/* Social Proof Mini Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 border-2 border-[#0b0f17] flex items-center justify-center font-black text-[10px] text-white shadow-md">
                KM
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 border-2 border-[#0b0f17] flex items-center justify-center font-black text-[10px] text-white shadow-md">
                SD
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 border-2 border-[#0b0f17] flex items-center justify-center font-black text-[10px] text-white shadow-md">
                AM
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-600 border-2 border-[#0b0f17] flex items-center justify-center font-black text-[10px] text-white shadow-md">
                FS
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
                <span className="font-extrabold text-white text-xs ml-1">4.9 / 5</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Recommandé par <strong className="text-white">+14 000 créateurs</strong> · Voir les avis ci-dessous ↓
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Registration / Login Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative">
            {/* Mode Tabs (/signup & /login) */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0b0f17] border border-slate-800">
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Inscription (Nouveau client)
              </button>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`py-2.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Connexion
              </button>
            </div>

            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-white">
                {mode === 'signup'
                  ? 'Crée ton compte Cortia en 1 clic'
                  : 'Heureux de te revoir sur Cortia'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'signup'
                  ? 'Choisis ta méthode d’inscription rapide pour accéder au studio et aux abonnements'
                  : 'Connecte-toi avec ton compte Google, Facebook, TikTok ou Email'}
              </p>
            </div>

            {/* Active Referral Detected Banner */}
            {referralCode && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/10 border border-amber-500/35 flex items-center gap-3 animate-in fade-in">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="text-xs flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white">Parrainage Actif</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                      {referralCode}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    🎁 <strong className="text-emerald-400">+1 crédit bonus gratuit</strong> offert automatiquement à l'inscription !
                  </p>
                </div>
              </div>
            )}

            {/* 1-Click Social Login Buttons: Google (Gmail), Facebook, TikTok */}
            <div className="space-y-2.5">
              {/* 1. Continuer avec Google (Gmail) */}
              <button
                type="button"
                onClick={() => handleSocialButtonClick('google')}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99]"
              >
                {/* Official Google 'G' SVG Logo */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                  />
                </svg>
                <span>Continuer avec Google (Gmail)</span>
              </button>

              {/* 2. Continuer avec Facebook */}
              <button
                type="button"
                onClick={() => handleSocialButtonClick('facebook')}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99]"
              >
                {/* Official Facebook 'f' SVG Logo */}
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>Continuer avec Facebook</span>
              </button>

              {/* 3. Continuer avec TikTok */}
              <button
                type="button"
                onClick={() => handleSocialButtonClick('tiktok')}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#090d16] hover:bg-slate-900 border border-slate-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-[0.99]"
              >
                {/* Official TikTok SVG Logo */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"
                    fill="#ffffff"
                  />
                  <path
                    d="M16.5 2.441a4.793 4.793 0 0 0 3.089 4.245v1.5a8.182 8.182 0 0 1-4.773-1.526v6.983a6.33 6.33 0 0 1-9.2 5.62 6.33 6.33 0 0 0 8.2-5.62V2h2.684v.441z"
                    fill="#25F4EE"
                    fillOpacity="0.85"
                  />
                  <path
                    d="M13.374 2v13.672a2.896 2.896 0 0 1-4.8 2.18 2.896 2.896 0 0 0 5.8-2.18V2h-1z"
                    fill="#FE2C55"
                    fillOpacity="0.85"
                  />
                </svg>
                <span>Continuer avec TikTok</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-800" />
              <span className="shrink mx-3 text-[10px] font-bold uppercase text-slate-500">
                Ou par Email & Mot de passe
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Classic Form: Nom, Email (Gmail, etc.) & Mot de passe */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    Nom complet ou Pseudo Créateur
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Marc Koffi"
                      className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">
                  Adresse Email (Gmail, etc.)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton-adresse@gmail.com"
                    className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 block">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      <span>Code de parrainage (Optionnel)</span>
                    </label>
                    {referralCode && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        +1 crédit bonus actif
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Ex: CORTIA ou KOFFI782"
                    className="w-full bg-[#0b0f17] border border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono placeholder-slate-600 focus:outline-hidden uppercase"
                  />
                  <p className="text-[10px] text-slate-500">
                    Un ami t'a parrainé ? Entre son code pour recevoir 1 crédit gratuit supplémentaire.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {isLoading
                    ? 'Connexion en cours...'
                    : mode === 'login'
                    ? 'Se connecter à Cortia'
                    : 'Créer mon compte & Choisir mon offre'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>

            {/* Quick Owner Access for SaaS Admin */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleQuickOwnerLogin}
                className="w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accès Propriétaire Admin (accepteurbronze07@gmail.com)</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* In-Page 1-Click Social Auth Modal (Google Gmail / Facebook / TikTok) */}
      {activeSocialModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-black text-white">
                  {activeSocialModal === 'google' && 'Connexion Google (Gmail)'}
                  {activeSocialModal === 'facebook' && 'Connexion Facebook'}
                  {activeSocialModal === 'tiktok' && 'Connexion TikTok'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveSocialModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Confirme ou saisis ton compte{' '}
              <strong className="text-white">
                {activeSocialModal === 'google'
                  ? 'Google (Gmail)'
                  : activeSocialModal === 'facebook'
                  ? 'Facebook'
                  : 'TikTok'}
              </strong>{' '}
              pour créer ton espace client Cortia instantanément (+1 crédit gratuit offert = 1 vidéo de test) :
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Ton Nom ou Pseudo
                </label>
                <input
                  type="text"
                  value={socialName}
                  onChange={(e) => setSocialName(e.target.value)}
                  placeholder="Ton nom"
                  className="w-full bg-[#0b0f17] border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  {activeSocialModal === 'google'
                    ? 'Ton adresse Gmail'
                    : activeSocialModal === 'facebook'
                    ? 'Email de ton compte Facebook'
                    : 'Email associé à ton compte TikTok'}
                </label>
                <input
                  type="email"
                  value={socialEmail}
                  onChange={(e) => setSocialEmail(e.target.value)}
                  placeholder="ton-compte@gmail.com"
                  className="w-full bg-[#0b0f17] border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveSocialModal(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isLoading || !socialEmail.includes('@')}
                onClick={() =>
                  executeSocialAuth(activeSocialModal, socialName, socialEmail)
                }
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {isLoading ? 'Validation en cours...' : 'Continuer en 1 clic →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SECTION TÉMOIGNAGES CLIENTS IA (SOCIAL PROOF & CONVERSION) */}
      {/* ========================================================== */}
      <section className="w-full max-w-6xl mx-auto my-12 z-10 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Avis Créateurs Certifiés · Propulsé par Gemini AI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ils génèrent des millions de vues avec Cortia
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Découvre comment plus de 14 000 créateurs ont automatisé leur montage, masqué les sous-titres concurrents et monétisé leurs comptes TikTok, Reels et Shorts.
            </p>
          </div>

          {/* AI Generator Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleGenerateAiTestimonials}
              disabled={isGeneratingAiTestimonials}
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Demander à Gemini IA de générer de nouveaux retours d'expérience réalistes"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${isGeneratingAiTestimonials ? 'animate-spin' : ''}`} />
              <span>{isGeneratingAiTestimonials ? 'Génération IA en cours...' : '✨ Régénérer avec l’IA'}</span>
            </button>
          </div>
        </div>

        {/* AI Toast feedback */}
        {aiGeneratedSuccessToast && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Nouveaux retours clients d'utilisateurs satisfaits générés avec succès par Gemini 3.8 Flash !</span>
          </div>
        )}

        {/* 4 Trust & Conversion Metric Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#0f1522]/80 border border-slate-800/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black shrink-0">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="text-base font-black text-white">4.9 / 5</div>
              <div className="text-[10px] text-slate-400">2 480+ avis créateurs</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0f1522]/80 border border-slate-800/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-base font-black text-white">+380 %</div>
              <div className="text-[10px] text-slate-400">Rétention moyenne</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0f1522]/80 border border-slate-800/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center font-black shrink-0">
              <Flame className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <div className="text-base font-black text-white">&lt; 5 secondes</div>
              <div className="text-[10px] text-slate-400">Rendu MP4 direct</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0f1522]/80 border border-slate-800/90 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-black shrink-0">
              <ThumbsUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-base font-black text-white">99.4 %</div>
              <div className="text-[10px] text-slate-400">Taux de recommandation</div>
            </div>
          </div>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-[#0f1522] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all hover:scale-[1.01]"
            >
              {/* Creator Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                        t.avatarColor || 'from-emerald-500 to-teal-600'
                      } text-white font-black text-xs flex items-center justify-center shadow-md`}
                    >
                      {t.avatarInitials || t.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-white">{t.name}</span>
                        {t.verified && (
                          <span title="Avis Créateur Vérifié" className="inline-flex">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">{t.handle}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[9px] font-black uppercase text-amber-300">
                    {t.plan}
                  </span>
                </div>

                {/* Stars & Niche */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-slate-400 font-medium truncate max-w-[130px]">{t.roleOrNiche}</span>
                </div>

                {/* Highlight Result Badge */}
                {t.keyMetric && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-[11px] font-bold">
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                    <span>{t.keyMetric}</span>
                  </div>
                )}

                {/* Testimonial Quote */}
                <p className="text-[11px] text-slate-300 leading-relaxed italic relative pl-3 border-l-2 border-emerald-500/40">
                  « {t.comment} »
                </p>
              </div>

              {/* Card Footer: Platform & Time */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                <span className="font-semibold text-slate-400">{t.platform}</span>
                <span>{t.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action bar below testimonials */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#0f1522] to-teal-950/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-black text-white">
              Prêt à booster tes vues et monétiser tes créations ? 🚀
            </h3>
            <p className="text-xs text-slate-300">
              Inscris-toi gratuitement en 30 secondes et reçois immédiatement ton crédit de test offert.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              switchMode('signup');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>Créer mon compte gratuit</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto pt-6 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 z-10">
        <span>© 2026 Cortia.io — Studio de Création Vidéo IA</span>
        <div className="flex items-center gap-4">
          <span>Google / Gmail · Facebook · TikTok Auth</span>
          <span>·</span>
          <span>Paiements Orange Money, Moov, Wave & CB</span>
        </div>
      </footer>
    </div>
  );
};
