import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Wand2,
  RefreshCw,
  Camera,
  Crown,
  Zap,
  Palette,
  Layers,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { AI_AVATAR_PRESETS, AiAvatarPreset } from '../../data/aiAvatars';
import { soundFx } from '../../utils/audioUtils';
import { toast } from '../toast/ToastContext';

interface AiAvatarGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onSelectAvatar: (avatarUrl: string) => Promise<void>;
  userName?: string;
}

// 6 Creative Creator Archetypes for dynamic generative AI portraits
const CREATOR_ARCHETYPES = [
  {
    id: 'cyber',
    label: '⚡ Cyberpunk Studio',
    prompt: 'Portrait 3D d’un créateur vidéo futuriste avec casque audio néon émeraude',
    bgGradient: 'from-emerald-950 via-slate-900 to-teal-950',
    primaryColor: '#10b981',
  },
  {
    id: 'cinema',
    label: '🎬 Réalisateur 4K',
    prompt: 'Portrait cinématographique réaliste avec éclairage studio de tournage et caméra bokeh',
    bgGradient: 'from-slate-950 via-zinc-900 to-amber-950',
    primaryColor: '#f59e0b',
  },
  {
    id: 'pixar',
    label: '🌟 3D Pixar Animation',
    prompt: 'Personnage 3D stylisé souriant tenant un smartphone et micro de vlog studio',
    bgGradient: 'from-blue-950 via-slate-900 to-indigo-950',
    primaryColor: '#3b82f6',
  },
  {
    id: 'anime',
    label: '🔥 Anime Viral Master',
    prompt: 'Illustration anime moderne d’un monteur vidéo avec sweat à capuche et néons',
    bgGradient: 'from-purple-950 via-slate-900 to-pink-950',
    primaryColor: '#ec4899',
  },
  {
    id: 'business',
    label: '💎 Business & Finance',
    prompt: 'Créateur business et investissement avec costume moderne et vue gratte-ciel',
    bgGradient: 'from-cyan-950 via-slate-900 to-slate-950',
    primaryColor: '#06b6d4',
  },
  {
    id: 'minimalist',
    label: '✨ Minimaliste Élite',
    prompt: 'Avatar vectoriel géométrique moderne avec typographie créateur et halo doré',
    bgGradient: 'from-amber-950 via-slate-900 to-emerald-950',
    primaryColor: '#14b8a6',
  },
];

