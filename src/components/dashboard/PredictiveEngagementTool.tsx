import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  Gauge,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Clock,
  Film,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Target,
  BarChart3,
  Sliders,
  Share2,
} from 'lucide-react';
import { soundFx } from '../../utils/audioUtils';

interface PredictiveAnalysisResult {
  scoreOverall: number;
  hookPowerScore: number;
  retentionScore: number;
  shareabilityScore: number;
  predictedCompletionRate: string;
  predictedViralPotential: string;
  estimatedRPM: string;
  wordCount: number;
  estimatedDurationSec: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  timelineChecklist: Record<
    string,
    { status: 'excellent' | 'good' | 'warning'; label: string; feedback: string }
  >;
  improvedHookSuggestion?: string;
}

const SAMPLE_SCRIPTS = [
  {
    name: 'Piscine & Devis Abusif ($15 000)',
    niche: 'Rénovation & Piscine',
    text: `Avant de scroller, regarde ce devis à 15 000 dollars qu'un artisan peu scrupuleux a donné à cette cliente affolée. On a vidé le bassin, et là, stupéfaction totale : le plâtre est fissuré et le fond est tapissé de coquillages séchés. Attends, regarde bien ce qu'on découvre sous le skimmer principal ! 95 % des propriétaires pensent qu'il faut tout casser, mais c'est une énorme bêtise. Un seul mauvais coup de truelle et le liner est fichu pour toujours. Regarde comment notre artisan lisse la couche de Shell Blend avec une précision chirurgicale. Tu ne vas pas croire le résultat final : un blanc perlé impeccable avec une eau turquoise cristalline. Toi, tu aurais payé 15 000 dollars pour ça ? Donne ton avis en commentaire et abonne-toi pour la partie 2 !`,
  },
  {
    name: 'Secret Artisanal & Plâtre Sec',
    niche: 'Artisanat & Bricolage',
    text: `Attends deux secondes avant de swiper, parce que ce que tu vois ici va te faire économiser des milliers d'euros. Regarde ce mur de briques complètement rongé par l'humidité. La plupart des gens appliquent une simple couche d'enduit et s'étonnent que tout s'effondre six mois plus tard. Mais attends, regarde bien l'astuce secrète de notre maçon : il prépare un mélange spécial de chaux hydraulique et de sable tamisé. Une seule seconde d'inattention et la prise est ratée. Regarde le lissage à la taloche, c'est ultra satisfaisant. Le mur est maintenant plus solide qu'au premier jour. Aurais-tu tenté de le faire toi-même ? Dis-moi en commentaire et lâche un follow !`,
  },
];

