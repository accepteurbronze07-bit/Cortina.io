import React from 'react';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Sparkles,
  Flame,
  ArrowRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { AppLanguage } from '../../types';

export const TutorialView: React.FC<{ language: AppLanguage; onStartCreate: () => void }> = ({
  onStartCreate,
}) => {
  const steps = [
    {
      step: 1,
      title: 'Trouver 3 vidéos gagnantes avec fort Hook',
      desc: 'Va sur TikTok ou YouTube Shorts, cherche ton créneau et repère 3 clips ayant dépassé les 300 000 vues.',
      time: '2 min',
    },
    {
      step: 2,
      title: 'Coller les liens et sélectionner le meilleur Hook',
      desc: 'Laisse Cortia extraire les données. Choisis la vidéo avec le début le plus percutant comme clip d’accroche.',
      time: '30 sec',
    },
    {
      step: 3,
      title: 'Activer le Caption Mask pour effacer les anciens textes',
      desc: 'Positionne le masque de floutage sur les anciens sous-titres des concurrents pour éviter la pénalité d’originalité.',
      time: '1 min',
    },
    {
      step: 4,
      title: 'Générer le script viral Gemini et choisir la voix IA',
      desc: 'Notre IA réécrit un script 100% unique calibré à la seconde près. Sélectionne une voix punchy comme Antoine ou Sarah.',
      time: '1 min',
    },
    {
      step: 5,
      title: 'Télécharger et publier aux heures de pic (18h-21h)',
      desc: 'Exporte ton rendu MP4 HD sans filigrane avec les hashtags générés et publie directement sur TikTok & Shorts.',
      time: '30 sec',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Masterclass Vidéo Virale
          </span>
        </div>
        <h2 className="text-2xl font-black text-white">
          Comment atteindre 1 Million de vues avec Cortia
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
          Apprends la formule exacte de remixage vidéo 9:16 utilisée par les plus gros créateurs de contenu pour générer des millions de vues et monétiser chaque mois.
        </p>
      </div>

      {/* Tutorial Steps */}
      <div className="space-y-3">
        {steps.map((st) => (
          <div
            key={st.step}
            className="p-5 rounded-2xl bg-[#0f1522] border border-slate-800 flex items-start gap-4 transition-all hover:border-slate-700"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black text-sm shrink-0">
              {st.step}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">{st.title}</h4>
                <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900">
                  {st.time}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{st.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-2">
        <button
          onClick={onStartCreate}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>Créer ma première vidéo virale maintenant</span>
        </button>
      </div>
    </div>
  );
};