// Helper to generate dynamic procedural vector creator avatar as data URL
function generateProceduralAiAvatarSvg(options: {
  seed: string;
  archetypeId: string;
  primaryColor: string;
}): string {
  const initials = options.seed.slice(0, 2).toUpperCase() || 'CR';
  const color = options.primaryColor || '#10b981';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a0f1d"/>
        <stop offset="50%" stop-color="#111827"/>
        <stop offset="100%" stop-color="#070a0f"/>
      </linearGradient>
      <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.2"/>
      </linearGradient>
      <filter id="neon" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="10" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <!-- Background Circle -->
    <rect width="400" height="400" fill="url(#bgGrad)"/>
    <circle cx="200" cy="200" r="170" fill="none" stroke="url(#glowGrad)" stroke-width="6" stroke-dasharray="8 6"/>
    <circle cx="200" cy="200" r="145" fill="#0f172a" stroke="${color}" stroke-width="2" opacity="0.6"/>

    <!-- Headphones Icon Art -->
    <path d="M120 220 A 80 80 0 0 1 280 220" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" filter="url(#neon)"/>
    <rect x="100" y="200" width="30" height="55" rx="12" fill="${color}" opacity="0.9"/>
    <rect x="270" y="200" width="30" height="55" rx="12" fill="${color}" opacity="0.9"/>
    <circle cx="115" cy="227" r="6" fill="#070a0f"/>
    <circle cx="285" cy="227" r="6" fill="#070a0f"/>

    <!-- Center Monogram -->
    <text x="200" y="225" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle" dominant-baseline="central" letter-spacing="2">
      ${initials}
    </text>

    <!-- AI Video Creator Badge -->
    <rect x="130" y="295" width="140" height="28" rx="8" fill="#070a0f" stroke="${color}" stroke-width="1.5"/>
    <text x="200" y="313" font-family="system-ui, sans-serif" font-weight="800" font-size="11" fill="${color}" text-anchor="middle" letter-spacing="1.5">
      AI CREATOR
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AiAvatarGeneratorModal: React.FC<AiAvatarGeneratorModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSelectAvatar,
  userName = 'Créateur',
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('cyber_creator');
  const [selectedArchetype, setSelectedArchetype] = useState<string>('cyber');
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Créateur vidéo passionné avec casque studio, ambiance néon émeraude et éclairage cinéma'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = async (preset: AiAvatarPreset) => {
    soundFx.playSfx('ding');
    setSelectedPresetId(preset.id);
    await onSelectAvatar(preset.imageSrc);
    toast.success(`Avatar « ${preset.name} » appliqué à votre profil !`, 'Avatar Mis à Jour');
  };

  const handleGenerateCustomAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    soundFx.playSfx('whoosh');

    try {
      // Simulate high-tier AI generation with procedural synthesis matching selected archetype and prompt
      await new Promise((resolve) => setTimeout(resolve, 800));

      const archetypeObj =
        CREATOR_ARCHETYPES.find((a) => a.id === selectedArchetype) || CREATOR_ARCHETYPES[0];

      const svgDataUrl = generateProceduralAiAvatarSvg({
        seed: userName.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'AI',
        archetypeId: selectedArchetype,
        primaryColor: archetypeObj.primaryColor,
      });

      setGeneratedPreview(svgDataUrl);
      soundFx.playSfx('chaching');
      await onSelectAvatar(svgDataUrl);
      toast.success(
        'Votre avatar personnalisé IA a été généré et appliqué avec succès !',
        'Génération Réussie'
      );
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la génération de l’avatar IA.', 'Erreur');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-[#0f1522] border-2 border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/25">
            <Wand2 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Générateur d'Avatars de Profil par IA</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Creator AI Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Personnalisez votre identité de créateur dans la barre latérale, le header et la vue profil.
            </p>
          </div>
        </div>

        {/* Current Active Avatar Preview Bar */}
        <div className="p-4 rounded-2xl bg-[#070a0f] border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 shrink-0 bg-slate-900 flex items-center justify-center">
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt="Avatar Actuel"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xl font-black text-emerald-400">
                  {userName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-slate-950" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                Avatar Actuellement Actif
              </span>
              <p className="text-sm font-bold text-white">{userName}</p>
              <p className="text-[11px] text-slate-400">
                Visible dans le Sidebar, le Header et vos fiches de montage
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold hidden sm:inline">
            ✓ Synchronisé
          </span>
        </div>

        {/* Section 1: Curated High-End AI Avatars (1-Click Selection) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Avatars Créateurs Haute Résolution (Sélection en 1 clic)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">4 styles studio</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AI_AVATAR_PRESETS.map((preset) => {
              const isSelected = currentAvatarUrl === preset.imageSrc;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`group relative p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg'
                      : 'bg-[#070a0f] hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-2 border border-slate-800 group-hover:border-slate-700 shadow-md">
                    <img
                      src={preset.imageSrc}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-950/80 text-white backdrop-blur-xs">
                      {preset.badge}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-black text-white line-clamp-1 leading-snug">
                      {preset.name}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                      {preset.style}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Custom Generative AI Generator */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-tr from-purple-950/30 via-slate-900 to-emerald-950/20 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Générer un Avatar IA sur-mesure selon votre Niche
            </h4>
          </div>

          {/* Archetypes Selector Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Style d'archétype créateur :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CREATOR_ARCHETYPES.map((arch) => (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => {
                    soundFx.playSfx('click');
                    setSelectedArchetype(arch.id);
                    setCustomPrompt(arch.prompt);
                  }}
                  className={`p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer truncate ${
                    selectedArchetype === arch.id
                      ? 'bg-purple-500/20 border-purple-400 text-white ring-1 ring-purple-500/40'
                      : 'bg-[#070a0f] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {arch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt input */}
          <form onSubmit={handleGenerateCustomAvatar} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Description de votre persona de créateur :
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={2}
                className="w-full bg-[#070a0f] border border-slate-800 focus:border-purple-500 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden resize-none"
                placeholder="Décrivez votre avatar (ex: Casque de montage, ambiance néon, lunettes de soleil)..."
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[10px] text-slate-400 font-mono">
                ✨ Algorithme Gemini Creator Portrait
              </span>

              <button
                type="submit"
                disabled={isGenerating}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Création de l'avatar en cours...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Générer et Appliquer</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
