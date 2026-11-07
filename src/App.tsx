/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Sparkles,
  X,
  Zap,
  Check,
  Smartphone,
  CreditCard,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QuickAccessBar } from './components/QuickAccessBar';
import { StepWizard } from './components/wizard/StepWizard';
import { ProfileView } from './components/views/ProfileView';
import { SubscriptionView } from './components/views/SubscriptionView';
import { CreditsView } from './components/views/CreditsView';
import { MonetizedAccountView } from './components/views/MonetizedAccountView';
import { LatestCreationView } from './components/views/LatestCreationView';
import { TutorialView } from './components/views/TutorialView';
import { CommunityView } from './components/views/CommunityView';
import { VoiceStudioView } from './components/views/VoiceStudioView';
import { CaptionMaskStandaloneView } from './components/views/CaptionMaskStandaloneView';
import { ScriptViralStandaloneView } from './components/views/ScriptViralStandaloneView';
import { SettingsView } from './components/views/SettingsView';
import { SupportModal } from './components/views/SupportModal';
import { AdminView } from './components/views/AdminView';
import { AuthPage } from './components/auth/AuthPage';
import {
  NavigationView,
  AppLanguage,
  AppTheme,
  UserAccount,
  CompletedCreation,
  PaymentGatewayConfig,
} from './types';
import { soundFx } from './utils/audioUtils';

