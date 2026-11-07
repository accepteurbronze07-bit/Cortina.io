import React, { useState, useEffect } from 'react';
import {
  Mic,
  Volume2,
  Play,
  Pause,
  Type,
  Music,
  Check,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Globe2,
  Zap,
  Search,
  Ban,
  Bookmark,
  Download,
  Plus,
  Minus,
  Move,
  ZoomIn,
  X,
} from 'lucide-react';
import {
  VoiceOption,
  VoiceCatalogTab,
  SubtitleStyle,
  SubtitleCatalogTab,
  BackgroundMusic,
  SoundEffectClip,
  SfxCatalogTab,
  AppLanguage,
} from '../../types';
import { translations } from '../../locales/translations';
import { soundFx } from '../../utils/audioUtils';

// ============================================================================
// 1. CATALOGUE DE VOIX-OFF PAR ONGLETS DE LANGUES (AVATARS CARRÉS & BADGES 💎)
// ============================================================================
export const NONE_VOICE_OPTION: VoiceOption = {
  id: 'voice_none',
  name: 'Aucun(e)',
  gender: 'M',
  accent: 'Sans voix-off',
  style: 'Vidéo avec musique et sous-titres uniquement',
  geminiVoice: 'NONE',
  avatar: '',
  pitch: 1.0,
  rate: 1.2,
  isNone: true,
};

