import React, { useState } from 'react';
import {
  LayoutTemplate,
  Sparkles,
  Check,
  Copy,
  Clock,
  Flame,
  ArrowRight,
  BookOpen,
  Zap,
  HelpCircle,
  X,
  FileText,
  CheckCircle2,
  Sliders,
  Search,
  Tag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  SCRIPT_TEMPLATES,
  ScriptTemplate,
  ScriptTemplateCategory,
} from '../../data/scriptTemplates';
import { soundFx } from '../../utils/audioUtils';

interface ScriptTemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplateForAi: (template: ScriptTemplate) => void;
  onLoadPrewrittenScript: (template: ScriptTemplate) => void;
  currentSelectedTemplateId?: string | null;
}

export const ScriptTemplateLibraryModal: React.FC<ScriptTemplateLibraryModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplateForAi,
  onLoadPrewrittenScript,
  currentSelectedTemplateId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ScriptTemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: Array<{ id: ScriptTemplateCategory; label: string; icon?: string }> = [
    { id: 'all', label: 'Tous les templates' },
    { id: 'storytelling', label: '📖 Storytelling' },
    { id: 'aggressive_hook', label: '⚡ Hook Agressif' },
    { id: 'listicle', label: '🔢 Listicle' },
    { id: 'before_after', label: '✨ Avant / Après' },
    { id: 'challenge', label: '⏱️ Challenge 24h' },
    { id: 'educational', label: '🧠 Éducatif / How-To' },
  ];

  const filteredTemplates = SCRIPT_TEMPLATES.filter((tpl) => {
    const matchesCategory = selectedCategory === 'all' || tpl.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      tpl.title.toLowerCase().includes(q) ||
      tpl.description.toLowerCase().includes(q) ||
      tpl.hookFormula.toLowerCase().includes(q) ||
      tpl.suggestedNiche.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCopyScript = (script: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(script);
    setCopiedId(id);
    soundFx.playSfx('pop');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyAi = (tpl: ScriptTemplate) => {
    soundFx.playSfx('chaching');
    onApplyTemplateForAi(tpl);
    onClose();
  };

  const handleLoadPrewritten = (tpl: ScriptTemplate) => {
    soundFx.playSfx('ding');
    onLoadPrewrittenScript(tpl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b0f17] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Bibliothèque de Templates de Scripts</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {SCRIPT_TEMPLATES.length} Structures Éprouvées
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Structures psychologiques haute rétention calibrées 61s pour TikTok Creator Rewards, Shorts & Reels
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par structure, mot-clé, formule d'accroche ou niche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070a0f] border border-slate-800 focus:border-amber-500/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count =
                cat.id === 'all'
                  ? SCRIPT_TEMPLATES.length
                  : SCRIPT_TEMPLATES.filter((t) => t.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-slate-950/30 text-slate-900' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid / List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
              <LayoutTemplate className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-300">Aucun template ne correspond à votre recherche</p>
              <p className="text-xs text-slate-400 mt-1">
                Essayez d'autres mots-clés ou sélectionnez la catégorie « Tous les templates ».
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTemplates.map((tpl) => {
                const isSelected = currentSelectedTemplateId === tpl.id;
                const isExpanded = expandedTemplateId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900/90 border-amber-500/50 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800/90'
                    }`}
                  >
                    {/* Main Card Header & Summary */}
                    <div className="p-5 space-y-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                              {tpl.categoryLabel}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              {tpl.badge}
                            </span>
                            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {tpl.viewsProjection}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-white">{tpl.title}</h4>
                        </div>

                        {/* Top Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLoadPrewritten(tpl)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Charger directement ce script complet pré-rédigé dans l'éditeur"
                          >
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Charger le script modèle</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyAi(tpl)}
                            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                            title="Appliquer cette structure et pré-remplir le générateur Gemini AI"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Appliquer & Générer par IA</span>
                          </button>
                        </div>
                      </div>

                      {/* Description & Hook Formula Callout */}
                      <p className="text-xs text-slate-300 leading-relaxed">{tpl.description}</p>

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                          <span className="flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            Formule du Hook Type (00:00 - 00:04) :
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">Accroche psychologique</span>
                        </div>
                        <p className="text-xs text-amber-100 font-bold italic">{tpl.hookFormula}</p>
                      </div>

                      {/* Timeline Structure Strip */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Timeline de la Structure (61 secondes) :
                          </span>
                          <span className="text-[10px] text-slate-500">5 blocs haute rétention</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5 text-xs">
                          {tpl.structure.map((block, bIdx) => (
                            <div
                              key={bIdx}
                              className="p-2 rounded-lg bg-[#070a0f] border border-slate-800/80 flex flex-col justify-between"
                            >
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono text-[10px] text-amber-400 font-bold">
                                  {block.timeframe}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold">#{bIdx + 1}</span>
                              </div>
                              <span className="text-[11px] font-extrabold text-slate-200 line-clamp-1">
                                {block.name}
                              </span>
                              <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                {block.purpose}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Expand / Collapse Footer */}
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 text-amber-400" />
                              <span>Masquer les détails & le script complet</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 text-amber-400" />
                              <span>Voir le script complet pré-rédigé & conseils de rétention</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleCopyScript(tpl.prewrittenScript, tpl.id, e)}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1"
                            title="Copier le script complet du template"
                          >
                            {copiedId === tpl.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px] text-emerald-400 font-bold">Copié</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copier</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Drawer: Full script, titles, and tips */}
                    {isExpanded && (
                      <div className="p-5 border-t border-slate-800/80 bg-slate-950/60 space-y-4 animate-in fade-in duration-150">
                        {/* Retention Tip */}
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-2.5">
                          <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-extrabold text-purple-200">Conseil d'Élite Rétention : </span>
                            <span className="text-slate-300">{tpl.retentionTip}</span>
                          </div>
                        </div>

                        {/* Pre-written Script Preview */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-emerald-400" />
                              Script Modèle Pré-rédigé (Prêt pour la voix-off) :
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {tpl.prewrittenScript.split(/\s+/).filter(Boolean).length} mots (~61s)
                            </span>
                          </div>
                          <div className="p-4 rounded-xl bg-[#070a0f] border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed">
                            {tpl.prewrittenScript}
                          </div>
                        </div>

                        {/* Suggested Titles & Hashtags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-[#070a0f] border border-slate-800/80 space-y-1.5">
                            <span className="font-bold text-slate-300 block">Titres Viraux Suggérés :</span>
                            <ul className="space-y-1 text-slate-400">
                              {tpl.suggestedTitles.map((st, i) => (
                                <li key={i} className="flex items-center gap-1.5 text-[11px]">
                                  <span className="text-amber-400 font-bold">•</span>
                                  <span>{st}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 rounded-xl bg-[#070a0f] border border-slate-800/80 space-y-1.5">
                            <span className="font-bold text-slate-300 block">Hashtags Recommandés :</span>
                            <div className="flex flex-wrap gap-1.5">
                              {tpl.suggestedHashtags.map((h, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300"
                                >
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Action Footer for this template */}
                        <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleLoadPrewritten(tpl)}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-cyan-400" />
                            <span>Charger ce script dans l'éditeur</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyAi(tpl)}
                            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 fill-slate-950" />
                            <span>Appliquer la structure au générateur IA</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Tous les templates sont optimisés pour générer des vidéos courtes conformes au Creator Rewards Program.
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
