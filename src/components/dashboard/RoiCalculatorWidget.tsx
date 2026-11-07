import React, { useState, useId } from 'react';
import {
  Calculator,
  TrendingUp,
  BadgeDollarSign,
  Zap,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  PieChart,
  Crown,
  HelpCircle,
  BarChart3,
  Layers,
} from 'lucide-react';
import { soundFx } from '../../utils/audioUtils';
import { toast } from '../toast/ToastContext';

type CurrencyType = 'EUR' | 'FCFA' | 'USD';

interface NicheTier {
  id: string;
  label: string;
  baseRpmEur: number;
  badge: string;
  examples: string;
}

const NICHE_TIERS: NicheTier[] = [
  {
    id: 'finance_business',
    label: 'Finance, Immo & Business',
    baseRpmEur: 1.85,
    badge: '💎 RPM Élite',
    examples: 'Investissement, cryptos, devis travaux, revente',
  },
  {
    id: 'renovation_craft',
    label: 'Rénovation, Piscine & Bricolage',
    baseRpmEur: 1.25,
    badge: '🔥 Fort RPM',
    examples: 'Sauvetage piscine, nettoyage extrême, plâtre, artisanat',
  },
  {
    id: 'mystery_curiosity',
    label: 'Mystère, Faits & Découvertes',
    baseRpmEur: 0.85,
    badge: '⚡ Volume Viral',
    examples: 'Secrets engloutis, faits historiques, anomalies',
  },
  {
    id: 'entertainment_lifestyle',
    label: 'Divertissement & Lifestyle',
    baseRpmEur: 0.55,
    badge: '🌟 Grand Public',
    examples: 'Humour, vlogs, défis viraux, réactions',
  },
];

interface PlanOption {
  id: 'TIK' | 'PRO' | 'ELITE';
  label: string;
  costEur: number;
  creditsLabel: string;
}

const PLANS: PlanOption[] = [
  { id: 'TIK', label: 'Offre TIK', costEur: 17, creditsLabel: '25 vidéos/mois' },
  { id: 'PRO', label: 'Offre PRO', costEur: 37, creditsLabel: '75 vidéos/mois' },
  { id: 'ELITE', label: 'Offre ÉLITE', costEur: 77, creditsLabel: 'Illimité' },
];

