import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Flame,
  ArrowRight,
  Download,
  FileDown,
  FileType,
  Save,
  Wifi,
  WifiOff,
  Database,
  Trash2,
  FolderOpen,
  X,
  Clock,
  CloudUpload,
  LayoutTemplate,
  BookOpen,
  Layers,
  CheckCircle2,
  Users,
  Share2,
  Radio,
  Link2,
  Edit3,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AppLanguage, ScriptGenerationResult, NarrativeScriptStyle } from '../../types';
import { requestViralScript, requestScriptOptimization } from '../../services/geminiService';
import { NARRATIVE_STYLE_OPTIONS } from '../wizard/Step5ScriptViral';
import { soundFx } from '../../utils/audioUtils';
import { PredictiveEngagementTool } from '../dashboard/PredictiveEngagementTool';
import {
  saveDraftToIndexedDb,
  getDraftsFromIndexedDb,
  deleteDraftFromIndexedDb,
  syncOfflineDraftsWithServer,
  OfflineScriptDraft,
} from '../../utils/indexedDbDrafts';
import { SCRIPT_TEMPLATES, ScriptTemplate } from '../../data/scriptTemplates';
import { ScriptTemplateLibraryModal } from './ScriptTemplateLibraryModal';
import { toast } from '../toast/ToastContext';
import { useScriptCollaboration } from '../../hooks/useScriptCollaboration';
import { ScriptCollaborationModal } from '../collaboration/ScriptCollaborationModal';