export const VOICE_OPTIONS: VoiceOption[] = [
  // --- FRANÇAIS (FR) — VOIX SPEECHMA ÉNERGIQUES & CLAIRES ---
  {
    id: 'fr_henri_speechma',
    name: 'Henri (Speechma)',
    gender: 'M',
    accent: 'Français • Speechma Studio Henri',
    style: 'Voix masculine Speechma énergique, claire et ultra-réaliste (Marché FR)',
    geminiVoice: 'Puck',
    edgeVoice: 'fr-FR-HenriNeural',
    speechmaVoice: 'Henri',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.03,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Henri Speechma ultra-clear, energetic French male narrator voice with dynamic retention cadence',
    samplePreviewText:
      'Il demandait quatre mille euros pour vider cette piscine ! Regarde bien ce qu’on a découvert au fond.',
  },
  {
    id: 'fr_paul_speechma',
    name: 'Paul (Speechma)',
    gender: 'M',
    accent: 'Français • Speechma Dynamique Paul',
    style: 'Voix masculine Speechma percutante et dynamique pour hooks viraux 61s',
    geminiVoice: 'Fenrir',
    edgeVoice: 'fr-FR-RemyMultilingualNeural',
    speechmaVoice: 'Paul',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.06,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Paul Speechma punchy, clear and authoritative French male storyteller voice',
    samplePreviewText:
      'Un seul faux mouvement et la pompe explosait ! Attends de voir la transformation finale.',
  },
  {
    id: 'fr_leader_energique',
    name: 'Leader énergique',
    gender: 'M',
    accent: 'Français • Remy Neural (+8% Dynamique)',
    style: 'Voix masculine puissante de leader motivant pour hooks viraux',
    geminiVoice: 'Fenrir',
    edgeVoice: 'fr-FR-RemyMultilingualNeural',
    speechmaVoice: 'Paul',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    pitch: 1.08,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Energetic, commanding, punchy French male leader voice with dynamic pitch and fast viral cadence',
    samplePreviewText:
      'Arrête de scroller ! Voici le secret que seuls les vrais leaders utilisent pour exploser sur TikTok.',
  },
  {
    id: 'fr_jeune_courageux',
    name: 'Jeune courageux',
    gender: 'M',
    accent: 'Français • Gérard Neural (+12% Punchy)',
    style: 'Rythme masculin rapide, audacieux et percutant',
    geminiVoice: 'Zephyr',
    edgeVoice: 'fr-BE-GerardNeural',
    speechmaVoice: 'Henri',
    avatar:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    pitch: 1.12,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Bold, fearless, fast-paced young French male creator voice full of enthusiasm',
    samplePreviewText:
      'Personne n’osait tenter cette expérience en direct, alors regarde bien ce qui va se passer !',
  },
  {
    id: 'fr_mec_pose',
    name: 'Mec posé',
    gender: 'M',
    accent: 'Français • Fabrice Neural (-6% Calme)',
    style: 'Voix masculine naturelle, confiante et posée pour storytelling',
    geminiVoice: 'Orus',
    edgeVoice: 'fr-CH-FabriceNeural',
    speechmaVoice: 'Paul',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    pitch: 0.94,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Calm, laid-back, deep and authentic French male storyteller voice',
    samplePreviewText:
      'Installe-toi tranquillement, je vais te raconter comment cette séquence a fait le tour du monde.',
  },
  {
    id: 'fr_etudiant_naif',
    name: 'Étudiant naïf',
    gender: 'M',
    accent: 'Français • Jeune Clair (+18% Pitch)',
    style: 'Ton masculin jeune, clair, spontané et curieux',
    geminiVoice: 'Puck',
    edgeVoice: 'fr-CA-ThierryNeural',
    speechmaVoice: 'Henri',
    avatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    pitch: 1.18,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Curious, youthful, bright high-pitched French male student voice discovering something amazing',
    samplePreviewText:
      'Attends, mais comment c’est possible un truc pareil ? Je viens seulement de comprendre l’astuce !',
  },
  {
    id: 'fr_maxime_pro',
    name: 'Maxime',
    gender: 'M',
    accent: 'Français • Henri Studio PRO',
    style: 'La voix-off masculine française #1 des vidéos TikTok à 1M+ vues',
    geminiVoice: 'Puck',
    edgeVoice: 'fr-FR-HenriNeural',
    speechmaVoice: 'Henri',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.02,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Maxime ultra-viral French male TikTok narrator voice, crisp studio articulation and dynamic authority',
    samplePreviewText:
      'Salut c’est Maxime. Regarde attentivement ce détail à la troisième seconde, c’est complètement fou.',
  },
  {
    id: 'fr_grenouille_pro',
    name: 'Grenouille 🐸',
    gender: 'M',
    accent: 'Français • Cartoon (+45% Pitch & Vibrato)',
    style: 'Voix cartoon aiguë nasillarde ultra virale avec vibrato',
    geminiVoice: 'Puck',
    edgeVoice: 'fr-BE-GerardNeural',
    avatar:
      'https://images.unsplash.com/photo-1559715541-5daf8a0296d0?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.45,
    rate: 1.25,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Playful, nasal, high-pitched funny cartoon frog character voice in French for viral memes',
    samplePreviewText:
      'Croâ ! Mais qu’est-ce qu’il fait là lui ? Regarde jusqu’à la fin, tu vas halluciner !',
  },
  {
    id: 'fr_valentino_pro',
    name: 'Valentino 💌',
    gender: 'M',
    accent: 'Français • Antoine Grave & Charme (-15%)',
    style: 'Voix d’homme suave, très grave et ultra charismatique',
    geminiVoice: 'Charon',
    edgeVoice: 'fr-CA-AntoineNeural',
    avatar:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 0.85,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Deep, smooth, velvety baritone French male voice Valentino with magnetic warmth',
    samplePreviewText:
      'Approche un instant... Ce que tu t’apprêtes à voir dans cette vidéo va te fasciner.',
  },
  {
    id: 'fr_homme_calme_pro',
    name: 'Homme calme',
    gender: 'M',
    accent: 'Français • Alain Documentaire (-20% Grave)',
    style: 'Voix masculine profonde de narrateur documentaire & mystères',
    geminiVoice: 'Charon',
    edgeVoice: 'fr-FR-AlainNeural',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 0.8,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Deep bass-baritone, composed French male documentary narrator voice with suspenseful resonance',
    samplePreviewText:
      'Peu de gens connaissent la véritable histoire derrière ces images. Écoute bien.',
  },
  {
    id: 'fr_fille_sereine_pro',
    name: 'Fille sereine',
    gender: 'F',
    accent: 'Français • Vivienne Douce Neural',
    style: 'Voix féminine apaisante, esthétique et fluide',
    geminiVoice: 'Aoede',
    edgeVoice: 'fr-FR-VivienneMultilingualNeural',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.03,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Serene, soft, warm and captivating French female creator voice',
    samplePreviewText:
      'Prends une grande inspiration et regarde la beauté incroyable de ce moment.',
  },
  {
    id: 'fr_fille_chaleureuse',
    name: 'Fille chaleureuse',
    gender: 'F',
    accent: 'Français • Denise Énergique (+10%)',
    style: 'Voix féminine française souriante, vive et chaleureuse',
    geminiVoice: 'Kore',
    edgeVoice: 'fr-FR-DeniseNeural',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.1,
    rate: 1.2,
    langTab: 'FR',
    langCode: 'fr',
    characterPrompt:
      'Energetic, bright, warm French female TikTok narrator voice Denise',
    samplePreviewText:
      'Coucou ! Regarde cette astuce géniale que je viens de tester, le résultat est bluffant !',
  },

  // --- ANGLAIS (EN) — VOIX SPEECHMA US PERCUTANTES & DYNAMIQUES ---
  {
    id: 'en_matthew_speechma',
    name: 'Matthew (Speechma US)',
    gender: 'M',
    accent: 'English (US) • Speechma Matthew PRO',
    style: 'Voix US Speechma percutante, grave et ultra-réaliste à fort RPM',
    geminiVoice: 'Charon',
    edgeVoice: 'en-US-ChristopherNeural',
    speechmaVoice: 'Matthew',
    avatar:
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 0.94,
    rate: 1.2,
    langTab: 'EN',
    langCode: 'en',
    characterPrompt:
      'Matthew Speechma US punchy, commanding American male viral storyteller voice',
    samplePreviewText:
      'They quoted four thousand dollars to drain this swamp! Wait, look what happened next.',
  },
  {
    id: 'en_guy_speechma',
    name: 'Guy (Speechma US)',
    gender: 'M',
    accent: 'English (US) • Speechma Guy Dynamic',
    style: 'Voix US Speechma dynamique et magnétique pour Re-hooks 15s',
    geminiVoice: 'Orus',
    edgeVoice: 'en-US-GuyNeural',
    speechmaVoice: 'Guy',
    avatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 0.96,
    rate: 1.2,
    langTab: 'EN',
    langCode: 'en',
    characterPrompt:
      'Guy Speechma US dynamic, charismatic American male voice for high-retention shorts',
    samplePreviewText:
      'One wrong move and everything is ruined! Watch how we saved this in record time.',
  },
  {
    id: 'en_brian_speechma',
    name: 'Brian (Speechma US)',
    gender: 'M',
    accent: 'English (US) • Speechma Brian Bold',
    style: 'Voix US Speechma nerveuse, claire et ultra-captivante',
    geminiVoice: 'Puck',
    edgeVoice: 'en-US-BrianNeural',
    speechmaVoice: 'Brian',
    avatar:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.04,
    rate: 1.2,
    langTab: 'EN',
    langCode: 'en',
    characterPrompt:
      'Brian Speechma US energetic, crisp and fast-paced American male creator voice',
    samplePreviewText:
      'Ninety-five percent of people make this exact mistake! How much would you pay for this?',
  },
  {
    id: 'en_mec_pose',
    name: 'Mec posé',
    gender: 'M',
    accent: 'English (US) • Christopher Neural',
    style: 'Relaxed, confident deep American male storytelling voice',
    geminiVoice: 'Charon',
    edgeVoice: 'en-US-ChristopherNeural',
    speechmaVoice: 'Matthew',
    avatar:
      'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=300&auto=format&fit=crop&q=80',
    pitch: 0.91,
    rate: 1.2,
    langTab: 'EN',
    langCode: 'en',
    characterPrompt: 'Chill, laid-back, deep authentic American male storyteller voice',
    samplePreviewText:
      'Wait a second and watch closely, because almost nobody notices what happens right here.',
  },
  {
    id: 'en_mec_charismatique',
    name: 'Mec charismatique',
    gender: 'M',
    accent: 'English (US) • Guy Neural PRO',
    style: 'Deep magnetic male voice for business & luxury shorts',
    geminiVoice: 'Orus',
    edgeVoice: 'en-US-GuyNeural',
    speechmaVoice: 'Guy',
    avatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 0.86,
    rate: 1.2,
    langTab: 'EN',
    langCode: 'en',
    characterPrompt: 'Charismatic, confident, deep authoritative English male voice',
    samplePreviewText:
      'This single moment changed everything, and here is the exact reason why.',
  },
  {
    id: 'en_jeune_courageux',
    name: 'Jeune courageux',
    gender: 'M',
    accent: 'English (US) • Eric Neural Bold',
    style: 'Punchy, fearless high-retention male hook voice',
    geminiVoice: 'Puck',
    edgeVoice: 'en-US-EricNeural',
    speechmaVoice: 'Brian',
    avatar:
      'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=300&auto=format&fit=crop&q=80',
    pitch: 1.09,
    rate: 1.2,
    langTab: 'EN',
    langCode: 'en',
    characterPrompt: 'Bold, brave, high-energy young American male creator voice',
    samplePreviewText:
      'Stop scrolling right now! You have never seen anything quite like this clip.',
  },
  {
    id: 'en_streamer_dynamique',
    name: 'Streamer dynamique',
    gender: 'M',
    accent: 'English (UK/US) • Ryan Neural Hype',
    style: 'Ultra-fast MrBeast / Gaming male streamer energy',
    geminiVoice: 'Zephyr',
    edgeVoice: 'en-GB-RyanNeural',
    speechmaVoice: 'Brian',
    avatar:
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.14,
    rate: 1.25,
    langTab: 'EN',
    langCode: 'en',
    characterPrompt: 'Hyper-dynamic, excited male streamer voice for viral TikToks',
    samplePreviewText:
      'No way this just happened on camera! Watch until the very last second!',
  },

  // --- ESPAGNOL (ES) — VOIX SPEECHMA NARRATIVES CHALEUREUSES ---
  {
    id: 'es_julio',
    name: 'Julio (Speechma)',
    gender: 'M',
    accent: 'Español • Speechma Julio PRO',
    style: 'Voix masculine espagnole Speechma narrative, chaleureuse et entraînante',
    geminiVoice: 'Fenrir',
    edgeVoice: 'es-MX-JorgeNeural',
    speechmaVoice: 'Julio',
    avatar:
      'https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 0.96,
    rate: 1.2,
    langTab: 'ES',
    langCode: 'es',
    characterPrompt: 'Charismatic, deep vibrant Spanish male narrator voice Julio Speechma',
    samplePreviewText:
      '¡Hola! Soy Julio en Speechma. Nos cobraban cuatro mil dólares por esto, pero mira lo que descubrimos.',
  },
  {
    id: 'es_alvaro_speechma',
    name: 'Alvaro (es-ES-AlvaroNeural)',
    gender: 'M',
    accent: 'Español • Speechma Alvaro Narrador',
    style: 'Voix narrative espagnole grave, chaleureuse et captivante (1.10x)',
    geminiVoice: 'Orus',
    edgeVoice: 'es-ES-AlvaroNeural',
    speechmaVoice: 'Alvaro',
    avatar:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.0,
    rate: 1.1,
    langTab: 'ES',
    langCode: 'es',
    characterPrompt: 'Warm, deep and captivating Spanish male storyteller voice Alvaro Speechma es-ES-AlvaroNeural',
    samplePreviewText:
      'Un movimiento en falso y todo se arruina. Mira la transformación antes y después.',
  },
  {
    id: 'es_mateo',
    name: 'Mateo (es-UY-MateoNeural)',
    gender: 'M',
    accent: 'Español • Mateo Neural',
    style: 'Voix masculine énergique, claire et percutante (1.10x)',
    geminiVoice: 'Puck',
    edgeVoice: 'es-UY-MateoNeural',
    speechmaVoice: 'Mateo',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    badge: '🔥',
    isPro: true,
    pitch: 1.0,
    rate: 1.1,
    langTab: 'ES',
    langCode: 'es',
    characterPrompt: 'Energetic, modern Spanish male storyteller voice Mateo',
    samplePreviewText:
      '¡Espera a ver lo que encontramos en este lugar! La transformación es brutal.',
  },
  {
    id: 'es_sofia',
    name: 'Sofia (es-BO-SofiaNeural)',
    gender: 'F',
    accent: 'Español • Sofia Neural',
    style: 'Voix féminine expressive, rythmée et naturelle (1.10x)',
    geminiVoice: 'Leda',
    edgeVoice: 'es-BO-SofiaNeural',
    speechmaVoice: 'Sofia',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.0,
    rate: 1.1,
    langTab: 'ES',
    langCode: 'es',
    characterPrompt: 'Expressive, engaging and natural Spanish female storyteller voice Sofia',
    samplePreviewText:
      'No vas a creer cómo quedó esto al final. Quédate hasta el último segundo.',
  },
  {
    id: 'es_jeune_courageux',
    name: 'Jeune courageux',
    gender: 'M',
    accent: 'Español • Gonzalo Neural Audaz',
    style: 'Jeune voix masculine dynamique pour hooks viraux en espagnol',
    geminiVoice: 'Puck',
    edgeVoice: 'es-CO-GonzaloNeural',
    speechmaVoice: 'Julio',
    avatar:
      'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300&auto=format&fit=crop&q=80',
    pitch: 1.1,
    rate: 1.2,
    langTab: 'ES',
    langCode: 'es',
    characterPrompt: 'Bold, energetic young Spanish male creator voice',
    samplePreviewText:
      '¡No pases este video! Lo que está a punto de suceder te dejará sin palabras.',
  },
  {
    id: 'es_fille_chaleureuse',
    name: 'Fille chaleureuse',
    gender: 'F',
    accent: 'Español • Elvira Neural Cálida',
    style: 'Voix féminine chaleureuse, expressive et naturelle',
    geminiVoice: 'Leda',
    edgeVoice: 'es-ES-ElviraNeural',
    speechmaVoice: 'Elvira',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    pitch: 1.08,
    rate: 1.2,
    langTab: 'ES',
    langCode: 'es',
    characterPrompt: 'Warm, expressive, friendly Spanish female narrator voice',
    samplePreviewText:
      'Mira qué detalle tan increíble acabo de descubrir en esta escena viral.',
  },
  {
    id: 'es_mec_pose',
    name: 'Mec posé',
    gender: 'M',
    accent: 'Español • Álvaro Neural Tranquilo',
    style: 'Ton masculin posé, grave et captivant',
    geminiVoice: 'Orus',
    edgeVoice: 'es-ES-AlvaroNeural',
    speechmaVoice: 'Alvaro',
    avatar:
      'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&auto=format&fit=crop&q=80',
    pitch: 0.9,
    rate: 1.2,
    langTab: 'ES',
    langCode: 'es',
    characterPrompt: 'Calm, composed, deep Spanish male storytelling voice',
    samplePreviewText:
      'Casi nadie nota el verdadero secreto detrás de esta secuencia. Escucha bien.',
  },

  // --- PORTUGAIS (BRÉSIL) (PT_BR) ---
  {
    id: 'pt_lucas_brasil',
    name: 'Lucas (Brasil)',
    gender: 'M',
    accent: 'Português (BR) • Antônio Neural PRO',
    style: 'Voix masculine brésilienne authentique et ultra dynamique',
    geminiVoice: 'Fenrir',
    edgeVoice: 'pt-BR-AntonioNeural',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.04,
    rate: 1.2,
    langTab: 'PT_BR',
    langCode: 'pt',
    characterPrompt: 'Energetic, deep authentic Brazilian Portuguese male creator voice Lucas',
    samplePreviewText:
      'Para tudo e olha só o que acontece nesse vídeo! Ninguém esperava por esse final.',
  },
  {
    id: 'pt_camila_chaleureuse',
    name: 'Camila Chaleureuse',
    gender: 'F',
    accent: 'Português (BR) • Francisca Neural',
    style: 'Voix féminine brésilienne solaire et engageante',
    geminiVoice: 'Kore',
    edgeVoice: 'pt-BR-FranciscaNeural',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    pitch: 1.08,
    rate: 1.2,
    langTab: 'PT_BR',
    langCode: 'pt',
    characterPrompt: 'Warm, sunny, engaging Brazilian Portuguese female voice',
    samplePreviewText:
      'Você já tinha reparado nesse detalhe incrível? Assiste até o final para entender!',
  },
  {
    id: 'pt_narrateur_viral',
    name: 'Narrateur Viral BR',
    gender: 'M',
    accent: 'Português (BR) • Donato Neural Grave',
    style: 'Narration masculine profonde pour histoires & curiosités',
    geminiVoice: 'Charon',
    edgeVoice: 'pt-BR-DonatoNeural',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    pitch: 0.84,
    rate: 1.2,
    langTab: 'PT_BR',
    langCode: 'pt',
    characterPrompt: 'Deep, captivating Brazilian Portuguese male viral narrator voice',
    samplePreviewText:
      'Esse é o segredo que fez esse vídeo atingir milhões de visualizações em poucas horas.',
  },
  {
    id: 'pt_jeune_dynamique',
    name: 'Jeune Dynamique BR',
    gender: 'M',
    accent: 'Português (BR) • Fábio Neural Rápido',
    style: 'Rythme masculin rapide spécial Shorts & Reels Brésil',
    geminiVoice: 'Puck',
    edgeVoice: 'pt-BR-FabioNeural',
    avatar:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    pitch: 1.12,
    rate: 1.2,
    langTab: 'PT_BR',
    langCode: 'pt',
    characterPrompt: 'Fast, youthful Brazilian Portuguese male TikTok voice',
    samplePreviewText:
      'Olha a velocidade disso! Comenta aqui embaixo o que você achou dessa cena!',
  },

  // --- ALLEMAND (DE) — SPEECHMA KLAUS & GRETEL ---
  {
    id: 'de_klaus_speechma',
    name: 'Klaus (Speechma)',
    gender: 'M',
    accent: 'Deutsch • Speechma Studio Klaus',
    style: 'Voix masculine allemande énergique, claire et percutante (1.15x)',
    geminiVoice: 'Fenrir',
    edgeVoice: 'de-DE-KillianNeural',
    speechmaVoice: 'Klaus',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.02,
    rate: 1.15,
    langTab: 'DE',
    langCode: 'de',
    characterPrompt:
      'Klaus energetic punchy German male narrator voice with dynamic TikTok retention pace',
    samplePreviewText:
      'Warte kurz! Was du gleich in diesem Clip siehst, hat wirklich niemand kommen sehen.',
  },
  {
    id: 'de_gretel_speechma',
    name: 'Gretel (Speechma)',
    gender: 'F',
    accent: 'Deutsch • Speechma Gretel',
    style: 'Voix féminine allemande captivante, chaleureuse et fluide (1.15x)',
    geminiVoice: 'Kore',
    edgeVoice: 'de-DE-KatjaNeural',
    speechmaVoice: 'Gretel',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.04,
    rate: 1.15,
    langTab: 'DE',
    langCode: 'de',
    characterPrompt:
      'Gretel warm, captivating, natural German female storyteller voice with smooth inflection',
    samplePreviewText:
      'Achte genau auf dieses Detail in Sekunde drei. Der Vorher-Nachher-Effekt ist unglaublich!',
  },
  {
    id: 'de_mec_pose',
    name: 'Mec posé',
    gender: 'M',
    accent: 'Deutsch • Conrad Neural Gelassen',
    style: 'Voix masculine allemande posée, claire et confiante',
    geminiVoice: 'Charon',
    edgeVoice: 'de-DE-ConradNeural',
    speechmaVoice: 'Klaus',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    pitch: 0.9,
    rate: 1.15,
    langTab: 'DE',
    langCode: 'de',
    characterPrompt: 'Calm, composed, deep German male storytelling voice',
    samplePreviewText:
      'Schau dir diese Szene genau an. Fast niemand bemerkt dieses entscheidende Detail.',
  },
  {
    id: 'de_leader_audacieux',
    name: 'Leader audacieux',
    gender: 'M',
    accent: 'Deutsch • Killian Neural Mutig',
    style: 'Ton masculin audacieux et percutant pour hooks viraux',
    geminiVoice: 'Orus',
    edgeVoice: 'de-DE-KillianNeural',
    speechmaVoice: 'Klaus',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 0.85,
    rate: 1.15,
    langTab: 'DE',
    langCode: 'de',
    characterPrompt: 'Bold, authoritative German male leader voice',
    samplePreviewText:
      'Warte kurz! Was du gleich in diesem Clip siehst, verändert deine Perspektive komplett.',
  },

  // --- CHINOIS MANDARIN (ZH) — SPEECHMA YUNXI & XIAOXIAO ---
  {
    id: 'zh_yunxi_speechma',
    name: 'Yunxi / 云希 (Speechma)',
    gender: 'M',
    accent: '中文 • Speechma Studio 云希',
    style: 'Voix masculine chinoise dynamique, percutante et captivante (1.10x)',
    geminiVoice: 'Puck',
    edgeVoice: 'zh-CN-YunxiNeural',
    speechmaVoice: 'Yunxi',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.02,
    rate: 1.10,
    langTab: 'ZH',
    langCode: 'zh',
    characterPrompt:
      'Yunxi dynamic, punchy, crisp Mandarin Chinese male storyteller voice with dramatic tension',
    samplePreviewText:
      '等等！仔细看这短短几秒钟，接下来的反转绝对让你意想不到！',
  },
  {
    id: 'zh_xiaoxiao_speechma',
    name: 'Xiaoxiao / 晓晓 (Speechma)',
    gender: 'F',
    accent: '中文 • Speechma 晓晓',
    style: 'Voix féminine chinoise douce, engageante et ultra-naturelle (1.10x)',
    geminiVoice: 'Aoede',
    edgeVoice: 'zh-CN-XiaoxiaoNeural',
    speechmaVoice: 'Xiaoxiao',
    avatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.05,
    rate: 1.10,
    langTab: 'ZH',
    langCode: 'zh',
    characterPrompt:
      'Xiaoxiao sweet, lively, highly expressive Mandarin Chinese female narrator voice for TikTok',
    samplePreviewText:
      '千万别划走！这个视频最后的效果，真的彻底惊艳了所有人！',
  },

  // --- CORÉEN (KO) — SPEECHMA INJOON & SUNHI ---
  {
    id: 'ko_injoon_speechma',
    name: 'InJoon / 인준 (Speechma)',
    gender: 'M',
    accent: '한국어 • Speechma Studio 인준',
    style: 'Voix masculine coréenne énergique, moderne et dynamique (1.15x)',
    geminiVoice: 'Fenrir',
    edgeVoice: 'ko-KR-InJoonNeural',
    speechmaVoice: 'InJoon',
    avatar:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.03,
    rate: 1.15,
    langTab: 'KO',
    langCode: 'ko',
    characterPrompt:
      'InJoon punchy, modern Korean male viral narrator voice with fast engaging pacing',
    samplePreviewText:
      '잠깐만요! 이 장면 놓치면 진짜 후회합니다. 마지막 반전을 꼭 확인해 보세요!',
  },
  {
    id: 'ko_sunhi_speechma',
    name: 'SunHi / 선희 (Speechma)',
    gender: 'F',
    accent: '한국어 • Speechma 선희',
    style: 'Voix féminine coréenne claire, captivante et entraînante (1.15x)',
    geminiVoice: 'Kore',
    edgeVoice: 'ko-KR-SunHiNeural',
    speechmaVoice: 'SunHi',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.06,
    rate: 1.15,
    langTab: 'KO',
    langCode: 'ko',
    characterPrompt:
      'SunHi lively, bright, engaging Korean female creator voice with high viral appeal',
    samplePreviewText:
      '스킵하지 마세요! 지금 이 순간부터 완전히 놀라운 변화가 시작됩니다!',
  },

  // --- JAPONAIS (JA) — SPEECHMA KEITA & NANAMI ---
  {
    id: 'ja_keita_speechma',
    name: 'Keita / 圭太 (Speechma)',
    gender: 'M',
    accent: '日本語 • Speechma Studio 圭太',
    style: 'Voix masculine japonaise percutante, captivante et énergique (1.15x)',
    geminiVoice: 'Fenrir',
    edgeVoice: 'ja-JP-KeitaNeural',
    speechmaVoice: 'Keita',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.02,
    rate: 1.15,
    langTab: 'JA',
    langCode: 'ja',
    characterPrompt:
      'Keita sharp, dramatic, compelling Japanese male narrator voice with strong hook emphasis',
    samplePreviewText:
      'ちょっと待って！この3秒間の異変に気づいた人はいますか？最後は本当に衝撃的です！',
  },
  {
    id: 'ja_nanami_speechma',
    name: 'Nanami / 七海 (Speechma)',
    gender: 'F',
    accent: '日本語 • Speechma 七海',
    style: 'Voix féminine japonaise fluide, expressive et engageante (1.15x)',
    geminiVoice: 'Aoede',
    edgeVoice: 'ja-JP-NanamiNeural',
    speechmaVoice: 'Nanami',
    avatar:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.05,
    rate: 1.15,
    langTab: 'JA',
    langCode: 'ja',
    characterPrompt:
      'Nanami expressive, clear, charming Japanese female creator voice with natural cadence',
    samplePreviewText:
      'スクロールしないで！この作業の驚くべき結末をぜひ最後まで見届けてください！',
  },

  // --- CHANSON-MÊME / ADVERTISEMENT (ADS) ---
  {
    id: 'ads_voix_pub_tele',
    name: 'Voix Pub Télé',
    gender: 'M',
    accent: 'Advertisement • Remy Promo TV',
    style: 'Voix masculine officielle de bande-annonce & spot publicitaire',
    geminiVoice: 'Fenrir',
    edgeVoice: 'fr-FR-RemyMultilingualNeural',
    avatar:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 0.94,
    rate: 1.2,
    langTab: 'ADS',
    langCode: 'fr',
    characterPrompt:
      'Ultra-punchy commercial TV advertisement male announcer voice with excitement and promo cadence',
    samplePreviewText:
      'Nouveau ! Découvre dès maintenant pourquoi tout le monde s’arrache cette astuce incroyable !',
  },
  {
    id: 'ads_chanson_meme',
    name: 'Chanson-même Viral',
    gender: 'M',
    accent: 'Chanson-même • Gérard Rythmé',
    style: 'Diction masculine chantante et rythmée pour memes & promos',
    geminiVoice: 'Puck',
    edgeVoice: 'fr-BE-GerardNeural',
    avatar:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.25,
    rate: 1.25,
    langTab: 'ADS',
    langCode: 'fr',
    characterPrompt:
      'Melodic, rhythmic sing-song viral meme & jingle male narrator voice full of bounce',
    samplePreviewText:
      'Regarde bien ce clip, c’est le moment le plus fou de ta journée, reste jusqu’au bout !',
  },
  {
    id: 'ads_hype_promo',
    name: 'Annonceur Hype',
    gender: 'M',
    accent: 'Advertisement • Henri Flash',
    style: 'Voix masculine promo e-commerce & TikTok Shop à haute conversion',
    geminiVoice: 'Zephyr',
    edgeVoice: 'fr-FR-HenriNeural',
    avatar:
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&auto=format&fit=crop&q=80',
    pitch: 1.1,
    rate: 1.25,
    langTab: 'ADS',
    langCode: 'fr',
    characterPrompt: 'Fast, persuasive TikTok Shop & commercial promo male voice',
    samplePreviewText:
      'Attention offre flash ! Regarde la démonstration en direct dans les prochaines secondes !',
  },
  {
    id: 'ads_chanteuse_pop',
    name: 'Voix Pop Pub',
    gender: 'F',
    accent: 'Advertisement • Denise Pop Star',
    style: 'Voix féminine pétillante pour publicités & lifestyle',
    geminiVoice: 'Kore',
    edgeVoice: 'fr-FR-DeniseNeural',
    avatar:
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80',
    badge: '💎',
    isPro: true,
    pitch: 1.1,
    rate: 1.2,
    langTab: 'ADS',
    langCode: 'fr',
    characterPrompt: 'Sparkling, upbeat female pop commercial announcer voice',
    samplePreviewText:
      'C’est la tendance numéro un du moment ! Regarde le résultat par toi-même !',
  },
];

