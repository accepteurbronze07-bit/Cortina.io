import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Radio,
  Share2,
  X,
  UserCheck,
  Edit3,
  ExternalLink,
  Shield,
  Zap,
  Globe,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { CollabUser } from '../../hooks/useScriptCollaboration';
import { soundFx } from '../../utils/audioUtils';
import { toast } from '../toast/ToastContext';

interface ScriptCollaborationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRoomId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  activeUsers: CollabUser[];
  currentUser: CollabUser;
  shareLink: string;
  onStartOrJoin: (roomId?: string) => Promise<string>;
  onLeave: () => void;
  onUpdateName: (name: string) => void;
}

export const ScriptCollaborationModal: React.FC<ScriptCollaborationModalProps> = ({
  isOpen,
  onClose,
  activeRoomId,
  isConnected,
  isConnecting,
  activeUsers,
  currentUser,
  shareLink,
  onStartOrJoin,
  onLeave,
  onUpdateName,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');
  const [userNameInput, setUserNameInput] = useState(currentUser.name);
  const [isEditingName, setIsEditingName] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    soundFx.playSfx('click');
    toast.success('Lien unique de collaboration copié ! Envoyez-le à votre équipe.', 'Lien Partagé');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (userNameInput.trim()) {
      onUpdateName(userNameInput.trim());
      setIsEditingName(false);
      soundFx.playSfx('ding');
      toast.info(`Votre pseudo est désormais « ${userNameInput.trim()} »`, 'Profil Collaborateur');
    }
  };

  const handleJoinCustomRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    let target = inputRoomId.trim();
    if (!target) return;

    // If pasted full URL, extract param
    if (target.includes('collab=')) {
      try {
        const parsed = new URL(target);
        target = parsed.searchParams.get('collab') || target;
      } catch {}
    }

    soundFx.playSfx('pop');
    await onStartOrJoin(target);
    setInputRoomId('');
    toast.success(`Connexion à la session « ${target} » en cours...`, 'Session Rejointe');
  };

  const handleCreateNewSession = async () => {
    soundFx.playSfx('chaching');
    const newId = await onStartOrJoin();
    toast.success(`Nouvelle session « ${newId} » créée avec succès !`, 'Session Collaborative');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="bg-[#0f1522] border-2 border-emerald-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/25">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Co-écriture & Partage en Direct</h3>
              {isConnected ? (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Connecté
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                  Hors session
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Partagez un lien unique pour rédiger et retoucher le même script simultanément à plusieurs.
            </p>
          </div>
        </div>

        {/* Current User Identity Card */}
        <div className="p-3.5 rounded-2xl bg-[#070a0f] border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-950 font-black text-sm shadow-md"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Votre identifiant en direct :</span>
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={userNameInput}
                    onChange={(e) => setUserNameInput(e.target.value)}
                    className="bg-slate-900 border border-emerald-500 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-hidden"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-[11px] cursor-pointer"
                  >
                    Valider
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{currentUser.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUserNameInput(currentUser.name);
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    title="Changer de pseudo"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Rôle</span>
            <span className="font-mono text-[11px] font-bold text-emerald-400">Co-Auteur IA</span>
          </div>
        </div>

        {/* If Active Session */}
        {activeRoomId ? (
          <div className="space-y-4">
            {/* Share Link Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                  Lien unique de partage en temps réel
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                  Room: {activeRoomId}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="w-full bg-[#070a0f] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-hidden select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copier le lien</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Toute personne ouvrant ce lien rejoint instantanément votre espace de travail et voit le script se mettre à jour en direct.
              </p>
            </div>

            {/* Active Users in this Room */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Collaborateurs connectés en direct ({activeUsers.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">WebSockets synchronisés</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeUsers.map((user) => {
                  const isMe = user.id === currentUser.id;
                  return (
                    <div
                      key={user.id}
                      className="p-2.5 rounded-xl bg-[#070a0f] border border-slate-800 flex items-center gap-2.5 text-xs"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-950 font-black text-xs shadow-xs"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-white block truncate">
                          {user.name} {isMe && <span className="text-emerald-400 text-[10px] font-black">(Moi)</span>}
                        </span>
                        <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          En ligne et synchronisé
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Room Button */}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={handleCreateNewSession}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Créer une autre session</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onLeave();
                  onClose();
                }}
                className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Quitter la session collaborative</span>
              </button>
            </div>
          </div>
        ) : (
          /* When NOT yet in a session */
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#070a0f] border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-white">Démarrer une session de co-écriture</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Générez un lien unique partageable. Vos modifications et celles de vos collaborateurs apparaîtront en direct à l'écran.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateNewSession}
                disabled={isConnecting}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 mx-auto shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{isConnecting ? 'Initialisation...' : 'Créer un lien de session collaborative'}</span>
              </button>
            </div>

            {/* Join existing by link/ID */}
            <form onSubmit={handleJoinCustomRoom} className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 block">
                Ou rejoindre une session existante (Lien ou ID) :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ex: collab-92ad3f ou collez le lien"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  className="flex-1 bg-[#070a0f] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={!inputRoomId.trim()}
                  className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs cursor-pointer disabled:opacity-40"
                >
                  Rejoindre
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
