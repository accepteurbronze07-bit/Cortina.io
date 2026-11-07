import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Send,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  RotateCcw,
  Search,
  Zap,
  ArrowRight,
  ShieldCheck,
  Film,
  Mic,
  Loader2,
} from 'lucide-react';
import { AppLanguage } from '../../types';
import { soundFx } from '../../utils/audioUtils';

interface SupportModalProps {
  language: AppLanguage;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'gemini' | 'knowledge_base';
}

const SUGGESTED_QUESTIONS = [
  {
    icon: '✂️',
    label: 'Réussir le Hook (Étape 1)',
    prompt: 'Comment réussir le découpage du Hook dans les 3 premières secondes pour stopper le swipe ?',
  },
  {
    icon: '🛡️',
    label: 'Caption Mask anti-strike',
    prompt: 'Comment fonctionne le Caption Mask en Étape 2 pour éviter le strike de non-originalité TikTok ?',
  },
  {
    icon: '🎙️',
    label: 'Meilleures voix IA',
    prompt: 'Quelles sont les meilleures voix IA pour le marché US, Espagnol et Français ?',
  },
  {
    icon: '⚡',
    label: 'Export ultra-rapide en 3s',
    prompt: 'Comment exporter ma vidéo sans sous-titres en moins de 3 secondes avec 100% de la qualité d’origine ?',
  },
  {
    icon: '🎁',
    label: 'Gagner des crédits parrainage',
    prompt: 'Comment fonctionne le système de parrainage pour gagner +3 crédits bonus par ami inscrit ?',
  },
  {
    icon: '💳',
    label: 'Annulation en 1 clic',
    prompt: 'Comment annuler mon abonnement sans préavis ou payer par Mobile Money ?',
  },
];

const INITIAL_FAQS = [
  {
    category: 'Montage & Originalité',
    q: 'Comment Cortia protège-t-il contre le strike de non-originalité ?',
    a: 'Cortia utilise le Caption Mask pour cacher les écrits des concurrents, réagence le montage en découpant le meilleur Hook, ajoute une voix IA inédite avec nouveau script Gemini et mixe une nouvelle bande-son. Le contenu résultant est considéré comme une œuvre dérivée 100% originale par les algorithmes de détection.',
    quickPrompt: 'Donne-moi 3 astuces pour être certain que ma vidéo soit validée par le TikTok Creator Rewards Program.',
  },
  {
    category: 'Rendu & Export',
    q: 'Combien de temps prend le rendu d’une vidéo finale ?',
    a: 'Grâce aux optimisations FFmpeg ultra-rapides (-preset ultrafast), le rendu avec sous-titres animés prend moins de 60 secondes en 720p/1080p. Si vous choisissez l’option "Sans sous-titres", la vidéo est exportée en copie de flux directe (-c copy) en moins de 3 secondes !',
    quickPrompt: 'Quelle est la différence de temps et de qualité entre le mode avec sous-titres et le mode sans sous-titres ?',
  },
  {
    category: 'Paiements & Abonnements',
    q: 'Les paiements Mobile Money sont-ils instantanés ?',
    a: 'Oui, via Orange Money, Wave, MTN MoMo et Moov Money, la validation se fait immédiatement après confirmation de votre code secret sur votre téléphone. Vos crédits ou votre plan PRO sont activés en quelques secondes.',
    quickPrompt: 'Quels sont les opérateurs Mobile Money supportés en Côte d’Ivoire, Sénégal et Afrique de l’Ouest ?',
  },
  {
    category: 'Engagement & Résiliation',
    q: 'Puis-je annuler mon abonnement sans préavis ?',
    a: 'Absolument. Conformément à notre politique "Annuler en 1 clic" sur la page Profil, vous pouvez résilier à tout moment sans aucun frais. Vous conserverez vos crédits restants jusqu’à la fin du mois en cours.',
    quickPrompt: 'Que se passe-t-il avec mes crédits si j’annule mon abonnement aujourd’hui ?',
  },
  {
    category: 'Parrainage & Bonus',
    q: 'Comment fonctionne le parrainage et combien de crédits puis-je gagner ?',
    a: 'Chaque utilisateur dispose d’un lien et code de parrainage unique dans son profil. Vous gagnez +3 crédits bonus à chaque nouvel ami qui s’inscrit, et votre ami reçoit +1 crédit bonus gratuit dès son arrivée. Les gains sont cumulables sans aucune limite.',
    quickPrompt: 'Comment partager mon lien de parrainage sur WhatsApp pour maximiser mes inscriptions ?',
  },
];