export default function App() {
  const [currentView, setCurrentView] = useState<NavigationView>('create');
  const [language, setLanguage] = useState<AppLanguage>('FR');
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cortia_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [welcomeNewUserBanner, setWelcomeNewUserBanner] = useState<boolean>(false);
  const [showZeroCreditModal, setShowZeroCreditModal] = useState<boolean>(false);
  const [preselectedCheckoutPlan, setPreselectedCheckoutPlan] = useState<
    'TIK' | 'PRO' | 'ELITE' | null
  >(null);
  const [isProcessingModalUpgrade, setIsProcessingModalUpgrade] = useState<boolean>(false);

  // Sync theme with document attributes & classes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
        document.body.classList.remove('theme-light');
      }
      localStorage.setItem('cortia_theme', theme);
    }
  }, [theme]);

  const initialPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const savedToken =
    typeof window !== 'undefined' ? localStorage.getItem('cortia_auth_token') : null;

  // When a visitor arrives without being logged in (no saved token, or on /login or /signup), show the Cortia.io Landing + Sign Up / Login page first
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(
    !savedToken || initialPath === '/login' || initialPath === '/signup'
  );
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>(
    initialPath === '/login' ? 'login' : 'signup'
  );

  const [authToken, setAuthToken] = useState<string>(savedToken || '');

  // User Account State
  const [userAccount, setUserAccount] = useState<UserAccount>({
    id: 'usr_owner_1',
    name: 'Propriétaire Cortia',
    role: 'admin',
    email: 'accepteurbronze07@gmail.com',
    avatarUrl: '/src/assets/images/creator_avatar_cyber_1793963428734.jpg',
    authProvider: 'google',
    credits: 75,
    maxCredits: 75,
    isUnlimited: false,
    plan: 'PRO',
    billingCycle: 'monthly',
    memberSince: 'Octobre 2026',
    videosCreatedThisMonth: 12,
    maxVideosMonth: 75,
    hasMonetizedAccount: true,
    estimatedMonthlyEarnings: 840,
  });

  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig | undefined>(undefined);

  // Creations Library (no hardcoded demo script)
  const [creations, setCreations] = useState<CompletedCreation[]>([]);

  // Hydrate user session & payment config from persistent server database
  useEffect(() => {
    if (!authToken) return;
    const fetchCurrentSession = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUserAccount(data.user);
            if (Array.isArray(data.user.creations)) {
              setCreations(data.user.creations);
            }
          }
          if (data.paymentConfig) {
            setPaymentConfig(data.paymentConfig);
          }
        } else if (res.status === 401) {
          localStorage.removeItem('cortia_auth_token');
          setAuthToken('');
          setShowAuthScreen(true);
        }
      } catch (e) {
        console.error('Session hydration error:', e);
      }
    };
    fetchCurrentSession();
  }, [authToken]);

  const handleAuthSuccess = (
    token: string,
    user: UserAccount,
    cfg?: PaymentGatewayConfig,
    isNewSignup?: boolean
  ) => {
    localStorage.setItem('cortia_auth_token', token);
    setAuthToken(token);
    setUserAccount(user);
    if (cfg) {
      setPaymentConfig(cfg);
    }
    if (Array.isArray(user.creations)) {
      setCreations(user.creations);
    }
    setShowAuthScreen(false);
    if (isNewSignup) {
      setWelcomeNewUserBanner(true);
      setCurrentView('create');
    }
    try {
      window.history.replaceState({}, '', '/');
    } catch {
      // ignore in restricted iframe
    }
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch {
      // ignore
    }
    localStorage.removeItem('cortia_auth_token');
    setAuthToken('');
    setWelcomeNewUserBanner(false);
    setShowZeroCreditModal(false);
    setAuthInitialMode('signup');
    setShowAuthScreen(true);
    try {
      window.history.replaceState({}, '', '/signup');
    } catch {
      // ignore
    }
  };

  const handleCreationComplete = async (newCreation: CompletedCreation) => {
    setCreations((prev) => [newCreation, ...prev]);
    try {
      const res = await fetch('/api/user/creations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ creation: newCreation }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUserAccount(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Every final video generation/download consumes 1 credit (credits - 1).
  // As soon as the balance reaches 0 credit, display the modern modal prompting to subscribe to TIK, PRO, or ÉLITE.
  const handleDeductCredit = async () => {
    let hitZeroLocally = false;
    setUserAccount((prev) => {
      const isUnlim = Boolean(prev.isUnlimited || prev.plan === 'ELITE');
      const nextCredits = isUnlim ? prev.credits : Math.max(0, prev.credits - 1);
      if (!isUnlim && nextCredits <= 0) {
        hitZeroLocally = true;
      }
      return {
        ...prev,
        credits: nextCredits,
        videosCreatedThisMonth: prev.videosCreatedThisMonth + 1,
      };
    });

    if (hitZeroLocally) {
      setShowZeroCreditModal(true);
    }

    try {
      const res = await fetch('/api/user/deduct-credit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserAccount(data.user);
          const isUnlimServer = Boolean(data.user.isUnlimited || data.user.plan === 'ELITE');
          if (!isUnlimServer && data.user.credits <= 0) {
            setShowZeroCreditModal(true);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNavigate = (view: NavigationView) => {
    soundFx.playSfx('click');
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOfferFromZeroModal = (planId: 'TIK' | 'PRO' | 'ELITE') => {
    soundFx.playSfx('ding');
    setPreselectedCheckoutPlan(planId);
    setShowZeroCreditModal(false);
    setCurrentView('subscription');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickGatewaySubscribeFromModal = async (
    planId: 'TIK' | 'PRO' | 'ELITE',
    gateway: 'CinetPay' | 'FedaPay'
  ) => {
    setIsProcessingModalUpgrade(true);
    soundFx.playSfx('whoosh');
    try {
      const res = await fetch('/api/webhook/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId: userAccount.id,
          email: userAccount.email,
          planId,
          gateway,
          operator: 'Orange Money / Moov Money',
          amountDisplay:
            planId === 'ELITE'
              ? '50 000 FCFA'
              : planId === 'PRO'
              ? '24 000 FCFA'
              : '11 000 FCFA',
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUserAccount(data.user);
        soundFx.playSfx('chaching');
        setShowZeroCreditModal(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingModalUpgrade(false);
    }
  };

  if (showAuthScreen) {
    return <AuthPage initialMode={authInitialMode} onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col lg:flex-row antialiased selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        language={language}
        onLanguageChange={setLanguage}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        userAccount={userAccount}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Sticky Header */}
        <Header
          currentView={currentView}
          onOpenMobile={() => setIsOpenMobile(true)}
          onNavigate={handleNavigate}
          language={language}
          userAccount={userAccount}
          onLogout={handleLogout}
        />

        {/* Quick Access Bar with Keyboard Shortcuts (Ctrl+N, Ctrl+S, Ctrl+K, etc.) */}
        <QuickAccessBar
          currentView={currentView}
          onNavigate={handleNavigate}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        />

        {/* Welcome Banner for newly registered clients: 1 free credit (1 test video) */}
        {welcomeNewUserBanner && (
          <div className="mx-4 sm:mx-6 lg:mx-8 mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black text-white">
                  Bienvenue sur Cortia.io, {userAccount.name || userAccount.email.split('@')[0]} ! 🎉
                </p>
                <p className="text-xs text-slate-300">
                  Ton compte ({userAccount.email}) a reçu{' '}
                  <strong className="text-emerald-400">
                    1 crédit gratuit de bienvenue (1 vidéo de test)
                  </strong>
                  . Crée ta vidéo de test maintenant ou débloque plus de crédits avec une offre !
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentView !== 'subscription' ? (
                <button
                  type="button"
                  onClick={() => handleNavigate('subscription')}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Voir les offres TIK / PRO / ÉLITE</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavigate('create')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                >
                  + Créer ma vidéo de test (1 crédit) →
                </button>
              )}
              <button
                type="button"
                onClick={() => setWelcomeNewUserBanner(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* View Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'create' && (
            <StepWizard
              language={language}
              onCreationComplete={handleCreationComplete}
              userCredits={
                userAccount.isUnlimited || userAccount.plan === 'ELITE' ? 9999 : userAccount.credits
              }
              onDeductCredit={handleDeductCredit}
              onRequireUpgrade={() => setShowZeroCreditModal(true)}
            />
          )}

          {currentView === 'montage' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300">
                <span>Le studio de montage vidéo automatique utilise le flux guidé en 5 étapes.</span>
                <button
                  onClick={() => handleNavigate('create')}
                  className="font-bold underline cursor-pointer"
                >
                  Lancer le montage →
                </button>
              </div>
              <StepWizard
                language={language}
                onCreationComplete={handleCreationComplete}
                userCredits={
                  userAccount.isUnlimited || userAccount.plan === 'ELITE' ? 9999 : userAccount.credits
                }
                onDeductCredit={handleDeductCredit}
                onRequireUpgrade={() => setShowZeroCreditModal(true)}
              />
            </div>
          )}

          {currentView === 'caption-mask' && <CaptionMaskStandaloneView language={language} />}

          {currentView === 'script-viral' && <ScriptViralStandaloneView language={language} />}

          {currentView === 'voice-studio' && <VoiceStudioView language={language} />}

          {currentView === 'latest-creation' && (
            <LatestCreationView
              creations={creations}
              onNavigateToCreate={() => handleNavigate('create')}
              language={language}
            />
          )}

          {currentView === 'tutorial' && (
            <TutorialView language={language} onStartCreate={() => handleNavigate('create')} />
          )}

          {currentView === 'community' && <CommunityView language={language} />}

          {currentView === 'subscription' && (
            <SubscriptionView
              userAccount={userAccount}
              onUpdateAccount={setUserAccount}
              language={language}
              authToken={authToken}
              paymentConfig={paymentConfig}
              initialCheckoutPlan={preselectedCheckoutPlan}
            />
          )}

          {currentView === 'credits' && (
            <CreditsView
              userAccount={userAccount}
              onUpdateAccount={setUserAccount}
              language={language}
              authToken={authToken}
            />
          )}

          {currentView === 'monetized-account' && (
            <MonetizedAccountView userAccount={userAccount} language={language} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              language={language}
              onLanguageChange={setLanguage}
              userAccount={userAccount}
              theme={theme}
              onThemeChange={setTheme}
            />
          )}

          {currentView === 'profile' && (
            <ProfileView
              userAccount={userAccount}
              onUpdateAccount={setUserAccount}
              onNavigate={handleNavigate}
              language={language}
              authToken={authToken}
              onLogout={handleLogout}
            />
          )}

          {currentView === 'support' && <SupportModal language={language} />}

          {currentView === 'admin' && (
            <AdminView
              authToken={authToken}
              currentUser={userAccount}
              onUserUpdated={setUserAccount}
              onPaymentConfigUpdated={setPaymentConfig}
            />
          )}
        </main>
      </div>

      {/* Modern 0-Credit Upgrade Modal (Displayed automatically as soon as balance reaches 0 credits) */}
      {showZeroCreditModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f1522] border-2 border-emerald-500/50 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowZeroCreditModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                <span>Solde atteint : 0 crédit disponible</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Tu as utilisé ton crédit gratuit de test ! 🚀
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Choisis une offre ci-dessous (<strong>TIK</strong>, <strong>PRO</strong> ou{' '}
                <strong>ÉLITE</strong>) pour débloquer immédiatement de nouveaux crédits vidéos via{' '}
                <strong>Orange Money, Moov Money, Wave, CinetPay, FedaPay ou Carte</strong>.
              </p>
            </div>

            {/* 3 Offers Grid inside the Modal */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Offer 1: TIK */}
              <div className="rounded-2xl bg-[#0b101b] border border-slate-800 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-sky-400">Offre TIK</span>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-black">
                      +25 CRÉDITS
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    11 000 FCFA <span className="text-xs text-slate-400 font-normal">(17€)</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>+25 vidéos HD (.MP4)</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Voix IA + Caption Mask</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    disabled={isProcessingModalUpgrade}
                    onClick={() => handleSelectOfferFromZeroModal('TIK')}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Choisir TIK (+25)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingModalUpgrade}
                    onClick={() => handleQuickGatewaySubscribeFromModal('TIK', 'CinetPay')}
                    className="w-full py-2 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold cursor-pointer"
                  >
                    ⚡ CinetPay / Mobile Money
                  </button>
                </div>
              </div>

              {/* Offer 2: PRO (Popular) */}
              <div className="rounded-2xl bg-gradient-to-b from-[#132425] to-[#0b101b] border-2 border-emerald-500 p-5 flex flex-col justify-between space-y-4 relative shadow-xl shadow-emerald-500/15">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-slate-950" /> POPULAIRE
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-400">Offre PRO</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black">
                      +75 CRÉDITS
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    24 000 FCFA <span className="text-xs text-slate-400 font-normal">(37€)</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-200 pt-2 border-t border-slate-800/80">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>+75 vidéos virales .MP4</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Toutes les Voix Humaines PRO</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    disabled={isProcessingModalUpgrade}
                    onClick={() => handleSelectOfferFromZeroModal('PRO')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/25"
                  >
                    <span>Débloquer PRO (+75)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingModalUpgrade}
                    onClick={() => handleQuickGatewaySubscribeFromModal('PRO', 'CinetPay')}
                    className="w-full py-2 px-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[11px] font-bold cursor-pointer"
                  >
                    ⚡ CinetPay / FedaPay Direct
                  </button>
                </div>
              </div>

              {/* Offer 3: ÉLITE */}
              <div className="rounded-2xl bg-[#0b101b] border border-amber-500/40 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-400">Offre ÉLITE</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                      ILLIMITÉ
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    50 000 FCFA <span className="text-xs text-slate-400 font-normal">(77€)</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Vidéos & Crédits ILLIMITÉS</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Priorité Serveur + Support VIP</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    disabled={isProcessingModalUpgrade}
                    onClick={() => handleSelectOfferFromZeroModal('ELITE')}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Passer en ÉLITE Illimité</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingModalUpgrade}
                    onClick={() => handleQuickGatewaySubscribeFromModal('ELITE', 'FedaPay')}
                    className="w-full py-2 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold cursor-pointer"
                  >
                    💳 FedaPay / Mobile Money
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Orange Money ({paymentConfig?.orangeMoneyNumber || '+225 07 00 00 00 00'}) • Moov
                  Money ({paymentConfig?.moovMoneyNumber || '+225 01 00 00 00 00'}) • Wave • CB
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowZeroCreditModal(false)}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

