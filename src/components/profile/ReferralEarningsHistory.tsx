import React, { useState, useMemo } from 'react';
import {
  Gift,
  Zap,
  Users,
  Search,
  Filter,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  Share2,
  Copy,
  Check,
  Download,
  Clock,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Film,
} from 'lucide-react';
import { UserAccount } from '../../types';
import { soundFx } from '../../utils/audioUtils';

interface ReferralEarningsHistoryProps {
  userAccount: UserAccount;
  onShareLink?: () => void;
  onCopyLink?: () => void;
  copiedLink?: boolean;
}

export type EarningsFilter = 'all' | 'sponsor' | 'referee';

export const ReferralEarningsHistory: React.FC<ReferralEarningsHistoryProps> = ({
  userAccount,
  onShareLink,
  onCopyLink,
  copiedLink = false,
}) => {
  const [filter, setFilter] = useState<EarningsFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Synthesize bonus transactions list (including legacy referredBy if applicable)
  const allEarnings = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      date: string;
      credits: number;
      type: 'sponsor_gain' | 'referee_bonus';
      status: string;
      email?: string;
    }> = [];

    // Add existing recorded referrals
    if (userAccount.referrals && userAccount.referrals.length > 0) {
      userAccount.referrals.forEach((item) => {
        const isReferee = item.type === 'referee_bonus' || item.creditsRewarded === 1;
        list.push({
          id: item.id,
          title: isReferee
            ? (item.referredName || 'Bonus de Bienvenue Parrainage')
            : `Parrainage : ${item.referredName || item.referredEmail.split('@')[0]}`,
          subtitle: isReferee
            ? 'Bonus débloqué grâce à votre code parrain'
            : item.referredEmail,
          date: item.date,
          credits: item.creditsRewarded || (isReferee ? 1 : 3),
          type: isReferee ? 'referee_bonus' : 'sponsor_gain',
          status: 'Crédité & Disponible',
          email: item.referredEmail,
        });
      });
    }

    // If user was referred by someone but no explicit referee item exists in history, synthesize it
    const hasRefereeEntry = list.some((x) => x.type === 'referee_bonus');
    if (userAccount.referredBy && !hasRefereeEntry) {
      list.push({
        id: 'ref_welcome_initial',
        title: `Bonus Filleul (Code ${userAccount.referredBy})`,
        subtitle: 'Validation du code de parrainage lors de l’inscription',
        date: userAccount.memberSince || 'Récemment',
        credits: 1,
        type: 'referee_bonus',
        status: 'Crédité & Disponible',
      });
    }

    return list;
  }, [userAccount]);

  // Filter & search
  const filteredEarnings = useMemo(() => {
    return allEarnings.filter((item) => {
      // Filter by type
      if (filter === 'sponsor' && item.type !== 'sponsor_gain') return false;
      if (filter === 'referee' && item.type !== 'referee_bonus') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSub = item.subtitle.toLowerCase().includes(query);
        const matchesEmail = item.email ? item.email.toLowerCase().includes(query) : false;
        const matchesDate = item.date.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSub && !matchesEmail && !matchesDate) {
          return false;
        }
      }

      return true;
    });
  }, [allEarnings, filter, searchQuery]);

  // Aggregate stats
  const totalEarnedCredits = useMemo(() => {
    return allEarnings.reduce((acc, curr) => acc + curr.credits, 0);
  }, [allEarnings]);

  const sponsorCredits = useMemo(() => {
    return allEarnings
      .filter((x) => x.type === 'sponsor_gain')
      .reduce((acc, curr) => acc + curr.credits, 0);
  }, [allEarnings]);

  const refereeCredits = useMemo(() => {
    return allEarnings
      .filter((x) => x.type === 'referee_bonus')
      .reduce((acc, curr) => acc + curr.credits, 0);
  }, [allEarnings]);

  // Estimated value (1 credit = ~1,50 € / 1 000 FCFA based on TIK plan single video unit value)
  const estimatedSavingsEur = (totalEarnedCredits * 1.5).toFixed(2);
  const estimatedSavingsFcfa = (totalEarnedCredits * 1000).toLocaleString('fr-FR');

  const handleCopySummary = () => {
    soundFx.playSfx('ding');
    const text = `📊 Bilan des Gains Cortia.io :
• Total bonus reçus : +${totalEarnedCredits} crédits
• Amis parrainés : ${userAccount.referralCount || 0}
• Équivalent vidéos offertes : ${totalEarnedCredits} vidéos MP4 HD
• Mon lien de parrainage : ${window.location.origin}/?ref=${userAccount.referralCode || 'CORTIA'}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden">
      {/* Glow backdrop */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-[#0d121d] rounded-[14px] flex items-center justify-center text-amber-400">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Historique des Gains</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Gains Parrainage
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualisation complète de tous les bonus et crédits débloqués grâce au parrainage.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopySummary}
            className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
            title="Copier le récapitulatif des gains"
          >
            {copiedSummary ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Bilan copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copier le bilan</span>
              </>
            )}
          </button>

          {onShareLink && (
            <button
              type="button"
              onClick={onShareLink}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Inviter des amis</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards: Detailed Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Bonus Reçus */}
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Reçu</span>
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            +{totalEarnedCredits}
          </div>
          <p className="text-[10px] text-slate-500">Crédits bonus cumulés</p>
        </div>

        {/* Gains Parrain (+3) */}
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gains Parrain</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            +{sponsorCredits}
          </div>
          <p className="text-[10px] text-slate-500">{userAccount.referralCount || 0} ami(s) validé(s)</p>
        </div>

        {/* Équivalent Vidéos HD */}
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vidéos Offertes</span>
            <Film className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalEarnedCredits}
          </div>
          <p className="text-[10px] text-slate-500">Rendus MP4 100% gratuits</p>
        </div>

        {/* Valeur Économisée */}
        <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Économie Réalisée</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {estimatedSavingsEur} €
          </div>
          <p className="text-[10px] text-slate-500">~{estimatedSavingsFcfa} FCFA économisés</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-[#0b0f17] border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('click');
              setFilter('all');
            }}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tous les gains ({allEarnings.length})
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('click');
              setFilter('sponsor');
            }}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'sponsor'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Gains Parrain (+3)
          </button>
          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('click');
              setFilter('referee');
            }}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filter === 'referee'
                ? 'bg-emerald-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Bonus Filleul (+1)
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, date..."
            className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredEarnings.length > 0 ? (
          <div className="divide-y divide-slate-800/80 bg-[#0b0f17] border border-slate-800 rounded-2xl overflow-hidden">
            {filteredEarnings.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'sponsor_gain'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.type === 'sponsor_gain' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <Gift className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{item.title}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.type === 'sponsor_gain'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        {item.type === 'sponsor_gain' ? 'Parrainage Ami' : 'Bonus Inscription'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{item.subtitle}</span>
                      <span>•</span>
                      <span className="text-slate-500 font-mono text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.date}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pl-13 sm:pl-0">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.status}</span>
                  </span>

                  <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 font-black text-sm font-mono tracking-tight shrink-0">
                    +{item.credits} {item.credits > 1 ? 'crédits' : 'crédit'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="p-8 rounded-2xl bg-[#0b0f17] border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-bold text-white">Aucun gain trouvé</h4>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? `Aucun résultat ne correspond à la recherche "${searchQuery}".`
                  : 'Partage ton lien de parrainage pour recevoir +3 crédits dès la première inscription d’un ami !'}
              </p>
            </div>

            {onCopyLink && (
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Lien copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copier mon lien de parrainage</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer Pro Tip */}
      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-300 leading-relaxed">
          <strong className="text-white">Astuce Croissance :</strong> Vos crédits bonus de parrainage sont utilisables immédiatement pour générer vos scripts, voix-off et vidéos HD finales. Les gains sont <strong className="text-emerald-400">cumulables à l’infini</strong> sans limite d’invitations.
        </p>
      </div>
    </div>
  );
};
