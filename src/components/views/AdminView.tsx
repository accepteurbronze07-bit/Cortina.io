import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  CreditCard,
  Smartphone,
  Plus,
  Check,
  RefreshCw,
  Crown,
  Sparkles,
  ExternalLink,
  Key,
  Save,
  TrendingUp,
  Search,
  Copy,
  Zap,
  Clock,
  X,
} from 'lucide-react';
import {
  PaymentGatewayConfig,
  PendingManualPayment,
  SubscriptionPlanId,
  UserAccount,
} from '../../types';

interface AdminViewProps {
  authToken: string;
  currentUser: UserAccount;
  onUserUpdated: (updated: UserAccount) => void;
  onPaymentConfigUpdated: (config: PaymentGatewayConfig) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  authToken,
  currentUser,
  onUserUpdated,
  onPaymentConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'payments'>('clients');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingManualPayment[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>({
    activeGateway: 'cinetpay',
    cinetpayApiKey: '',
    cinetpaySiteId: '',
    paydunyaMasterKey: '',
    paydunyaToken: '',
    fedapayPublicKey: '',
    fedapaySecretKey: '',
    orangeMoneyNumber: '+225 07 08 09 10 11',
    moovMoneyNumber: '+225 01 02 03 04 05',
    waveNumber: '+225 07 11 22 33 44',
    mtnMoneyNumber: '+225 05 55 66 77 88',
    paymentLinkTik: '',
    paymentLinkPro: '',
    paymentLinkElite: '',
    creatomateApiKey: '',
    creatomateTemplateId: '',
    makeWebhookUrl: '',
    rapidApiKey: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [customCreditAmount, setCustomCreditAmount] = useState<Record<string, number>>({});
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookFullUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhook/payment`
      : '/api/webhook/payment';

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.users) setUsers(data.users);
      if (Array.isArray(data.pendingPayments)) {
        setPendingPayments(data.pendingPayments);
      }
      if (data.paymentConfig) {
        setPaymentConfig(data.paymentConfig);
        onPaymentConfigUpdated(data.paymentConfig);
      }
    } catch (e) {
      console.error('Failed to load admin overview:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const handleAddCredits = async (userId: string, amount: number, setUnlimited?: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ amount, setUnlimited }),
      });
      const data = await res.json();
      if (data.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        if (data.user.id === currentUser.id) {
          onUserUpdated(data.user);
        }
        showToast(
          setUnlimited
            ? `Crédits illimités (ÉLITE) activés pour ${data.user.email}`
            : `${amount >= 0 ? `+${amount}` : amount} crédits appliqués à ${data.user.email}`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePlan = async (userId: string, plan: SubscriptionPlanId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
        if (data.user.id === currentUser.id) {
          onUserUpdated(data.user);
        }
        showToast(
          `Plan ${plan} activé (${
            plan === 'TIK' ? '+25 crédits' : plan === 'PRO' ? '+75 crédits' : 'Illimité'
          }) pour ${data.user.email}`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1-Click Approval of Manual Orange Money / Moov Money / Wave Payment
  const handleApproveManualPayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        if (data.users) setUsers(data.users);
        if (data.pendingPayments) setPendingPayments(data.pendingPayments);
        if (data.user && data.user.id === currentUser.id) {
          onUserUpdated(data.user);
        }
        showToast(
          `Paiement Mobile Money validé en 1 clic ! Compte ${data.user?.email} crédité (${
            data.creditsAdded === 'UNLIMITED' ? 'Illimité ÉLITE' : `+${data.creditsAdded} crédits`
          }).`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectManualPayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.pendingPayments) {
        setPendingPayments(data.pendingPayments);
        showToast('Demande de paiement refusée.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger /api/webhook/payment directly for CinetPay / FedaPay testing or instant gateway credit
  const handleTriggerWebhookPayment = async (
    planId: 'TIK' | 'PRO' | 'ELITE',
    gateway: 'CinetPay' | 'FedaPay',
    targetUser?: UserAccount
  ) => {
    const userToCredit = targetUser || currentUser;
    try {
      const res = await fetch('/api/webhook/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId: userToCredit.id,
          email: userToCredit.email,
          planId,
          gateway,
          operator: 'Orange Money / Moov Money',
          amountDisplay:
            planId === 'ELITE'
              ? '50 000 FCFA'
              : planId === 'PRO'
              ? '24 000 FCFA'
              : '11 000 FCFA',
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        if (data.user.id === currentUser.id) {
          onUserUpdated(data.user);
        }
        showToast(
          `Webhook ${gateway} (/api/webhook/payment) exécuté : ${
            planId === 'ELITE'
              ? 'Crédits ILLIMITÉS'
              : planId === 'PRO'
              ? '+75 crédits (PRO)'
              : '+25 crédits (TIK)'
          } ajoutés à ${data.user.email} !`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(paymentConfig),
      });
      const data = await res.json();
      if (data.paymentConfig) {
        setPaymentConfig(data.paymentConfig);
        onPaymentConfigUpdated(data.paymentConfig);
        showToast('Configuration CinetPay / FedaPay & Numéros Orange/Moov enregistrée !');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingConfig(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePendingList = pendingPayments.filter((p) => p.status === 'pending');
  const activeSubscribersCount = users.filter((u) => u.plan !== null).length;
  const totalVideosCreated = users.reduce((acc, u) => acc + (u.creations?.length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#111722] border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Panneau Administrateur SaaS</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Propriétaire
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gérez vos clients inscrits (1 crédit gratuit de bienvenue), validez les paiements Mobile Money en 1 clic et configurez CinetPay / FedaPay.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'clients'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                : 'bg-[#0b0f17] text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clients inscrits ({users.length})</span>
            {activePendingList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                {activePendingList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                : 'bg-[#0b0f17] text-slate-300 border border-slate-800 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Money & API</span>
          </button>
          <button
            onClick={fetchOverview}
            className="p-2.5 rounded-xl bg-[#0b0f17] border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* Pending Manual Mobile Money Transfers Queue (1-Click Admin Validation) */}
      {activePendingList.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">
                Paiements Mobile Money Manuels en attente de validation 1-clic (
                {activePendingList.length})
              </h3>
            </div>
            <span className="text-[11px] font-bold text-amber-300">
              Orange Money / Moov Money / Wave Direct
            </span>
          </div>

          <div className="space-y-2">
            {activePendingList.map((item) => (
              <div
                key={item.id}
                className="bg-[#0b0f17] border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-white">{item.userEmail}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] uppercase">
                      Plan {item.planId} (
                      {item.planId === 'TIK'
                        ? '+25 crédits'
                        : item.planId === 'PRO'
                        ? '+75 crédits'
                        : 'Illimité'}
                      )
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {item.amountDisplay}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Opérateur : <strong className="text-white uppercase">{item.operator}</strong> •
                    Numéro client : <strong className="text-amber-300">{item.senderPhone}</strong> •
                    Réf : <span className="font-mono">{item.transactionRef}</span> • {item.createdAt}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproveManualPayment(item.id)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      Valider en 1 clic (
                      {item.planId === 'TIK'
                        ? '+25'
                        : item.planId === 'PRO'
                        ? '+75'
                        : 'Illimité'}
                      )
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectManualPayment(item.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                    title="Refuser"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111722] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Clients Inscrits</p>
            <p className="text-2xl font-extrabold text-white mt-1">{users.length}</p>
            <p className="text-[11px] text-emerald-400">1 crédit gratuit attribué à l’inscription</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#111722] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Abonnements Actifs</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">
              {activeSubscribersCount}
            </p>
            <p className="text-[11px] text-slate-400">TIK (+25) • PRO (+75) • ÉLITE (Illimité)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#111722] border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">Passerelle Mobile Money</p>
            <p className="text-lg font-extrabold text-white mt-1 uppercase">
              {paymentConfig.activeGateway}
            </p>
            <p className="text-[11px] text-slate-500">
              {totalVideosCreated} vidéos générées au total
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {activeTab === 'clients' ? (
        <div className="bg-[#111722] border border-slate-800/80 rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-white">
                Liste des clients & Validation Mobile Money en 1 clic
              </h2>
              <p className="text-xs text-slate-400">
                Ajoutez des crédits ou validez un paiement Orange Money / Moov Money / CinetPay / FedaPay en 1 clic (+25 TIK, +75 PRO, Illimité ÉLITE).
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un email ou nom..."
                className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-3">Client</th>
                  <th className="py-3 px-3">Abonnement</th>
                  <th className="py-3 px-3">Solde Crédits</th>
                  <th className="py-3 px-3">Valider / Ajouter Crédits en 1 clic</th>
                  <th className="py-3 px-3">Activer Offre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredUsers.map((u) => {
                  const uid = u.id || u.email;
                  return (
                    <tr key={uid} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white">{u.email}</span>
                          {u.role === 'admin' && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Admin
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-emerald-400">
                            ·{' '}
                            {u.authProvider === 'google'
                              ? 'Google / Gmail'
                              : u.authProvider === 'facebook'
                              ? 'Facebook'
                              : u.authProvider === 'tiktok'
                              ? 'TikTok'
                              : 'Email'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {u.name} • {u.creations?.length || 0} vidéo(s) • Inscrit le {u.memberSince}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {u.plan ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              u.plan === 'ELITE'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : u.plan === 'PRO'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            {u.plan} ({u.billingCycle === 'annual' ? 'Annuel' : 'Mensuel'})
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[11px]">
                            Essai (1 crédit)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        {u.isUnlimited || u.plan === 'ELITE' ? (
                          <span className="inline-flex items-center gap-1 font-extrabold text-amber-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            Illimité (ÉLITE)
                          </span>
                        ) : (
                          <span
                            className={`font-extrabold text-sm ${
                              u.credits <= 0 ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {u.credits} crédit{u.credits > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => handleAddCredits(uid, 1)}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer transition-colors"
                            title="Ajouter 1 crédit de test"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleAddCredits(uid, 25)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            +25 (TIK)
                          </button>
                          <button
                            onClick={() => handleAddCredits(uid, 75)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            +75 (PRO)
                          </button>
                          <button
                            onClick={() => handleAddCredits(uid, 9999, true)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            Illimité (ÉLITE)
                          </button>
                          <div className="flex items-center gap-1 ml-1">
                            <input
                              type="number"
                              placeholder="Nb"
                              value={customCreditAmount[uid] ?? ''}
                              onChange={(e) =>
                                setCustomCreditAmount((prev) => ({
                                  ...prev,
                                  [uid]: Number(e.target.value),
                                }))
                              }
                              className="w-14 bg-[#0b0f17] border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white"
                            />
                            <button
                              onClick={() => {
                                const val = customCreditAmount[uid];
                                if (val) handleAddCredits(uid, val);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                              title="Ajouter montant personnalisé"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1">
                          {(['TIK', 'PRO', 'ELITE'] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => handleChangePlan(uid, p)}
                              className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                u.plan === p
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-[#0b0f17] border border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSavePaymentConfig}
          className="bg-[#111722] border border-slate-800/80 rounded-2xl p-6 space-y-6"
        >
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Configuration Passerelles CinetPay / FedaPay & Numéros Directs (Orange Money / Moov Money)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Reliez vos boutons d’achat aux passerelles CinetPay / FedaPay (avec crédit automatique via <code className="text-emerald-400">/api/webhook/payment</code>) et renseignez vos numéros Orange Money / Moov Money directs.
            </p>
          </div>

          {/* Active Webhook Endpoint & 1-Click CinetPay / FedaPay Purchase Buttons */}
          <div className="p-4 rounded-2xl bg-[#0b101b] border border-emerald-500/35 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                  URL Webhook de Confirmation Automatique (CinetPay & FedaPay)
                </span>
                <p className="text-xs text-slate-400">
                  Ajoute automatiquement <strong>+25 crédits (TIK)</strong>, <strong>+75 crédits (PRO)</strong> ou <strong>Illimité (ÉLITE)</strong> dès réception du paiement.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300">
                  {webhookFullUrl}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookFullUrl);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copié' : 'Copier'}</span>
                </button>
              </div>
            </div>

            {/* Direct Gateway Purchase / Test Buttons in Admin -> Mobile Money & API */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300">
                Tester / Créditer via Passerelle CinetPay ou FedaPay :
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerWebhookPayment('TIK', 'CinetPay')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Achat CinetPay TIK (+25 crédits)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerWebhookPayment('PRO', 'CinetPay')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500 text-emerald-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Achat CinetPay PRO (+75 crédits)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerWebhookPayment('ELITE', 'FedaPay')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Achat FedaPay ÉLITE (Illimité)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Gateway Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Passerelle de paiement principale affichée aux clients
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'cinetpay', label: 'CinetPay (Orange / Moov / Wave / CB)' },
                { id: 'fedapay', label: 'FedaPay (Mobile Money & Cartes)' },
                { id: 'direct_momo', label: 'Numéros Directs Orange / Moov (1-clic)' },
                { id: 'paydunya', label: 'PayDunya (Mobile Money)' },
              ].map((gw) => (
                <button
                  type="button"
                  key={gw.id}
                  onClick={() =>
                    setPaymentConfig((prev) => ({
                      ...prev,
                      activeGateway: gw.id as PaymentGatewayConfig['activeGateway'],
                    }))
                  }
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                    paymentConfig.activeGateway === gw.id
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : 'bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {gw.label}
                </button>
              ))}
            </div>
          </div>

          {/* Direct Mobile Money Merchant Numbers (Orange Money / Moov Money / Wave / MTN) */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              Numéros Directs Orange Money / Moov Money / Wave (Paiements manuels validables en 1 clic)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  🟠 Numéro Orange Money Direct (Marchand / Admin)
                </label>
                <input
                  type="text"
                  value={paymentConfig.orangeMoneyNumber}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, orangeMoneyNumber: e.target.value })
                  }
                  placeholder="+225 07 08 09 10 11"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  🔵 Numéro Moov Money Direct (Marchand / Admin)
                </label>
                <input
                  type="text"
                  value={paymentConfig.moovMoneyNumber}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, moovMoneyNumber: e.target.value })
                  }
                  placeholder="+225 01 02 03 04 05"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  🌊 Numéro Wave Direct
                </label>
                <input
                  type="text"
                  value={paymentConfig.waveNumber}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, waveNumber: e.target.value })
                  }
                  placeholder="+225 07 11 22 33 44"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  🟡 Numéro MTN Mobile Money Direct
                </label>
                <input
                  type="text"
                  value={paymentConfig.mtnMoneyNumber}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, mtnMoneyNumber: e.target.value })
                  }
                  placeholder="+225 05 55 66 77 88"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* API Keys (CinetPay / FedaPay) */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              Clés API Passerelles (CinetPay & FedaPay)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CinetPay API Key
                </label>
                <input
                  type="text"
                  value={paymentConfig.cinetpayApiKey}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, cinetpayApiKey: e.target.value })
                  }
                  placeholder="Ex: 129083109283109283..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CinetPay Site ID
                </label>
                <input
                  type="text"
                  value={paymentConfig.cinetpaySiteId}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, cinetpaySiteId: e.target.value })
                  }
                  placeholder="Ex: 589201"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  FedaPay Public Key
                </label>
                <input
                  type="text"
                  value={paymentConfig.fedapayPublicKey}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, fedapayPublicKey: e.target.value })
                  }
                  placeholder="pk_live_..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  FedaPay Secret Key
                </label>
                <input
                  type="password"
                  value={paymentConfig.fedapaySecretKey || ''}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, fedapaySecretKey: e.target.value })
                  }
                  placeholder="sk_live_..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Direct Payment Links */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              Liens de paiement directs (CinetPay / FedaPay / Wave Business)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lien Plan TIK (17€ / 11 000 FCFA)
                </label>
                <input
                  type="url"
                  value={paymentConfig.paymentLinkTik || ''}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, paymentLinkTik: e.target.value })
                  }
                  placeholder="https://pay.cinetpay.com/..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lien Plan PRO (37€ / 24 000 FCFA)
                </label>
                <input
                  type="url"
                  value={paymentConfig.paymentLinkPro || ''}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, paymentLinkPro: e.target.value })
                  }
                  placeholder="https://pay.cinetpay.com/..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Lien Plan ÉLITE (77€ / 50 000 FCFA)
                </label>
                <input
                  type="url"
                  value={paymentConfig.paymentLinkElite || ''}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, paymentLinkElite: e.target.value })
                  }
                  placeholder="https://pay.fedapay.com/..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Creatomate, Make.com & RapidAPI Integration */}
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Intégration Montage Cloud Creatomate, Make.com & Extraction TikTok
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Clé API Creatomate
                </label>
                <input
                  type="text"
                  value={paymentConfig.creatomateApiKey || ''}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, creatomateApiKey: e.target.value })
                  }
                  placeholder="Ex: d8a7f9e0c1b2a3..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Template ID Creatomate
                </label>
                <input
                  type="text"
                  value={paymentConfig.creatomateTemplateId || ''}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, creatomateTemplateId: e.target.value })
                  }
                  placeholder="Ex: 8f3d21a0-5b2e-4f1c-9a8d-..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  URL Webhook Make.com
                </label>
                <input
                  type="url"
                  value={paymentConfig.makeWebhookUrl || ''}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, makeWebhookUrl: e.target.value })
                  }
                  placeholder="https://hook.eu1.make.com/..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Clé RapidAPI TikTok (Optionnel — TikWM actif par défaut)
                </label>
                <input
                  type="text"
                  value={paymentConfig.rapidApiKey || ''}
                  onChange={(e) =>
                    setPaymentConfig({ ...paymentConfig, rapidApiKey: e.target.value })
                  }
                  placeholder="Optionnel : clé X-RapidAPI-Key"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              {savingConfig
                ? 'Enregistrement...'
                : 'Enregistrer la configuration Mobile Money & API'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

