import React from 'react';
import { Menu, Zap, Crown, Sparkles, CheckCircle2, LogOut, Search, Command } from 'lucide-react';
import { NavigationView, AppLanguage, UserAccount } from '../types';
import { translations } from '../locales/translations';
import { soundFx } from '../utils/audioUtils';

interface HeaderProps {
  currentView: NavigationView;
  onOpenMobile: () => void;
  onNavigate: (view: NavigationView) => void;
  language: AppLanguage;
  userAccount: UserAccount;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobile,
  onNavigate,
  language,
  userAccount,
  onLogout,
}) => {
  const t = translations[language] || translations.FR;

  const viewTitles: Record<NavigationView, { title: string; subtitle: string }> = {
    create: {
      title: '+ Créer un montage viral',
      subtitle: 'Assistant guidé en 5 étapes pour dominer TikTok & Shorts',
    },
    montage: {
      title: 'Montage Vidéo Automatique',
      subtitle: 'Assemblage intelligent, découpage dynamique et transitions',
    },
    'caption-mask': {
      title: 'Caption Mask Studio',
      subtitle: 'Floutez et masquez les sous-titres des concurrents',
    },
    'script-viral': {
      title: 'Générateur de Scripts Viraux',
      subtitle: 'Propulsé par Gemini AI : Rétention maximale et hooks percutants',
    },
    'voice-studio': {
      title: 'Voice Studio Pro',
      subtitle: 'Voix off IA réalistes et expressives pour vos vidéos',
    },
    'latest-creation': {
      title: 'Ma dernière création',
      subtitle: 'Aperçu, analyse de rétention et téléchargement haute définition',
    },
    tutorial: {
      title: 'Tutoriel & Masterclass',
      subtitle: 'Comment générer 1M de vues par semaine avec Cortia',
    },
    community: {
      title: 'Communauté Créateurs VIP',
      subtitle: 'Rejoins 14 000+ créateurs sur Discord & Telegram',
    },
    subscription: {
      title: 'Abonnement & Formules',
      subtitle: 'Passez au niveau supérieur avec le plan PRO ou ELITE',
    },
    credits: {
      title: 'Mes Crédits de Rendu',
      subtitle: 'Gérez et rechargez vos crédits instantanément',
    },
    'monetized-account': {
      title: 'Programme Compte Monétisé',
      subtitle: 'Éligibilité TikTok Creator Rewards & calculateurs de RPM',
    },
    settings: {
      title: 'Paramètres du Studio',
      subtitle: 'Configuration du rendu vidéo, clés API et préférences',
    },
    profile: {
      title: 'Mon Profil Créateur',
      subtitle: 'Gestion du compte Cortia, emails et facturation',
    },
    support: {
      title: 'Support & Assistance VIP',
      subtitle: 'Équipe dédiée disponible 7j/7 par WhatsApp et chat',
    },
    admin: {
      title: 'Administration SaaS Cortia',
      subtitle: 'Gestion des clients inscrits, crédits en 1 clic et passerelles Mobile Money',
    },
  };

  const currentInfo = viewTitles[currentView] || {
    title: 'Cortia Video Studio',
    subtitle: 'Plateforme de remix vidéo IA',
  };

  const isUnlimited = Boolean(userAccount.isUnlimited || userAccount.plan === 'ELITE');

  return (
    <header className="sticky top-0 z-30 bg-[#0d121d]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>{currentInfo.title}</span>
            {currentView === 'create' && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Assistant IA 5 Étapes
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 hidden md:block">{currentInfo.subtitle}</p>
        </div>
      </div>

      {/* Right side: Quick stats, credits, profile & logout */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Search & Shortcuts Trigger */}
        <button
          type="button"
          onClick={() => {
            soundFx.playSfx('whoosh');
            window.dispatchEvent(new CustomEvent('cortia:open-command-palette'));
          }}
          className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
          title="Ouvrir la palette de commandes et raccourcis (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px]">Accès rapide</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-emerald-400 border border-slate-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Active plan pill */}
        <button
          onClick={() => onNavigate('subscription')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-colors cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5 text-emerald-400" />
          <span>{userAccount.plan ? `Plan ${userAccount.plan}` : 'Choisir un plan'}</span>
        </button>

        {/* Live Credits badge */}
        <button
          onClick={() => onNavigate('credits')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{isUnlimited ? 'Illimité' : `${userAccount.credits} crédits`}</span>
        </button>

        {/* Profile Avatar trigger */}
        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 transition-all text-left cursor-pointer group"
          title="Voir le profil et avatar IA"
        >
          {userAccount.avatarUrl ? (
            <div className="w-7 h-7 rounded-lg overflow-hidden ring-1 ring-emerald-500/40 group-hover:ring-emerald-400 shrink-0">
              <img
                src={userAccount.avatarUrl}
                alt="Avatar de profil IA"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
              {userAccount.email.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px] group-hover:text-emerald-300 transition-colors">
              {userAccount.name || userAccount.email.split('@')[0]}
            </p>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Connecté
            </p>
          </div>
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter / Changer de compte"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 border border-slate-700/70 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
