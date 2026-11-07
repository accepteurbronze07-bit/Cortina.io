import { NarrativeScriptStyle } from '../types';

export type ScriptTemplateCategory =
  | 'all'
  | 'storytelling'
  | 'aggressive_hook'
  | 'listicle'
  | 'before_after'
  | 'challenge'
  | 'educational';

export interface ScriptTemplateBlock {
  timeframe: string;
  name: string;
  purpose: string;
  sampleText: string;
}

export interface ScriptTemplate {
  id: string;
  title: string;
  category: ScriptTemplateCategory;
  categoryLabel: string;
  badge: string;
  viewsProjection: string;
  suggestedNiche: string;
  hookFormula: string;
  description: string;
  structure: ScriptTemplateBlock[];
  prewrittenScript: string;
  suggestedTitles: string[];
  suggestedHashtags: string[];
  retentionTip: string;
  recommendedStyle: NarrativeScriptStyle;
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'tpl_storytelling_critical',
    title: 'Storytelling Émotionnel & Sauvetage Critique',
    category: 'storytelling',
    categoryLabel: 'Storytelling',
    badge: '🔥 17.8M Vues',
    viewsProjection: '17.8M vues potentielles • RPM 2.05$',
    suggestedNiche: 'Sauvetage d’un chantier, rénovation impossible, transformation spectaculaire',
    hookFormula: '« Tout le monde lui disait d’abandonner, mais ce qu’on a trouvé au fond a tout changé... »',
    description:
      'Structure narrative en 5 actes axée sur l’empathie, la tension croissante et un rebondissement inattendu qui maximise le temps de visionnage moyen (Watch Time > 85%).',
    retentionTip:
      'Placez le doute le plus fort à 00:20 pour empêcher les utilisateurs de swiper avant le dénouement.',
    recommendedStyle: 'mystery_bottom',
    suggestedTitles: [
      '3 entreprises ont dit que c’était mort... Regardez le résultat !',
      'Le propriétaire pleurait devant ce désastre, mais on a refusé d’abandonner.',
      'Ce qu’on a découvert après 14h de travail acharné...',
    ],
    suggestedHashtags: ['#storytelling', '#renovation', '#sauvetage', '#satisfying', '#viralvideo', '#challenge'],
    structure: [
      {
        timeframe: '00:00 - 00:05',
        name: 'Hook Émotionnel & Mystère',
        purpose: 'Arrêt de défilement immédiat avec un enjeu humain et un secret non résolu.',
        sampleText: 'Tout le monde lui disait de tout jeter et d’abandonner. Mais quand je suis arrivé sur place, j’ai compris qu’on ne pouvait pas laisser cette situation ainsi.',
      },
      {
        timeframe: '00:05 - 00:18',
        name: 'Diagnostic Critique & Obstacle Infranchissable',
        purpose: 'Créer de la tension en montrant l’échec des méthodes habituelles.',
        sampleText: 'Ça faisait 3 ans que personne n’avait touché à ça. Les trois premières entreprises avaient refusé le chantier en affirmant que c’était irrécupérable.',
      },
      {
        timeframe: '00:18 - 00:35',
        name: 'Le Déclic & Protocole Chirurgical',
        purpose: 'Captiver avec un secret de fabrication ou une manœuvre inhabituelle.',
        sampleText: 'C’est là qu’on a sorti notre protocole secret. La plupart des gens pensent qu’il faut tout raser, mais avec le bon dosage et une précision millimétrique, la réaction a commencé.',
      },
      {
        timeframe: '00:35 - 00:50',
        name: 'La Transformation Spectaculaire',
        purpose: 'Récompenser le spectateur avec une libération visuelle gratifiante (effet satisfying).',
        sampleText: 'Regardez comment la crasse et les impuretés disparaissent en direct. Minute après minute, la clarté d’origine refait surface comme par magie.',
      },
      {
        timeframe: '00:50 - 01:01',
        name: 'Révélation Finale & Question Débat',
        purpose: 'Déclencher des dizaines de commentaires pour booster l’algorithme TikTok/Shorts.',
        sampleText: 'Au final, on a sauvé le projet pour un dixième du prix neuf. Et vous, auriez-vous pris le risque de tenter le coup ? Dites-le-moi en commentaire !',
      },
    ],
    prewrittenScript:
      'Tout le monde lui disait de tout jeter et d’abandonner. Mais quand je suis arrivé sur les lieux, j’ai immédiatement vu ce que les autres avaient raté. Ça faisait plus de trois ans que la situation empirait, et deux entreprises avaient déjà affirmé que c’était totalement mort. Sauf qu’on refuse de reculer devant un chantier difficile. On a d’abord attaqué avec notre formule concentrée pour neutraliser la première couche d’impuretés. À la vingtième minute, l’eau a viré d’un coup et la réaction chimique s’est déclenchée sous nos yeux. Regardez cette transition : chaque recoin reprend vie comme au premier jour. Le propriétaire n’en croyait pas ses yeux quand il a découvert le résultat après 6 heures de travail non-stop. On a sauvé l’installation complète sans rien remplacer. Honnêtement, auriez-vous baissé les bras à sa place ? Donnez-moi votre note sur dix en commentaire !',
  },
  {
    id: 'tpl_aggressive_hook',
    title: 'Hook Agressif & Rupture de Motif (Pattern Interrupt)',
    category: 'aggressive_hook',
    categoryLabel: 'Hook Agressif',
    badge: '⚡ Choc Immédiat',
    viewsProjection: '12.4M vues potentielles • Rétention 0-3s > 92%',
    suggestedNiche: 'Erreur fatale, avertissement d’urgence, secret controversé d’expert',
    hookFormula: '« Arrête IMMÉDIATEMENT de faire cette erreur ou tu vas détruire... »',
    description:
      'Démarrage brutal qui interrompt le scrolling passif en confrontant l’utilisateur avec un interdit ou une vérité dérangeante qui l’oblige à rester pour vérifier s’il fait la même bêtise.',
    retentionTip:
      'Ne donnez pas la solution avant 00:35 pour forcer le spectateur à écouter toute l’explication.',
    recommendedStyle: 'financial_shock',
    suggestedTitles: [
      'Si tu fais encore ça, arrête TOUT de suite...',
      'L’erreur à 4 500 € que 95 % des gens commettent chaque semaine',
      'Le secret interdit que les professionnels vous cachent exprès',
    ],
    suggestedHashtags: ['#erreur', '#astuce', '#attention', '#danger', '#secrets', '#viral'],
    structure: [
      {
        timeframe: '00:00 - 00:04',
        name: 'Interdiction Frontale Choc',
        purpose: 'Rupture cognitive brutale avec négation ou impératif direct.',
        sampleText: 'Arrête immédiatement de faire ça si tu ne veux pas bousiller l’intégralité de ton équipement !',
      },
      {
        timeframe: '00:04 - 00:16',
        name: 'La Preuve du Désastre en Image',
        purpose: 'Montrer les conséquences désastreuses que 90% des gens subissent sans le savoir.',
        sampleText: '95 % des personnes utilisent ce produit en pensant bien faire, alors que c’est précisément ce qui cause ce dépôt toxique indestructible.',
      },
      {
        timeframe: '00:16 - 00:35',
        name: 'L’Explication Technique sans Tabou',
        purpose: 'Instaurer une autorité incontestable avec des faits précis.',
        sampleText: 'Regardez ce qui se passe quand vous mélangez ces composants : une couche microscopique s’incruste et commence à ronger les parois de l’intérieur.',
      },
      {
        timeframe: '00:35 - 00:50',
        name: 'L’Alternative Ultime des Pros',
        purpose: 'Révéler la méthode exacte, accessible et méconnue pour tout sauver.',
        sampleText: 'Voici ce qu’il faut faire à la place : une seule dose de cette solution au pH neutre appliquée en cercles concentriques. En 10 minutes, c’est réglé.',
      },
      {
        timeframe: '00:50 - 01:01',
        name: 'Call to Action Polarisant',
        purpose: 'Pousser le public à débattre et partager avec un proche.',
        sampleText: 'Combien de fois as-tu commis cette erreur sans le savoir ? Sois honnête et dis-le-moi en commentaire !',
      },
    ],
    prewrittenScript:
      'Arrête immédiatement d’utiliser ce produit si tu ne veux pas ruiner définitivement toute ton installation ! Quatre-vingt-quinze pour cent des gens font cette erreur chaque semaine en pensant économiser de l’argent, alors que c’est précisément ce qui provoque cette catastrophe. Quand vous appliquez ça directement sur la surface, vous créez une réaction abrasive qui détruit le vernis de protection en moins de 48 heures. Regardez les dégâts : une accumulation de calcaire et de bactéries que plus aucun produit standard ne peut dissoudre. La vraie méthode des pros, c’est d’utiliser un mélange équilibré à pH contrôlé. En appliquant cette technique simple, vous dissolvez la crasse en profondeur sans jamais attaquer le matériau. Vous venez d’économiser des milliers d’euros de réparations. Partage cette vidéo à quelqu’un qui fait encore l’erreur, et dis-moi si tu savais déjà ça !',
  },
  {
    id: 'tpl_listicle_secrets',
    title: 'Listicle Viral "Top 3 Secrets Inavouables"',
    category: 'listicle',
    categoryLabel: 'Listicle',
    badge: '🔢 Format TikTok Roi',
    viewsProjection: '8.9M vues potentielles • Taux de complétion élevé',
    suggestedNiche: 'Conseils pratiques, astuces d’experts, erreurs à éviter, hacks rapides',
    hookFormula: '« 3 choses que les experts refusent de vous avouer (surtout la dernière)... »',
    description:
      'Format dynamique en 3 points quantifiés avec un mécanisme d’anticipation (Open Loop) sur le dernier point pour garantir un visionnage jusqu’à la dernière seconde.',
    retentionTip:
      'Gardez le point #3 pour la fin et annoncez dès la 4ème seconde qu’il est le plus rentable.',
    recommendedStyle: 'unexpected_discovery',
    suggestedTitles: [
      '3 secrets que les professionnels gardent pour eux...',
      '3 astuces gratuites qui vont te faire économiser des centaines d’euros',
      'Les 3 détails qui changent absolument TOUT (le 3e va te choquer)',
    ],
    suggestedHashtags: ['#astuces', '#top3', '#lifehack', '#secrets', '#tiktokhacks', '#viral'],
    structure: [
      {
        timeframe: '00:00 - 00:06',
        name: 'Hook Quantifié + Boucle Ouverte',
        purpose: 'Donner une promesse claire et verrouiller l’attention avec la règle du 3ème point.',
        sampleText: 'Voici 3 secrets que les pros ne vous diront jamais, et le dernier va vous éviter de perdre des milliers d’euros.',
      },
      {
        timeframe: '00:06 - 00:22',
        name: 'Secret #1 : Le Quick Win Immédiat',
        purpose: 'Offrir une valeur rapide et concrète pour valider la confiance du spectateur.',
        sampleText: 'Numéro 1 : n’achetez jamais le modèle grand public en rayon. Le secret réside dans la version concentrée disponible chez les grossistes pour 3 fois moins cher.',
      },
      {
        timeframe: '00:22 - 00:40',
        name: 'Secret #2 : L’Astuce Contre-Intuitive',
        purpose: 'Casser une croyance populaire pour relancer le rythme au milieu de la vidéo.',
        sampleText: 'Numéro 2 : frotter trop fort ne sert à rien. Il faut laisser agir le principe actif pendant exactement 12 minutes avant de rincer à basse pression.',
      },
      {
        timeframe: '00:40 - 00:54',
        name: 'Secret #3 : Le Game-Changer Absolu',
        purpose: 'Délivrer la promesse initiale avec une technique choc.',
        sampleText: 'Et enfin numéro 3, le plus important : toujours appliquer une couche d’étanchéité hydrophobe. L’eau s’écoule instantanément sans laisser la moindre trace.',
      },
      {
        timeframe: '00:54 - 01:01',
        name: 'Interaction & Enregistrement',
        purpose: 'Générer des sauvegardes (bookmarks) prioritaires dans l’algorithme.',
        sampleText: 'Enregistre cette vidéo pour ne pas l’oublier, et dis-moi en commentaire celle que tu vas tester dès aujourd’hui !',
      },
    ],
    prewrittenScript:
      'Voici les 3 secrets que les professionnels refusent de vous avouer, et le dernier va littéralement vous faire économiser une fortune. Premier secret : n’achetez jamais les produits de nettoyage déjà dilués en supermarché. Vous payez 90 % d’eau. Prenez la formule pure chez un revendeur professionnel et dosez-la vous-même, vous ferez 5 fois plus d’utilisations pour le même prix. Deuxième secret : ne frottez jamais à sec. La clé réside dans le temps de pose thermique : appliquez à tiède et laissez reposer 8 minutes montre en main pour que les molécules fassent tout le travail à votre place. Et enfin le troisième secret, le plus important : terminez toujours par un film protecteur déperlant à base de silice. La saleté ne pourra plus jamais accrocher pendant au moins 6 mois. Enregistre cette vidéo pour l’avoir sous la main, et dis-moi en commentaire lequel de ces 3 hacks tu appliques déjà !',
  },
  {
    id: 'tpl_before_after',
    title: 'Avant / Après Choc & Métamorphose Radicale',
    category: 'before_after',
    categoryLabel: 'Avant / Après',
    badge: '✨ Satisfaisant',
    viewsProjection: '14.2M vues potentielles • Bouclage infini (Loop)',
    suggestedNiche: 'Nettoyage extrême, remise à neuf, réhabilitation, detailing',
    hookFormula: '« Regardez l’état catastrophique de cet endroit... Le résultat final paraît irréel. »',
    description:
      'Contraste saisissant entre un désordre total au début et une perfection clinique à la fin, créant une satisfaction visuelle puissante qui incite au rewatch.',
    retentionTip:
      'Montrez un aperçu d’une demi-seconde du résultat propre dès le hook pour piquer la curiosité.',
    recommendedStyle: 'unexpected_discovery',
    suggestedTitles: [
      'De marais toxique à paradis d’eau turquoise en 24h !',
      'Personne ne croyait que c’était récupérable... Regardez bien !',
      'Le Avant / Après le plus satisfaisant de l’année...',
    ],
    suggestedHashtags: ['#avantapres', '#satisfying', '#transformation', '#cleanwithme', '#oddlysatisfying', '#viral'],
    structure: [
      {
        timeframe: '00:00 - 00:05',
        name: 'Choc Visuel Brutal',
        purpose: 'Montrer la pire situation possible pour instaurer un point de départ saisissant.',
        sampleText: 'Regardez attentivement l’état lamentable dans lequel on a trouvé cet endroit. Une eau croupie, des moisissures et une odeur insoutenable.',
      },
      {
        timeframe: '00:05 - 00:18',
        name: 'Le Verdict sans Pitié',
        purpose: 'Renforcer la difficulté du défi.',
        sampleText: 'Même les anciens propriétaires avaient capitulé. Tout le monde nous disait que c’était une cause perdue d’avance.',
      },
      {
        timeframe: '00:18 - 00:38',
        name: 'L’Assaut Technique Pas-à-Pas',
        purpose: 'Découpage d’actions rapides et satisfaisantes.',
        sampleText: 'On a aspiré les résidus profonds, injecté notre traitement de choc et décapé millimètre par millimètre. Regardez la ligne de démarcation ultra nette.',
      },
      {
        timeframe: '00:38 - 00:52',
        name: 'Le Reveal Lumineux (Climax)',
        purpose: 'Offrir la vision parfaite de l’accomplissement.',
        sampleText: 'Et voilà la magie : une surface immaculée, une eau d’un bleu cristallin et une clarté digne d’un hôtel cinq étoiles.',
      },
      {
        timeframe: '00:52 - 01:01',
        name: 'Notation Participative',
        purpose: 'Forcer l’engagement par une note chiffrée.',
        sampleText: 'Franchement, sur une échelle de 1 à 10, quelle note donnes-tu à cette transformation ? Dis-le en commentaire !',
      },
    ],
    prewrittenScript:
      'Regardez bien l’état absolument catastrophique dans lequel on a trouvé les lieux ce matin. Une couche de crasse de plusieurs centimètres, une stagnation totale et une odeur infecte qui régnait sur place. Tout le monde jurait qu’il fallait tout détruire et repartir à zéro. Mais nous, on adore relever les défis impossibles. Première étape : évacuation complète de la vase superficielle avec une pompe d’extraction haut débit. Ensuite, application de notre solvant dégraissant à action immédiate. Admirez la ligne de séparation ultra satisfaisante entre la zone traitée et la partie encore encrassée. Après seulement 5 heures d’un travail chirurgical, voici le grand moment du reveal. C’est limpide, brillant et parfaitement sain. Note cette transformation de 1 à 10 dans les commentaires !',
  },
  {
    id: 'tpl_challenge_24h',
    title: 'Défi 24h & Course contre la montre (Urgence Max)',
    category: 'challenge',
    categoryLabel: 'Challenge 24h',
    badge: '⏱️ Tension Maximale',
    viewsProjection: '11.1M vues potentielles • RPM 1.95$',
    suggestedNiche: 'Chantier express, deadline impossible, sauvetage avant événement ou mariage',
    hookFormula: '« J’avais exactement 24 heures pour accomplir ce miracle avant l’arrivée des invités... »',
    description:
      'Récit palpitant avec compte à rebours en temps réel, obstacles inattendus et solution in extremis qui maintient le spectateur en haleine.',
    retentionTip:
      'Insérez des mentions horaires régulières (H+3, H+14, H+22) pour matérialiser l’urgence.',
    recommendedStyle: 'mystery_bottom',
    suggestedTitles: [
      'Le mariage commence dans 24h et la piscine est verte... Sauvetage express !',
      'Défi impossible : rénover tout ça en moins d’une journée chrono',
      'Le compte à rebours le plus stressant de toute ma carrière...',
    ],
    suggestedHashtags: ['#challenge24h', '#urgence', '#sauvetage', '#chrono', '#pression', '#viral'],
    structure: [
      {
        timeframe: '00:00 - 00:06',
        name: 'L’Enjeu et le Compte à Rebours',
        purpose: 'Créer un compte à rebours avec un enjeu dramatique.',
        sampleText: 'J’avais très exactement 24 heures pour transformer ce désastre avant le début de la grande réception de famille.',
      },
      {
        timeframe: '00:06 - 00:20',
        name: 'H+4 : L’Obstacle Fatal qui Bloque Tout',
        purpose: 'Plonger le spectateur dans le doute.',
        sampleText: 'À H+4, catastrophe : le filtre principal a explosé sous la pression. Il a fallu tout démonter en urgence sous la pluie.',
      },
      {
        timeframe: '00:20 - 00:40',
        name: 'H+12 : La Nuit Blanche et le Coup de Poker',
        purpose: 'Intensifier la tension dramatique au cœur de la nuit.',
        sampleText: 'Il est 3 heures du matin. Mes yeux piquent mais on enchaîne les cycles de filtration non-stop avec notre solution d’urgence.',
      },
      {
        timeframe: '00:40 - 00:52',
        name: 'H+23 : La Victoire In Extremis',
        purpose: 'Délivrer le soulagement éclatant à quelques minutes de la deadline.',
        sampleText: 'À seulement une heure de l’arrivée des premiers invités, le miracle s’est produit : une eau parfaitement cristalline et limpide.',
      },
      {
        timeframe: '00:52 - 01:01',
        name: 'Défi Communautaire',
        purpose: 'Créer un appel à l’interaction.',
        sampleText: 'Auriez-vous tenu sous une telle pression ? Laisse un like si le résultat est validé !',
      },
    ],
    prewrittenScript:
      'J’avais très exactement 24 heures pour sauver cette piscine avant l’arrivée de cinquante invités pour un mariage. Quand je suis arrivé sur place hier midi, l’eau ressemblait à un marécage toxique impénétrable. Les mariés étaient au bord des larmes. À H+4, premier coup dur : la pompe de filtration rend l’âme sous l’épaisseur des dépôts. Pas le temps de paniquer, on a improvisé un circuit de secours avec nos propres groupes mobiles. À 2 heures du matin en pleine nuit, la température chutait mais la réaction d’oxydation a enfin commencé à agir. H+18 au lever du soleil : les particules mortes tombent au fond et on aspire la totalité sans perdre une minute. Regardez le résultat à H+23, pile une heure avant le cocktail : une eau turquoise digne d’une carte postale. Tu aurais réussi à tenir ce défi ? Démontre ton soutien en t’abonnant !',
  },
  {
    id: 'tpl_educational_howto',
    title: 'Tutoriel Éducatif & How-To Express 60s',
    category: 'educational',
    categoryLabel: 'Éducatif / How-To',
    badge: '🧠 Forte Rétention & Partages',
    viewsProjection: '9.8M vues potentielles • Taux d’enregistrement maximal',
    suggestedNiche: 'Apprentissage pas-à-pas, guide de dépannage, tutoriel technique simplifié',
    hookFormula: '« Voici exactement comment réussir ça chez toi en 3 étapes simples sans dépenser un sou... »',
    description:
      'Guide pratique à forte valeur ajoutée qui résout un problème douloureux avec une clarté chirurgicale, idéal pour maximiser les sauvegardes et les partages.',
    retentionTip:
      'Numérotez clairement chaque étape à l’écran pour donner une sensation d’avancement rapide.',
    recommendedStyle: 'unexpected_discovery',
    suggestedTitles: [
      'Comment régler ce problème en 60 secondes chrono sans rien payer',
      'Le guide pas-à-pas que tout le monde devrait connaître',
      'Tuto express : répare ça toi-même comme un pro',
    ],
    suggestedHashtags: ['#tuto', '#howto', '#apprendre', '#astucedujour', '#bricolage', '#lifehack'],
    structure: [
      {
        timeframe: '00:00 - 00:05',
        name: 'La Promesse Chiffrée sans Blabla',
        purpose: 'Attirer avec une solution directe à un problème pénible.',
        sampleText: 'Voici comment régler définitivement ce problème en moins de 60 secondes sans faire appel à un réparateur.',
      },
      {
        timeframe: '00:05 - 00:20',
        name: 'Étape 1 : Le Diagnostic Instantané',
        purpose: 'Vérification simple accessible à un débutant.',
        sampleText: 'Première étape : vérifie ce clapet situé à l’arrière. S’il est bloqué par le tartre, c’est 80 % de la panne.',
      },
      {
        timeframe: '00:20 - 00:38',
        name: 'Étape 2 : L’Action Précise de Déblocage',
        purpose: 'Le geste technique salvateur expliqué en quelques secondes.',
        sampleText: 'Deuxième étape : pulvérise un mélange tiède d’eau et de vinaigre blanc à 14 degrés, puis effectue un quart de tour vers la droite.',
      },
      {
        timeframe: '00:38 - 00:52',
        name: 'Étape 3 : Le Test de Réussite',
        purpose: 'Valider le fonctionnement et constater le retour à la normale.',
        sampleText: 'Troisième étape : relance la pression et écoute le déclic caractéristique. Le débit revient instantanément à son niveau d’origine.',
      },
      {
        timeframe: '00:52 - 01:01',
        name: 'Call to Action Utilité',
        purpose: 'Pousser au favori et au partage.',
        sampleText: 'Enregistre ce tuto pour le jour où tu auras la panne, et abonne-toi pour plus d’astuces utiles au quotidien !',
      },
    ],
    prewrittenScript:
      'Voici comment résoudre ce problème chez toi en moins de 60 secondes sans débourser le moindre centime pour un dépanneur. Première étape : localisez la vanne d’admission située sur le côté gauche. Si elle présente ce léger suintement, c’est simplement le joint torique qui s’est délogé avec la pression. Deuxième étape : dévissez d’un demi-tour à la main sans outil pour ne rien casser. Nettoyez l’embase avec un chiffon propre et appliquez une goutte de lubrifiant silicone pour rétablir une étanchéité parfaite. Troisième étape : revissez jusqu’à la butée et ouvrez l’arrivée principale. Observez : plus aucune fuite, la pression est revenue à 2 bars pile comme en sortie d’usine. Vous venez d’économiser une intervention facturée au moins 150 euros. Enregistre la vidéo pour l’avoir le jour où ça t’arrive, et partage-la à tes amis !',
  },
];
