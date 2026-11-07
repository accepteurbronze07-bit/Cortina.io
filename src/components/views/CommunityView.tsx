import React from 'react';
import { Users, MessageSquare, Send, Trophy, Flame, Sparkles, ExternalLink } from 'lucide-react';
import { AppLanguage } from '../../types';

export const CommunityView: React.FC<{ language: AppLanguage }> = () => {
  const topCreators = [
    { rank: 1, name: 'Lucas_ViralHub', views: '4.8M vues', earnings: '3 840 €', badge: '🥇 Top Creator' },
    { rank: 2, name: 'SarahReels', views: '3.2M vues', earnings: '2 560 €', badge: '🥈 Elite' },
    { rank: 3, name: 'TikTokSecrets_FR', views: '2.7M vues', earnings: '2 160 €', badge: '🥉 Pro' },
    { rank: 4, name: 'AlexBizShorts', views: '1.9M vues', earnings: '1 520 €', badge: 'Pro' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Communauté Créateurs VIP
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">Échange avec 14 000+ créateurs Cortia</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Accède aux canaux privés Discord et Telegram : partages de hooks qui buzzent, nouvelles tendances algorithmiques et retours d'expérience.
        </p>

        <div className="pt-3 flex flex-wrap gap-3">
          <button
            onClick={() => alert('Ouverture du serveur Discord VIP Cortia...')}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Rejoindre le Discord VIP</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>

          <button
            onClick={() => alert('Ouverture du canal Telegram VIP Cortia...')}
            className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Canal Telegram Alertes Trends</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Classement Créateurs de la Semaine
            </h3>
          </div>
          <span className="text-xs text-slate-400">Mis à jour toutes les 24 heures</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {topCreators.map((creator) => (
            <div key={creator.rank} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-xs text-slate-300">
                  #{creator.rank}
                </span>
                <div>
                  <span className="font-bold text-white block">{creator.name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">{creator.badge}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-white block">{creator.views}</span>
                <span className="text-[10px] font-mono text-emerald-400">
                  ~{creator.earnings} gagnés
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
