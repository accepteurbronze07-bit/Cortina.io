import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Save,
  Video,
  Mic,
  FileText,
  Sparkles,
  Palette,
  HelpCircle,
  X,
  Check,
  Zap,
  ArrowRight,
  Sliders,
  Crown,
  Share2,
  Shield,
  Laptop,
  CheckCircle2,
  Command,
  Eye,
  Download,
  Maximize2,
} from 'lucide-react';
import { NavigationView, AppTheme } from '../types';
import { soundFx } from '../utils/audioUtils';
import { toast } from './toast/ToastContext';

interface QuickAccessBarProps {
  currentView: NavigationView;
  onNavigate: (view: NavigationView) => void;
  theme: AppTheme;
  onToggleTheme: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  category: 'Création & Montage' | 'IA & Outils' | 'Compte & Crédits' | 'Interface & Paramètres';
  shortcut: string;
  icon: React.FC<{ className?: string }>;
  action: () => void;
  description: string;
}

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({
  currentView,
  onNavigate,
  theme,
  onToggleTheme,
}) => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [osType, setOsType] = useState<'win' | 'mac'>('win');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect OS for shortcut display (Ctrl vs Cmd)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      setOsType(isMac ? 'mac' : 'win');
    }
  }, []);

  // Show floating toast on shortcut trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Quick action: New Project
  const handleNewProject = () => {
    soundFx.playSfx('pop');
    onNavigate('create');
    window.dispatchEvent(new CustomEvent('cortia:new-project'));
    toast.info('Nouveau projet initié via raccourci clavier.', 'Nouveau Projet');
    triggerToast('⚡ Raccourci Ctrl+N : Nouveau projet initié');
  };

  // Quick action: Save Script
  const handleSaveScript = () => {
    soundFx.playSfx('ding');
    // Save any draft script in focus or active script to localStorage
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const activeText =
      document.querySelector('textarea')?.value ||
      localStorage.getItem('cortia_saved_script_draft') ||
      'Script Cortia sauvegardé avec succès.';

    localStorage.setItem('cortia_saved_script_draft', activeText);
    localStorage.setItem('cortia_script_last_saved_time', now);
    window.dispatchEvent(new CustomEvent('cortia:save-script', { detail: { text: activeText } }));

    toast.success(`Script sauvegardé avec succès à ${now} !`, 'Sauvegarde Script');
    triggerToast(`💾 Raccourci Ctrl+S : Script sauvegardé à ${now}`);
  };

  // Quick action: Caption Mask
  const handleCaptionMask = () => {
    soundFx.playSfx('click');
    onNavigate('caption-mask');
    triggerToast('🎭 Raccourci Ctrl+M : Caption Mask Studio');
  };

  // Quick action: Viral Script
  const handleViralScript = () => {
    soundFx.playSfx('click');
    onNavigate('script-viral');
    triggerToast('⚡ Raccourci Ctrl+G : Générateur de Scripts Viraux');
  };

  // Quick action: Voice Studio
  const handleVoiceStudio = () => {
    soundFx.playSfx('click');
    onNavigate('voice-studio');
    triggerToast('🎙️ Raccourci Alt+V : Voice Studio Pro');
  };

  // Quick action: Toggle Theme
  const handleToggleThemeShortcut = () => {
    soundFx.playSfx('click');
    onToggleTheme();
    triggerToast(`🌓 Raccourci Alt+T : Thème ${theme === 'dark' ? 'Clair' : 'Sombre'} activé`);
  };

  // All registered commands
  const commands: CommandItem[] = [
    {
      id: 'new-project',
      title: 'Nouveau projet de montage',
      category: 'Création & Montage',
      shortcut: 'Ctrl + N',
      icon: Plus,
      action: handleNewProject,
      description: 'Lancer un nouveau remix TikTok guidé en 5 étapes',
    },
    {
      id: 'save-script',
      title: 'Sauvegarder le script',
      category: 'Création & Montage',
      shortcut: 'Ctrl + S',
      icon: Save,
      action: handleSaveScript,
      description: 'Enregistrer le script actuel et le brouillon dans le studio',
    },
    {
      id: 'caption-mask',
      title: 'Caption Mask Studio',
      category: 'Création & Montage',
      shortcut: 'Ctrl + M',
      icon: Video,
      action: handleCaptionMask,
      description: 'Flouter ou masquer les sous-titres des concurrents',
    },
    {
      id: 'viral-script',
      title: 'Générateur de Scripts Viraux',
      category: 'IA & Outils',
      shortcut: 'Ctrl + G',
      icon: FileText,
      action: handleViralScript,
      description: 'Créer un script avec Gemini IA et hooks de rétention',
    },
    {
      id: 'voice-studio',
      title: 'Voice Studio Pro',
      category: 'IA & Outils',
      shortcut: 'Alt + V',
      icon: Mic,
      action: handleVoiceStudio,
      description: 'Générer une voix-off IA réaliste en français ou anglais',
    },
    {
      id: 'latest-creation',
      title: 'Ma dernière création .MP4',
      category: 'Création & Montage',
      shortcut: 'Ctrl + L',
      icon: Sparkles,
      action: () => {
        onNavigate('latest-creation');
        triggerToast('🎬 Vue : Dernière création');
      },
      description: 'Visualiser et télécharger la dernière vidéo assemblée',
    },
    {
      id: 'credits',
      title: 'Mes Crédits de Rendu',
      category: 'Compte & Crédits',
      shortcut: 'Ctrl + C',
      icon: Zap,
      action: () => {
        onNavigate('credits');
        triggerToast('⚡ Vue : Mes Crédits');
      },
      description: 'Consulter le solde et recharger par Orange Money ou Wave',
    },
    {
      id: 'subscription',
      title: 'Abonnements TIK, PRO & ÉLITE',
      category: 'Compte & Crédits',
      shortcut: 'Ctrl + B',
      icon: Crown,
      action: () => {
        onNavigate('subscription');
        triggerToast('👑 Vue : Abonnements');
      },
      description: 'Passer à la vitesse supérieure avec des crédits illimités',
    },
    {
      id: 'toggle-theme',
      title: `Basculer vers le thème ${theme === 'dark' ? 'Clair' : 'Sombre'}`,
      category: 'Interface & Paramètres',
      shortcut: 'Alt + T',
      icon: Palette,
      action: handleToggleThemeShortcut,
      description: 'Alterner entre le mode sombre cinéma et le mode clair haute visibilité',
    },
    {
      id: 'toggle-fullscreen',
      title: 'Mode Plein Écran (Workspace Montage)',
      category: 'Interface & Paramètres',
      shortcut: 'F',
      icon: Maximize2,
      action: () => {
        window.dispatchEvent(new CustomEvent('cortia:toggle-fullscreen'));
        triggerToast('🖥️ Mode Plein Écran basculé');
      },
      description: 'Maximiser l’espace de travail du studio de montage vidéo (Touche F ou Échap)',
    },
    {
      id: 'settings',
      title: 'Paramètres du Studio',
      category: 'Interface & Paramètres',
      shortcut: 'Ctrl + ,',
      icon: Sliders,
      action: () => {
        onNavigate('settings');
        triggerToast('⚙️ Vue : Paramètres');
      },
      description: 'Résolution de rendu (1080p / 4K) et cadence FPS',
    },
    {
      id: 'help-shortcuts',
      title: 'Guide des raccourcis clavier',
      category: 'Interface & Paramètres',
      shortcut: '?',
      icon: HelpCircle,
      action: () => setIsHelpOpen(true),
      description: 'Afficher la liste complète des raccourcis du studio',
    },
  ];

  // Filter commands by search query
  const filteredCommands = commands.filter((cmd) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.shortcut.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    );
  });

  // Global Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      const modifier = e.ctrlKey || e.metaKey;

      // 1. Ctrl + K / Cmd + K : Toggle Command Palette (Works even if input is focused)
      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundFx.playSfx('whoosh');
        setIsPaletteOpen((prev) => {
          if (!prev) {
            setSearchQuery('');
            setSelectedIndex(0);
          }
          return !prev;
        });
        return;
      }

      // 2. Escape : Close open modals
      if (e.key === 'Escape') {
        if (isPaletteOpen) {
          e.preventDefault();
          setIsPaletteOpen(false);
          return;
        }
        if (isHelpOpen) {
          e.preventDefault();
          setIsHelpOpen(false);
          return;
        }
      }

      // 3. Arrow navigation inside open Command Palette
      if (isPaletteOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? (filteredCommands.length || 1) - 1 : prev - 1
          );
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setIsPaletteOpen(false);
          }
          return;
        }
      }

      // 4. Ctrl + N / Cmd + N : New Project (Prevent opening new browser window)
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewProject();
        return;
      }

      // 5. Ctrl + S / Cmd + S : Save Script (Prevent browser save dialog)
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveScript();
        return;
      }

      // 6. Ctrl + M / Cmd + M : Caption Mask
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleCaptionMask();
        return;
      }

      // 7. Ctrl + G / Cmd + G : Viral Script
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        handleViralScript();
        return;
      }

      // 8. Alt + V or Ctrl + Shift + V : Voice Studio
      if ((e.altKey && e.key.toLowerCase() === 'v') || (modifier && e.shiftKey && e.key.toLowerCase() === 'v')) {
        e.preventDefault();
        handleVoiceStudio();
        return;
      }

      // 9. Alt + T : Toggle Theme
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleToggleThemeShortcut();
        return;
      }

      // 10. '?' key (when not typing in an input) : Open Shortcuts Help
      if (!isInputFocused && !modifier && e.key === '?') {
        e.preventDefault();
        soundFx.playSfx('ding');
        setIsHelpOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen, isHelpOpen, selectedIndex, filteredCommands, theme]);

  // Focus search input when palette opens
  useEffect(() => {
    if (isPaletteOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isPaletteOpen]);

  // Listen to open-command-palette custom event
  useEffect(() => {
    const handleOpenPalette = () => {
      soundFx.playSfx('whoosh');
      setIsPaletteOpen(true);
    };
    window.addEventListener('cortia:open-command-palette', handleOpenPalette);
    return () => window.removeEventListener('cortia:open-command-palette', handleOpenPalette);
  }, []);

  // Format shortcut label for Mac vs Windows
  const formatShortcut = (sc: string) => {
    if (osType === 'mac') {
      return sc.replace(/Ctrl/g, '⌘').replace(/Alt/g, '⌥').replace(/Shift/g, '⇧');
    }
    return sc;
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. HORIZONTAL QUICK ACCESS TOOLBAR (BARRE D'ACCÈS RAPIDE) */}
      {/* ======================================================== */}
      <div className="w-full bg-[#0d121d] border-b border-slate-800/80 px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs overflow-x-auto select-none">
        {/* Left: Command Search Button Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('whoosh');
              setIsPaletteOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer group shadow-xs"
            title="Ouvrir la palette de commandes rapides (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-semibold hidden sm:inline">Palette d’actions rapides</span>
            <span className="font-semibold sm:hidden">Recherche</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono font-bold text-emerald-400 border border-slate-700 group-hover:border-emerald-500/40">
              {osType === 'mac' ? '⌘K' : 'Ctrl+K'}
            </kbd>
          </button>
        </div>

        {/* Center: Quick Action Buttons with Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
          {/* Ctrl+N: Nouveau Projet */}
          <button
            type="button"
            onClick={handleNewProject}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
              currentView === 'create'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Démarrer un nouveau projet de montage vidéo (Ctrl + N)"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>Nouveau</span>
            <kbd className="hidden md:inline px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
              {osType === 'mac' ? '⌘N' : 'Ctrl+N'}
            </kbd>
          </button>

          {/* Ctrl+S: Sauvegarder Script */}
          <button
            type="button"
            onClick={handleSaveScript}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer shrink-0"
            title="Sauvegarder immédiatement le script et les réglages (Ctrl + S)"
          >
            <Save className="w-3 h-3 text-sky-400" />
            <span>Sauvegarder</span>
            <kbd className="hidden md:inline px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
              {osType === 'mac' ? '⌘S' : 'Ctrl+S'}
            </kbd>
          </button>

          {/* Ctrl+M: Caption Mask */}
          <button
            type="button"
            onClick={handleCaptionMask}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
              currentView === 'caption-mask'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Floutage & masquage de sous-titres (Ctrl + M)"
          >
            <Video className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline">Caption Mask</span>
            <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
              {osType === 'mac' ? '⌘M' : 'Ctrl+M'}
            </kbd>
          </button>

          {/* Ctrl+G: Script Viral */}
          <button
            type="button"
            onClick={handleViralScript}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
              currentView === 'script-viral'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Générateur de scripts viraux IA (Ctrl + G)"
          >
            <FileText className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Script Viral</span>
            <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
              {osType === 'mac' ? '⌘G' : 'Ctrl+G'}
            </kbd>
          </button>

          {/* Alt+V: Voice Studio */}
          <button
            type="button"
            onClick={handleVoiceStudio}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
              currentView === 'voice-studio'
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-300'
                : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Voix-off IA réalistes Gemini (Alt + V)"
          >
            <Mic className="w-3 h-3 text-teal-400" />
            <span className="hidden xl:inline">Voice Studio</span>
            <kbd className="hidden xl:inline px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
              {osType === 'mac' ? '⌥V' : 'Alt+V'}
            </kbd>
          </button>
        </div>

        {/* Right: Fullscreen, Theme Toggle & Shortcuts Help Modal trigger */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* F: Plein Écran */}
          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('click');
              window.dispatchEvent(new CustomEvent('cortia:toggle-fullscreen'));
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-[11px] font-bold cursor-pointer transition-all"
            title="Agrandir l'espace de montage en Plein Écran (Touche F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Plein Écran</span>
            <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
              F
            </kbd>
          </button>

          {/* Alt+T: Theme Toggle */}
          <button
            type="button"
            onClick={handleToggleThemeShortcut}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-all"
            title={`Basculer vers le thème ${theme === 'dark' ? 'clair' : 'sombre'} (Alt + T)`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* ?: Shortcuts Guide */}
          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('ding');
              setIsHelpOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-bold cursor-pointer transition-all"
            title="Afficher la liste des raccourcis clavier (?)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Raccourcis</span>
            <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
              ?
            </kbd>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. FLOATING SHORTCUT NOTIFICATION TOAST                    */}
      {/* ======================================================== */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="px-4 py-3 rounded-2xl bg-[#0f1522] border-2 border-emerald-500/60 text-white font-bold text-xs flex items-center gap-3 shadow-2xl backdrop-blur-md">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 fill-emerald-400" />
            </div>
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. COMMAND PALETTE MODAL (SPOTLIGHT CTRL + K)             */}
      {/* ======================================================== */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-150">
          <div
            className="bg-[#0f1522] border-2 border-emerald-500/40 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-[#0b0f17]">
              <Search className="w-5 h-5 text-emerald-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Rechercher une action, un outil ou un raccourci clavier..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setIsPaletteOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Command Results List */}
            <div className="overflow-y-auto p-3 space-y-1 divide-y divide-slate-800/40">
              {filteredCommands.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-1">
                  <p className="text-xs font-bold text-white">Aucun résultat trouvé pour "{searchQuery}"</p>
                  <p className="text-[11px] text-slate-500">
                    Essaie avec d'autres mots-clés : "Nouveau", "Script", "Floutage", "Voix", "Thème"...
                  </p>
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        setIsPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border border-emerald-500/40 text-white'
                          : 'hover:bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{cmd.title}</span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                              · {cmd.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{cmd.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <kbd className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-emerald-400 shadow-xs">
                          {formatShortcut(cmd.shortcut)}
                        </kbd>
                        <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Command Palette Footer Keyboard Hints */}
            <div className="p-3 border-t border-slate-800 bg-[#0b0f17] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">↓</kbd>
                  <span>Naviguer</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">↵</kbd>
                  <span>Exécuter</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">Échap</kbd>
                  <span>Fermer</span>
                </span>
              </div>
              <span className="text-emerald-400 font-semibold">{filteredCommands.length} raccourcis disponibles</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SHORTCUTS CHEAT SHEET MODAL (TOUCHE ?)                 */}
      {/* ======================================================== */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-[#0f1522] border-2 border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[88vh] overflow-y-auto animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <HelpCircle className="w-4 h-4" />
                <span>Productivité & Vitesse d'Exécution</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Raccourcis Clavier du Studio Cortia
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Gagne un temps précieux sur chaque montage vidéo grâce aux touches de raccourci rapides.
              </p>
            </div>

            {/* Operating System Pill Switcher */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0b0f17] border border-slate-800 w-fit">
              <button
                type="button"
                onClick={() => setOsType('win')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  osType === 'win'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Windows / Linux (Ctrl)
              </button>
              <button
                type="button"
                onClick={() => setOsType('mac')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  osType === 'mac'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                macOS (⌘ Cmd)
              </button>
            </div>

            {/* Shortcuts Table */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {commands.map((cmd) => (
                  <div
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setIsHelpOpen(false);
                    }}
                    className="p-3.5 rounded-2xl bg-[#0b0f17] border border-slate-800 hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
                        {cmd.title}
                      </p>
                      <p className="text-[10px] text-slate-400">{cmd.category}</p>
                    </div>

                    <kbd className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 shadow-md shrink-0">
                      {formatShortcut(cmd.shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips footer */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-xs text-slate-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Astuce Pro :</strong> Appuie sur <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[10px] font-mono border border-slate-700 font-bold text-white">Ctrl + K</kbd> à n'importe quel moment pour rechercher instantanément une action ou naviguer d'un clic !
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