export const PredictiveEngagementTool: React.FC<{
  initialScript?: string;
  onApplyScript?: (script: string) => void;
}> = ({ initialScript = '', onApplyScript }) => {
  const [scriptText, setScriptText] = useState(initialScript || SAMPLE_SCRIPTS[0].text);
  const [platform, setPlatform] = useState<'tiktok' | 'youtube_shorts' | 'reels'>('tiktok');
  const [topic, setTopic] = useState('Rénovation & Viral');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PredictiveAnalysisResult | null>(null);
  const [copiedHook, setCopiedHook] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round((wordCount / 165) * 60);

  const handleAnalyze = async () => {
    if (!scriptText.trim() || scriptText.trim().length < 15) {
      setErrorMsg('Veuillez entrer un script d’au moins 15 caractères.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);
    soundFx.playSfx('whoosh');

    try {
      const res = await fetch('/api/script/predict-engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptText,
          topic,
          platform,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.analysis) {
        throw new Error(data.error || 'Erreur lors de l’analyse.');
      }

      setAnalysis(data.analysis);
      soundFx.playSfx('cash');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Impossible de joindre le service prédictif Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyHook = (text: string) => {
    soundFx.playSfx('ding');
    navigator.clipboard.writeText(text);
    setCopiedHook(true);
    setTimeout(() => setCopiedHook(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 70) return 'text-teal-400 border-teal-500/40 bg-teal-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 85) return 'from-emerald-400 via-teal-400 to-emerald-500';
    if (score >= 70) return 'from-teal-400 to-emerald-400';
    if (score >= 50) return 'from-amber-400 to-yellow-500';
    return 'from-rose-500 to-amber-500';
  };

  return (
    <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Glow backdrop */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-[#0d121d] rounded-[14px] flex items-center justify-center text-emerald-400">
              <Gauge className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">
                Analyse Prédictive d'Engagement IA
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulez la performance algorithmique (rétention 60s, hook score et RPM prévisionnel) avant le tournage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Calibré Monétisation 61s</span>
          </span>
        </div>
      </div>

      {/* Preset script chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          Tester un scénario type en 1 clic :
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_SCRIPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                soundFx.playSfx('click');
                setScriptText(sample.text);
                setTopic(sample.niche);
              }}
              className="py-1.5 px-3 rounded-xl bg-[#0b0f17] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{sample.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Script Input & Controls */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-300 block">
            Script vidéo à auditer :
          </label>

          <div className="flex items-center gap-2">
            {/* Platform selector */}
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as any)}
              className="bg-[#0b0f17] border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="tiktok">Plateforme : TikTok</option>
              <option value="youtube_shorts">Plateforme : YouTube Shorts</option>
              <option value="reels">Plateforme : Instagram Reels</option>
            </select>

            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <strong className="text-emerald-400">{wordCount}</strong> mots • ~
              <strong className="text-white">{estimatedSeconds}s</strong>
            </span>
          </div>
        </div>

        <textarea
          rows={5}
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
          placeholder="Collez ici votre script ou votre accroche vidéo..."
          className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-2xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden leading-relaxed font-sans"
        />

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 pt-1">
          <p className="text-[11px] text-slate-500">
            Objectif recommandé : 160 à 180 mots pour franchir le cap des 60s TikTok Creator Rewards.
          </p>

          <button
            type="button"
            disabled={isLoading || wordCount < 5}
            onClick={handleAnalyze}
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Audit Gemini en cours...</span>
              </>
            ) : (
              <>
                <Gauge className="w-4 h-4 stroke-[2.5]" />
                <span>Auditer l'Engagement Vidéo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6 pt-4 border-t border-slate-800/80 animate-in fade-in duration-200">
          {/* Top Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Overall Score */}
            <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 relative overflow-hidden space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Score Global d'Engagement
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${getScoreGradient(
                    analysis.scoreOverall
                  )}`}
                >
                  {analysis.scoreOverall}
                </span>
                <span className="text-xs text-slate-500 font-bold">/ 100</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <Flame className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Potentiel : {analysis.predictedViralPotential}</span>
              </div>
            </div>

            {/* Hook Power (0-3s) */}
            <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Puissance du Hook (0-3s)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {analysis.hookPowerScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${analysis.hookPowerScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Capacité à stopper net le scroll des utilisateurs
              </p>
            </div>

            {/* Retention Score (60s) */}
            <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rétention 60s Estimée
                </span>
                <span className="text-xs font-mono font-bold text-teal-400">
                  {analysis.retentionScore}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full"
                  style={{ width: `${analysis.retentionScore}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500">
                Complétion projetée : {analysis.predictedCompletionRate}
              </p>
            </div>

            {/* RPM Projeté */}
            <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                RPM Monétisation Estimé
              </span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {analysis.estimatedRPM}
              </div>
              <p className="text-[10px] text-slate-500">
                Par 1 000 vues qualifiées TikTok Creator Rewards
              </p>
            </div>
          </div>

          {/* Timeline Psychologique d'Engagement (0s -> 61s) */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chronologie Psychologique des Re-Hooks (Structure Haute Rétention)</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">Structure 61s calibrée</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
              {Object.entries(analysis.timelineChecklist || {}).map(([key, item], idx) => (
                <div
                  key={key}
                  className={`p-3 rounded-xl border flex flex-col justify-between text-xs space-y-1.5 ${
                    item.status === 'excellent'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : item.status === 'good'
                      ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Étape {idx + 1}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.status === 'excellent'
                          ? 'bg-emerald-400'
                          : item.status === 'good'
                          ? 'bg-teal-400'
                          : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <span className="font-bold text-white text-[11px] block">{item.label}</span>
                  <span className="text-[10px] text-slate-400 leading-tight block">
                    {item.feedback}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 space-y-2.5">
              <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Points Forts Détectés par l'Algorithme</span>
              </h4>
              <ul className="space-y-2">
                {analysis.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations & Weaknesses */}
            <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 space-y-2.5">
              <h4 className="text-xs font-black text-amber-400 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span>Conseils de Gemini pour Booster la Rétention</span>
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improved Hook Suggestion */}
          {analysis.improvedHookSuggestion && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Hook Optimisé par Gemini 3.8 Flash :
                </span>
                <p className="text-xs text-slate-100 font-semibold italic">
                  "{analysis.improvedHookSuggestion}"
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyHook(analysis.improvedHookSuggestion || '')}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedHook ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier le Hook</span>
                    </>
                  )}
                </button>

                {onApplyScript && (
                  <button
                    type="button"
                    onClick={() => {
                      if (analysis.improvedHookSuggestion) {
                        onApplyScript(analysis.improvedHookSuggestion);
                      }
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Appliquer</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