export const SupportModal: React.FC<SupportModalProps> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<'ai_chat' | 'faq_guide' | 'contact_ticket'>('ai_chat');

  // FAQ Accordion & Search state
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');

  // Interactive Gemini Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      text: "👋 Bonjour ! Je suis l'assistant IA de **Cortia Video Studio** propulsé par **Gemini 3.8 Flash**.\n\nJe suis entraîné pour vous guider sur toutes les étapes de montage, l'astuce anti-strike **Caption Mask**, le choix des **voix-off Speechma**, les **sous-titres animés** et la monétisation.\n\nPosez-moi votre question ou cliquez sur une suggestion ci-dessous !",
      timestamp: 'À l’instant',
      source: 'gemini',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Ticket Form state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'ai_chat') {
      scrollToBottom();
    }
  }, [chatMessages, activeTab, isAiLoading]);

  // Send message to Gemini FAQ endpoint
  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputMessage).trim();
    if (!textToSend || isAiLoading) return;

    soundFx.playSfx('whoosh');
    setInputMessage('');

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setIsAiLoading(true);

    try {
      // Prepare previous turns for Gemini context
      const historyPayload = updatedHistory.slice(-8).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        text: m.text,
      }));

      const res = await fetch('/api/support/faq-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          language: language || 'FR',
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        soundFx.playSfx('pop');
        const assistantMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          role: 'assistant',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          source: data.source || 'gemini',
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } else {
        const fallbackMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          role: 'assistant',
          text: "Je suis temporairement indisponible. Vous pouvez consulter les questions fréquentes dans l'onglet Guide FAQ ou contacter le support direct via WhatsApp.",
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          source: 'knowledge_base',
        };
        setChatMessages((prev) => [...prev, fallbackMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        text: "Une erreur de connexion est survenue. N'hésitez pas à relancer votre question ou à contacter notre assistance WhatsApp directe.",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleClearHistory = () => {
    soundFx.playSfx('ding');
    setChatMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        text: "Conversation réinitialisée ! Quelle est votre prochaine question sur Cortia Video Studio ?",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        source: 'gemini',
      },
    ]);
  };

  const handleCopyText = (text: string, id: string) => {
    soundFx.playSfx('ding');
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSpeakText = (text: string) => {
    soundFx.playSfx('click');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Clean markdown tags for cleaner speech
      const cleaned = text.replace(/[*_#`]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = language === 'EN' ? 'en-US' : language === 'ES' ? 'es-ES' : 'fr-FR';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAskFaqToGemini = (prompt: string) => {
    setActiveTab('ai_chat');
    handleSendMessage(prompt);
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playSfx('ding');
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setTicketSubject('');
      setTicketMessage('');
    }, 3500);
  };

  // Filter classic FAQs
  const filteredFaqs = INITIAL_FAQS.filter((f) => {
    if (!faqSearchQuery.trim()) return true;
    const q = faqSearchQuery.toLowerCase();
    return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Assistant IA Gemini 3.8 Flash & Support 24/7
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1.5">
              Centre d'Assistance & FAQ Interactive
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Obtenez des réponses immédiates sur le montage, le Caption Mask, les voix IA et la monétisation grâce à notre IA ou échangez avec nos experts.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <a
              href="https://wa.me/33700000000"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                soundFx.playSfx('ding');
                alert("Lancement du Support VIP WhatsApp direct (7j/7)...");
              }}
              className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer active:scale-95 w-full sm:w-auto"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp VIP (7j/7)</span>
            </a>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="pt-2 flex items-center gap-2 border-t border-slate-800/80 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('click');
              setActiveTab('ai_chat');
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'ai_chat'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-[#0b0f17] border border-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Assistant IA Gemini (En direct)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-slate-900/40 border border-slate-700/50">
              Actif
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('click');
              setActiveTab('faq_guide');
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'faq_guide'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-[#0b0f17] border border-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Guide FAQ Thématique</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playSfx('click');
              setActiveTab('contact_ticket');
            }}
            className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'contact_ticket'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white bg-[#0b0f17] border border-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Envoyer un Ticket</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE GEMINI CHAT */}
      {activeTab === 'ai_chat' && (
        <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center">
                <div className="w-full h-full bg-[#0d121d] rounded-[10px] flex items-center justify-center text-emerald-400">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <span>Assistant Expert Cortia Studio</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[11px] text-slate-400">
                  Posez n'importe quelle question sur vos montages vidéo ou cliquez sur une suggestion
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearHistory}
              className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Réinitialiser la conversation"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Effacer</span>
            </button>
          </div>

          {/* Suggested Click-to-Ask Chips */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Questions fréquentes prêtes en 1 clic :
            </span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="py-1.5 px-3 rounded-xl bg-[#0b0f17] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Scrollable Container */}
          <div className="bg-[#0b0f17] border border-slate-800/90 rounded-2xl p-4 sm:p-5 h-[400px] overflow-y-auto space-y-4 shadow-inner">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 mt-0.5">
                    <div className="w-full h-full bg-[#0d121d] rounded-[10px] flex items-center justify-center text-emerald-400">
                      <Bot className="w-4 h-4" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md ml-auto'
                      : 'bg-[#111724] border border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-line">
                    {msg.text.split('\n').map((line, lIdx) => {
                      if (!line.trim()) return <div key={lIdx} className="h-1.5" />;

                      // Render bullet points
                      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                        const content = line.trim().substring(2);
                        return (
                          <div key={lIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
                            <span className={msg.role === 'user' ? 'text-slate-950' : 'text-emerald-400'}>
                              •
                            </span>
                            <span>{content}</span>
                          </div>
                        );
                      }

                      return <div key={lIdx}>{line}</div>;
                    })}
                  </div>

                  {/* Message Meta & Action Toolbar */}
                  <div
                    className={`flex items-center justify-between gap-3 pt-1 text-[10px] ${
                      msg.role === 'user' ? 'text-slate-800 border-t border-slate-900/20' : 'text-slate-500 border-t border-slate-800/80'
                    }`}
                  >
                    <span>{msg.timestamp}</span>

                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSpeakText(msg.text)}
                          className="hover:text-emerald-400 p-1 transition-colors cursor-pointer"
                          title="Écouter la réponse"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="hover:text-emerald-400 p-1 transition-colors cursor-pointer flex items-center gap-1"
                          title="Copier la réponse"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isAiLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0">
                  <div className="w-full h-full bg-[#0d121d] rounded-[10px] flex items-center justify-center text-emerald-400">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                </div>
                <div className="rounded-2xl bg-[#111724] border border-slate-800 p-3 text-xs text-slate-400 flex items-center gap-2.5">
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span>Gemini analyse votre question et rédige la solution...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputMessage}
                disabled={isAiLoading}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Posez votre question sur le montage, le Caption Mask, les voix ou l'export..."
                className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden pr-10"
              />
            </div>

            <button
              type="submit"
              disabled={isAiLoading || !inputMessage.trim()}
              className="py-3 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-40 flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
            >
              {isAiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Envoyer</span>
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: CLASSIC FAQ ACCORDION WITH GEMINI EXPANSION */}
      {activeTab === 'faq_guide' && (
        <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Base de Connaissances & Questions Fréquentes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Retrouvez instantanément les réponses aux interrogations les plus récurrentes.
              </p>
            </div>

            {/* FAQ Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={faqSearchQuery}
                onChange={(e) => setFaqSearchQuery(e.target.value)}
                placeholder="Filtrer les questions..."
                className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-800 bg-[#0b0f17] overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playSfx('click');
                      setOpenFaq(isOpen ? null : idx);
                    }}
                    className="w-full p-4 text-left text-xs font-bold text-white flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 border border-slate-800 text-emerald-400">
                        {faq.category}
                      </span>
                      <span>{faq.q}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${
                        isOpen ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-4 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 space-y-3">
                      <p>{faq.a}</p>

                      {/* Interactive Gemini Prompt Trigger */}
                      <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800/60">
                        <span className="text-[11px] text-slate-400">
                          Besoin de plus d'explications sur ce point ?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAskFaqToGemini(faq.quickPrompt)}
                          className="py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Demander à Gemini IA →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CONTACT TECH TICKET */}
      {activeTab === 'contact_ticket' && (
        <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Envoyer un message à l'équipe technique Cortia
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Une question spécifique ou un besoin particulier ? Décrivez votre demande et nos ingénieurs vous répondront dans les 2 heures.
            </p>
          </div>

          {ticketSent ? (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Votre message a été transmis avec succès. Un conseiller va vous répondre sous 2 heures !</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Objet de votre demande
                </label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Ex: Problème de téléchargement, suggestion de voix ou question abonnement"
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Description détaillée
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Expliquez-nous en détail votre besoin pour une assistance rapide..."
                  className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer ma demande au Support</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
