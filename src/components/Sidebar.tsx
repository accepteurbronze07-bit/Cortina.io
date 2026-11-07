import React from 'react';
import {
  Sparkles,
  Scissors,
  EyeOff,
  FileText,
  Mic,
  Film,
  GraduationCap,
  Users,
  CreditCard,
  Coins,
  BadgeDollarSign,
  Settings,
  User,
  HelpCircle,
  X,
  Plus,
  ChevronDown,
  Flame,
  Shield,
} from 'lucide-react';
import { NavigationView, AppLanguage, UserAccount } from '../types';
import { LANGUAGES, translations } from '../locales/translations';
import { soundFx } from '../utils/audioUtils';

interface SidebarProps {
  currentView: NavigationView;
  onNavigate: (view: NavigationView) => void;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  userAccount: UserAccount;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  language,
  onLanguageChange,
  isOpenMobile,
  onCloseMobile,
  userAccount,
}) => {
  const t = translations[language] || translations.FR;
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);

  const handleNavClick = (view: NavigationView) => {
    soundFx.playSfx('click');
    onNavigate(view);
    onCloseMobile();
  };

  const isUnlimited = Boolean(userAccount.isUnlimited || userAccount.plan === 'ELITE');

  const navItems = [
    {
      group: 'Outils',
      items: [
        {
          id: 'montage' as NavigationView,
          label: t.montagePro,
          icon: Scissors,
          badge: 'PRO',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'caption-mask' as NavigationView,
          label: t.captionMaskTik,
          icon: EyeOff,
          badge: 'TIK',
          badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
        },
        {
          id: 'script-viral' as NavigationView,
          label: t.scriptViralPro,
          icon: FileText,
          badge: 'PRO',
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        },
        {
          id: 'voice-studio' as NavigationView,
          label: t.voiceStudioPro,
          icon: Mic,
          badge: 'PRO',
          badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        },
      ],
    },
    {
      group: 'Bibliothèque',
      items: [
        {
          id: 'latest-creation' as NavigationView,
          label: t.myLatestCreation,
          icon: Film,
          badge: `${userAccount.creations?.length || 1}`,
          badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
        },
        {
          id: 'tutorial' as NavigationView,
          label: t.tutorial,
          icon: GraduationCap,
        },
        {
          id: 'community' as NavigationView,
          label: t.community,
          icon: Users,
        },
      ],
    },
    {
      group: 'Monétisation',
      items: [
        {
          id: 'subscription' as NavigationView,
          label: t.subscription,
          icon: CreditCard,
          badge: userAccount.plan || 'FREE',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
        {
          id: 'credits' as NavigationView,
          label: t.credits,
          icon: Coins,
          badge: isUnlimited ? '∞' : `${userAccount.credits}`,
          badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-mono',
        },
        {
          id: 'monetized-account' as NavigationView,
          label: t.monetizedAccount,
          icon: BadgeDollarSign,
          badge: '98%',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        },
      ],
    },
    {
      group: 'Compte & Préférences',
      items: [
        {
          id: 'settings' as NavigationView,
          label: t.settings,
          icon: Settings,
        },
        {
          id: 'profile' as NavigationView,
          label: t.profile,
          icon: User,
        },
        {
          id: 'support' as NavigationView,
          label: t.support,
          icon: HelpCircle,
        },
        {
          id: 'admin' as NavigationView,
          label: 'Admin',
          icon: Shield,
          badge: 'SaaS',
          badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        },
      ],
    },
  ];

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0d121d] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <button
            onClick={() => handleNavClick('create')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#0d121d] rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-white">Cortia</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Video Studio Automator</p>
            </div>
          </button>

          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Green "+ Créer" Button */}
        <div className="p-4 pb-2">
          <button
            onClick={() => handleNavClick('create')}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <div className="w-5 h-5 rounded-full bg-slate-950/20 flex items-center justify-center text-slate-950 group-hover:rotate-90 transition-transform">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>{t.createBtn}</span>
            <Sparkles className="w-4 h-4 ml-auto text-slate-950/70" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {navItems.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.group}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      {item.id === 'profile' && userAccount.avatarUrl ? (
                        <img
                          src={userAccount.avatarUrl}
                          alt="Avatar profil"
                          className="w-4 h-4 rounded-full object-cover shrink-0 ring-1 ring-emerald-500/60"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-emerald-400'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                      )}
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${
                            item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Account quick info & Language Selector */}
        <div className="p-3 border-t border-slate-800 bg-[#0a0e17]">
          {/* Creator Profile Card with AI Avatar */}
          <div
            onClick={() => handleNavClick('profile')}
            className="mb-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-800/50 cursor-pointer transition-all flex items-center gap-2.5 group"
            title="Gérer mon profil et avatar IA"
          >
            <div className="relative shrink-0">
              {userAccount.avatarUrl ? (
                <img
                  src={userAccount.avatarUrl}
                  alt="Avatar IA"
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-emerald-500/40 group-hover:ring-emerald-400 transition-all shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center">
                  {userAccount.email.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0a0e17]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                  {userAccount.name || userAccount.email.split('@')[0]}
                </p>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {userAccount.plan || 'FREE'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span>Avatar IA Personnalisé</span>
              </p>
            </div>
          </div>

          {/* Credits Mini-bar */}
          <div
            onClick={() => handleNavClick('credits')}
            className="mb-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                ⚡
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-200">
                  {isUnlimited
                    ? 'Crédits Illimités'
                    : `${userAccount.credits} / ${userAccount.maxCredits} crédits`}
                </p>
                <p className="text-[10px] text-slate-400">
                  {userAccount.plan ? `Plan ${userAccount.plan} Actif` : 'Compte Gratuit'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 hover:underline">
              + Recharger
            </span>
          </div>

          {/* Multilingual Selector (FR, EN, ES, DE, RU, AR, PT) */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="w-full py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{currentLangObj.flag}</span>
                <span className="font-semibold text-white">{currentLangObj.code}</span>
                <span className="text-slate-400 text-[11px]">({currentLangObj.label})</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  langMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {langMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 p-1 bg-[#121826] border border-slate-700/80 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto space-y-0.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setLangMenuOpen(false);
                      soundFx.playSfx('pop');
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      language === lang.code
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="font-bold">{lang.code}</span>
                    <span className="text-slate-400 text-[11px] ml-auto">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
