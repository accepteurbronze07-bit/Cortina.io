export interface AiAvatarPreset {
  id: string;
  name: string;
  style: string;
  badge: string;
  prompt: string;
  imageSrc: string;
  description: string;
}

export const AI_AVATAR_PRESETS: AiAvatarPreset[] = [
  {
    id: 'cyber_creator',
    name: 'Cyberpunk Studio Pro',
    style: 'Rendu 3D Futuriste',
    badge: '⚡ Tendance 2026',
    prompt: 'Tech video creator with glowing studio headphones, neon emerald & teal rim light',
    imageSrc: '/src/assets/images/creator_avatar_cyber_1793963428734.jpg',
    description: 'Casque studio néon émeraude, interface de montage et ambiance cyberpunk.',
  },
  {
    id: 'pixar_creator',
    name: 'Créateur 3D Pixar',
    style: 'Animation 3D Stylisée',
    badge: '🌟 Populaire',
    prompt: 'Pixar style digital content creator with wireless headset, warm lighting',
    imageSrc: '/src/assets/images/creator_avatar_pixar_1793963430354.jpg',
    description: 'Style 3D expressif et chaleureux, micro-casque sans fil et studio feutré.',
  },
  {
    id: 'cinema_director',
    name: 'Réalisateur Cinéma',
    style: 'Cinématique Studio 4K',
    badge: '🎬 Pro Film',
    prompt: 'Charismatic filmmaker close-up portrait with cinematic studio lights and camera bokeh',
    imageSrc: '/src/assets/images/creator_avatar_cinema_1793963431247.jpg',
    description: 'Éclairage cinéma professionnel, caméra de tournage en arrière-plan et regard confiant.',
  },
  {
    id: 'anime_viral',
    name: 'Anime Viral Master',
    style: 'Digital Anime Art',
    badge: '🔥 Rétention TikTok',
    prompt: 'Anime style portrait of viral video editor wearing headphones and hoodie in creative studio',
    imageSrc: '/src/assets/images/creator_avatar_anime_1793963430971.jpg',
    description: 'Illustration anime moderne, sweat créateur et studio néon multi-écrans.',
  },
];
