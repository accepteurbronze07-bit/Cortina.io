import React, { useState } from 'react';
import {
  Check,
  Crown,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Flame,
  X,
  Smartphone,
  ExternalLink,
  Zap,
  Clock,
} from 'lucide-react';
import { UserAccount, AppLanguage, PaymentGatewayConfig } from '../../types';
import { translations } from '../../locales/translations';
import { soundFx } from '../../utils/audioUtils';

interface SubscriptionViewProps {
  userAccount: UserAccount;
  onUpdateAccount: (account: UserAccount) => void;
  language: AppLanguage;
  authToken?: string;
  paymentConfig?: PaymentGatewayConfig;
  initialCheckoutPlan?: 'TIK' | 'PRO' | 'ELITE' | null;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  userAccount,
  onUpdateAccount,
  language,
  authToken = 'default_owner_token',
  paymentConfig,
  initialCheckoutPlan = null,
}) => {
  const t = translations[language] || translations.FR;
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'EUR' | 'FCFA'>('FCFA');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<
    'TIK' | 'PRO' | 'ELITE' | null
  >(initialCheckoutPlan);

  // Payment gateway & method state
  const [selectedGateway, setSelectedGateway] = useState<'cinetpay' | 'fedapay' | 'direct_momo'>(
    paymentConfig?.activeGateway === 'fedapay'
      ? 'fedapay'
      : paymentConfig?.activeGateway === 'manual' || paymentConfig?.activeGateway === 'direct_momo'
      ? 'direct_momo'
      : 'cinetpay'
  );
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card'>('mobile_money');
  const [momoProvider, setMomoProvider] = useState<'orange' | 'moov' | 'wave' | 'mtn'>('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+225');
  const [manualTxRef, setManualTxRef] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [manualPendingSubmitted, setManualPendingSubmitted] = useState(false);
  const [transactionRef, setTransactionRef] = useState<string>('');

  const plans = [
    {
      id: 'TIK' as const,
      name: 'TIK',
      badge: 'DÉMARRAGE',
      description: 'Idéal pour débuter sur TikTok et tester l’algorithme de remix.',
      priceEUR: billingCycle === 'annual' ? 14 : 17,
      priceFCFA: billingCycle === 'annual' ? 9500 : 11000,
      videosCount: '25 vidéos / mois (+25 crédits)',
      features: [
        '25 rendus vidéos HD par mois (+25 crédits)',
        'Caption Mask basique',
        '5 Voix IA standards',
        'Rendu 720×1280 HD vertical 9:16',
        'Musiques tendances incluses',
        'Support standard sous 24h',
      ],
      cta: 'Souscrire au plan TIK (+25 crédits)',
      popular: false,
    },
    {
      id: 'PRO' as const,
      name: 'PRO',
      badge: 'LE PLUS POPULAIRE',
      description: 'Le combo gagnant pour les créateurs qui veulent percer et monétiser.',
      priceEUR: billingCycle === 'annual' ? 31 : 37,
      priceFCFA: billingCycle === 'annual' ? 20000 : 24000,
      videosCount: '75 vidéos / mois (+75 crédits)',
      features: [
        '75 rendus vidéos Ultra-HD par mois (+75 crédits)',
        'Script Viral IA illimité (Gemini Flash)',
        'Voice Studio PRO complet (toutes les voix humaines)',
        'Caption Mask avancé (floutage Haut/Bas TikTok Pro)',
        'Rendu ultra-rapide sans filigrane',
        'Accès communauté créateurs VIP',
        'Audit d’originalité TikTok automatique',
      ],
      cta: 'Passer au Plan PRO (+75 crédits)',
      popular: true,
    },
    {
      id: 'ELITE' as const,
      name: 'ÉLITE',
      badge: 'PUISSANCE MAXIMALE',
      description: 'Pour les agences et créateurs full-time qui gèrent plusieurs comptes.',
      priceEUR: billingCycle === 'annual' ? 65 : 77,
      priceFCFA: billingCycle === 'annual' ? 42000 : 50000,
      videosCount: 'Vidéos & Crédits Illimités',
      features: [
        'Vidéos & Montages ILLIMITÉS',
        'Priorité absolue sur les serveurs de rendu GPU',
        'Toutes les voix Ultra-HD & Clonage vocal',
        'Accompagnement Compte Monétisé Express',
        'Exportation sous-titres .ASS et rushs',
        'Support direct VIP WhatsApp 7j/7',
        'Garantie monétisation 30 jours',
      ],
      cta: 'Débloquer le Plan ÉLITE (Illimité)',
      popular: false,
    },
  ];

  const handleOpenCheckout = (
    planId: 'TIK' | 'PRO' | 'ELITE',
    preferredGateway?: 'cinetpay' | 'fedapay' | 'direct_momo'
  ) => {
    soundFx.playSfx('ding');
    if (preferredGateway) {
      setSelectedGateway(preferredGateway);
    }
    setSelectedPlanForCheckout(planId);
    setPaymentSuccess(false);
    setManualPendingSubmitted(false);
  };

  // Process payment via /api/webhook/payment (for CinetPay / FedaPay) or /api/payments/manual-momo (for direct Orange/Moov manual validation)
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForCheckout) return;

    setIsProcessingPayment(true);
    soundFx.playSfx('whoosh');

    const selectedPlanObj = plans.find((p) => p.id === selectedPlanForCheckout);
    const amountDisplay =
      currency === 'EUR'
        ? `${selectedPlanObj?.priceEUR} €`
        : `${selectedPlanObj?.priceFCFA.toLocaleString('fr-FR')} FCFA`;

    try {
      if (selectedGateway === 'direct_momo') {
        // Submit manual Mobile Money transfer request for 1-click Admin validation
        const res = await fetch('/api/payments/manual-momo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            planId: selectedPlanForCheckout,
            billingCycle,
            operator: momoProvider,
            senderPhone: `${countryCode} ${phoneNumber}`,
            transactionRef: manualTxRef || undefined,
            amountDisplay,
          }),
        });
        await res.json();
        setIsProcessingPayment(false);
        setManualPendingSubmitted(true);
        soundFx.playSfx('ding');
        return;
      }

      // CinetPay / FedaPay gateway confirmation -> calls /api/webhook/payment which automatically credits +25 (TIK), +75 (PRO), or Unlimited (ELITE)
      const res = await fetch('/api/webhook/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId: userAccount.id,
          email: userAccount.email,
          planId: selectedPlanForCheckout,
          billingCycle,
          gateway: selectedGateway === 'fedapay' ? 'FedaPay' : 'CinetPay',
          paymentMethod,
          operator: paymentMethod === 'mobile_money' ? momoProvider : 'visa_mastercard',
          phoneNumber:
            paymentMethod === 'mobile_money' ? `${countryCode} ${phoneNumber}` : undefined,
          amountDisplay,
        }),
      });
      const data = await res.json();
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      soundFx.playSfx('chaching');
      if (data.invoice?.id) {
        setTransactionRef(data.invoice.id);
      }
      if (data.user) {
        onUpdateAccount(data.user);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setIsProcessingPayment(false);
    }
  };

  const getConfiguredMerchantNumber = () => {
    if (!paymentConfig) return '+225 07 00 00 00 00';
    if (momoProvider === 'orange') return paymentConfig.orangeMoneyNumber || '+225 07 00 00 00 00';
    if (momoProvider === 'moov') return paymentConfig.moovMoneyNumber || '+225 01 00 00 00 00';
    if (momoProvider === 'wave') return paymentConfig.waveNumber || '+225 05 00 00 00 00';
    return paymentConfig.mtnMoneyNumber || '+225 05 00 00 00 00';
  };

  const getDirectPaymentLink = () => {
    if (!paymentConfig || !selectedPlanForCheckout) return '';
    if (selectedPlanForCheckout === 'TIK') return paymentConfig.paymentLinkTik;
    if (selectedPlanForCheckout === 'PRO') return paymentConfig.paymentLinkPro;
    if (selectedPlanForCheckout === 'ELITE') return paymentConfig.paymentLinkElite;
    return '';
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Formules & Abonnements Cortia
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          Débloque tes crédits vidéos avec Mobile Money ou Carte
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Paiement instantané sécurisé via <strong>CinetPay</strong>, <strong>FedaPay</strong> (Orange Money, Moov Money, Wave, Visa/Mastercard) ou transfert direct.
        </p>

        {/* Currency and Billing Controls */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          {/* Monthly / Annual switch */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => {
                soundFx.playSfx('click');
                setBillingCycle('monthly');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.monthly}
            </button>
            <button
              onClick={() => {
                soundFx.playSfx('click');
                setBillingCycle('annual');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{t.annual}</span>
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                -15%
              </span>
            </button>
          </div>

          {/* Currency Toggle (EUR / FCFA) */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => {
                soundFx.playSfx('click');
                setCurrency('EUR');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currency === 'EUR'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EUR (€)
            </button>
            <button
              onClick={() => {
                soundFx.playSfx('click');
                setCurrency('FCFA');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currency === 'FCFA'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              FCFA (XOF)
            </button>
          </div>
        </div>
      </div>

      {/* 3 Plans Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((p) => {
          const isCurrentPlan =
            userAccount.plan === p.id && (userAccount.credits > 1 || userAccount.isUnlimited);
          const displayPrice =
            currency === 'EUR' ? `${p.priceEUR}€` : `${p.priceFCFA.toLocaleString('fr-FR')} FCFA`;

          return (
            <div
              key={p.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                p.popular
                  ? 'bg-gradient-to-b from-[#132223] via-[#0f1725] to-[#0d121d] border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 ring-2 ring-emerald-500/20 md:-translate-y-2'
                  : 'bg-[#0f1522] border border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Popular Badge */}
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-slate-950" /> {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black tracking-wider uppercase text-slate-400">
                    {p.name}
                  </span>
                  {isCurrentPlan && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      PLAN ACTIF
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="mb-3">
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-baseline gap-1">
                    <span>{displayPrice}</span>
                    <span className="text-xs font-normal text-slate-400">/ mois</span>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">{p.videosCount}</p>
                </div>

                <p className="text-xs text-slate-400 mb-6 leading-relaxed">{p.description}</p>

                {/* Features List */}
                <div className="space-y-3 pt-4 border-t border-slate-800/80 mb-6">
                  {p.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Main CTA + CinetPay / FedaPay Quick Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleOpenCheckout(p.id, 'cinetpay')}
                  className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    p.popular
                      ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 text-slate-950 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/30 active:scale-[0.98]'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>{p.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout(p.id, 'cinetpay')}
                    className="py-2 px-2.5 rounded-lg bg-[#0b101b] hover:bg-slate-900 border border-emerald-500/30 text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3 h-3 text-emerald-400" />
                    <span>CinetPay</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCheckout(p.id, 'fedapay')}
                    className="py-2 px-2.5 rounded-lg bg-[#0b101b] hover:bg-slate-900 border border-cyan-500/30 text-[11px] font-bold text-cyan-300 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <CreditCard className="w-3 h-3 text-cyan-400" />
                    <span>FedaPay</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment Methods Guarantee */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-5 text-center shadow-lg space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Passerelles CinetPay, FedaPay & Transfert Direct Mobile Money connectées à{' '}
          <span className="font-mono text-emerald-400">/api/webhook/payment</span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-300 pt-1">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-400">
            🟠 Orange Money ({paymentConfig?.orangeMoneyNumber || '+225 07 00 00 00 00'})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-sky-400">
            🔵 Moov Money ({paymentConfig?.moovMoneyNumber || '+225 01 00 00 00 00'})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-400">
            🌊 Wave ({paymentConfig?.waveNumber || '+225 05 00 00 00 00'})
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
            ⚡ CinetPay / FedaPay
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-blue-400">
            💳 Visa / Mastercard
          </span>
        </div>
      </div>

      {/* Interactive Checkout Modal (CinetPay / FedaPay / Direct Orange & Moov Mobile Money & Card) */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111724] border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative space-y-5 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedPlanForCheckout(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {paymentSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Paiement Confirmé & Crédité !</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Ton compte est maintenant activé sur le{' '}
                    <strong>Plan {selectedPlanForCheckout}</strong> via{' '}
                    <strong>{selectedGateway.toUpperCase()}</strong>.{' '}
                    {selectedPlanForCheckout === 'ELITE'
                      ? 'Tes crédits sont désormais ILLIMITÉS.'
                      : selectedPlanForCheckout === 'PRO'
                      ? '+75 crédits ont été ajoutés automatiquement à ton solde.'
                      : '+25 crédits ont été ajoutés automatiquement à ton solde.'}
                  </p>
                  {transactionRef && (
                    <p className="text-[11px] font-mono text-emerald-400 mt-2">
                      Référence Webhook : {transactionRef}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPlanForCheckout(null)}
                  className="py-3 px-8 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/30 cursor-pointer"
                >
                  Continuer vers le Studio ({userAccount.isUnlimited ? 'Illimité' : `${userAccount.credits} crédits`})
                </button>
              </div>
            ) : manualPendingSubmitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Transfert Mobile Money Enregistré !
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Ta notification de transfert vers le numéro marchand{' '}
                    <strong>{getConfiguredMerchantNumber()}</strong> pour le{' '}
                    <strong>Plan {selectedPlanForCheckout}</strong> a été envoyée. Dès validation en 1 clic par l’administrateur, tes crédits (
                    {selectedPlanForCheckout === 'ELITE'
                      ? 'Illimité'
                      : selectedPlanForCheckout === 'PRO'
                      ? '+75 crédits'
                      : '+25 crédits'}
                    ) seront activés sur ton compte.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPlanForCheckout(null)}
                  className="py-3 px-8 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">
                        Souscrire au Plan {selectedPlanForCheckout}
                      </h3>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                        {selectedPlanForCheckout === 'TIK'
                          ? '+25 crédits'
                          : selectedPlanForCheckout === 'PRO'
                          ? '+75 crédits'
                          : 'Illimité'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Montant ({billingCycle === 'annual' ? 'Annuel -15%' : 'Mensuel'}) :{' '}
                      <span className="font-bold text-emerald-400 font-mono">
                        {currency === 'EUR'
                          ? `${plans.find((p) => p.id === selectedPlanForCheckout)?.priceEUR} €`
                          : `${plans
                              .find((p) => p.id === selectedPlanForCheckout)
                              ?.priceFCFA.toLocaleString('fr-FR')} FCFA`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Gateway Selector: CinetPay | FedaPay | Transfert Direct Orange/Moov */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Passerelle de paiement
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('cinetpay')}
                      className={`py-2.5 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        selectedGateway === 'cinetpay'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚡ CinetPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('fedapay')}
                      className={`py-2.5 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        selectedGateway === 'fedapay'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      💳 FedaPay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGateway('direct_momo');
                        setPaymentMethod('mobile_money');
                      }}
                      className={`py-2.5 px-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        selectedGateway === 'direct_momo'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      📲 Numéro Direct
                    </button>
                  </div>
                </div>

                {/* Payment Method Switcher (Mobile Money vs Card) */}
                {selectedGateway !== 'direct_momo' && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mobile_money')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'mobile_money'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Mobile Money</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Visa / Mastercard</span>
                    </button>
                  </div>
                )}

                {/* Form fields based on selected method */}
                {paymentMethod === 'mobile_money' || selectedGateway === 'direct_momo' ? (
                  <div className="space-y-3 pt-1">
                    {/* Operator selector: Orange Money, Moov Money, Wave, MTN */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'orange', label: 'Orange Money' },
                        { id: 'moov', label: 'Moov Money' },
                        { id: 'wave', label: 'Wave' },
                        { id: 'mtn', label: 'MTN MoMo' },
                      ].map((op) => (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() =>
                            setMomoProvider(op.id as 'orange' | 'moov' | 'wave' | 'mtn')
                          }
                          className={`py-2.5 px-2 rounded-lg border text-[11px] font-bold transition-all text-center cursor-pointer ${
                            momoProvider === op.id
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>

                    {/* Merchant number display configured by Admin */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-300">
                        Numéro marchand <strong>{momoProvider.toUpperCase()}</strong> :
                      </span>
                      <span className="font-mono font-black text-emerald-400">
                        {getConfiguredMerchantNumber()}
                      </span>
                    </div>

                    {/* Phone input with country code */}
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-white"
                      >
                        <option value="+225">🇨🇮 +225 (CI)</option>
                        <option value="+221">🇸🇳 +221 (SN)</option>
                        <option value="+226">🇧🇫 +226 (BF)</option>
                        <option value="+223">🇲🇱 +223 (ML)</option>
                        <option value="+229">🇧🇯 +229 (BJ)</option>
                        <option value="+228">🇹🇬 +228 (TG)</option>
                        <option value="+237">🇨🇲 +237 (CM)</option>
                        <option value="+242">🇨🇬 +242 (CG)</option>
                      </select>

                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Votre numéro Mobile Money (ex: 07 00 00 00 00)"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
                      />
                    </div>

                    {selectedGateway === 'direct_momo' && (
                      <input
                        type="text"
                        value={manualTxRef}
                        onChange={(e) => setManualTxRef(e.target.value)}
                        placeholder="Référence SMS du transfert (Optionnel — ex: MP2610...)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 font-mono"
                      />
                    )}

                    <p className="text-[11px] text-slate-400">
                      {selectedGateway === 'direct_momo'
                        ? `Envoyez le montant sur le numéro ${momoProvider.toUpperCase()} ci-dessus puis validez : l'Admin activera vos crédits en 1 clic.`
                        : `Paiement instantané via ${selectedGateway.toUpperCase()} : votre compte sera crédité automatiquement de ${
                            selectedPlanForCheckout === 'TIK'
                              ? '+25 crédits'
                              : selectedPlanForCheckout === 'PRO'
                              ? '+75 crédits'
                              : 'Crédits illimités'
                          }.`}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="Numéro de carte Visa / Mastercard (16 chiffres)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 font-mono"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / AA"
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 font-mono"
                      />
                      <input
                        type="text"
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        placeholder="CVV (3 chiffres)"
                        className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {getDirectPaymentLink() && (
                  <a
                    href={getDirectPaymentLink()}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      Ouvrir le lien de paiement externe ({selectedGateway.toUpperCase()})
                    </span>
                  </a>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="w-full py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>Validation du paiement sécurisé...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {selectedGateway === 'direct_momo'
                          ? 'J’ai effectué le transfert Mobile Money →'
                          : `Payer via ${selectedGateway.toUpperCase()} & Débloquer mes crédits`}
                      </span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

