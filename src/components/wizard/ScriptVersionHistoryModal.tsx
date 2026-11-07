import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Check,
  Copy,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Bookmark,
  X,
  FileText,
  Split,
  Eye,
  Zap,
  Wand2,
} from 'lucide-react';
import { ScriptVersion, ScriptVersionSource } from '../../types';
import { soundFx } from '../../utils/audioUtils';

interface ScriptVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  versions: ScriptVersion[];
  currentScriptText: string;
  onRestoreVersion: (version: ScriptVersion) => void;
  onDeleteVersion: (id: string) => void;
  onClearHistory: () => void;
  onCreateSnapshot: (label?: string) => void;
}

export const ScriptVersionHistoryModal: React.FC<ScriptVersionHistoryModalProps> = ({
  isOpen,
  onClose,
  versions,
  currentScriptText,
  onRestoreVersion,
  onDeleteVersion,
  onClearHistory,
  onCreateSnapshot,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'ai' | 'optimization' | 'snapshot'>('all');
  const [comparingVersionId, setComparingVersionId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [snapshotInput, setSnapshotInput] = useState('');
  const [showSnapshotForm, setShowSnapshotForm] = useState(false);
  const [restoredId, setRestoredId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredVersions = versions.filter((v) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'ai') {
      return v.source === 'ai_generation' || v.source === 'ai_regeneration';
    }
    if (selectedFilter === 'optimization') {
      return v.source === 'ai_optimization' || v.source === 'ai_proofread';
    }
    if (selectedFilter === 'snapshot') {
      return v.source === 'snapshot' || v.source === 'manual_edit';
    }
    return true;
  });

  const getSourceIcon = (source: ScriptVersionSource) => {
    switch (source) {
      case 'ai_generation':
      case 'ai_regeneration':
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ai_optimization':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'ai_proofread':
        return <Wand2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'restore':
        return <RotateCcw className="w-3.5 h-3.5 text-purple-400" />;
      case 'snapshot':
        return <Bookmark className="w-3.5 h-3.5 text-blue-400" />;
      case 'manual_edit':
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSourceBadgeClass = (source: ScriptVersionSource) => {
    switch (source) {
      case 'ai_generation':
      case 'ai_regeneration':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'ai_optimization':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'ai_proofread':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'restore':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'snapshot':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'manual_edit':
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundFx.playSfx('pop');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRestore = (ver: ScriptVersion) => {
    soundFx.playSfx('ding');
    onRestoreVersion(ver);
    setRestoredId(ver.id);
    setTimeout(() => {
      setRestoredId(null);
      onClose();
    }, 900);
  };

  const handleDownloadTxt = (ver: ScriptVersion) => {
    const content = `=== CORTIA SCRIPT VIRAL - VERSION ${ver.versionNumber} ===\nDate: ${ver.formattedDate}\nOrigine: ${ver.sourceLabel}\nAccroche: ${ver.hookText}\nViralité: ${ver.estimatedViralityScore}/100\n\n--- SCRIPT COMPLET ---\n${ver.fullScript}\n\n--- HASHTAGS ---\n${(ver.hashtags || []).join(' ')}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script-cortia-v${ver.versionNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const comparingVersion = versions.find((v) => v.id === comparingVersionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0b0f17] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Historique des versions du script</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {versions.length} version{versions.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sauvegarde automatique à chaque génération, optimisation IA ou modification manuelle
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Toutes ({versions.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('ai')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === 'ai'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Générations IA
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('optimization')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === 'optimization'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              Optimisations & Retouches
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('snapshot')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedFilter === 'snapshot'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <Bookmark className="w-3 h-3 text-blue-400" />
              Instantanés manuels
            </button>
          </div>

          {/* Quick Snapshot Action */}
          <div className="flex items-center gap-2">
            {!showSnapshotForm ? (
              <button
                type="button"
                onClick={() => setShowSnapshotForm(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Créer un instantané</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Nom de l'instantané (ex: Avant test Style B)..."
                  value={snapshotInput}
                  onChange={(e) => setSnapshotInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onCreateSnapshot(snapshotInput || 'Instantané manuel');
                      setSnapshotInput('');
                      setShowSnapshotForm(false);
                    }
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 border border-blue-500/50 text-white focus:outline-hidden w-56"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    onCreateSnapshot(snapshotInput || 'Instantané manuel');
                    setSnapshotInput('');
                    setShowSnapshotForm(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Sauvegarder
                </button>
                <button
                  type="button"
                  onClick={() => setShowSnapshotForm(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Comparison Panel if active */}
          {comparingVersion && (
            <div className="p-4 rounded-xl bg-purple-950/20 border-2 border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Split className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-purple-200">
                    Comparaison : Version actuelle vs Version v{comparingVersion.versionNumber} ({comparingVersion.sourceLabel})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(comparingVersion)}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurer cette version v{comparingVersion.versionNumber}
                  </button>
                  <button
                    type="button"
                    onClick={() => setComparingVersionId(null)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Current Active */}
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
                    <span className="text-emerald-400">● Version Actuelle dans l'éditeur</span>
                    <span>{currentScriptText.split(/\s+/).filter(Boolean).length} mots</span>
                  </div>
                  <pre className="font-mono text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {currentScriptText}
                  </pre>
                </div>

                {/* Compared Version */}
                <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-purple-300 text-[11px] font-bold">
                    <span>● Version v{comparingVersion.versionNumber} ({comparingVersion.formattedDate})</span>
                    <span>{comparingVersion.wordCount} mots</span>
                  </div>
                  <pre className="font-mono text-[11px] text-purple-100 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {comparingVersion.fullScript}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Versions List */}
          {filteredVersions.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
              <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-400">Aucune version dans cette catégorie</p>
              <p className="text-xs text-slate-400 mt-1">
                Générez un script avec Gemini ou créez un instantané pour démarrer l'historique.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVersions.map((ver, idx) => {
                const isCurrent = idx === 0 && ver.fullScript.trim() === currentScriptText.trim();
                const isComparing = comparingVersionId === ver.id;
                const isJustRestored = restoredId === ver.id;

                return (
                  <div
                    key={ver.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isJustRestored
                        ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-500/30'
                        : isCurrent
                        ? 'bg-slate-900/80 border-emerald-500/40 shadow-sm'
                        : isComparing
                        ? 'bg-purple-950/30 border-purple-500/50'
                        : 'bg-slate-900/40 hover:bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      {/* Left: Tag + Label + Time */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          v{ver.versionNumber}
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${getSourceBadgeClass(
                            ver.source
                          )}`}
                        >
                          {getSourceIcon(ver.source)}
                          {ver.sourceLabel}
                        </span>

                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            Version Actuelle
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ver.formattedDate}
                        </span>
                      </div>

                      {/* Right: Key Stats */}
                      <div className="flex items-center gap-2 text-xs">
                        {ver.scenarioCode && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            Scénario {ver.scenarioCode}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {ver.wordCount} mots
                        </span>
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          🔥 {ver.estimatedViralityScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Hook preview */}
                    {ver.hookText && (
                      <div className="mb-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                        <span className="font-bold text-emerald-400 mr-1.5">Accroche :</span>
                        <span className="text-slate-300 italic font-medium">« {ver.hookText} »</span>
                      </div>
                    )}

                    {/* Full script text excerpt */}
                    <p className="text-xs font-mono text-slate-300 leading-relaxed bg-[#070a0f] p-3 rounded-lg border border-slate-900 line-clamp-3">
                      {ver.fullScript}
                    </p>

                    {/* Action Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Restore Button */}
                        <button
                          type="button"
                          onClick={() => handleRestore(ver)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isCurrent ? 'Ré-appliquer' : 'Restaurer cette version'}</span>
                        </button>

                        {/* Compare Button */}
                        <button
                          type="button"
                          onClick={() =>
                            setComparingVersionId(comparingVersionId === ver.id ? null : ver.id)
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isComparing
                              ? 'bg-purple-600 text-white border-purple-500'
                              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isComparing ? 'Fermer comparaison' : 'Comparer'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Script */}
                        <button
                          type="button"
                          onClick={() => handleCopy(ver.fullScript, ver.id)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                          title="Copier le script de cette version"
                        >
                          {copiedId === ver.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Download .txt */}
                        <button
                          type="button"
                          onClick={() => handleDownloadTxt(ver)}
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                          title="Télécharger cette version (.txt)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Single Version */}
                        {versions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Supprimer la version v${ver.versionNumber} de l'historique ?`)) {
                                onDeleteVersion(ver.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-colors cursor-pointer"
                            title="Supprimer cette version"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
            La restauration recharge le script et rafraîchit automatiquement la voix-off et le rendu vidéo.
          </span>

          <div className="flex items-center gap-2">
            {versions.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Effacer tout l'historique des versions pour ce projet ?")) {
                    onClearHistory();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs font-bold transition-colors cursor-pointer"
              >
                Vider l'historique
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