// ============================================================================
// 2. GRILLE DE MODÈLES DE SOUS-TITRES (AVEC MODE 1 MOT PAR 1 MOT VIRAL FLASH)
// ============================================================================
export const SUBTITLE_STYLES: SubtitleStyle[] = [
  // 0. 1 MOT PAR 1 MOT (Style Viral Flash — Tapis / Métier Rentable : SANS -> DIPLÔME -> JE -> GAGNE)
  {
    id: 'word-by-word',
    subtitleTemplateId: 'word-by-word',
    name: 'Affichage 1 Mot par 1 Mot (Style Viral Flash)',
    category: 'Tendance',
    subTab: 'tendance',
    textColor: '#FFFFFF',
    highlightColor: '#FFFFFF',
    fontFamily: 'font-sans font-black',
    badge: '🔥 Tapis Viral',
    isFree: true,
    exampleWord: 'SANS → DIPLÔME',
    previewLine1: 'SANS',
    previewLine2: '→ DIPLÔME → JE → GAGNE',
    position: 'bottom',
    wordByWord: true,
  },
  // 1. BROWN FOX (Blanc et bleu cyan sur fond noir arrondi — Gratuit)
  {
    id: 'brown-fox-box',
    subtitleTemplateId: 'brown-fox-box',
    name: 'BROWN FOX (Box Noir Arrondi)',
    category: 'Tendance',
    subTab: 'tendance',
    textColor: '#FFFFFF',
    highlightColor: '#22D3EE',
    fontFamily: 'font-sans font-black',
    badge: 'Gratuit',
    isFree: true,
    exampleWord: 'BROWN FOX',
    previewLine1: 'BROWN',
    previewLine2: 'FOX',
    position: 'bottom',
  },
  // 2. BROWN FOX (Blanc et cyan avec halo lumineux — Gratuit)
  {
    id: 'brown-fox-glow',
    subtitleTemplateId: 'brown-fox-glow',
    name: 'BROWN FOX (Halo Cyan)',
    category: 'Tendance',
    subTab: 'tendance',
    textColor: '#FFFFFF',
    highlightColor: '#00F5FF',
    fontFamily: 'font-sans font-black',
    badge: 'Gratuit',
    isFree: true,
    exampleWord: 'BROWN FOX',
    previewLine1: 'BROWN',
    previewLine2: 'FOX',
    position: 'bottom',
  },
  // 3. THE QUICK BROWN FOX (2 lignes blanc et cyan contour noir épais — Gratuit)
  {
    id: 'quick-cyan',
    subtitleTemplateId: 'quick-cyan',
    name: 'THE QUICK BROWN FOX (Cyan Contour)',
    category: 'Tendance',
    subTab: 'tendance',
    textColor: '#FFFFFF',
    highlightColor: '#22D3EE',
    fontFamily: 'font-sans font-black',
    badge: 'Gratuit',
    isFree: true,
    exampleWord: 'THE QUICK BROWN FOX',
    previewLine1: 'THE QUICK',
    previewLine2: 'BROWN FOX',
    position: 'bottom',
  },
  // 4. THE QUICK BROWN FOX (2 lignes blanc et jaune vif Hormozi — Gratuit)
  {
    id: 'hormozi-yellow',
    subtitleTemplateId: 'hormozi-yellow',
    name: 'THE QUICK BROWN FOX (Hormozi Jaune)',
    category: 'Tendance',
    subTab: 'tendance',
    textColor: '#FFFFFF',
    highlightColor: '#FACC15',
    fontFamily: 'font-sans font-black',
    badge: 'Gratuit',
    isFree: true,
    exampleWord: 'THE QUICK BROWN FOX',
    previewLine1: 'THE QUICK',
    previewLine2: 'BROWN FOX',
    position: 'bottom',
  },
  // 5. THE QUICK (Jaune lumineux — Gratuit)
  {
    id: 'yellow-glow',
    subtitleTemplateId: 'yellow-glow',
    name: 'THE QUICK (Jaune Lumineux)',
    category: 'NOUVEAU',
    subTab: 'nouveau',
    textColor: '#FDE047',
    highlightColor: '#FACC15',
    fontFamily: 'font-sans font-black',
    badge: 'Gratuit',
    isFree: true,
    exampleWord: 'THE QUICK',
    previewLine1: 'THE QUICK',
    position: 'center',
  },
  // 6. LE RAPIDE RENARD BRUN (Blanc et rose/magenta contour noir — 💎)
  {
    id: 'pink-magenta',
    subtitleTemplateId: 'pink-magenta',
    name: 'LE RAPIDE RENARD BRUN (Rose 💎)',
    category: 'NOUVEAU',
    subTab: 'nouveau',
    textColor: '#FFFFFF',
    highlightColor: '#EC4899',
    fontFamily: 'font-sans font-black',
    badge: '💎',
    isPro: true,
    exampleWord: 'LE RAPIDE RENARD BRUN',
    previewLine1: 'LE RAPIDE',
    previewLine2: 'RENARD BRUN',
    position: 'bottom',
  },
  // 7. THE QUICK BROWN FOX (Minimaliste petit texte blanc épuré — Gratuit)
  {
    id: 'minimal-clean',
    subtitleTemplateId: 'minimal-clean',
    name: 'THE QUICK BROWN FOX (Minimal Épuré)',
    category: 'Classique',
    subTab: 'classique',
    textColor: '#FFFFFF',
    highlightColor: '#38BDF8',
    fontFamily: 'font-sans font-bold',
    badge: 'Gratuit',
    isFree: true,
    exampleWord: 'THE QUICK BROWN FOX',
    previewLine1: 'THE QUICK',
    previewLine2: 'BROWN FOX',
    position: 'bottom',
  },
];