export const RoiCalculatorWidget: React.FC = () => {
  const [currency, setCurrency] = useState<CurrencyType>('EUR');
  const [videoVolume, setVideoVolume] = useState<number>(30); // 30 videos / month (1/day)
  const [avgViewsPerVideo, setAvgViewsPerVideo] = useState<number>(75000); // 75k views / video
  const [engagementRate, setEngagementRate] = useState<number>(8.5); // 8.5%
  const [selectedNicheId, setSelectedNicheId] = useState<string>('renovation_craft');
  const [selectedPlanId, setSelectedPlanId] = useState<'TIK' | 'PRO' | 'ELITE'>('PRO');
  const [copied, setCopied] = useState<boolean>(false);

  // Currency converter multipliers
  const FX = {
    EUR: 1,
    FCFA: 655.957,
    USD: 1.08,
  };

  const selectedNiche =
    NICHE_TIERS.find((n) => n.id === selectedNicheId) || NICHE_TIERS[1];
  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[1];

  // Mathematical ROI Model
  // 1. Total Monthly Views
  const totalViews = videoVolume * avgViewsPerVideo;

  // 2. Qualified Monetized Views (~82% of views exceed 60s completion for Creator Rewards)
  const qualifiedViews = Math.round(totalViews * 0.82);

  // 3. Engagement algorithmic multiplier
  // Baseline is 5% engagement. Above 5%, TikTok algorithm ranks video in higher tier ads
  // +4% RPM bonus per +1% of engagement above 5%
  const engagementDelta = engagementRate - 5.0;
  const engagementBoostPct = Math.max(-20, Math.min(80, Math.round(engagementDelta * 4.5)));
  const effectiveRpmEur = Number((selectedNiche.baseRpmEur * (1 + engagementBoostPct / 100)).toFixed(2));

  // 4. Gross Estimated Monthly Revenue (EUR)
  const grossMonthlyEur = (qualifiedViews / 1000) * effectiveRpmEur;

  // 5. Software Investment Cost (EUR)
  const softwareCostEur = selectedPlan.costEur;

  // 6. Net Profit (EUR)
  const netMonthlyEur = Math.max(0, grossMonthlyEur - softwareCostEur);
  const netAnnualEur = netMonthlyEur * 12;

  // 7. Multiplier & ROI %
  const roiMultiplier = softwareCostEur > 0 ? (grossMonthlyEur / softwareCostEur).toFixed(1) : '1.0';
  const roiPercentage = softwareCostEur > 0 ? Math.round(((grossMonthlyEur - softwareCostEur) / softwareCostEur) * 100) : 0;

  // 8. Break-even analysis (videos required to amortize Cortia subscription)
  const grossPerVideoEur = videoVolume > 0 ? grossMonthlyEur / videoVolume : 0;
  const breakEvenVideos = grossPerVideoEur > 0 ? Math.max(1, Math.ceil(softwareCostEur / grossPerVideoEur)) : 1;

  // Formatting helpers
  const formatMoney = (amountEur: number) => {
    const val = amountEur * FX[currency];
    if (currency === 'FCFA') {
      return `${Math.round(val).toLocaleString('fr-FR')} FCFA`;
    }
    if (currency === 'USD') {
      return `$${Math.round(val).toLocaleString('fr-FR')}`;
    }
    return `${Math.round(val).toLocaleString('fr-FR')} €`;
  };

  const handleApplyPreset = (preset: {
    videos: number;
    views: number;
    engagement: number;
    niche: string;
    plan: 'TIK' | 'PRO' | 'ELITE';
  }) => {
    soundFx.playSfx('pop');
    setVideoVolume(preset.videos);
    setAvgViewsPerVideo(preset.views);
    setEngagementRate(preset.engagement);
    setSelectedNicheId(preset.niche);
    setSelectedPlanId(preset.plan);
  };

  const handleCopySummary = () => {
    soundFx.playSfx('ding');
    const summary = `📊 PROJECTION ROI CRÉATEUR - CORTIA VIDEO STUDIO
• Rythme : ${videoVolume} vidéos/mois (~${(videoVolume / 4).toFixed(0)} vidéos/semaine)
• Vues moyennes / vidéo : ${avgViewsPerVideo.toLocaleString('fr-FR')} vues
• Vues totales mensuelles : ${totalViews.toLocaleString('fr-FR')} (${qualifiedViews.toLocaleString('fr-FR')} qualifiées)
• Taux d'engagement moyen : ${engagementRate}% (Bonus RPM : ${engagementBoostPct >= 0 ? '+' : ''}${engagementBoostPct}%)
• Thématique / RPM Effectif : ${selectedNiche.label} (~${effectiveRpmEur}€ / 1K vues)
--------------------------------------------------
💰 Revenus Bruts Estimés : ${formatMoney(grossMonthlyEur)} / mois
⚡ Coût Abonnement Cortia : ${formatMoney(softwareCostEur)} / mois (${selectedPlan.label})
🚀 Bénéfice NET Estimé : ${formatMoney(netMonthlyEur)} / mois (${formatMoney(netAnnualEur)} / an)
📈 Multiplicateur de ROI : x${roiMultiplier} (+${roiPercentage}% de retour)
⏱️ Amorti dès la ${breakEvenVideos}e vidéo produite !`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success('Simulation et calcul de ROI copiés dans le presse-papiers !', 'Projection Copiée');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-[#0f1522] border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/25">
            <Calculator className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Calculatrice de ROI & Rentabilité</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Creator Rewards & Reels
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulez précisément vos gains nets selon votre volume de production et votre engagement
            </p>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#070a0f] border border-slate-800 self-end sm:self-auto">
          {(['EUR', 'FCFA', 'USD'] as CurrencyType[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                soundFx.playSfx('click');
                setCurrency(c);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                currency === c
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c === 'FCFA' ? 'FCFA' : c === 'EUR' ? 'EUR (€)' : 'USD ($)'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Presets Strip */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Scénarios Prédéfinis selon votre profil de créateur :
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                videos: 12,
                views: 25000,
                engagement: 5.5,
                niche: 'mystery_curiosity',
                plan: 'TIK',
              })
            }
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer"
          >
            <span className="text-xs font-bold text-white block">🥉 Débutant</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">12 vidéos • 25K vues</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                videos: 30,
                views: 75000,
                engagement: 8.5,
                niche: 'renovation_craft',
                plan: 'PRO',
              })
            }
            className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-left transition-all cursor-pointer ring-1 ring-emerald-500/20"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 block">🥈 Régulier</span>
              <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/15 px-1 rounded">Top</span>
            </div>
            <span className="text-[10px] text-slate-300 block mt-0.5">30 vidéos • 75K vues</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                videos: 60,
                views: 160000,
                engagement: 12.0,
                niche: 'renovation_craft',
                plan: 'PRO',
              })
            }
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer"
          >
            <span className="text-xs font-bold text-white block">🥇 Créateur Pro</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">60 vidéos • 160K vues</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleApplyPreset({
                videos: 90,
                views: 350000,
                engagement: 15.5,
                niche: 'finance_business',
                plan: 'ELITE',
              })
            }
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer"
          >
            <span className="text-xs font-bold text-white block">👑 Agence / Élite</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">90 vidéos • 350K vues</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Inputs Sliders vs Results Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Slider 1: Video Volume */}
          <div className="p-4 rounded-2xl bg-[#070a0f] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                Volume de vidéos créées par mois :
              </span>
              <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {videoVolume} vidéos / mois ({Math.round((videoVolume / 30) * 10) / 10} / jour)
              </span>
            </div>
            <input
              type="range"
              min="4"
              max="120"
              step="2"
              value={videoVolume}
              onChange={(e) => setVideoVolume(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>4 vidéos (~1/sem)</span>
              <span>30 vidéos (1/jour)</span>
              <span>60 vidéos (2/jour)</span>
              <span>120 vidéos</span>
            </div>
          </div>

          {/* Slider 2: Average Views per video */}
          <div className="p-4 rounded-2xl bg-[#070a0f] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                Vues moyennes estimées par vidéo :
              </span>
              <span className="font-mono text-sm font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {avgViewsPerVideo.toLocaleString('fr-FR')} vues
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="1000000"
              step="10000"
              value={avgViewsPerVideo}
              onChange={(e) => setAvgViewsPerVideo(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>10K vues</span>
              <span>100K vues</span>
              <span>500K vues</span>
              <span>1M vues</span>
            </div>
          </div>

          {/* Slider 3: Engagement Rate (%) */}
          <div className="p-4 rounded-2xl bg-[#070a0f] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Taux d'engagement moyen (Likes, Partages, Comms) :
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Un fort engagement booste votre RPM effectif de{' '}
                  <strong className={engagementBoostPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                    {engagementBoostPct >= 0 ? `+${engagementBoostPct}%` : `${engagementBoostPct}%`}
                  </strong>
                </span>
              </div>
              <span className="font-mono text-sm font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                {engagementRate.toFixed(1)} %
              </span>
            </div>
            <input
              type="range"
              min="2.0"
              max="22.0"
              step="0.5"
              value={engagementRate}
              onChange={(e) => setEngagementRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>2% (Faible)</span>
              <span>6% (Standard)</span>
              <span>10% (Très bon)</span>
              <span>20%+ (Ultra-viral)</span>
            </div>
          </div>

          {/* Niche & Category Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              Thématique de contenu & RPM de la niche :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NICHE_TIERS.map((niche) => {
                const isSelected = selectedNicheId === niche.id;
                return (
                  <button
                    key={niche.id}
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      setSelectedNicheId(niche.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                        : 'bg-[#070a0f] border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-extrabold text-white">{niche.label}</span>
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          {niche.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{niche.examples}</p>
                    </div>
                    <span className="mt-2 text-[11px] font-mono font-bold text-emerald-300">
                      Base ~{niche.baseRpmEur}€ / 1K vues
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subscription Plan selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">
              Formule d'abonnement Cortia sélectionnée :
            </span>
            <div className="grid grid-cols-3 gap-2">
              {PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      setSelectedPlanId(plan.id);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                        : 'bg-[#070a0f] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-white block">{plan.label}</span>
                    <span className="text-[11px] font-mono font-bold text-amber-300 block mt-0.5">
                      {formatMoney(plan.costEur)} / mois
                    </span>
                    <span className="text-[9px] text-slate-400 block">{plan.creditsLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Projected Returns & ROI Metrics (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-gradient-to-b from-[#132822] via-[#0d181e] to-[#070a0f] border-2 border-emerald-500/60 shadow-2xl space-y-5 text-center relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Bénéfice Net Mensuel Projeté</span>
            </div>

            {/* Giant Net Profit Figure */}
            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight drop-shadow-md">
                {formatMoney(netMonthlyEur)}
              </div>
              <span className="text-xs text-emerald-300 font-bold block">
                Soit {formatMoney(netAnnualEur)} de bénéfice net par an
              </span>
            </div>

            {/* KPI Badges Row */}
            <div className="grid grid-cols-2 gap-2 pt-2 text-left">
              <div className="p-3 rounded-2xl bg-[#070a0f]/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Multiplicateur ROI</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  x{roiMultiplier}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">
                  +{roiPercentage}% retour
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-[#070a0f]/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Amortissement</span>
                <span className="text-base font-black text-cyan-300 font-mono block">
                  Dès la {breakEvenVideos}e vidéo
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-bold">
                  sur {videoVolume} créées
                </span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs text-left">
              <div className="flex justify-between items-center text-slate-300">
                <span>Vues qualifiées 60s+ :</span>
                <span className="font-mono font-bold text-white">
                  {qualifiedViews.toLocaleString('fr-FR')} vues
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>RPM effectif (boost engagement inclus) :</span>
                <span className="font-mono font-bold text-emerald-400">
                  {effectiveRpmEur} € / 1K vues
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Revenus bruts estimés :</span>
                <span className="font-mono font-bold text-white">
                  {formatMoney(grossMonthlyEur)}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-400">
                <span>Coût logiciel Cortia ({selectedPlan.label}) :</span>
                <span className="font-mono text-rose-400 font-semibold">
                  - {formatMoney(softwareCostEur)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-black">
                <span className="text-emerald-300">Marge NETTE mensuelle :</span>
                <span className="font-mono text-emerald-400 text-sm">
                  {formatMoney(netMonthlyEur)}
                </span>
              </div>
            </div>

            {/* Visual Margin Bar */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Ratio Coût / Marge Net</span>
                <span className="text-emerald-400">
                  {grossMonthlyEur > 0 ? `${Math.round((netMonthlyEur / grossMonthlyEur) * 100)}% de marge nette` : '100%'}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-rose-500"
                  style={{
                    width: `${Math.min(100, (softwareCostEur / (grossMonthlyEur || 1)) * 100)}%`,
                  }}
                  title="Coût logiciel Cortia"
                />
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{
                    width: `${Math.max(0, 100 - (softwareCostEur / (grossMonthlyEur || 1)) * 100)}%`,
                  }}
                  title="Bénéfice Net"
                />
              </div>
            </div>

            {/* Copy Projection CTA */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Projection ROI copiée !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier ma projection financière</span>
                </>
              )}
            </button>
          </div>

          {/* Algorithmic Engagement Tip */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
            <span className="font-extrabold text-amber-300 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Impact du Taux d'Engagement sur votre ROI
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              En maintenant un engagement à <strong>{engagementRate}%</strong> (grâce aux relances et hooks Cortia), l'algorithme Creator Rewards augmente la rétention au-delà de 60s, ce qui génère un bonus de{' '}
              <strong className="text-emerald-400">
                {engagementBoostPct >= 0 ? `+${engagementBoostPct}%` : `${engagementBoostPct}%`}
              </strong>{' '}
              sur votre rémunération par mille vues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
