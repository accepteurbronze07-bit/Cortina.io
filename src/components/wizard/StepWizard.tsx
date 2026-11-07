import React, { useState, useEffect, useRef } from 'react';
import { Check, Sparkles, Maximize2, Minimize2, Monitor } from 'lucide-react';
import {
  VideoClip,
  VoiceOption,
  SubtitleStyle,
  BackgroundMusic,
  AppLanguage,
  CompletedCreation,
} from '../../types';
import { translations } from '../../locales/translations';
import { Step1Links } from './Step1Links';
import { Step2Hook } from './Step2Hook';
import { Step3VoiceSubtitles, VOICE_OPTIONS, SUBTITLE_STYLES, MUSIC_TRACKS } from './Step3VoiceSubtitles';
import { Step4CaptionMask } from './Step4CaptionMask';
import { Step5ScriptViral } from './Step5ScriptViral';
import { soundFx } from '../../utils/audioUtils';
import { toast } from '../toast/ToastContext';

interface StepWizardProps {
  language: AppLanguage;
  onCreationComplete: (creation: CompletedCreation) => void;
  userCredits: number;
  onDeductCredit: () => void;
  onRequireUpgrade?: () => void;
}

const INITIAL_CLIPS: VideoClip[] = [
  {
    id: 'clip_1',
    url: '',
    title: 'Vidéo TikTok #1',
    views: '',
    likes: '',
    duration: '0:00',
    thumbnail: '',
    isHook: true,
    mirrorHorizontal: false,
    blurZone: {
      x: 8,
      y: 72,
      width: 84,
      height: 16,
      blurAmount: 20,
      opacity: 0,
      enabled: false,
      style: 'pure-blur',
      topBottomBlurEnabled: true,
      topBottomBlurPct: 16,
      mirrorHorizontal: false,
    },
    hasDetectedSubtitles: true,
  },
  {
    id: 'clip_2',
    url: '',
    title: 'Vidéo TikTok #2',
    views: '',
    likes: '',
    duration: '0:00',
    thumbnail: '',
    isHook: false,
    mirrorHorizontal: false,
    blurZone: {
      x: 8,
      y: 72,
      width: 84,
      height: 16,
      blurAmount: 20,
      opacity: 0,
      enabled: false,
      style: 'pure-blur',
      topBottomBlurEnabled: true,
      topBottomBlurPct: 16,
      mirrorHorizontal: false,
    },
    hasDetectedSubtitles: true,
  },
];