export const ScriptViralStandaloneView: React.FC<{ language: AppLanguage }> = ({ language }) => {
  const [topic, setTopic] = useState('');
  const [links, setLinks] = useState('');
  const [narrativeStyle, setNarrativeStyle] = useState<NarrativeScriptStyle>('mystery_bottom');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ScriptGenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportedTxt, setExportedTxt] = useState(false);
  const [exportedPdf, setExportedPdf] = useState(false);
  const [savedScriptToast, setSavedScriptToast] = useState(false);

  // Script Template Library state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [activeTemplate, setActiveTemplate] = useState<ScriptTemplate | null>(null);

  // IndexedDB Offline State & Online Sync
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineDrafts, setOfflineDrafts] = useState<OfflineScriptDraft[]>([]);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Real-Time Multi-User Collaboration State
  const [isCollabModalOpen, setIsCollabModalOpen] = useState<boolean>(false);
  const [isLiveEditorMode, setIsLiveEditorMode] = useState<boolean>(true);

  const collab = useScriptCollaboration({
    onRemoteScriptUpdate: (remoteState, editor) => {
      if (remoteState.topic && remoteState.topic !== topic) {
        setTopic(remoteState.topic);
      }
      if (remoteState.narrativeStyle) {
        setNarrativeStyle(remoteState.narrativeStyle as NarrativeScriptStyle);
      }
      const words = (remoteState.fullScript || '').trim().split(/\s+/).filter(Boolean).length;
      setResult((prev) => ({
        hookText: remoteState.hookText || prev?.hookText || remoteState.fullScript.split('\n')[0] || '',
        fullScript: remoteState.fullScript,
        suggestedTitles: prev?.suggestedTitles || [remoteState.topic],
        description: `Modifié en direct par ${editor?.name || remoteState.lastEditorName || 'un collaborateur'}`,
        hashtags: remoteState.hashtags?.length ? remoteState.hashtags : prev?.hashtags || ['#viral', '#tiktok'],
        estimatedViralityScore: prev?.estimatedViralityScore || 94,
        estimatedDuration: `~${Math.max(1, Math.round(words / 2.7))}s (${words} mots)`,
      }));
    },
  });

  // URL check for collab session link (?collab=ROOM_ID or ?session=ROOM_ID)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roomFromUrl = params.get('collab') || params.get('session');
      if (roomFromUrl && !collab.activeRoomId) {
        collab
          .startOrJoinRoom(roomFromUrl, {
            topic,
            fullScript: result?.fullScript,
            narrativeStyle,
          })
          .then(() => {
            toast.success(
              `Session collaborative « ${roomFromUrl} » rejointe ! Co-écriture activée.`,
              'Session Rejointe'
            );
          });
      }
    } catch (e) {
      console.warn('URL collab param check error:', e);
    }
  }, []);

  const handleScriptChange = (newText: string) => {
    const words = newText.trim().split(/\s+/).filter(Boolean).length;
    setResult((prev) =>
      prev
        ? {
            ...prev,
            fullScript: newText,
            estimatedDuration: `~${Math.max(1, Math.round(words / 2.7))}s (${words} mots)`,
          }
        : {
            hookText: newText.split('\n')[0] || topic || 'Accroche virale',
            fullScript: newText,
            suggestedTitles: [topic || 'Script Collaboratif'],
            description: 'Édité en temps réel à plusieurs',
            hashtags: ['#viral', '#tiktok'],
            estimatedViralityScore: 92,
            estimatedDuration: `~${Math.max(1, Math.round(words / 2.7))}s (${words} mots)`,
          }
    );

    if (collab.activeRoomId) {
      collab.broadcastScriptChange({
        fullScript: newText,
        topic,
        narrativeStyle,
        hookText: newText.split('\n')[0] || '',
      });
    }
  };

  const handleStartCollaboration = async () => {
    soundFx.playSfx('chaching');
    const roomId = await collab.startOrJoinRoom(undefined, {
      topic: topic || 'Script Collaboratif',
      fullScript: result?.fullScript || '',
      hookText: result?.hookText || '',
      narrativeStyle,
      hashtags: result?.hashtags || [],
    });

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('collab', roomId);
      window.history.replaceState({}, '', url.toString());
    } catch {}

    setIsCollabModalOpen(true);
  };

  // Load offline drafts from IndexedDB
  const refreshOfflineDrafts = async () => {
    const list = await getDraftsFromIndexedDb();
    setOfflineDrafts(list);
  };

  useEffect(() => {
    refreshOfflineDrafts();
  }, []);

  // Monitor network connectivity and auto-sync when returning online
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      soundFx.playSfx('ding');
      setSyncToastMessage('🟢 Connexion rétablie ! Synchronisation des brouillons IndexedDB en cours...');
      setIsSyncing(true);
      try {
        const { syncedCount } = await syncOfflineDraftsWithServer();
        await refreshOfflineDrafts();
        if (syncedCount > 0) {
          setSyncToastMessage(`☁️ ${syncedCount} brouillon(s) synchronisé(s) avec le serveur !`);
        } else {
          setSyncToastMessage('✅ Tous vos brouillons IndexedDB sont à jour avec le serveur.');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSyncing(false);
        setTimeout(() => setSyncToastMessage(null), 3500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      soundFx.playSfx('whoosh');
      setSyncToastMessage('🟡 Mode hors-ligne actif. Vos brouillons de scripts sont sécurisés localement dans IndexedDB.');
      setTimeout(() => setSyncToastMessage(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      syncOfflineDraftsWithServer().then(() => refreshOfflineDrafts()).catch(() => {});
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save current script to IndexedDB
  const handleSaveToIndexedDb = async () => {
    const scriptContent = result?.fullScript || '';
    if (!scriptContent && !topic) return;

    soundFx.playSfx('ding');
    try {
      await saveDraftToIndexedDb({
        topic: topic || 'Brouillon Script Viral',
        narrativeStyle,
        fullScript: scriptContent,
        hashtags: result?.hashtags || [],
      });

      await refreshOfflineDrafts();
      setSavedScriptToast(true);
      toast.success('Votre script a été sauvegardé avec succès dans vos brouillons hors-ligne (IndexedDB).', 'Script Sauvegardé');
      setTimeout(() => setSavedScriptToast(false), 2500);

      // Auto-sync with server if online
      if (isOnline) {
        syncOfflineDraftsWithServer().then(() => refreshOfflineDrafts()).catch(() => {});
      }
    } catch (err) {
      console.error('Error saving to IndexedDB:', err);
      toast.error('Impossible de sauvegarder le script en local.', 'Erreur Sauvegarde');
    }
  };

  // Restore a draft from IndexedDB
  const handleRestoreDraft = (draft: OfflineScriptDraft) => {
    soundFx.playSfx('pop');
    setTopic(draft.topic);
    setNarrativeStyle((draft.narrativeStyle as NarrativeScriptStyle) || 'mystery_bottom');
    setResult({
      hookText: draft.fullScript.split('\n')[0] || draft.topic,
      fullScript: draft.fullScript,
      suggestedTitles: [draft.topic],
      description: 'Brouillon restauré depuis IndexedDB',
      hashtags: draft.hashtags || [],
      estimatedViralityScore: 92,
      estimatedDuration: '~61 secondes',
    });
    setIsDraftsModalOpen(false);
    toast.info(`Brouillon « ${draft.topic} » chargé dans l'éditeur.`, 'Brouillon Restauré');
  };

  // Delete a draft from IndexedDB
  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFx.playSfx('whoosh');
    await deleteDraftFromIndexedDb(id);
    await refreshOfflineDrafts();
    toast.info('Brouillon supprimé de la base locale.', 'Suppression');
  };

  // Manual trigger to force sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    soundFx.playSfx('ding');
    try {
      const { syncedCount } = await syncOfflineDraftsWithServer();
      await refreshOfflineDrafts();
      setSyncToastMessage(
        syncedCount > 0
          ? `☁️ Synchronisation réussie : ${syncedCount} brouillon(s) envoyés au serveur !`
          : '✅ Tous vos brouillons locaux sont déjà synchronisés.'
      );
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToastMessage(null), 3500);
    }
  };

  // Apply a template for AI generation
  const handleApplyTemplateForAi = (template: ScriptTemplate) => {
    setActiveTemplate(template);
    setNarrativeStyle(template.recommendedStyle);
    if (!topic || topic.trim().length < 5) {
      setTopic(template.suggestedTitles[0] || template.suggestedNiche);
    }
    soundFx.playSfx('chaching');
    setSyncToastMessage(`Template « ${template.title} » appliqué pour guider l'IA.`);
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  // Load a pre-written template script directly into the editor
  const handleLoadPrewrittenScript = (template: ScriptTemplate) => {
    setActiveTemplate(template);
    setNarrativeStyle(template.recommendedStyle);
    setTopic(template.suggestedTitles[0] || template.suggestedNiche);
    setResult({
      hookText: template.structure[0]?.sampleText || template.hookFormula,
      fullScript: template.prewrittenScript,
      suggestedTitles: template.suggestedTitles,
      description: `Template structuré : ${template.title} (${template.categoryLabel})`,
      hashtags: template.suggestedHashtags,
      estimatedViralityScore: 96,
      estimatedDuration: '~61 secondes (168 mots)',
    });
    soundFx.playSfx('ding');
    setSyncToastMessage(`Script modèle « ${template.title} » chargé dans l'éditeur.`);
    setTimeout(() => setSyncToastMessage(null), 3000);
  };

  // Listen to Ctrl+S global event from QuickAccessBar
  useEffect(() => {
    const handleGlobalSave = () => {
      if (result?.fullScript) {
        handleSaveToIndexedDb();
      }
    };
    window.addEventListener('cortia:save-script', handleGlobalSave);
    return () => window.removeEventListener('cortia:save-script', handleGlobalSave);
  }, [result, topic, narrativeStyle, isOnline]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    soundFx.playSfx('whoosh');
    try {
      const templatePrompt = activeTemplate
        ? `Structure template imposée: ${activeTemplate.title} (${activeTemplate.categoryLabel}). Règle psychologique: ${activeTemplate.retentionTip}. Formule d'accroche: ${activeTemplate.hookFormula}. Blocs temporels: ${activeTemplate.structure.map((s) => `${s.timeframe}: ${s.name} (${s.purpose})`).join(' | ')}.`
        : undefined;

      const res = await requestViralScript({
        links: [links],
        topic,
        hookVideoTitle: topic,
        language,
        narrativeStyle,
        customPrompt: templatePrompt,
      });
      setResult(res);
      soundFx.playSfx('chaching');
      toast.success('Script viral haute rétention généré avec succès par Gemini !', 'Génération Réussie');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la génération du script par Gemini AI.', 'Erreur IA');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fullScript);
    setCopied(true);
    soundFx.playSfx('click');
    toast.success('Le script complet a été copié dans votre presse-papiers !', 'Script Copié');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const scriptToExport = result?.fullScript || '';
    if (!scriptToExport) return;

    soundFx.playSfx('ding');
    const safeTopic = (topic || 'script_viral').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const filename = `cortia_${safeTopic}_${Date.now()}.txt`;

    const content = `============================================================
CORTIA VIDEO STUDIO — SCRIPT VIRAL HAUTE RÉTENTION (61S)
Plateforme de Montage & Remix Vidéo IA (https://cortia.io)
============================================================

• Sujet / Niche : ${topic || 'Généraliste'}
• Style Narratif : ${narrativeStyle}
• Calibrage : ${result?.estimatedDuration || '~61 secondes (165-175 mots)'}
• Date d'export : ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}

------------------------------------------------------------
1. ACCROCHE CHOC (00:00 - 00:04)
------------------------------------------------------------
${result?.hookText || ''}

------------------------------------------------------------
2. SCRIPT INTÉGRAL DE LA VOIX-OFF (Structure Haute Rétention)
------------------------------------------------------------
${scriptToExport}

------------------------------------------------------------
3. HASHTAGS VIRAUX RECOMMANDÉS
------------------------------------------------------------
${(result?.hashtags || []).join(' ')}

------------------------------------------------------------
4. TITRES & VARIANTES SUGGÉRÉS
------------------------------------------------------------
${(result?.suggestedTitles || []).map((t, idx) => `${idx + 1}. ${t}`).join('\n')}

============================================================
Optimisé pour le TikTok Creator Rewards Program, Shorts & Reels
Cortia.io — Tous droits réservés.
============================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportedTxt(true);
    toast.success(`Le fichier "${filename}" a été téléchargé avec succès !`, 'Téléchargement .TXT');
    setTimeout(() => setExportedTxt(false), 2500);
  };

  const handleExportPdf = () => {
    const scriptToExport = result?.fullScript || '';
    if (!scriptToExport) return;

    soundFx.playSfx('cash');
    const safeTopic = (topic || 'script_viral').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const filename = `cortia_${safeTopic}_${Date.now()}.pdf`;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let yPos = 20;

    // Header emerald bar
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, pageWidth, 5, 'F');

    // Brand title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('CORTIA.IO', margin, yPos);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text('STUDIO DE CRÉATION VIDÉO VIRALE IA', margin + 35, yPos);

    yPos += 8;

    // Subtitle
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Fiche de Tournage & Script Voix-Off (61s)', margin, yPos);

    yPos += 7;

    // Meta box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, yPos, contentWidth, 14, 2, 2, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const metaDate = new Date().toLocaleDateString('fr-FR');
    doc.text(
      `Sujet : ${topic || 'Viral'}  |  Style : ${narrativeStyle}  |  Durée : ${
        result?.estimatedDuration || '~61s'
      }  |  Date : ${metaDate}`,
      margin + 4,
      yPos + 8.5
    );

    yPos += 20;

    // Hook box
    if (result?.hookText) {
      doc.setFillColor(254, 243, 199); // amber-100
      doc.setDrawColor(245, 158, 11); // amber-500
      doc.setLineWidth(0.4);

      const hookLines = doc.splitTextToSize(
        `ACCROCHE CHOC (00:00 - 00:04) :\n"${result.hookText}"`,
        contentWidth - 8
      );
      const hookBoxHeight = hookLines.length * 5 + 6;
      doc.roundedRect(margin, yPos, contentWidth, hookBoxHeight, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(hookLines, margin + 4, yPos + 6);

      yPos += hookBoxHeight + 8;
    }

    // Script header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('TEXTE DE LA VOIX-OFF (Structure Haute Rétention) :', margin, yPos);

    yPos += 6;

    // Script text with automatic wrapping & pagination
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);

    const splitScript = doc.splitTextToSize(scriptToExport, contentWidth);
    for (let i = 0; i < splitScript.length; i++) {
      if (yPos > 275) {
        doc.addPage();
        yPos = 20;
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 4, 'F');
      }
      doc.text(splitScript[i], margin, yPos);
      yPos += 5.2;
    }

    yPos += 8;

    // Hashtags
    if (result?.hashtags && result.hashtags.length > 0) {
      if (yPos > 265) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(16, 185, 129);
      doc.text('Hashtags Viraux Recommandés :', margin, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const hashtagStr = result.hashtags.join(' ');
      const splitHashtags = doc.splitTextToSize(hashtagStr, contentWidth);
      doc.text(splitHashtags, margin, yPos);
      yPos += splitHashtags.length * 4.5 + 4;
    }

    // Footer on each page
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Généré avec Cortia Video Studio (https://cortia.io) • Prêt pour TikTok Creator Rewards & Shorts',
        margin,
        290
      );
      doc.text(`Page ${p} / ${totalPages}`, pageWidth - margin - 15, 290);
    }

    doc.save(filename);
    setExportedPdf(true);
    toast.success(`Le document PDF "${filename}" a été téléchargé avec succès !`, 'Téléchargement .PDF');
    setTimeout(() => setExportedPdf(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
              Script Viral (PRO)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Online / Offline status badge */}
            {isOnline ? (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <Wifi className="w-3.5 h-3.5" />
                <span>En ligne · Synchronisation active</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-xs">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Hors-ligne · Sauvegarde locale IndexedDB</span>
              </span>
            )}

            {/* Offline Drafts Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/40 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              title="Ouvrir la liste des brouillons enregistrés dans IndexedDB"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Brouillons IndexedDB</span>
              {offlineDrafts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px]">
                  {offlineDrafts.length}
                </span>
              )}
            </button>
            {/* Real-Time Live Collaboration Button */}
            <button
              type="button"
              onClick={collab.activeRoomId ? () => setIsCollabModalOpen(true) : handleStartCollaboration}
              className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                collab.activeRoomId
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400 text-emerald-300 ring-1 ring-emerald-500/40 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold'
              }`}
              title="Collaborer en direct via un lien unique partagé"
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {collab.activeRoomId
                  ? `Co-écriture en direct (${collab.activeUsers.length})`
                  : 'Collaborer en direct'}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  collab.activeRoomId ? 'bg-emerald-400' : 'bg-slate-950'
                }`}
              />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Rédacteur de Scripts Viraux IA</h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Génère des scripts ultra-rétenteurs avec hooks psychologiques et relances d'attention pour TikTok, Reels et Shorts. Sauvegarde automatique dans IndexedDB et co-écriture collaborative en temps réel.
          </p>
        </div>
      </div>

      {/* Real-time Collaboration Live Strip */}
      {collab.activeRoomId && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-[#070a0f] border-2 border-emerald-500/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
              <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Session de Co-Écriture en Direct
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  #{collab.activeRoomId}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
                {collab.lastEditor ? (
                  <span className="text-[11px] text-emerald-400">
                    ✏️ Dernière modification par <strong>{collab.lastEditor.name}</strong>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Modifications synchronisées en temps réel via WebSockets
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Avatars of active collaborators */}
            <div className="flex items-center -space-x-1.5 mr-1" title="Collaborateurs connectés en direct">
              {collab.activeUsers.map((u) => (
                <div
                  key={u.id}
                  className="w-7 h-7 rounded-full border-2 border-[#0f1522] flex items-center justify-center text-slate-950 font-black text-[11px] shadow-xs cursor-help"
                  style={{ backgroundColor: u.color }}
                  title={`${u.name} (en ligne)`}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(collab.getShareLink());
                soundFx.playSfx('click');
                toast.success('Lien unique copié ! Envoyez-le à un collègue.', 'Lien Partagé');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copier le lien</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollabModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Gérer ({collab.activeUsers.length})
            </button>
          </div>
        </div>
      )}

      {/* Sync Toast Feedback Banner */}
      {syncToastMessage && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-emerald-500/40 text-white text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-top-2">
          <Database className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{syncToastMessage}</span>
        </div>
      )}

      {/* Input Box */}
      <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Templates Library Banner & Quick Selectors */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-500/15 border-2 border-amber-500/30 space-y-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Bibliothèque de Templates de Scripts</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                    {SCRIPT_TEMPLATES.length} structures
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300">
                  Choisissez parmi des structures pré-rédigées (Storytelling, Hook agressif, Listicle, Avant/Après...) avant de générer votre propre script.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <LayoutTemplate className="w-3.5 h-3.5 fill-slate-950" />
              <span>Ouvrir la bibliothèque ({SCRIPT_TEMPLATES.length})</span>
            </button>
          </div>

          {/* Quick Select Template Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {SCRIPT_TEMPLATES.slice(0, 3).map((tpl) => {
              const isCurrent = activeTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplateForAi(tpl)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-500/30 shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {tpl.categoryLabel}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">{tpl.badge}</span>
                    </div>
                    <p className="text-xs font-extrabold text-white line-clamp-1">{tpl.title}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 italic">
                      {tpl.hookFormula}
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold text-amber-400">
                    <span>{isCurrent ? '● Template appliqué' : 'Appliquer structure'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Template Status Pill */}
          {activeTemplate && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-slate-200">
                  <strong className="text-amber-300">Structure active :</strong> {activeTemplate.title} ({activeTemplate.categoryLabel})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadPrewrittenScript(activeTemplate)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Charger le texte modèle
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplate(null)}
                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-white text-[11px] cursor-pointer"
                >
                  ✕ Réinitialiser
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            Option de Style Narratif Viral
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {NARRATIVE_STYLE_OPTIONS.map((opt) => {
              const isSelected = narrativeStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    soundFx.playSfx('click');
                    setNarrativeStyle(opt.id);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                      : 'bg-[#0b0f17] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                          isSelected
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {opt.code}
                      </span>
                      <span className="text-[10px] font-black text-amber-300">{opt.badge}</span>
                    </div>
                    <p className="text-xs font-extrabold leading-snug">{opt.title}</p>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{opt.subtitle}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white uppercase tracking-wider">
            Sujet ou niche de la vidéo
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white uppercase tracking-wider">
            Lien d'inspiration TikTok / Shorts (optionnel)
          </label>
          <input
            type="url"
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            className="w-full bg-[#0b0f17] border border-slate-800 rounded-xl px-3.5 py-3 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-500 font-mono"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Génération du script par Gemini AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>Rédiger le script viral par IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-[#0f1522] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Script Viral Généré ({result.estimatedDuration || '~61s'})
              </span>
              <span className="text-[11px] text-slate-400">
                Structure psychologique 165-175 mots calibrée monétisation
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Live Edit / Reader */}
              <button
                type="button"
                onClick={() => setIsLiveEditorMode(!isLiveEditorMode)}
                className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLiveEditorMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title={isLiveEditorMode ? 'Passer en affichage lecture' : 'Passer en mode édition directe'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isLiveEditorMode ? 'Mode Éditeur Actif' : 'Modifier le texte'}</span>
              </button>

              {/* Share session button */}
              <button
                type="button"
                onClick={collab.activeRoomId ? () => setIsCollabModalOpen(true) : handleStartCollaboration}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-xs font-bold text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Partager ce script avec un lien unique pour éditer à plusieurs"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{collab.activeRoomId ? 'Partager le lien' : 'Co-écrire en direct'}</span>
              </button>

              {/* Quick Save Script (Ctrl+S) */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playSfx('ding');
                  if (result?.fullScript) {
                    localStorage.setItem('cortia_saved_script_draft', result.fullScript);
                    setSavedScriptToast(true);
                    setTimeout(() => setSavedScriptToast(false), 2500);
                  }
                }}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Sauvegarder le script (Ctrl + S)"
              >
                <Save className="w-3.5 h-3.5 text-sky-400" />
                <span>Sauvegarder</span>
                <kbd className="px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400 border border-slate-700">
                  Ctrl+S
                </kbd>
              </button>

              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copier le script dans le presse-papier"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>

              {/* Export TXT button */}
              <button
                type="button"
                onClick={handleExportTxt}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Télécharger le script en fichier texte brut .TXT"
              >
                {exportedTxt ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">.TXT Téléchargé !</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    <span>Exporter .TXT</span>
                  </>
                )}
              </button>

              {/* Export PDF button */}
              <button
                type="button"
                onClick={handleExportPdf}
                className="py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                title="Générer et télécharger la fiche de tournage .PDF professionnelle"
              >
                {exportedPdf ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>.PDF Téléchargé !</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Exporter .PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {savedScriptToast && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Script sauvegardé avec succès dans le studio (Ctrl + S) !</span>
            </div>
          )}

          {/* Typing indicator from remote peers */}
          {collab.typingUsers.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2 animate-pulse">
              <Edit3 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {collab.typingUsers.join(', ')} est en train de modifier le script en direct...
              </span>
            </div>
          )}

          {/* Real-time editable textarea or formatted preview */}
          {isLiveEditorMode ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-bold text-slate-300">
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  Éditeur en direct (modifications synchronisées en temps réel)
                </span>
                {collab.activeRoomId && (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Synchronisation multi-utilisateurs active
                  </span>
                )}
              </div>
              <textarea
                value={result.fullScript}
                onChange={(e) => {
                  handleScriptChange(e.target.value);
                  collab.sendTypingPresence(true);
                }}
                onBlur={() => collab.sendTypingPresence(false)}
                rows={13}
                className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-xl p-4 font-mono text-xs text-slate-100 leading-relaxed focus:outline-hidden resize-y select-text shadow-inner transition-colors"
                placeholder="Rédigez ou éditez votre script ici. Les modifications sont diffusées en direct à tous les collaborateurs connectés..."
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                <span>
                  {result.fullScript.trim().split(/\s+/).filter(Boolean).length} mots ·{' '}
                  {result.estimatedDuration || '~61s'}
                </span>
                <span className="text-slate-500 text-[10px]">
                  Calibré pour ~165-175 mots (60s+ TikTok Creator Rewards)
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#0b0f17] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-line">
              {result.fullScript}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-2">
            {result.hashtags.map((tag, idx) => (
              <span key={idx} className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-400 border border-slate-800">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Collaborative Blank Workspace if user joined via link but no result yet */}
      {collab.activeRoomId && !result && (
        <div className="bg-[#0f1522] border-2 border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                Espace de Co-Écriture Partagé (Session #{collab.activeRoomId})
              </span>
              <span className="text-[11px] text-slate-400">
                Vous êtes connecté avec {collab.activeUsers.length} collaborateur(s). Commencez à rédiger ou générez avec l'IA.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(collab.getShareLink());
                soundFx.playSfx('click');
                toast.success('Lien copié dans le presse-papiers !', 'Lien Partagé');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Inviter d'autres personnes</span>
            </button>
          </div>

          <textarea
            value=""
            onChange={(e) => handleScriptChange(e.target.value)}
            rows={10}
            className="w-full bg-[#0b0f17] border border-slate-800 focus:border-emerald-500 rounded-xl p-4 font-mono text-xs text-slate-100 leading-relaxed focus:outline-hidden resize-y select-text shadow-inner"
            placeholder="Tapez ici le script en direct avec vos collaborateurs..."
          />
        </div>
      )}

      {/* Predictive Engagement Tool using Gemini */}
      <PredictiveEngagementTool
        initialScript={result?.fullScript || ''}
        onApplyScript={(newHook) => {
          if (result) {
            setResult({
              ...result,
              hookText: newHook,
            });
          }
        }}
      />

      {/* ======================================================== */}
      {/* MODAL BROUILLONS HORS-LIGNE (INDEXEDDB)                   */}
      {/* ======================================================== */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-[#0f1522] border-2 border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Database className="w-4 h-4" />
                <span>Stockage Local IndexedDB & Synchronisation Serveur</span>
              </div>
              <h3 className="text-xl font-black text-white">Mes Brouillons de Scripts Hors-ligne</h3>
              <p className="text-xs text-slate-400">
                Tes brouillons sont conservés dans ton navigateur même sans internet, et synchronisés avec le serveur dès que la connexion revient.
              </p>
            </div>

            {/* Sync control row */}
            <div className="p-3 rounded-2xl bg-[#0b0f17] border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                )}
                <span className="text-slate-300">
                  État réseau : <strong className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>{isOnline ? 'En ligne' : 'Hors-ligne'}</strong>
                </span>
              </div>

              {isOnline && (
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
                </button>
              )}
            </div>

            {/* Drafts List */}
            <div className="space-y-2.5">
              {offlineDrafts.length === 0 ? (
                <div className="p-8 text-center bg-[#0b0f17] border border-slate-800 rounded-2xl space-y-2">
                  <FolderOpen className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">Aucun brouillon enregistré dans IndexedDB</p>
                  <p className="text-[11px] text-slate-500">
                    Clique sur "Sauvegarder (IndexedDB)" ou utilise Ctrl+S pour conserver tes scripts hors-ligne.
                  </p>
                </div>
              ) : (
                offlineDrafts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleRestoreDraft(d)}
                    className="p-4 rounded-2xl bg-[#0b0f17] border border-slate-800 hover:border-amber-500/50 transition-all flex items-start justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white group-hover:text-amber-300 transition-colors truncate">
                          {d.topic}
                        </h4>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                            d.synced
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {d.synced ? 'Synchronisé' : 'Stocké localement'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 italic font-mono">
                        {d.fullScript.slice(0, 160)}...
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(d.updatedAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{d.fullScript.split(/\s+/).filter(Boolean).length} mots</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteDraft(d.id, e)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 cursor-pointer"
                        title="Supprimer ce brouillon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Script Template Library Modal */}
      <ScriptTemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApplyTemplateForAi={handleApplyTemplateForAi}
        onLoadPrewrittenScript={handleLoadPrewrittenScript}
        currentSelectedTemplateId={activeTemplate?.id}
      />

      {/* Script Real-Time Multi-User Collaboration Modal */}
      <ScriptCollaborationModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        activeRoomId={collab.activeRoomId}
        isConnected={collab.isConnected}
        isConnecting={collab.isConnecting}
        activeUsers={collab.activeUsers}
        currentUser={collab.currentUser}
        shareLink={collab.getShareLink()}
        onStartOrJoin={collab.startOrJoinRoom}
        onLeave={collab.leaveRoom}
        onUpdateName={collab.updateMyName}
      />
    </div>
  );
};
