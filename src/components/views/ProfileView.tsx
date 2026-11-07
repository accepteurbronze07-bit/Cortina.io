import React, { useState } from 'react';
import {
  User,
  Mail,
  Zap,
  Crown,
  CreditCard,
  LogOut,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  Download,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Receipt,
  Gift,
  Users,
  Copy,
  Check,
  Share2,
  AlertCircle,
  ExternalLink,
  Camera,
  Wand2,
} from 'lucide-react';
import { UserAccount, NavigationView, AppLanguage } from '../../types';
import { translations } from '../../locales/translations';
import { soundFx } from '../../utils/audioUtils';
import { ReferralEarningsHistory } from '../profile/ReferralEarningsHistory';
import { AiAvatarGeneratorModal } from '../profile/AiAvatarGeneratorModal';

interface ProfileViewProps {
  userAccount: UserAccount;
  onUpdateAccount: (account: UserAccount) => void;
  onNavigate: (view: NavigationView) => void;
  language: AppLanguage;
  authToken?: string;
  onLogout?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userAccount,
  onUpdateAccount,
  onNavigate,
  language,
  authToken = 'default_owner_token',
  onLogout,
}) => {
  const t = translations[language] || translations.FR;
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Referral System States
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [claimCodeInput, setClaimCodeInput] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  const referralCode = userAccount.referralCode || 'CORTIA';
  const referralLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://cortia.io/?ref=${referralCode}`;

  const handleCopyLink = () => {
    soundFx.playSfx('ding');
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    soundFx.playSfx('ding');
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleShareWhatsapp = () => {
    soundFx.playSfx('pop');
    const msg = encodeURIComponent(
      `Salut ! Découvre Cortia.io pour créer des vidéos virales TikTok/Shorts avec l'IA. En passant par mon lien, tu reçois 1 crédit bonus offert : ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const handleShareTwitter = () => {
    soundFx.playSfx('pop');
    const msg = encodeURIComponent(
      `Crée des vidéos TikTok virales en 5 étapes grâce à l'IA sur Cortia.io ! Obtiens tes crédits bonus gratuits ici :`
    );
    window.open(`https://twitter.com/intent/tweet?text=${msg}&url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const handleShareTelegram = () => {
    soundFx.playSfx('pop');
    const msg = encodeURIComponent(
      `Rejoins Cortia.io pour automatiser tes montages TikTok & Shorts avec l'IA (+1 crédit offert) :`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${msg}`, '_blank');
  };

  const handleClaimReferralCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = claimCodeInput.trim().toUpperCase();
    if (!code) return;

    setClaimLoading(true);
    setClaimError(null);
    setClaimSuccess(null);
    soundFx.playSfx('whoosh');

    try {
      const res = await fetch('/api/user/referral-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ referralCode: code }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setClaimError(data.error || 'Code de parrainage invalide.');
        soundFx.playSfx('pop');
        return;
      }

      soundFx.playSfx('cash');
      setClaimSuccess(data.message || 'Code validé ! +1 crédit bonus ajouté à votre solde.');
      if (data.user) {
        onUpdateAccount(data.user);
      }
      setClaimCodeInput('');
    } catch {
      setClaimError('Erreur de connexion au serveur.');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    soundFx.playSfx('ding');
    setIsCancelled(true);
    setShowCancelModal(false);
    try {
      const res = await fetch('/api/user/cancel-subscription', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.user) {
        onUpdateAccount(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = () => {
    soundFx.playSfx('pop');
    setShowLogoutModal(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleSelectAvatar = async (avatarUrl: string) => {
    soundFx.playSfx('ding');
    // Optimistic update
    const updatedAccount = { ...userAccount, avatarUrl };
    onUpdateAccount(updatedAccount);

    try {
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ avatarUrl }),
      });
      const data = await res.json();
      if (data.user) {
        onUpdateAccount(data.user);
      }
    } catch (err) {
      console.error('Erreur de sauvegarde de l\'avatar:', err);
    }
  };

  const invoices =
    userAccount.invoices && userAccount.invoices.length > 0
      ? userAccount.invoices
      : [
          { id: 'INV-2026-003', date: '24 Oct 2026', amount: '24 000 FCFA', plan: 'Plan PRO Mensuel', method: 'Orange Money', status: 'Payé' },
          { id: 'INV-2026-002', date: '24 Sep 2026', amount: '24 000 FCFA', plan: 'Plan PRO Mensuel', method: 'Wave', status: 'Payé' },
        ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Interactive AI Avatar container */}
            <div
              onClick={() => {
                soundFx.playSfx('click');
                setIsAvatarModalOpen(true);
              }}
              className="relative group cursor-pointer"
              title="Cliquez pour personnaliser votre avatar IA"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-500 p-0.5 shadow-xl shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <div className="w-full h-full bg-[#0b0f17] rounded-[14px] overflow-hidden flex items-center justify-center relative">
                  {userAccount.avatarUrl ? (
                    <img
                      src={userAccount.avatarUrl}
                      alt="Avatar de profil IA"
                      className="w-full h-full object-cover group-hover:opacity-85 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="font-black text-2xl text-emerald-400">
                      {userAccount.email.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xs opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-emerald-300">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-extrabold uppercase tracking-tight">Modifier</span>
                  </div>
                </div>
              </div>

              {/* Sparkle badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md ring-2 ring-[#0f1522] group-hover:scale-110 transition-transform">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-white">
                  {userAccount.name || userAccount.email.split('@')[0]}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> {userAccount.plan}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playSfx('click');
                    setIsAvatarModalOpen(true);
                  }}
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  <span>Avatar IA</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {userAccount.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('subscription')}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>{t.choosePlan}</span>
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="py-2.5 px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.signOut}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Account Details & Cortia Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Credits Card */}
        <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Solde de crédits
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-amber-400" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>{userAccount.credits}</span>
              <span className="text-xs text-slate-400 font-normal">
                / {userAccount.maxCredits} restants
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">1 crédit = 1 vidéo finale MP4 HD</p>
          </div>

          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${(userAccount.credits / userAccount.maxCredits) * 100}%` }}
            />
          </div>

          <button
            onClick={() => onNavigate('credits')}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-amber-400 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            + Recharger des crédits
          </button>
        </div>

        {/* Subscription Plan Card */}
        <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Abonnement Actuel
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-emerald-400">
              Plan {userAccount.plan}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Renouvellement le 24 Nov 2026 (37,00 €)
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <button
              onClick={() => onNavigate('subscription')}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold text-emerald-300 border border-emerald-500/30 transition-colors text-center"
            >
              Changer de plan
            </button>

            <button
              onClick={() => setShowCancelModal(true)}
              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-500/10 text-xs font-semibold text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
            >
              {t.cancelOneClick}
            </button>
          </div>
        </div>

        {/* Creator Rewards Status Card */}
        <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Compte Monétisé
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              <span>Éligible</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              TikTok Creator Rewards Program • RPM moyen ~0.84€
            </p>
          </div>

          <button
            onClick={() => onNavigate('monetized-account')}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            Voir les analyses de gains →
          </button>
        </div>
      </div>

      {/* Referral System & Bonus Credits Section */}
      <div className="bg-[#0f1522] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-amber-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-[#0d121d] rounded-[14px] flex items-center justify-center text-amber-400">
                <Gift className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Programme de Parrainage</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  +3 Crédits / Ami
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Invite tes contacts avec ton lien unique et gagnez des crédits bonus à chaque nouvelle inscription.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gains immédiats & illimités</span>
            </span>
          </div>
        </div>

        {/* Referral Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Amis Parrainés</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {userAccount.referralCount || 0}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Inscriptions validées</p>
          </div>

          <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Crédits Bonus Gagnés</span>
              <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono flex items-baseline gap-1">
              <span>+{userAccount.referralCreditsEarned || 0}</span>
              <span className="text-xs font-normal text-slate-400">crédits</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Soit {userAccount.referralCreditsEarned || 0} vidéos HD gratuites
            </p>
          </div>

          <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Règle Gagnant-Gagnant</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-sm font-extrabold text-slate-200 mt-1">
              <span className="text-emerald-400">+3 crédits</span> pour toi
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Et <span className="text-amber-400 font-bold">+1 crédit bonus</span> offert à ton ami dès son inscription
            </p>
          </div>
        </div>

        {/* Unique Referral Link & Code Box */}
        <div className="space-y-3 pt-1">
          <label className="text-xs font-bold text-slate-300 block">
            Ton lien de parrainage unique à partager :
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-[#0b0f17] border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3 overflow-hidden">
              <span className="text-xs font-mono text-emerald-400 truncate select-all">
                {referralLink}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 shrink-0">
                Code : <strong className="text-white">{referralCode}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Lien copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 stroke-[2.5]" />
                    <span>Copier le lien</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                className="py-3 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Copier le code uniquement"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
                <span className="hidden sm:inline">Code</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1-Click Social Sharing */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Partage instantané en 1 clic :
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsapp}
              className="py-2 px-3.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager sur WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              type="button"
              onClick={handleShareTelegram}
              className="py-2 px-3.5 rounded-xl bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-[#229ED9] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Partager sur Telegram</span>
            </button>

            {/* Twitter / X */}
            <button
              type="button"
              onClick={handleShareTwitter}
              className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Partager sur X (Twitter)</span>
            </button>
          </div>
        </div>

        {/* Sponsor Code Claim Box: If user wasn't referred yet */}
        {!userAccount.referredBy ? (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tu as été invité par un ami ? Saisis son code parrain</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Reçois immédiatement <strong className="text-amber-400">+1 crédit bonus</strong> supplémentaire en validant son code.
                </p>
              </div>

              {claimError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{claimError}</span>
                </div>
              )}

              {claimSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{claimSuccess}</span>
                </div>
              )}

              <form onSubmit={handleClaimReferralCode} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={claimCodeInput}
                  onChange={(e) => setClaimCodeInput(e.target.value.toUpperCase())}
                  placeholder="Ex: KOFFI782 ou CORTIA"
                  className="flex-1 bg-[#0d121d] border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden uppercase"
                />
                <button
                  type="submit"
                  disabled={claimLoading || !claimCodeInput.trim()}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {claimLoading ? 'Vérification...' : 'Valider (+1 crédit)'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-slate-300">
              Parrainé avec succès par le code <strong className="text-emerald-400 font-mono">{userAccount.referredBy}</strong> (+1 crédit bonus reçu lors de la validation).
            </p>
          </div>
        )}

      </div>

      {/* Historique des Gains (Referral Earnings & Bonus History Component) */}
      <ReferralEarningsHistory
        userAccount={userAccount}
        onShareLink={handleShareWhatsapp}
        onCopyLink={handleCopyLink}
        copiedLink={copiedLink}
      />

      {/* Invoices and Billing history */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Historique des factures</h3>
          </div>
          <span className="text-xs text-slate-400">Paiements sécurisés par Mobile Money & CB</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {invoices.map((inv) => (
            <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">{inv.plan}</span>
                <span className="text-slate-400 font-mono text-[11px]">{inv.id} • {inv.date}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-bold font-mono text-emerald-400">{inv.amount}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">
                  {inv.status}
                </span>
                <button
                  onClick={() => alert(`Téléchargement de la facture ${inv.id}`)}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Télécharger reçu PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal: Cancel in 1-Click */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111724] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-white">Annuler l'abonnement en 1 clic ?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Conformément à la politique Cortia, aucun engagement requis. Vous conserverez vos crédits restants ({userAccount.credits}) jusqu'à la fin de la période en cours.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-bold text-white">• Aucun frais de résiliation</p>
              <p className="text-slate-400">• Vous repasserez sur le plan TIK à la fin du mois</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              >
                Garder mon abonnement
              </button>

              <button
                onClick={handleCancelSubscription}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111724] border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-white">Se déconnecter ?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Voulez-vous vraiment vous déconnecter du compte {userAccount.email} ?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                onClick={handleSignOut}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Avatar Generator & Selector Modal */}
      <AiAvatarGeneratorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={userAccount.avatarUrl}
        onSelectAvatar={handleSelectAvatar}
      />
    </div>
  );
};