// ============================================================================
// 3. BIBLIOTHÈQUE D'EFFETS SONORES & MUSIC CLIPS (AVEC BOUTON CYAN +)
// ============================================================================
export const SOUND_EFFECT_CLIPS: SoundEffectClip[] = [
  // --- Onglet Tendance ---
  {
    id: 'sfx_bass_impact',
    name: 'Bass impact',
    duration: '00:02',
    durationSeconds: 2,
    tab: 'tendance',
    sfxKey: 'bass_impact',
  },
  {
    id: 'sfx_scene_switching',
    name: 'Scene switching',
    duration: '00:03',
    durationSeconds: 3,
    tab: 'tendance',
    sfxKey: 'scene_switching',
  },
  {
    id: 'sfx_stinger_camera_shutter',
    name: 'StingerCameraShutter',
    duration: '00:01',
    durationSeconds: 1,
    tab: 'tendance',
    isPro: true,
    sfxKey: 'stinger_camera_shutter',
  },
  {
    id: 'sfx_rainy_night',
    name: 'Rainy Night',
    duration: '01:00',
    durationSeconds: 60,
    tab: 'tendance',
    sfxKey: 'rainy_night',
  },
  {
    id: 'sfx_swish_whoosh_large',
    name: 'Swish whoosh (large)',
    duration: '00:01',
    durationSeconds: 1,
    tab: 'tendance',
    sfxKey: 'swish_whoosh_large',
  },

  // --- Onglet Music Clip ---
  {
    id: 'sfx_orchestral_hit_sting',
    name: 'OrchestralHitSting',
    duration: '00:07',
    durationSeconds: 7,
    tab: 'music_clip',
    isPro: true,
    sfxKey: 'orchestral_hit_sting',
  },
  {
    id: 'sfx_impactful_epic_jingle',
    name: 'Impactful epic jingle',
    duration: '00:07',
    durationSeconds: 7,
    tab: 'music_clip',
    sfxKey: 'impactful_epic_jingle',
  },
  {
    id: 'sfx_orchestra_hit_lo_d',
    name: 'Orchestra hit LO D',
    duration: '00:04',
    durationSeconds: 4,
    tab: 'music_clip',
    sfxKey: 'orchestra_hit_lo_d',
  },
  {
    id: 'sfx_music_effect_big_jaz',
    name: 'MusicEffectBigJaz',
    duration: '00:05',
    durationSeconds: 5,
    tab: 'music_clip',
    isPro: true,
    sfxKey: 'music_effect_big_jaz',
  },
  {
    id: 'sfx_orchestra_hit_jingle',
    name: 'Orchestra hit jingle',
    duration: '00:03',
    durationSeconds: 3,
    tab: 'music_clip',
    sfxKey: 'orchestra_hit_jingle',
  },

  // --- Onglet Amusant ---
  {
    id: 'sfx_cartoon_boing',
    name: 'Cartoon Boing Jump',
    duration: '00:02',
    durationSeconds: 2,
    tab: 'amusant',
    sfxKey: 'cartoon_boing',
  },
  {
    id: 'sfx_pop_bubble',
    name: 'Pop Bubble Ding',
    duration: '00:01',
    durationSeconds: 1,
    tab: 'amusant',
    sfxKey: 'pop_bubble',
  },
  {
    id: 'sfx_vinyl_scratch',
    name: 'Vinyl Scratch Stop',
    duration: '00:02',
    durationSeconds: 2,
    tab: 'amusant',
    isPro: true,
    sfxKey: 'vinyl_scratch',
  },
  {
    id: 'sfx_cash_register',
    name: 'Cash Register Cha-Ching',
    duration: '00:02',
    durationSeconds: 2,
    tab: 'amusant',
    sfxKey: 'cash_register',
  },
  {
    id: 'sfx_funny_quack',
    name: 'Funny Duck Quack',
    duration: '00:01',
    durationSeconds: 1,
    tab: 'amusant',
    isPro: true,
    sfxKey: 'funny_quack',
  },

  // --- Onglet Sifflements ---
  {
    id: 'sfx_slide_whistle_up',
    name: 'Slide Whistle Up',
    duration: '00:02',
    durationSeconds: 2,
    tab: 'sifflements',
    sfxKey: 'slide_whistle_up',
  },
  {
    id: 'sfx_slide_whistle_down',
    name: 'Slide Whistle Down',
    duration: '00:02',
    durationSeconds: 2,
    tab: 'sifflements',
    sfxKey: 'slide_whistle_down',
  },
  {
    id: 'sfx_referee_whistle',
    name: 'Referee Whistle Blast',
    duration: '00:01',
    durationSeconds: 1,
    tab: 'sifflements',
    isPro: true,
    sfxKey: 'referee_whistle',
  },
  {
    id: 'sfx_wind_whistle',
    name: 'Wind Breeze Whistle',
    duration: '00:04',
    durationSeconds: 4,
    tab: 'sifflements',
    sfxKey: 'wind_whistle',
  },
  {
    id: 'sfx_wolf_whistle',
    name: 'Cartoon Wolf Whistle',
    duration: '00:02',
    durationSeconds: 2,
    tab: 'sifflements',
    isPro: true,
    sfxKey: 'wolf_whistle',
  },
];

// ============================================================================
// 4. 10 MUSIQUES DE FOND VIRALES SYNTHÉTISÉES (.WAV)
// ============================================================================
export const MUSIC_TRACKS: BackgroundMusic[] = [
  {
    id: 'business_cash',
    name: 'Storytelling Business & Cash (Style Tapis / Métier rentable)',
    vibe: 'Nettoyage Tapis, Métier rentable, Storytelling Cash, Chiffres',
    bpm: 114,
    audioKey: 'business_cash',
    category: 'Business & Cash',
    recommendedVolume: 22,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['bass_impact', 'cash_register'],
  },
  {
    id: 'satisfying_asmr',
    name: 'Satisfying ASMR & Clean Chill',
    vibe: 'Vidéos Satisfaisantes, Lavage, Rénovation, Détente Pure',
    bpm: 96,
    audioKey: 'satisfying_asmr',
    category: 'ASMR & Chill',
    recommendedVolume: 22,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['pop_bubble', 'swish_whoosh_large'],
  },
  {
    id: 'phonk',
    name: 'Phonk Drift Viral (808 Cowbell)',
    vibe: 'Énergique, Sport, Voitures, Défis Viraux',
    bpm: 140,
    audioKey: 'phonk',
    category: 'Phonk',
    recommendedVolume: 24,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['bass_impact', 'scene_switching'],
  },
  {
    id: 'piano_emotion',
    name: 'Piano Émotion & Histoire Vraie',
    vibe: 'Histoire Vraie, Témoignage, Parcours de Vie, Émotion',
    bpm: 88,
    audioKey: 'piano_emotion',
    category: 'Émotion',
    recommendedVolume: 22,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['scene_switching'],
  },
  {
    id: 'suspense',
    name: 'Suspense & Mystère (Tension)',
    vibe: 'Storytelling, Secrets, Enquêtes, Faits Réels',
    bpm: 108,
    audioKey: 'suspense',
    category: 'Suspense',
    recommendedVolume: 20,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['bass_impact', 'swish_whoosh_large'],
  },
  {
    id: 'motivation',
    name: 'Motivation Épique & Succès',
    vibe: 'Inspiration, Business, Mindset, Luxe',
    bpm: 126,
    audioKey: 'motivation',
    category: 'Motivation',
    recommendedVolume: 22,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['bass_impact', 'orchestral_hit_sting'],
  },
  {
    id: 'lofi',
    name: 'Lofi Chill & Narration',
    vibe: 'Astuces, Tech, Lifestyle, Explications',
    bpm: 92,
    audioKey: 'lofi',
    category: 'Lofi',
    recommendedVolume: 25,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['swish_whoosh_large', 'pop_bubble'],
  },
  {
    id: 'trap_focus',
    name: 'Dark Trap 808 Hustle',
    vibe: 'E-commerce, Crypto, Finance, Ambition',
    bpm: 132,
    audioKey: 'trap_focus',
    category: 'Trap',
    recommendedVolume: 20,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['bass_impact', 'cash_register'],
  },
  {
    id: 'synthwave_cyber',
    name: 'Synthwave Cyber Nocturne',
    vibe: 'IA, Futur, Gaming, Technologie, Nuit',
    bpm: 118,
    audioKey: 'synthwave_cyber',
    category: 'Synthwave',
    recommendedVolume: 22,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['scene_switching', 'swish_whoosh_large'],
  },
  {
    id: 'afro_chill',
    name: 'Afro Chill & Rythme Doux',
    vibe: 'Vibe Solaire, Lifestyle, Voyage, Tendance',
    bpm: 104,
    audioKey: 'afro_chill',
    category: 'Afro Chill',
    recommendedVolume: 24,
    sfxEnabled: true,
    musicEnabled: true,
    selectedSfxIds: ['pop_bubble', 'scene_switching'],
  },
];

interface Step3VoiceSubtitlesProps {
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  selectedSubtitle: SubtitleStyle;
  onSubtitleChange: (sub: SubtitleStyle) => void;
  selectedMusic: BackgroundMusic;
  onMusicChange: (music: BackgroundMusic) => void;
  musicVolume: number;
  onVolumeChange: (vol: number) => void;
  onNext: () => void;
  onPrev: () => void;
  appLanguage: AppLanguage;
}

const VOICE_TABS: Array<{ id: VoiceCatalogTab; label: string; langCode: string }> = [
  { id: 'FR', label: '🇫🇷 Français', langCode: 'fr' },
  { id: 'EN', label: '🇺🇸 Anglais US (@PoolRescuePro)', langCode: 'en' },
  { id: 'ES', label: '🇪🇸 Espagnol (@rescatapetes)', langCode: 'es' },
  { id: 'PT_BR', label: '🇧🇷 Portugais (Brésil)', langCode: 'pt' },
  { id: 'DE', label: '🇩🇪 Allemand (Deutsch)', langCode: 'de' },
  { id: 'ZH', label: '🇨🇳 Chinois (Mandarin / 中文)', langCode: 'zh' },
  { id: 'KO', label: '🇰🇷 Coréen (한국어)', langCode: 'ko' },
  { id: 'JA', label: '🇯🇵 Japonais (日本語)', langCode: 'ja' },
  { id: 'ADS', label: 'Chanson-même / Advertisement', langCode: 'fr' },
];