export const StepWizard: React.FC<StepWizardProps> = ({
  language,
  onCreationComplete,
  userCredits,
  onDeductCredit,
  onRequireUpgrade,
}) => {
  const t = translations[language] || translations.FR;
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Listen to keyboard shortcut Ctrl+N (New Project)
  useEffect(() => {
    const handleNewProj = () => {
      setCurrentStep(1);
    };
    window.addEventListener('cortia:new-project', handleNewProj);
    return () => window.removeEventListener('cortia:new-project', handleNewProj);
  }, []);

  // Fullscreen Workspace State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    soundFx.playSfx('click');
    setIsFullscreen((prev) => {
      const next = !prev;
      if (next) {
        toast.info(
          'Mode Plein Écran activé. Appuyez sur Échap ou F pour quitter.',
          'Workspace Agrandie'
        );
        try {
          if (workspaceRef.current && !document.fullscreenElement) {
            workspaceRef.current.requestFullscreen().catch(() => {});
          }
        } catch {}
      } else {
        toast.info('Retour au mode standard.', 'Plein Écran');
        try {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {}
      }
      return next;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        if (e.key === 'Escape' && isFullscreen) {
          setIsFullscreen(false);
          soundFx.playSfx('click');
        }
        return;
      }

      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        soundFx.playSfx('click');
        toast.info('Retour au mode standard.', 'Plein Écran');
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const handleCustomToggle = () => {
      toggleFullscreen();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('cortia:toggle-fullscreen', handleCustomToggle);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('cortia:toggle-fullscreen', handleCustomToggle);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Wizard state
  const [videos, setVideos] = useState<VideoClip[]>(INITIAL_CLIPS);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [script, setScript] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Réinitialiser le script et l'audio dès qu'une nouvelle vidéo est sélectionnée
  const handleNewVideoUpload = (file: File) => {
    setVideoFile(file);
    setScript('');       // <-- Vide l'ancien script
    setAudioUrl(null);    // <-- Supprime l'ancien audio
    try {
      localStorage.removeItem('cortia_stepwizard_script_versions');
      localStorage.removeItem('cortia_cached_script_result');
    } catch {}
    window.dispatchEvent(
      new CustomEvent('cortia:reset-script-audio', { detail: { fileName: file?.name } })
    );
    setCurrentStep(2);
  };

  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>({
    ...VOICE_OPTIONS[0],
    voiceVolume: 130,
  });
  const [selectedSubtitle, setSelectedSubtitle] = useState<SubtitleStyle>({
    ...SUBTITLE_STYLES[0],
    hookBannerEnabled: true,
    hookBannerText: 'TRANSFORMATION TOTALE ! ⚡',
    hookBannerBgColor: 'yellow',
  });
  const [selectedMusic, setSelectedMusic] = useState<BackgroundMusic>(MUSIC_TRACKS[0]);
  const [musicVolume, setMusicVolume] = useState<number>(22);

  const stepsList = [
    { number: 1, label: t.step1Title, subtitle: 'Liens' },
    { number: 2, label: t.step2Title, subtitle: 'Hook' },
    { number: 3, label: 'Voix & Style', subtitle: 'Audio' },
    { number: 4, label: 'Caption Mask', subtitle: 'Floutage' },
    { number: 5, label: 'Script & Rendu', subtitle: 'Final' },
  ];

  const handleStepClick = (stepNumber: 1 | 2 | 3 | 4 | 5) => {
    // Only allow clicking previously visited or active steps
    if (stepNumber <= currentStep) {
      soundFx.playSfx('click');
      setCurrentStep(stepNumber);
    }
  };

  return (
    <div
      ref={workspaceRef}
      className={`transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#070a0f] p-4 sm:p-6 lg:p-8 overflow-y-auto flex flex-col space-y-6 shadow-2xl'
          : 'space-y-6'
      }`}
    >
      {/* Fullscreen Floating Top Navigation Bar or Normal Mode Header */}
      {isFullscreen ? (
        <div className="sticky top-0 z-40 bg-[#0f1522]/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-emerald-500/25">
              <Monitor className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">Cortia Studio · Workspace Plein Écran</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Mode Immersif
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Étape {currentStep}/5 : {stepsList[currentStep - 1]?.label} — Espace de travail agrandi pour un montage précis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick step navigation pills */}
            <div className="hidden md:flex items-center gap-1 bg-[#070a0f] p-1 rounded-xl border border-slate-800">
              {stepsList.map((st) => (
                <button
                  key={st.number}
                  type="button"
                  onClick={() => handleStepClick(st.number as any)}
                  disabled={st.number > currentStep}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentStep === st.number
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : currentStep > st.number
                      ? 'text-white hover:text-emerald-300'
                      : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {st.number}. {st.subtitle}
                </button>
              ))}
            </div>

            {/* Exit Fullscreen button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/40 text-slate-200 hover:text-rose-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
              title="Quitter le mode plein écran (Touche Échap ou F)"
            >
              <Minimize2 className="w-4 h-4 text-rose-400" />
              <span>Quitter Plein Écran</span>
              <kbd className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
                Échap
              </kbd>
            </button>
          </div>
        </div>
      ) : (
        /* Normal Mode Top Bar: Step info + Enter Fullscreen Button */
        <div className="flex items-center justify-between gap-3 max-w-4xl mx-auto px-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-300">
              Studio de Montage Vidéo · Étape {currentStep}/5 ({stepsList[currentStep - 1]?.label})
            </span>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3 py-1.5 rounded-xl bg-[#0f1522] hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs group"
            title="Agrandir l'espace de travail en mode plein écran (Touche F)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Mode Plein Écran</span>
            <kbd className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-400">
              F
            </kbd>
          </button>
        </div>
      )}

      {/* 5-Step Numbered Stepper (1 - 2 - 3 - 4 - 5) */}
      <div className={`bg-[#0f1522] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg mx-auto ${isFullscreen ? 'max-w-7xl w-full' : 'max-w-4xl'}`}>
        <div className="relative flex items-center justify-between">
          {/* Background Connecting Line */}
          <div className="absolute left-6 right-6 top-5 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
          <div
            className="absolute left-6 top-5 -translate-y-1/2 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 -z-0"
            style={{ width: `${((currentStep - 1) / 4) * 88}%` }}
          />

          {stepsList.map((st) => {
            const isCompleted = currentStep > st.number;
            const isCurrent = currentStep === st.number;

            return (
              <button
                key={st.number}
                type="button"
                onClick={() => handleStepClick(st.number as any)}
                disabled={st.number > currentStep}
                className="relative z-10 flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed"
              >
                {/* Step Circle with glowing ring when active */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                      : isCurrent
                      ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/20 shadow-lg shadow-emerald-500/30 scale-110'
                      : 'bg-slate-900 border-2 border-slate-800 text-slate-400 group-hover:border-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : st.number}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`block text-[11px] sm:text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'text-emerald-400'
                        : isCompleted
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                  <span className="hidden sm:block text-[10px] text-slate-400">
                    {st.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Switcher */}
      <div className={`transition-opacity duration-300 ${isFullscreen ? 'max-w-7xl w-full mx-auto flex-1' : ''}`}>
        {currentStep === 1 && (
          <Step1Links
            videos={videos}
            onUpdateVideos={setVideos}
            onNext={() => setCurrentStep(2)}
            language={language}
            onNewVideoUpload={handleNewVideoUpload}
          />
        )}

        {currentStep === 2 && (
          <Step2Hook
            videos={videos}
            onUpdateVideos={setVideos}
            onNext={() => setCurrentStep(3)}
            onPrev={() => setCurrentStep(1)}
            language={language}
          />
        )}

        {currentStep === 3 && (
          <Step3VoiceSubtitles
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            selectedSubtitle={selectedSubtitle}
            onSubtitleChange={setSelectedSubtitle}
            selectedMusic={selectedMusic}
            onMusicChange={setSelectedMusic}
            musicVolume={musicVolume}
            onVolumeChange={setMusicVolume}
            onNext={() => setCurrentStep(4)}
            onPrev={() => setCurrentStep(2)}
            appLanguage={language}
          />
        )}

        {currentStep === 4 && (
          <Step4CaptionMask
            videos={videos}
            onUpdateVideos={setVideos}
            selectedSubtitle={selectedSubtitle}
            onSubtitleChange={setSelectedSubtitle}
            onNext={() => setCurrentStep(5)}
            onPrev={() => setCurrentStep(3)}
            language={language}
          />
        )}

        {currentStep === 5 && (
          <Step5ScriptViral
            videos={videos}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            selectedVoice={selectedVoice}
            onVoiceChange={setSelectedVoice}
            selectedSubtitle={selectedSubtitle}
            onSubtitleChange={setSelectedSubtitle}
            selectedMusic={selectedMusic}
            onMusicChange={setSelectedMusic}
            musicVolume={musicVolume}
            onMusicVolumeChange={setMusicVolume}
            onPrev={() => setCurrentStep(4)}
            onCreationComplete={onCreationComplete}
            appLanguage={language}
            userCredits={userCredits}
            onDeductCredit={onDeductCredit}
            onRequireUpgrade={onRequireUpgrade}
            videoFile={videoFile}
            script={script}
            setScript={setScript}
            audioUrl={audioUrl}
            setAudioUrl={setAudioUrl}
          />
        )}
      </div>
    </div>
  );
};
