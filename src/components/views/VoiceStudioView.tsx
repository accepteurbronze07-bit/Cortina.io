import React, { useState } from 'react';
import { Mic, Play, Pause, Globe2, Check } from 'lucide-react';
import { AppLanguage, VoiceOption, VoiceCatalogTab } from '../../types';
import { VOICE_OPTIONS } from '../wizard/Step3VoiceSubtitles';
import { soundFx } from '../../utils/audioUtils';

const STUDIO_VOICE_TABS: Array<{ id: VoiceCatalogTab; label: string }> = [
  { id: 'FR', label: 'Français' },
  { id: 'EN', label: 'Anglais' },
  { id: 'ES', label: 'Espagnol' },
  { id: 'PT_BR', label: 'Portugais (Brésil)' },
  { id: 'DE', label: 'Allemand' },
  { id: 'ADS', label: 'Chanson-même / Advertisement' },
];

export const VoiceStudioView: React.FC<{ language: AppLanguage }> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<VoiceCatalogTab>('FR');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [customText, setCustomText] = useState(
    'Bienvenue dans le Voice Studio Cortia. Rédige ton texte ou colle ton script pour générer une voix off IA ultra-réaliste.'
  );
  const [speed, setSpeed] = useState(1.08);
  const [pitch, setPitch] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);

  const visibleVoices = VOICE_OPTIONS.filter((v) => (v.langTab || 'FR') === activeTab);

  const handleTest = async (voiceToPlay: VoiceOption = selectedVoice) => {
    setIsPlaying(true);
    soundFx.playSfx('click');
    try {
      await soundFx.playVoicePreview(
        customText,
        voiceToPlay.geminiVoice,
        voiceToPlay.name,
        speed,
        pitch,
        voiceToPlay.langCode || language.toLowerCase(),
        voiceToPlay.characterPrompt,
        voiceToPlay.id
      );
    } finally {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-black text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30">
            Voice Studio PRO
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">Catalogue Vocal IA Multi-Langues</h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Teste et écoute toutes les voix personnages Cortia (Français, Anglais, Espagnol, Portugais Brésil, Allemand & Publicité) propulsées par Gemini Audio TTS.
        </p>
      </div>

      {/* Language Tabs + Square Voice Cards */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
          <Globe2 className="w-4 h-4 text-cyan-400 shrink-0 mr-1" />
          {STUDIO_VOICE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  soundFx.playSfx('click');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border border-cyan-400/60'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3.5">
          {visibleVoices.map((v) => {
            const isSelected = selectedVoice.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => {
                  setSelectedVoice(v);
                  setSpeed(v.rate);
                  setPitch(v.pitch);
                  handleTest(v);
                }}
                className="group flex flex-col items-center cursor-pointer"
              >
                <div
                  className={`relative w-full aspect-square rounded-2xl bg-[#161b26] border-2 overflow-hidden transition-all ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/20'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={v.avatar}
                    alt={v.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {v.isPro && (
                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-slate-950/85 border border-pink-500/40 flex items-center justify-center">
                      <span className="text-xs leading-none">💎</span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span
                  className={`mt-1.5 text-xs font-bold text-center truncate w-full ${
                    isSelected ? 'text-cyan-400' : 'text-slate-200'
                  }`}
                >
                  {v.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Text Area & Controls */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white uppercase tracking-wider">
            Texte à synthétiser ({selectedVoice.name})
          </label>
          <textarea
            rows={4}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-cyan-500 leading-relaxed font-sans"
          />
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Vitesse de diction</span>
              <span className="font-mono text-cyan-400 font-bold">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-semibold">Hauteur / Tonalité (Pitch)</span>
              <span className="font-mono text-cyan-400 font-bold">{pitch.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleTest(selectedVoice)}
            disabled={isPlaying}
            className="py-3 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-slate-950" />
            )}
            <span>
              {isPlaying
                ? `Lecture (${selectedVoice.name})...`
                : `Générer & Écouter (${selectedVoice.name})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