const VOICE_SPEED_PRESETS: Array<{ value: number; label: string; badge?: string }> = [
  { value: 1.0, label: '1.0x' },
  { value: 1.15, label: '1.15x' },
  { value: 1.2, label: '1.20x', badge: 'Défaut' },
  { value: 1.25, label: '1.25x TikTok Viral', badge: '🔥' },
  { value: 1.4, label: '1.4x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2.0, label: '2.0x' },
];

const VOICE_VOLUME_PRESETS: Array<{ value: number; label: string; badge?: string }> = [
  { value: 80, label: '80% (Voix douce)' },
  { value: 100, label: '100% (Standard)' },
  { value: 130, label: '130% (Voix forte & claire)', badge: 'Défaut' },
  { value: 160, label: '160% (Boost TikTok - Recommandé)', badge: '🔥' },
  { value: 200, label: '200% (Maximum)' },
];

const SFX_TABS: Array<{ id: SfxCatalogTab; label: string }> = [
  { id: 'tendance', label: 'Tendance' },
  { id: 'music_clip', label: 'Music Clip' },
  { id: 'amusant', label: 'Amusant' },
  { id: 'sifflements', label: 'Sifflements' },
];

const SUBTITLE_TABS: Array<{ id: SubtitleCatalogTab | 'all'; label: string; isNew?: boolean }> = [
  { id: 'tendance', label: 'Tendance' },
  { id: 'classique', label: 'Classique' },
  { id: 'nouveau', label: 'NOUVEAU', isNew: true },
];

export const Step3VoiceSubtitles: React.FC<Step3VoiceSubtitlesProps> = ({
  selectedLanguage,
  onLanguageChange,
  selectedVoice,
  onVoiceChange,
  selectedSubtitle,
  onSubtitleChange,
  selectedMusic,
  onMusicChange,
  musicVolume,
  onVolumeChange,
  onNext,
  onPrev,
  appLanguage,
}) => {
  const t = translations[appLanguage] || translations.FR;

  // Voice Catalog & Voice Speed State (default 1.20x TikTok dynamic pace)
  const initialVoiceTab: VoiceCatalogTab = (() => {
    const l = (selectedVoice.langCode || selectedLanguage || 'fr').toLowerCase();
    if (l.startsWith('en')) return 'EN';
    if (l.startsWith('es')) return 'ES';
    if (l.startsWith('pt')) return 'PT_BR';
    if (l.startsWith('de')) return 'DE';
    if (l.startsWith('zh')) return 'ZH';
    if (l.startsWith('ko')) return 'KO';
    if (l.startsWith('ja')) return 'JA';
    return 'FR';
  })();
  const [activeVoiceTab, setActiveVoiceTab] = useState<VoiceCatalogTab>(initialVoiceTab);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [voiceSearchQuery, setVoiceSearchQuery] = useState('');
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const currentVoiceSpeed = Math.max(1.0, Math.min(2.0, Number(selectedVoice.rate) || 1.2));
  const currentVoiceVolume = Math.max(
    50,
    Math.min(200, Number(selectedVoice.voiceVolume) || 130)
  );
  const isStudioBassBoost = selectedVoice.studioBassBoost !== false;

  // Sound Effects & Music Clips Library State (with Checkboxes Oui / Non)
  const [activeSfxTab, setActiveSfxTab] = useState<SfxCatalogTab>('tendance');
  const [playingSfxKey, setPlayingSfxKey] = useState<string | null>(null);
  const [bookmarkedSfxIds, setBookmarkedSfxIds] = useState<string[]>([
    'sfx_bass_impact',
    'sfx_orchestral_hit_sting',
  ]);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(selectedMusic.sfxEnabled !== false);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(selectedMusic.musicEnabled !== false);
  const [addedSfxKeys, setAddedSfxKeys] = useState<string[]>(
    selectedMusic.selectedSfxIds || ['bass_impact', 'scene_switching']
  );

  // Background Music Preview State
  const [playingMusicId, setPlayingMusicId] = useState<string | null>(null);

  // Subtitle Templates & Interactive Drag/Zoom State
  const [activeSubtitleTab, setActiveSubtitleTab] = useState<SubtitleCatalogTab | 'all'>('tendance');
  const [applyToAllMainCaptions, setApplyToAllMainCaptions] = useState(true);
  const [isDraggingSubStep3, setIsDraggingSubStep3] = useState(false);
  const step3SubPreviewRef = React.useRef<HTMLDivElement | null>(null);
  const step3PinchStartDistRef = React.useRef<number | null>(null);
  const step3PinchStartScaleRef = React.useRef<number>(100);

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

  const updateStep3SubtitleTransform = (patch: Partial<SubtitleStyle>) => {
    const nextY = patch.subtitleY ?? subY;
    const derivedPos: 'top' | 'center' | 'bottom' =
      nextY <= 35 ? 'top' : nextY <= 62 ? 'center' : 'bottom';
    onSubtitleChange({
      ...selectedSubtitle,
      subtitleX: subX,
      subtitleY: subY,
      subtitleScale: subScale,
      coverCompetitorText: subCoverCompetitor,
      position: derivedPos,
      ...patch,
    });
  };

  useEffect(() => {
    return () => {
      soundFx.stopMusicPreview();
      soundFx.stopCatalogSfxPreview();
      soundFx.stopVoicePreview();
    };
  }, []);

  // Filter voices by active language tab + search query
  const filteredVoices = VOICE_OPTIONS.filter((v) => {
    if (voiceSearchQuery.trim().length > 0) {
      const q = voiceSearchQuery.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.accent.toLowerCase().includes(q) ||
        v.style.toLowerCase().includes(q)
      );
    }
    return (v.langTab || 'FR') === activeVoiceTab;
  });

  // Toggle Studio Bass Boost & Presence ([✓] Boost Basses & Présence Studio - Micro Créateur)
  const handleToggleStudioBassBoost = (nextBoost: boolean) => {
    soundFx.playSfx('click');
    const updatedVoice: VoiceOption = {
      ...selectedVoice,
      rate: currentVoiceSpeed,
      voiceVolume: currentVoiceVolume,
      studioBassBoost: nextBoost,
    };
    onVoiceChange(updatedVoice);

    if (!updatedVoice.isNone && updatedVoice.geminiVoice !== 'NONE') {
      setPlayingVoiceId(updatedVoice.id);
      soundFx
        .playVoicePreview(
          updatedVoice.samplePreviewText ||
            `Bonjour, je suis la voix ${updatedVoice.name} avec le micro studio créateur.`,
          updatedVoice.geminiVoice,
          updatedVoice.name,
          currentVoiceSpeed,
          updatedVoice.pitch,
          updatedVoice.langCode || selectedLanguage,
          updatedVoice.characterPrompt,
          updatedVoice.id,
          nextBoost,
          currentVoiceVolume
        )
        .finally(() => {
          setTimeout(() => {
            setPlayingVoiceId((prev) => (prev === updatedVoice.id ? null : prev));
          }, 2600);
        });
    }
  };

  // Update Voiceover Volume (50% to 200%, default 130%)
  const handleVoiceVolumeChange = (newVolumePct: number, playPreviewAfter: boolean = false) => {
    const clampedVol = Math.round(Math.max(50, Math.min(200, Number(newVolumePct) || 130)));
    const updatedVoice: VoiceOption = {
      ...selectedVoice,
      rate: currentVoiceSpeed,
      voiceVolume: clampedVol,
      studioBassBoost: isStudioBassBoost,
    };
    onVoiceChange(updatedVoice);
    soundFx.setVoicePreviewVolume(clampedVol);

    if (playPreviewAfter && !updatedVoice.isNone && updatedVoice.geminiVoice !== 'NONE') {
      setPlayingVoiceId(updatedVoice.id);
      soundFx
        .playVoicePreview(
          updatedVoice.samplePreviewText ||
            `Bonjour, je suis la voix ${updatedVoice.name} avec le volume réglé à ${clampedVol} pourcent.`,
          updatedVoice.geminiVoice,
          updatedVoice.name,
          currentVoiceSpeed,
          updatedVoice.pitch,
          updatedVoice.langCode || selectedLanguage,
          updatedVoice.characterPrompt,
          updatedVoice.id,
          isStudioBassBoost,
          clampedVol
        )
        .finally(() => {
          setTimeout(() => {
            setPlayingVoiceId((prev) => (prev === updatedVoice.id ? null : prev));
          }, 2600);
        });
    }
  };

  // Update Voiceover Speed (1.0x to 2.0x)
  const handleVoiceSpeedChange = (newSpeed: number, playPreviewAfter: boolean = false) => {
    const clamped = Math.round(Math.max(1.0, Math.min(2.0, newSpeed)) * 100) / 100;
    const updatedVoice: VoiceOption = {
      ...selectedVoice,
      rate: clamped,
      voiceVolume: currentVoiceVolume,
      studioBassBoost: isStudioBassBoost,
    };
    onVoiceChange(updatedVoice);

    if (playPreviewAfter && !updatedVoice.isNone && updatedVoice.geminiVoice !== 'NONE') {
      setPlayingVoiceId(updatedVoice.id);
      soundFx
        .playVoicePreview(
          updatedVoice.samplePreviewText ||
            `Bonjour, je suis la voix ${updatedVoice.name} à la vitesse ${clamped} fois.`,
          updatedVoice.geminiVoice,
          updatedVoice.name,
          clamped,
          updatedVoice.pitch,
          updatedVoice.langCode || selectedLanguage,
          updatedVoice.characterPrompt,
          updatedVoice.id,
          isStudioBassBoost,
          currentVoiceVolume
        )
        .finally(() => {
          setTimeout(() => {
            setPlayingVoiceId((prev) => (prev === updatedVoice.id ? null : prev));
          }, 2600);
        });
    }
  };

  // Handle clicking a voice card (selects it with currentVoiceSpeed, currentVoiceVolume & studioBassBoost & plays preview in 1 click)
  const handleSelectAndPlayVoice = async (voice: VoiceOption, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const voiceWithSpeed: VoiceOption = {
      ...voice,
      rate: currentVoiceSpeed,
      voiceVolume: currentVoiceVolume,
      studioBassBoost: isStudioBassBoost,
    };
    onVoiceChange(voiceWithSpeed);
    if (voice.langCode) {
      onLanguageChange(voice.langCode);
    }

    if (voice.isNone || voice.geminiVoice === 'NONE') {
      soundFx.stopVoicePreview();
      setPlayingVoiceId(null);
      soundFx.playSfx('click');
      return;
    }

    if (playingVoiceId === voice.id) {
      soundFx.stopVoicePreview();
      setPlayingVoiceId(null);
      return;
    }

    setPlayingVoiceId(voice.id);
    try {
      await soundFx.playVoicePreview(
        voice.samplePreviewText ||
          `Bonjour, je suis la voix ${voice.name}. Prête pour ton montage viral.`,
        voice.geminiVoice,
        voice.name,
        currentVoiceSpeed,
        voice.pitch,
        voice.langCode || selectedLanguage,
        voice.characterPrompt,
        voice.id,
        isStudioBassBoost,
        currentVoiceVolume
      );
    } finally {
      setTimeout(() => {
        setPlayingVoiceId((prev) => (prev === voice.id ? null : prev));
      }, 2800);
    }
  };

  // Toggle master SFX checkbox [✓] Activer les effets sonores (SFX)
  const handleToggleMasterSfxEnabled = (nextEnabled: boolean) => {
    soundFx.playSfx('click');
    setSfxEnabled(nextEnabled);
    onMusicChange({
      ...selectedMusic,
      sfxEnabled: nextEnabled,
      musicEnabled,
      selectedSfxIds: nextEnabled ? addedSfxKeys : [],
    });
  };

  // Toggle master Background Music checkbox [✓] Activer la musique de fond
  const handleToggleMasterMusicEnabled = (nextEnabled: boolean) => {
    soundFx.playSfx('click');
    setMusicEnabled(nextEnabled);
    if (!nextEnabled) {
      soundFx.stopMusicPreview();
      setPlayingMusicId(null);
    }
    onMusicChange({
      ...selectedMusic,
      musicEnabled: nextEnabled,
      sfxEnabled,
      selectedSfxIds: sfxEnabled ? addedSfxKeys : [],
    });
  };

  // Clear all checked SFX in 1 click
  const handleClearAllSfx = () => {
    soundFx.playSfx('click');
    setAddedSfxKeys([]);
    onMusicChange({
      ...selectedMusic,
      sfxEnabled,
      musicEnabled,
      selectedSfxIds: [],
    });
  };

  // Handle playing a Sound Effect / Music Clip from the catalog
  const handlePlayCatalogSfx = async (clip: SoundEffectClip) => {
    soundFx.stopMusicPreview();
    setPlayingMusicId(null);

    if (playingSfxKey === clip.sfxKey) {
      soundFx.stopCatalogSfxPreview();
      setPlayingSfxKey(null);
      return;
    }

    setPlayingSfxKey(clip.sfxKey);
    try {
      await soundFx.toggleCatalogSfxPreview(clip.sfxKey, () => {
        setPlayingSfxKey((prev) => (prev === clip.sfxKey ? null : prev));
      });
    } catch {
      setPlayingSfxKey(null);
    }
  };

  // Toggle favorite bookmark 🔖
  const handleToggleBookmarkSfx = (clipId: string) => {
    soundFx.playSfx('click');
    setBookmarkedSfxIds((prev) =>
      prev.includes(clipId) ? prev.filter((id) => id !== clipId) : [...prev, clipId]
    );
  };

  // Add / Toggle SFX or Music Clip in the final video montage via Checkbox [✓] or Cyan + button
  const handleToggleAddSfxToMontage = (clip: SoundEffectClip) => {
    const isAlreadyAdded = addedSfxKeys.includes(clip.sfxKey);
    const nextKeys = isAlreadyAdded
      ? addedSfxKeys.filter((k) => k !== clip.sfxKey)
      : [...addedSfxKeys, clip.sfxKey];

    const nextSfxEnabled = nextKeys.length > 0 ? true : sfxEnabled;
    if (nextKeys.length > 0 && !sfxEnabled) {
      setSfxEnabled(true);
    }

    setAddedSfxKeys(nextKeys);
    onMusicChange({
      ...selectedMusic,
      sfxEnabled: nextSfxEnabled,
      musicEnabled,
      selectedSfxIds: nextSfxEnabled ? nextKeys : [],
    });

    // Play immediate acoustic feedback of the added sound effect
    if (!isAlreadyAdded) {
      handlePlayCatalogSfx(clip);
    } else {
      soundFx.playSfx('click');
    }
  };

  // Play or stop synthesized background music (.WAV)
  const handlePreviewMusic = async (music: BackgroundMusic) => {
    soundFx.stopCatalogSfxPreview();
    setPlayingSfxKey(null);

    if (playingMusicId === music.id) {
      soundFx.stopMusicPreview();
      setPlayingMusicId(null);
      return;
    }
    setPlayingMusicId(music.id);
    try {
      await soundFx.toggleMusicPreview(music.audioKey, musicVolume, () => {
        setPlayingMusicId((prev) => (prev === music.id ? null : prev));
      });
    } catch {
      setPlayingMusicId(null);
    }
  };

  // Render exact CapCut visual preview inside each square card
  const renderCapCutSubtitleCardPreview = (sub: SubtitleStyle) => {
    const tplId = sub.subtitleTemplateId || sub.id;
    switch (tplId) {
      case 'word-by-word':
      case 'viral_1word_flash':
        return (
          <div className="flex flex-col items-center justify-center gap-1 text-center">
            <span
              className="text-white font-black text-base sm:text-lg tracking-wider uppercase"
              style={{
                WebkitTextStroke: '2px #000000',
                textShadow: '0 3px 6px rgba(0,0,0,0.98)',
              }}
            >
              SANS
            </span>
            <span className="text-[9px] font-extrabold text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400/40">
              → DIPLÔME → JE → GAGNE
            </span>
          </div>
        );

      case 'brown-fox-box':
      case 'capcut_box_cyan':
        return (
          <div className="px-3 py-1.5 rounded-xl bg-black/95 border border-slate-800 shadow-lg flex items-center justify-center gap-1.5">
            <span className="text-white font-black text-xs sm:text-sm tracking-tight">BROWN</span>
            <span className="text-cyan-400 font-black text-xs sm:text-sm tracking-tight">FOX</span>
          </div>
        );

      case 'brown-fox-glow':
      case 'capcut_glow_cyan':
        return (
          <div className="flex items-center justify-center gap-1.5">
            <span
              className="text-white font-black text-xs sm:text-sm tracking-tight"
              style={{ textShadow: '0 0 10px rgba(255,255,255,0.85)' }}
            >
              BROWN
            </span>
            <span
              className="text-cyan-300 font-black text-xs sm:text-sm tracking-tight"
              style={{
                textShadow:
                  '0 0 12px rgba(34,211,238,1), 0 0 24px rgba(6,182,212,0.9)',
              }}
            >
              FOX
            </span>
          </div>
        );

      case 'quick-cyan':
      case 'capcut_2line_cyan':
        return (
          <div className="flex flex-col items-center justify-center leading-tight text-center">
            <span
              className="text-white font-black text-xs sm:text-sm tracking-tight"
              style={{
                WebkitTextStroke: '1.5px #000000',
                textShadow: '0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              THE QUICK
            </span>
            <span
              className="text-cyan-400 font-black text-xs sm:text-sm tracking-tight"
              style={{
                WebkitTextStroke: '1.5px #000000',
                textShadow: '0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              BROWN FOX
            </span>
          </div>
        );

      case 'hormozi-yellow':
      case 'hormozi':
        return (
          <div className="flex flex-col items-center justify-center leading-tight text-center">
            <span
              className="text-white font-black text-xs sm:text-sm tracking-tight"
              style={{
                WebkitTextStroke: '1.5px #000000',
                textShadow: '0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              THE QUICK
            </span>
            <span
              className="text-yellow-400 font-black text-xs sm:text-sm tracking-tight"
              style={{
                WebkitTextStroke: '1.5px #000000',
                textShadow: '0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              BROWN FOX
            </span>
          </div>
        );

      case 'yellow-glow':
      case 'capcut_yellow_glow':
        return (
          <div className="flex items-center justify-center">
            <span
              className="text-yellow-300 font-black text-sm sm:text-base tracking-wide"
              style={{
                textShadow:
                  '0 0 12px rgba(250,204,21,0.95), 0 0 24px rgba(234,179,8,0.8)',
              }}
            >
              THE QUICK
            </span>
          </div>
        );

      case 'pink-magenta':
      case 'capcut_pink_pro':
        return (
          <div className="flex flex-col items-center justify-center leading-tight text-center">
            <span
              className="text-white font-black text-[11px] sm:text-xs tracking-tight"
              style={{
                WebkitTextStroke: '1.3px #000000',
                textShadow: '0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              LE RAPIDE
            </span>
            <span
              className="text-pink-500 font-black text-[11px] sm:text-xs tracking-tight"
              style={{
                WebkitTextStroke: '1.3px #000000',
                textShadow: '0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              RENARD BRUN
            </span>
          </div>
        );

      case 'minimal-clean':
      case 'minimal':
      default:
        return (
          <div className="flex flex-col items-center justify-center leading-snug text-center">
            <span className="text-white font-bold text-[10px] sm:text-[11px] tracking-wider">
              THE QUICK
            </span>
            <span className="text-sky-400 font-bold text-[10px] sm:text-[11px] tracking-wider">
              BROWN FOX
            </span>
          </div>
        );
    }
  };

  const visibleSfxClips = SOUND_EFFECT_CLIPS.filter((c) => c.tab === activeSfxTab);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#111927] to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              Étape 3 sur 5 • Studio Audio & Légendes CapCut
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Format 01:01 (Monétisation TikTok)
            </span>
          </div>
          <h2 className="text-xl font-black text-white">{t.step3Title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Choisis ton personnage Voix-off IA (voix d'homme ou de femme), règle la vitesse (1.20x TikTok), coche tes Effets Sonores & Musique et sélectionne ton modèle CapCut.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
          <Mic className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">Voix active :</span>
          <span className="font-bold text-white">
            {selectedVoice.isNone ? '🚫 Aucun(e)' : `${selectedVoice.name} (${currentVoiceSpeed.toFixed(2)}x)`}
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 1 : CATALOGUE DE VOIX-OFF PAR ONGLETS DE LANGUES (CARTES CARRÉES) */}
      {/* ===================================================================== */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              1. Catalogue de Voix-off Speechma &amp; Studio par Marché
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">
              US (Matthew, Guy, Brian) • ES (Julio, Alvaro) • FR (Henri, Paul)
            </span>
            {!selectedVoice.isNone && (
              <button
                type="button"
                onClick={(e) => handleSelectAndPlayVoice(selectedVoice, e)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
              >
                {playingVoiceId === selectedVoice.id ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Voix Speechma ({selectedVoice.name})</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>🔊 Écouter la voix Speechma ({selectedVoice.name})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Language Tabs Bar + Search Magnifying Glass */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setShowVoiceSearch((prev) => !prev);
              soundFx.playSfx('click');
            }}
            className={`p-2 rounded-xl border shrink-0 transition-all cursor-pointer ${
              showVoiceSearch || voiceSearchQuery
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                : 'bg-[#161d2a] border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Rechercher une voix"
          >
            <Search className="w-4 h-4" />
          </button>

          {VOICE_TABS.map((tab) => {
            const isActive = activeVoiceTab === tab.id && !voiceSearchQuery;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveVoiceTab(tab.id);
                  setVoiceSearchQuery('');
                  onLanguageChange(tab.langCode);
                  if (
                    !selectedVoice.isNone &&
                    (selectedVoice.langCode || 'fr').toLowerCase() !== tab.langCode.toLowerCase()
                  ) {
                    const defaultVoiceForTab = VOICE_OPTIONS.find((v) => v.langTab === tab.id);
                    if (defaultVoiceForTab) {
                      onVoiceChange({
                        ...defaultVoiceForTab,
                        rate: currentVoiceSpeed,
                        voiceVolume: currentVoiceVolume,
                        studioBassBoost: isStudioBassBoost,
                      });
                    }
                  }
                  soundFx.playSfx('click');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border border-cyan-400/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Optional Search Input */}
        {showVoiceSearch && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={voiceSearchQuery}
              onChange={(e) => setVoiceSearchQuery(e.target.value)}
              placeholder="Rechercher une voix (ex: Maxime, Grenouille, Valentino, Julio, Lucas...)"
              className="w-full bg-[#0b0f17] border border-slate-800 focus:border-cyan-400 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
            {voiceSearchQuery && (
              <button
                type="button"
                onClick={() => setVoiceSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Square Cards Grid (First card: 🚫 Aucun(e), followed by language character cards) */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 gap-3">
          {/* Card 0: 🚫 Aucun(e) */}
          <div
            onClick={() => handleSelectAndPlayVoice(NONE_VOICE_OPTION)}
            className="group flex flex-col items-center cursor-pointer transition-all"
          >
            <div
              className={`relative w-full aspect-square rounded-2xl bg-[#161b26] flex flex-col items-center justify-center border-2 transition-all overflow-hidden ${
                selectedVoice.id === NONE_VOICE_OPTION.id
                  ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <Ban className="w-8 h-8 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <span
              className={`mt-1.5 text-[11px] font-bold text-center truncate w-full ${
                selectedVoice.id === NONE_VOICE_OPTION.id ? 'text-cyan-400' : 'text-slate-300'
              }`}
            >
              Aucun(e)
            </span>
          </div>

          {/* Character Voice Square Cards */}
          {filteredVoices.map((voice) => {
            const isSelected = selectedVoice.id === voice.id;
            const isPlaying = playingVoiceId === voice.id;

            return (
              <div
                key={voice.id}
                onClick={(e) => handleSelectAndPlayVoice(voice, e)}
                className="group flex flex-col items-center cursor-pointer transition-all"
              >
                <div
                  className={`relative w-full aspect-square rounded-2xl bg-[#161b26] border-2 transition-all overflow-hidden ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20'
                      : 'border-slate-800/90 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={voice.avatar}
                    alt={voice.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Subtle dark gradient at bottom of square */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />

                  {/* Male / Female Voice Badge at bottom-left */}
                  <div
                    className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold backdrop-blur-xs border ${
                      voice.gender === 'M'
                        ? 'bg-sky-950/85 border-sky-400/40 text-sky-300'
                        : 'bg-pink-950/85 border-pink-400/40 text-pink-300'
                    }`}
                  >
                    {voice.gender === 'M' ? '♂ Homme' : '♀ Femme'}
                  </div>

                  {/* PRO Diamond Badge 💎 on top-right */}
                  {voice.isPro && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-slate-950/85 backdrop-blur-xs border border-pink-500/40 flex items-center justify-center shadow-md">
                      <span className="text-xs leading-none">💎</span>
                    </div>
                  )}

                  {/* Play / Equalizer Overlay Button */}
                  <button
                    type="button"
                    onClick={(e) => handleSelectAndPlayVoice(voice, e)}
                    className={`absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                      isPlaying
                        ? 'bg-cyan-400 text-slate-950 scale-110'
                        : isSelected
                        ? 'bg-cyan-500/90 text-slate-950'
                        : 'bg-slate-950/80 text-white opacity-90 group-hover:bg-cyan-400 group-hover:text-slate-950'
                    }`}
                    title={`Écouter ${voice.name}`}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Selected Checkmark on top-left */}
                  {isSelected && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <span
                  className={`mt-1.5 text-[11px] font-bold text-center truncate w-full px-0.5 ${
                    isSelected ? 'text-cyan-400' : 'text-slate-200 group-hover:text-white'
                  }`}
                >
                  {voice.name}
                </span>
              </div>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* CURSEUR DE VITESSE DE LA VOIX-OFF (ACCÉLÉRATEUR DE VOIX 1.0x - 2.0x) */}
        {/* ================================================================= */}
        <div className="mt-4 p-4 rounded-2xl bg-[#0b0f17] border border-cyan-500/25 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Vitesse de la Voix-off (Accélérateur TikTok 1.0x à 2.0x)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-400/40 font-mono text-xs font-black text-cyan-300">
                {currentVoiceSpeed.toFixed(2)}x •{' '}
                {currentVoiceSpeed >= 1.4
                  ? 'Ultra Rapide'
                  : currentVoiceSpeed >= 1.18
                  ? 'Rythme Dynamique TikTok'
                  : 'Rythme Normal'}
              </span>

              {!selectedVoice.isNone && (
                <button
                  type="button"
                  onClick={() => handleVoiceSpeedChange(currentVoiceSpeed, true)}
                  className="px-3 py-1 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Tester la vitesse</span>
                </button>
              )}
            </div>
          </div>

          {/* Range Slider 1.0x to 2.0x */}
          <div className="space-y-1.5">
            <input
              type="range"
              min="1.0"
              max="2.0"
              step="0.05"
              value={currentVoiceSpeed}
              onChange={(e) => handleVoiceSpeedChange(parseFloat(e.target.value), false)}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>1.00x (Normal)</span>
              <span className="text-cyan-400 font-bold">1.20x - 1.25x (TikTok Viral Recommandé)</span>
              <span>2.00x (Max)</span>
            </div>
          </div>

          {/* Quick Preset Speed Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {VOICE_SPEED_PRESETS.map((preset) => {
              const isPresetActive = Math.abs(currentVoiceSpeed - preset.value) < 0.02;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleVoiceSpeedChange(preset.value, true)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                    isPresetActive
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-[#151c2c] hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{preset.label}</span>
                  {preset.badge && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded ${
                        isPresetActive
                          ? 'bg-slate-950/20 text-slate-950 font-black'
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

          {/* Option "Voix Dynamique & Basses Renforcées" (Checked by default) */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <label
              onClick={() => handleToggleStudioBassBoost(!isStudioBassBoost)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2.5 cursor-pointer select-none transition-all ${
                isStudioBassBoost
                  ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300 shadow-sm shadow-emerald-500/10'
                  : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                  isStudioBassBoost
                    ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                    : 'bg-slate-950 border-slate-600 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
              <span>Boost Basses &amp; Présence Studio (Micro Créateur)</span>
            </label>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                Basses 120Hz +6dB
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                Présence 2.5kHz +3dB
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                Compresseur DJI/Rode -14 LUFS
              </span>
            </div>
          </div>

          {/* =============================================================== */}
          {/* CURSEUR DE VOLUME DE LA VOIX-OFF (50% À 200%, DÉFAUT 130%)      */}
          {/* =============================================================== */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                  Volume de la Voix-off (50% à 200%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 font-mono text-xs font-black text-emerald-300">
                  {currentVoiceVolume}% •{' '}
                  {currentVoiceVolume >= 180
                    ? 'Maximum'
                    : currentVoiceVolume >= 150
                    ? 'Boost TikTok 🔥'
                    : currentVoiceVolume >= 120
                    ? 'Voix forte & claire'
                    : currentVoiceVolume >= 95
                    ? 'Standard'
                    : 'Voix douce'}
                </span>

                {!selectedVoice.isNone && (
                  <button
                    type="button"
                    onClick={() => handleVoiceVolumeChange(currentVoiceVolume, true)}
                    className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Tester le volume</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                type="range"
                min={50}
                max={200}
                step={5}
                value={currentVoiceVolume}
                onChange={(e) => handleVoiceVolumeChange(parseInt(e.target.value, 10), false)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>50% (Douce)</span>
                <span className="text-emerald-400 font-bold">
                  130% (Défaut) • 160% (Boost TikTok Recommandé)
                </span>
                <span>200% (Maximum)</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {VOICE_VOLUME_PRESETS.map((preset) => {
                const isActive = currentVoiceVolume === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleVoiceVolumeChange(preset.value, true)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                        : 'bg-[#151c2c] hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {preset.badge && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded ${
                          isActive
                            ? 'bg-slate-950/20 text-slate-950 font-black'
                            : 'bg-emerald-500/20 text-emerald-300'
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
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 2 : BIBLIOTHÈQUE D'EFFETS SONORES & MUSIC CLIPS (+ MUSIQUE)   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Sound Effects & Music Clips Library (CapCut Style + Checkboxes Oui/Non) */}
        <div className="lg:col-span-7 bg-[#0f1522] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  2. Effets Sonores (SFX) & Music Clips
                </h3>
              </div>

              {/* Master Checkbox: [✓] Activer les effets sonores (SFX) */}
              <div className="flex items-center gap-2">
                <label
                  onClick={() => handleToggleMasterSfxEnabled(!sfxEnabled)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer select-none transition-all ${
                    sfxEnabled
                      ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-xs'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      sfxEnabled
                        ? 'bg-cyan-400 border-cyan-400 text-slate-950'
                        : 'bg-slate-950 border-slate-600 text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                  <span>Activer les effets sonores (SFX)</span>
                </label>

                {sfxEnabled && addedSfxKeys.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllSfx}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                    title="Décocher tous les effets sonores"
                  >
                    Tout décocher
                  </button>
                )}
              </div>
            </div>

            {/* 4 Tabs: Tendance | Music Clip | Amusant | Sifflements */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-4">
                {SFX_TABS.map((tab) => {
                  const isActive = activeSfxTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveSfxTab(tab.id);
                        soundFx.playSfx('click');
                      }}
                      className={`text-xs font-extrabold pb-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'text-white border-cyan-400'
                          : 'text-slate-400 border-transparent hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg shrink-0">
                {sfxEnabled ? `${addedSfxKeys.length} coché(s)` : 'SFX désactivés'}
              </span>
            </div>

            {/* List of Sound Effects / Music Clips with individual Checkboxes [✓] */}
            <div className={`space-y-2 transition-opacity ${!sfxEnabled ? 'opacity-60' : ''}`}>
              {visibleSfxClips.map((clip) => {
                const isPlaying = playingSfxKey === clip.sfxKey;
                const isBookmarked = bookmarkedSfxIds.includes(clip.id);
                const isChecked = sfxEnabled && addedSfxKeys.includes(clip.sfxKey);

                return (
                  <div
                    key={clip.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isPlaying
                        ? 'bg-slate-900 border-cyan-400/60 shadow-md'
                        : isChecked
                        ? 'bg-[#141c2b] border-cyan-500/40'
                        : 'bg-[#131926] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Individual Checkbox [✓] to include/exclude this SFX */}
                    <button
                      type="button"
                      onClick={() => handleToggleAddSfxToMontage(clip)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-cyan-400 border-cyan-400 text-slate-950 shadow-xs'
                          : 'bg-slate-950 border-slate-600 text-transparent hover:border-cyan-400'
                      }`}
                      title={
                        isChecked
                          ? 'Décocher cet effet sonore (ne pas inclure)'
                          : 'Cocher pour inclure cet effet sonore dans la vidéo'
                      }
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Middle: ♪ Icon + Play trigger + Title + 💎 + Duration */}
                    <div
                      onClick={() => handlePlayCatalogSfx(clip)}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
                    >
                      <button
                        type="button"
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                            : 'bg-[#1c2436] text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                        }`}
                        title={isPlaying ? 'Pause' : `Écouter ${clip.name}`}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <span className="text-base font-bold leading-none">♪</span>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {clip.name}
                          </span>
                          {clip.isPro && (
                            <span className="text-xs leading-none shrink-0" title="PRO">
                              💎
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-400">
                            {clip.duration}
                          </span>
                          {isPlaying && (
                            <span className="text-[10px] font-bold text-cyan-400 animate-pulse">
                              • Lecture audio...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right actions: Bookmark 🔖, Download ↓, Cyan + / Check button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleBookmarkSfx(clip.id)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          isBookmarked
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                        title="Favori"
                      >
                        <Bookmark
                          className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundFx.downloadCatalogSfxWav(clip.sfxKey, clip.name);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                        title={`Télécharger ${clip.name} (.WAV)`}
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleAddSfxToMontage(clip)}
                        className={`w-8 h-8 rounded-lg font-black flex items-center justify-center transition-all cursor-pointer shadow-md ${
                          isChecked
                            ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                            : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
                        }`}
                        title={
                          isChecked
                            ? 'Retirer du montage vidéo'
                            : 'Ajouter cet effet sonore au montage vidéo'
                        }
                      >
                        {isChecked ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[3]" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active SFX Summary Pills */}
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Mixés à l'Étape 5 :
            </span>
            {!sfxEnabled || addedSfxKeys.length === 0 ? (
              <span className="text-[11px] text-slate-400 italic">
                Aucun effet sonore sélectionné (décoche ou coche les effets souhaités ci-dessus)
              </span>
            ) : (
              addedSfxKeys.map((sfxKey) => {
                const found = SOUND_EFFECT_CLIPS.find((c) => c.sfxKey === sfxKey);
                return (
                  <span
                    key={sfxKey}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-bold text-cyan-300"
                  >
                    ✓ ♪ {found ? found.name : sfxKey}
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* Right 5 Cols: Background Music Selector & Master Checkbox [✓] Activer la musique de fond */}
        <div className="lg:col-span-5 bg-[#0f1522] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Musique de Fond (.WAV)
                </h3>
              </div>

              {/* Master Checkbox: [✓] Activer la musique de fond */}
              <label
                onClick={() => handleToggleMasterMusicEnabled(!musicEnabled)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer select-none transition-all ${
                  musicEnabled
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-xs'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    musicEnabled
                      ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                      : 'bg-slate-950 border-slate-600 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
                <span>Activer la musique de fond</span>
              </label>
            </div>

            <div className={`space-y-2 transition-opacity ${!musicEnabled ? 'opacity-50' : ''}`}>
              {MUSIC_TRACKS.map((music) => {
                const isSelected = musicEnabled && selectedMusic.id === music.id;
                const isPlaying = playingMusicId === music.id;

                return (
                  <div
                    key={music.id}
                    onClick={() => {
                      setMusicEnabled(true);
                      onMusicChange({
                        ...music,
                        musicEnabled: true,
                        sfxEnabled,
                        selectedSfxIds: sfxEnabled ? addedSfxKeys : [],
                      });
                      soundFx.playSfx('click');
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                        : 'bg-[#131926] border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          isSelected
                            ? 'bg-emerald-400 border-emerald-400 text-slate-950'
                            : 'bg-slate-950 border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate">
                            {music.name}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 shrink-0">
                            {music.bpm} BPM
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{music.vibe}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewMusic(music);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Écouter</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volume Slider (0% to 100% + Muet 0% button) */}
          <div className="p-3.5 rounded-xl bg-[#0b0f17] border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="text-slate-200 font-extrabold flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                Volume de la Musique de fond (0% à 100%)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onVolumeChange(0);
                    soundFx.setMusicPreviewVolume(0);
                    soundFx.playSfx('click');
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black border cursor-pointer transition-all ${
                    !musicEnabled || musicVolume === 0
                      ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  🔇 Muet 0%
                </button>
                <span className="font-mono font-black text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                  {musicEnabled ? `${musicVolume}%` : '0%'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-slate-400">0%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                disabled={!musicEnabled}
                value={musicEnabled ? musicVolume : 0}
                onChange={(e) => {
                  const newVol = parseInt(e.target.value, 10);
                  onVolumeChange(newVol);
                  soundFx.setMusicPreviewVolume(newVol);
                }}
                className="flex-1 h-2 bg-slate-800 accent-emerald-400 rounded-lg cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] font-mono text-emerald-400 font-bold">100%</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[0, 5, 10, 20, 35, 50, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    if (pct > 0 && !musicEnabled) {
                      handleToggleMasterMusicEnabled(true);
                    }
                    onVolumeChange(pct);
                    soundFx.setMusicPreviewVolume(pct);
                    soundFx.playSfx('click');
                  }}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-all ${
                    musicEnabled && musicVolume === pct
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {pct === 0 ? '0% Muet' : `${pct}%`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SECTION 3 : GRILLE DE MODÈLES DE SOUS-TITRES (STYLE CAPCUT - 8 CARTES) */}
      {/* ===================================================================== */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        {/* Header + Sub-tabs (Tendance | Classique | NOUVEAU) + Radio Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <Type className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                3. Modèles de Sous-titres (CapCut)
              </h3>
            </div>

            <div className="flex items-center gap-4">
              {SUBTITLE_TABS.map((tab) => {
                const isActive = activeSubtitleTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveSubtitleTab(tab.id);
                      soundFx.playSfx('click');
                    }}
                    className={`relative text-xs font-extrabold pb-1 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'text-white border-cyan-400'
                        : 'text-slate-400 border-transparent hover:text-slate-200'
                    }`}
                  >
                    {tab.isNew ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black tracking-wider">
                        NOUVEAU
                      </span>
                    ) : (
                      <span>{tab.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Checkbox Toggle: [✓] Affichage 1 Mot par 1 Mot (Style Viral Flash : SANS -> DIPLÔME -> JE -> GAGNE) */}
            <button
              type="button"
              onClick={() => {
                const isCurrWordByWord = Boolean(
                  selectedSubtitle.wordByWord ||
                    selectedSubtitle.id === 'word-by-word' ||
                    selectedSubtitle.id === 'viral_1word_flash'
                );
                const nextWordByWord = !isCurrWordByWord;
                if (nextWordByWord) {
                  onSubtitleChange({
                    ...SUBTITLE_STYLES[0],
                    subtitleX: subX,
                    subtitleY: subY,
                    subtitleScale: subScale,
                    coverCompetitorText: subCoverCompetitor,
                    wordByWord: true,
                    hookBannerEnabled: selectedSubtitle.hookBannerEnabled !== false,
                    hookBannerText: selectedSubtitle.hookBannerText,
                    hookBannerBgColor: selectedSubtitle.hookBannerBgColor,
                  });
                } else {
                  onSubtitleChange({
                    ...SUBTITLE_STYLES[1],
                    subtitleX: subX,
                    subtitleY: subY,
                    subtitleScale: subScale,
                    coverCompetitorText: subCoverCompetitor,
                    wordByWord: false,
                    hookBannerEnabled: selectedSubtitle.hookBannerEnabled !== false,
                    hookBannerText: selectedSubtitle.hookBannerText,
                    hookBannerBgColor: selectedSubtitle.hookBannerBgColor,
                  });
                }
                soundFx.playSfx('pop');
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                selectedSubtitle.wordByWord ||
                selectedSubtitle.id === 'word-by-word' ||
                selectedSubtitle.id === 'viral_1word_flash'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <span
                className={`w-4 h-4 rounded flex items-center justify-center border ${
                  selectedSubtitle.wordByWord ||
                  selectedSubtitle.id === 'word-by-word' ||
                  selectedSubtitle.id === 'viral_1word_flash'
                    ? 'bg-amber-400 border-amber-400 text-slate-950'
                    : 'bg-slate-950 border-slate-600 text-transparent'
                }`}
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
              <span>
                Affichage 1 Mot par 1 Mot (Style Viral Flash : SANS → DIPLÔME → JE → GAGNE)
              </span>
            </button>

            {/* Radio Toggle: 🔘 Appliquer à toutes les légendes principales */}
            <button
              type="button"
              onClick={() => {
                setApplyToAllMainCaptions((prev) => !prev);
                soundFx.playSfx('click');
              }}
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer self-start md:self-auto"
            >
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  applyToAllMainCaptions
                    ? 'border-cyan-400 bg-cyan-400/20'
                    : 'border-slate-600 bg-transparent'
                }`}
              >
                {applyToAllMainCaptions && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                )}
              </span>
              <span>Appliquer à toutes les légendes principales</span>
            </button>
          </div>
        </div>

        {/* 8 Square Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {SUBTITLE_STYLES.map((sub) => {
            const isSelected = selectedSubtitle.id === sub.id;
            const isHighlightedTab =
              activeSubtitleTab === 'all' || sub.subTab === activeSubtitleTab;

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  onSubtitleChange({
                    ...sub,
                    subtitleX: subX,
                    subtitleY: subY,
                    subtitleScale: subScale,
                    coverCompetitorText: subCoverCompetitor,
                    hookBannerEnabled: selectedSubtitle.hookBannerEnabled !== false,
                    hookBannerText: selectedSubtitle.hookBannerText,
                    hookBannerBgColor: selectedSubtitle.hookBannerBgColor,
                  });
                  soundFx.playSfx('pop');
                }}
                className={`group relative aspect-[4/3] sm:aspect-square rounded-2xl bg-[#181d28] border-2 p-3 flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-xl shadow-cyan-500/15 bg-[#1b2333]'
                    : isHighlightedTab
                    ? 'border-slate-800 hover:border-slate-600'
                    : 'border-slate-800/50 opacity-85 hover:opacity-100 hover:border-slate-700'
                }`}
              >
                {/* Top-Right Badge: Gratuit (in cyan) or 💎 */}
                {sub.isPro ? (
                  <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-slate-950/80 border border-pink-500/40 text-xs leading-none shadow">
                    💎
                  </div>
                ) : (
                  <div className="absolute top-2.5 right-2.5 text-[11px] font-extrabold text-cyan-400 tracking-wide">
                    Gratuit
                  </div>
                )}

                {/* Selected Check Indicator on Top-Left */}
                {isSelected && (
                  <div className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Exact CapCut Typography Preview */}
                <div className="my-auto flex items-center justify-center w-full px-1 group-hover:scale-105 transition-transform">
                  {renderCapCutSubtitleCardPreview(sub)}
                </div>

                {/* Bottom Subtle Label */}
                <div className="w-full text-center mt-1">
                  <span className="text-[10px] font-semibold text-slate-400 truncate block">
                    {sub.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ================================================================= */}
        {/* DÉPLACER AU DOIGT & ZOOMER LES SOUS-TITRES (50% À 200%) - ÉTAPE 3 */}
        {/* ================================================================= */}
        <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-[#0b0f17] border border-cyan-500/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                Déplacer au doigt & Zoomer les Sous-titres sur l'écran (50% à 200%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 font-bold">
                Position X:{subX}% • Y:{subY}%
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-300 font-bold">
                Taille : {subScale}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Mini 9:16 Interactive Touch Preview to Drag & Pinch-Zoom Subtitles */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div
                ref={step3SubPreviewRef}
                onPointerMove={(e) => {
                  if (!isDraggingSubStep3 || !step3SubPreviewRef.current) return;
                  const rect = step3SubPreviewRef.current.getBoundingClientRect();
                  const nx = Math.round(
                    Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100))
                  );
                  const ny = Math.round(
                    Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100))
                  );
                  updateStep3SubtitleTransform({ subtitleX: nx, subtitleY: ny });
                }}
                onPointerUp={() => setIsDraggingSubStep3(false)}
                onPointerLeave={() => setIsDraggingSubStep3(false)}
                onTouchStart={(e) => {
                  if (e.touches.length === 2) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    step3PinchStartDistRef.current = Math.hypot(dx, dy);
                    step3PinchStartScaleRef.current = subScale;
                  }
                }}
                onTouchMove={(e) => {
                  if (e.touches.length === 2 && step3PinchStartDistRef.current) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const dist = Math.hypot(dx, dy);
                    const ratio = dist / Math.max(10, step3PinchStartDistRef.current);
                    const nextScale = Math.round(
                      Math.max(50, Math.min(200, step3PinchStartScaleRef.current * ratio))
                    );
                    updateStep3SubtitleTransform({ subtitleScale: nextScale });
                  }
                }}
                onTouchEnd={() => {
                  step3PinchStartDistRef.current = null;
                }}
                className="relative w-full max-w-[200px] aspect-[9/16] rounded-2xl overflow-hidden border-2 border-slate-800 bg-gradient-to-b from-slate-900 via-[#131c2e] to-slate-950 shadow-xl select-none touch-none"
              >
                {/* Guide grid lines */}
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/10 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-white/10 pointer-events-none" />

                <div className="absolute top-2 inset-x-2 text-center pointer-events-none">
                  <span className="text-[9px] font-bold text-slate-400 bg-black/50 px-2 py-0.5 rounded-full">
                    Glisse avec le doigt ou pince 🤏
                  </span>
                </div>

                {/* Draggable & Zoomable Subtitle Box */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingSubStep3(true);
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  style={{
                    left: `${subX}%`,
                    top: `${subY}%`,
                    transform: `translate(-50%, -50%) scale(${subScale / 100})`,
                  }}
                  className={`absolute z-20 cursor-grab active:cursor-grabbing px-2.5 py-1.5 rounded-xl transition-shadow ${
                    subCoverCompetitor
                      ? 'bg-[#05080f]/95 border border-cyan-400/60 shadow-2xl'
                      : 'border border-dashed border-cyan-400/70 bg-black/25'
                  }`}
                >
                  {renderCapCutSubtitleCardPreview(selectedSubtitle)}
                </div>
              </div>
            </div>

            {/* Right Controls: Zoom Slider (50% to 200%), -/+ Buttons, Quick Y/X Sliders & Competitor Text Cover */}
            <div className="md:col-span-7 space-y-3.5">
              {/* Zoom / Size Slider (50% to 200%) + - / + buttons */}
              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                    Zoom / Taille des sous-titres (50% à 200%) :
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playSfx('click');
                        updateStep3SubtitleTransform({
                          subtitleScale: Math.max(50, subScale - 10),
                        });
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black cursor-pointer border border-slate-700"
                      title="Réduire la taille (-10%)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 font-mono text-xs font-black text-amber-300 min-w-[54px] text-center">
                      {subScale}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playSfx('click');
                        updateStep3SubtitleTransform({
                          subtitleScale: Math.min(200, subScale + 10),
                        });
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-black cursor-pointer border border-slate-700"
                      title="Agrandir la taille (+10%)"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <input
                  type="range"
                  min={50}
                  max={200}
                  step={5}
                  value={subScale}
                  onChange={(e) =>
                    updateStep3SubtitleTransform({ subtitleScale: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-amber-400"
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  {[75, 100, 125, 150, 175, 200].map((presetScale) => (
                    <button
                      key={presetScale}
                      type="button"
                      onClick={() => {
                        soundFx.playSfx('click');
                        updateStep3SubtitleTransform({ subtitleScale: presetScale });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition-all ${
                        subScale === presetScale
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {presetScale}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Position Y & X Sliders + Quick Presets (Haut / Milieu Anti-Texte Concurrent / Bas) */}
              <div className="p-3.5 rounded-xl bg-[#111827] border border-slate-800 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 font-bold">Position Verticale (Y)</span>
                      <span className="font-mono text-cyan-400 font-bold">{subY}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={subY}
                      onChange={(e) =>
                        updateStep3SubtitleTransform({ subtitleY: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300 font-bold">Position Horizontale (X)</span>
                      <span className="font-mono text-cyan-400 font-bold">{subX}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={subX}
                      onChange={(e) =>
                        updateStep3SubtitleTransform({ subtitleX: parseInt(e.target.value, 10) })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-cyan-400"
                    />
                  </div>
                </div>

                {/* Quick Position Buttons including "Cacher l'ancien texte concurrent au milieu" */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      updateStep3SubtitleTransform({
                        subtitleX: 50,
                        subtitleY: 22,
                        position: 'top',
                      });
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
                      updateStep3SubtitleTransform({
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
                      updateStep3SubtitleTransform({
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

                {/* Checkbox: Fond Noir Couvrant sous le sous-titre */}
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={subCoverCompetitor}
                    onChange={(e) => {
                      soundFx.playSfx('click');
                      updateStep3SubtitleTransform({ coverCompetitorText: e.target.checked });
                    }}
                    className="w-3.5 h-3.5 accent-emerald-400 rounded cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-300">
                    Fond Noir Couvrant sous mes sous-titres (masque à 100 % un ancien texte concurrent situé dessous)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onPrev}
          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.prevStep}</span>
        </button>

        <button
          onClick={onNext}
          className="py-3.5 px-7 rounded-xl font-black text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <span>{t.nextStep} : Caption Mask</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
