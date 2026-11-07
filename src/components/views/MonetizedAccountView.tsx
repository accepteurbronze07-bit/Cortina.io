import React from 'react';
import {
  BadgeDollarSign,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount, AppLanguage } from '../../types';
import { PredictiveEngagementTool } from '../dashboard/PredictiveEngagementTool';
import { RoiCalculatorWidget } from '../dashboard/RoiCalculatorWidget';

interface MonetizedAccountViewProps {
  userAccount: UserAccount;
  language: AppLanguage;
}

export const MonetizedAccountView: React.FC<MonetizedAccountViewProps> = ({
  userAccount,
}) => {

  const eligibilityChecklist = [
    { label: 'Âge minimum requis (18 ans et plus)', status: true },
    { label: 'Au moins 10 000 abonnés sur le compte TikTok', status: true },
    { label: 'Au moins 100 000 vues au cours des 30 derniers jours', status: true },
    { label: 'Vidéos de plus d’une minute (60s+) pour déclencher la rémunération', status: true },
    { label: 'Masquage des sous-titres concurrents (Caption Mask) actif', status: true },
    { label: 'Voix-off originale par IA et nouvelle bande-son', status: true },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            <BadgeDollarSign className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-white">Programme TikTok Creator Rewards</h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                100% ÉLIGIBLE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Optimise tes vidéos pour toucher entre 0.60€ et 1.20€ par tranche de 1 000 vues qualifiées.
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-right">
          <span className="text-slate-400 block text-[10px]">RPM Moyen Projeté</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">~0.85 € / 1K vues</span>
        </div>
      </div>

      {/* Interactive Creator ROI Calculator */}
      <RoiCalculatorWidget />

      {/* Predictive Engagement Analyzer using Gemini */}
      <PredictiveEngagementTool />

      {/* Eligibility Checklist */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Checklist d'Originalité & Conformité Anti-Grève
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {eligibilityChecklist.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
