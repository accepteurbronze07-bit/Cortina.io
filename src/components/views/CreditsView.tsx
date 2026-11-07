import React, { useState } from 'react';
import {
  Zap,
  Check,
  CreditCard,
  History,
  Sparkles,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount, AppLanguage } from '../../types';
import { soundFx } from '../../utils/audioUtils';

interface CreditsViewProps {
  userAccount: UserAccount;
  onUpdateAccount: (account: UserAccount) => void;
  language: AppLanguage;
  authToken?: string;
}

export const CreditsView: React.FC<CreditsViewProps> = ({
  userAccount,
  onUpdateAccount,
  authToken = 'default_owner_token',
}) => {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [successPack, setSuccessPack] = useState<string | null>(null);

  const packs = [
    {
      id: 'pack_10',
      credits: 10,
      priceEUR: '9 €',
      priceFCFA: '6 000 FCFA',
      perCredit: '0,90 € / vidéo',
      popular: false,
    },
    {
      id: 'pack_25',
      credits: 25,
      priceEUR: '19 €',
      priceFCFA: '12 500 FCFA',
      perCredit: '0,76 € / vidéo',
      popular: true,
      badge: 'MEILLEURE VALEUR',
    },
    {
      id: 'pack_100',
      credits: 100,
      priceEUR: '49 €',
      priceFCFA: '32 000 FCFA',
      perCredit: '0,49 € / vidéo',
      popular: false,
    },
  ];

  const handleBuyPack = async (pack: typeof packs[0]) => {
    setIsPurchasing(true);
    soundFx.playSfx('whoosh');

    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          packId: pack.id,
          paymentMethod: 'mobile_money',
          operator: 'orange',
          amountDisplay: pack.priceFCFA,
        }),
      });
      const data = await res.json();
      setIsPurchasing(false);
      setSuccessPack(pack.id);
      soundFx.playSfx('chaching');
      if (data.user) {
        onUpdateAccount(data.user);
      }
      setTimeout(() => setSuccessPack(null), 3000);
    } catch (e) {
      console.error(e);
      setIsPurchasing(false);
    }
  };

  const usageHistory = [
    { id: '1', date: 'Aujourd’hui à 14:22', action: 'Génération vidéo TikTok #729', change: '-1 crédit', balance: `${userAccount.credits}` },
    { id: '2', date: 'Hier à 18:05', action: 'Génération vidéo YouTube Shorts', change: '-1 crédit', balance: `${userAccount.credits + 1}` },
    { id: '3', date: '22 Oct 2026', action: 'Renouvellement mensuel Plan PRO', change: '+75 crédits', balance: '75' },
  ];

  const isUnlimited = Boolean(userAccount.isUnlimited || userAccount.plan === 'ELITE');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Current Balance Banner */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            <Zap className="w-8 h-8 fill-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Solde Disponible Immédiatement
            </span>
            <div className="text-3xl font-black text-white font-mono flex items-baseline gap-2">
              <span>{isUnlimited ? 'Illimité' : `${userAccount.credits} Crédits`}</span>
              {!isUnlimited && (
                <span className="text-xs text-slate-400 font-normal">
                  (sur {userAccount.maxCredits} max)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              1 crédit est déduit uniquement lors de l'assemblage final réussi d'une vidéo HD.
            </p>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <span className="text-slate-400">Plan actif : </span>
          <span className="font-bold text-emerald-400">
            {userAccount.plan ? `Plan ${userAccount.plan}` : 'Gratuit'}
          </span>
        </div>
      </div>

      {successPack && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Vos crédits ont été ajoutés à votre solde avec succès !</span>
        </div>
      )}

      {/* Credit Packs */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Recharger un pack de crédits (sans engagement)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {packs.map((pk) => (
            <div
              key={pk.id}
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                pk.popular
                  ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30'
                  : 'bg-[#0f1522] border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-sm text-white">+{pk.credits} Crédits</span>
                  {pk.badge && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                      {pk.badge}
                    </span>
                  )}
                </div>

                <div className="text-2xl font-black text-white font-mono mb-1">{pk.priceEUR}</div>
                <p className="text-[11px] text-slate-400 font-mono">{pk.priceFCFA}</p>
                <p className="text-[10px] text-amber-400 font-semibold mt-2">{pk.perCredit}</p>
              </div>

              <button
                onClick={() => handleBuyPack(pk)}
                disabled={isPurchasing}
                className="w-full mt-4 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Recharger maintenant</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Usage History */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Historique récent d'utilisation
          </h3>
        </div>

        <div className="divide-y divide-slate-800/80">
          {usageHistory.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-200 block">{item.action}</span>
                <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-bold ${
                    item.change.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {item.change}
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Solde: {item.balance}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
