import React, { useState } from 'react';
import {
  Settings,
  Check,
  Sparkles,
  Monitor,
  Sliders,
  ShieldCheck,
  Database,
  Sun,
  Moon,
  Palette,
  Eye,
} from 'lucide-react';
import { AppLanguage, UserAccount, AppTheme } from '../../types';
import { LANGUAGES } from '../../locales/translations';
import { soundFx } from '../../utils/audioUtils';

interface SettingsViewProps {
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  userAccount: UserAccount;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageChange,
  userAccount,
  theme = 'dark',
  onThemeChange,
}) => {
  const [resolution, setResolution] = useState<'1080p' | '4K'>('1080p');
  const [fps, setFps] = useState<'60fps' | '30fps'>('60fps');
  const [autoSave, setAutoSave] = useState(true);
  const [savedNotification, setSavedNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('Paramètres enregistrés avec succès.');

  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    if (theme) return theme;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cortia_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });

  const handleToggleTheme = (newTheme: AppTheme) => {
    soundFx.playSfx('click');
    setCurrentTheme(newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'light') {
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
        document.body.classList.remove('theme-light');
      }
      localStorage.setItem('cortia_theme', newTheme);
    }
    setNotificationMsg(
      newTheme === 'light'
        ? '☀️ Thème clair haute visibilité activé.'
        : '🌙 Thème sombre studio activé.'
    );
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleSave = () => {
    soundFx.playSfx('ding');
    setNotificationMsg('Paramètres enregistrés avec succès.');
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Paramètres du Studio
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">Configuration du Moteur de Rendu</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Personnalise tes préférences d'encodage vidéo, la langue par défaut et le traitement audio.
        </p>
      </div>

      {savedNotification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Theme Selection & Toggle Card */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Apparence & Thème de l'Interface
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Alterne en un clic entre le mode sombre studio et le mode clair haute visibilité pour un confort de lecture optimal.
            </p>
          </div>

          {/* Interactive Toggle Switch Button */}
          <button
            type="button"
            onClick={() => handleToggleTheme(currentTheme === 'dark' ? 'light' : 'dark')}
            className={`relative inline-flex h-9 w-20 shrink-0 cursor-pointer rounded-full border-2 p-0.5 transition-colors duration-300 ease-in-out focus:outline-none ${
              currentTheme === 'light'
                ? 'bg-amber-400 border-amber-300 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 border-slate-700'
            }`}
            aria-label="Basculer le thème"
            title={currentTheme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            <span
              className={`pointer-events-none flex h-7.5 w-7.5 transform items-center justify-center rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${
                currentTheme === 'light' ? 'translate-x-11 text-amber-600' : 'translate-x-0.5 text-slate-800'
              }`}
            >
              {currentTheme === 'light' ? (
                <Sun className="h-4 w-4 fill-amber-500 text-amber-600" />
              ) : (
                <Moon className="h-4 w-4 fill-slate-800 text-slate-900" />
              )}
            </span>
            <span className="sr-only">Toggle theme</span>
          </button>
        </div>

        {/* 2 Selectable Theme Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Dark Mode Card */}
          <div
            onClick={() => handleToggleTheme('dark')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              currentTheme === 'dark'
                ? 'bg-slate-900/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
                  <Moon className="w-4 h-4 fill-slate-300 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Thème Sombre Studio</h4>
                  <span className="text-[10px] text-slate-400">Design cinéma feutré</span>
                </div>
              </div>
              {currentTheme === 'dark' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Actif
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Arrière-plans sombres profonds (#0b0f17) reposants pour les yeux lors du montage vidéo et travail de nuit.
            </p>
          </div>

          {/* Light Mode Card */}
          <div
            onClick={() => handleToggleTheme('light')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
              currentTheme === 'light'
                ? 'bg-slate-900/90 border-amber-400 shadow-lg shadow-amber-400/10 ring-1 ring-amber-400/30'
                : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sun className="w-4 h-4 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Thème Clair Haute Visibilité</h4>
                  <span className="text-[10px] text-amber-400 font-bold">Contraste Élevé</span>
                </div>
              </div>
              {currentTheme === 'light' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Actif
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Surfaces blanches éclatantes et typographie noire intense (#0f172a), parfait pour le travail en plein jour ou bureau éclairé.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Video Quality */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white uppercase tracking-wider block">
            Résolution d'encodage par défaut
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setResolution('1080p')}
              className={`p-3 rounded-xl border text-left transition-all ${
                resolution === '1080p'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold text-xs block">1080x1920 (Full HD Vertical)</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Standard recommandé pour TikTok, Reels et Shorts (Rendu rapide)
              </span>
            </button>

            <button
              onClick={() => setResolution('4K')}
              className={`p-3 rounded-xl border text-left transition-all ${
                resolution === '4K'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold text-xs block">2160x3840 (4K Ultra HD)</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Netteté extrême pour les écrans OLED et iPad
              </span>
            </button>
          </div>
        </div>

        {/* Frame Rate */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-bold text-white uppercase tracking-wider block">
            Cadence d'images (FPS)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFps('60fps')}
              className={`p-3 rounded-xl border text-left transition-all ${
                fps === '60fps'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold text-xs block">60 FPS (Ultra Fluide)</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Idéal pour les transitions dynamiques</span>
            </button>

            <button
              onClick={() => setFps('30fps')}
              className={`p-3 rounded-xl border text-left transition-all ${
                fps === '30fps'
                  ? 'bg-emerald-500/15 border-emerald-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              <span className="font-bold text-xs block">30 FPS (Standard Cinéma)</span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Fichiers plus légers</span>
            </button>
          </div>
        </div>

        {/* Engine Status */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <label className="text-xs font-bold text-white uppercase tracking-wider block">
            Statut du Moteur IA
          </label>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">Google Gemini 3.8 Engine</span>
            </div>
            <span className="text-emerald-400 font-mono text-[11px] font-bold">Actif & Connecté</span>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            onClick={handleSave}
            className="py-2.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
          >
            Enregistrer les préférences
          </button>
        </div>
      </div>
    </div>
  );
};
