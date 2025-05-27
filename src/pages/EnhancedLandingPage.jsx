import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Chip,
  useTheme,
  alpha,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Fade,
  Zoom,
  Avatar,
  AvatarGroup,
  useMediaQuery,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  Security,
  Speed,
  Euro,
  Check,
  ArrowForward,
  Shield,
  LocationOn,
  Timer,
  Block,
  AdminPanelSettings,
  People,
  Event,
  Description,
  Forum,
  FolderShared,
  Poll,
  Mood,
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  Palette as PaletteIcon,
  Image as ImageIcon,
  Language as LanguageIcon,
  MonetizationOn,
  Store,
  ShoppingCart
} from '@mui/icons-material';
import ThreeJSBackground from '../components/ThreeJSBackground';

const EnhancedLandingPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [language, setLanguage] = useState('en');
  const [anchorEl, setAnchorEl] = useState(null);

  // Sample user avatars for social proof
  const sampleUsers = [
    { name: 'Marie', avatar: '/api/placeholder/32/32' },
    { name: 'Pierre', avatar: '/api/placeholder/32/32' },
    { name: 'Sophie', avatar: '/api/placeholder/32/32' },
    { name: 'Lucas', avatar: '/api/placeholder/32/32' },
    { name: 'Emma', avatar: '/api/placeholder/32/32' }
  ];

  // Translations
  const translations = {
    en: {
      signIn: 'Sign In',
      getStarted: 'Get Started',
      heroTitle: ['Your Private Network.', 'Built for Privacy.'],
      heroSubtitle: 'Create your private network where privacy comes first. No tracking, no ads, no data mining. Your community, your rules.',
      heroCatchline: 'Finally, a place where your team can connect without being the product being sold.',
      startFreeTrial: 'Start Your Free Trial',
      viewPricing: 'View Pricing',
      joinOrgs: 'Join 500+ organizations already building in private',
      gdprCompliant: 'GDPR Compliant',
      gdprDesc: 'Full EU data protection',
      dataStaysEurope: 'Data Stays in Europe',
      hostedFrance: 'Hosted in France',
      setupMinutes: 'Setup in 2 Minutes',
      noTechSkills: 'No technical skills needed',
      zeroTracking: 'Zero Tracking',
      noAdsAnalytics: 'No ads, no analytics',
      builtForOrgs: 'Built for Organizations That Value Privacy',
      fourPillars: 'Four pillars that make your network secure and simple',
      simplyPowerful: 'Simply Powerful',
      simplyPowerfulDesc: 'Set up in minutes, not hours. Intuitive design that anyone can master without training.',
      privateCircle: 'Your Private Circle',
      privateCircleDesc: 'Invite-only networks. Your conversations, files, and creativity stay within your trusted circle.',
      completeControl: 'Complete Control',
      completeControlDesc: 'GDPR compliant by default. Your data stays in Europe. Export anytime, cancel instantly.',
      visualCollab: 'Visual Collaboration',
      visualCollabDesc: 'Moodboards, wikis, and portfolios. Express ideas visually with your team.',
      everythingNeed: 'Everything You Need, Nothing You Don\'t',
      coreFeatures: 'Core features included in every plan',
      secureChat: 'Secure Chat',
      realTimeMsg: 'Real-time messaging',
      fileSharing: 'File Sharing',
      upTo5TB: 'Up to 5TB storage',
      events: 'Events',
      calendarRSVP: 'Calendar & RSVPs',
      wiki: 'Wiki',
      knowledgeBase: 'Knowledge base',
      polls: 'Polls',
      decisionsVoting: 'Decisions & voting',
      moodboards: 'Moodboards',
      visualCollabShort: 'Visual collaboration',
      monetization: 'Monetization',
      sellWorkshops: 'Sell workshops & events',
      monetizeAudience: 'Monetize Your Audience',
      monetizeDesc: 'Sell workshops, premium content, exclusive events, and special offers directly to your community members.',
      whyChooseConclav: 'Why Organizations Choose Conclav',
      onlyPlatformPrivacy: 'The only platform that puts your privacy first, not your data for sale',
      keepUnwantedOut: 'Keep Unwanted Eyes Out',
      keepUnwantedDesc: 'Invite-only communities that stay private. No public profiles, no search indexing, no data harvesting. Your conversations belong to you, not advertisers.',
      dataStaysYours: 'Your Data Stays Yours',
      dataStaysYoursDesc: 'No ads, no analytics, no selling your information. We make money from subscriptions, not from you. Export your data anytime, cancel instantly.',
      completeControlTitle: 'You\'re In Complete Control',
      completeControlDesc2: 'Manage members, moderate content, and customize everything with simple admin tools. Set your own rules, your own way.',
      builtEuropeanPrivacy: 'Built for European Privacy',
      builtEuropeanDesc: 'GDPR compliant by design. Your data never leaves Europe. Transparent privacy practices you can actually understand.',
      setupMinutesTitle: 'Setup in Minutes, Not Days',
      setupMinutesDesc2: 'No complex configurations or IT headaches. Create your private network in under 5 minutes with our simple setup wizard.',
      builtRealCollab: 'Built for Real Collaboration',
      builtRealCollabDesc: 'Everything your team needs: secure chat, file sharing, event planning, and member directories. No algorithm manipulation, just genuine connections.',
      transparentPricing: 'Transparent Pricing, No Surprises',
      noHiddenFees: 'No hidden fees. No data selling. Just honest pricing.',
      community: 'Community',
      forSmallCommunities: 'For small communities and groups',
      nonProfit: 'Non-Profit',
      forEducational: 'For educational & non-profit organizations',
      professional: 'Professional',
      forGrowingOrgs: 'For growing organizations',
      members: 'members',
      storage: 'storage',
      adminAccounts: 'admin accounts',
      emailSupport: 'Email support',
      allCoreFeatures: 'All core features',
      dayFreeTrial: '14-day free trial',
      whiteLabel: 'White label option',
      prioritySupport: 'Priority support',
      specialNGORate: 'Special NGO rate',
      whiteLabelIncluded: 'White label included',
      mostPopular: 'Most popular choice',
      startFreeTrial2: 'Start Free Trial',
      needMore: 'Need more? Check out our',
      enterprisePlans: 'Enterprise plans',
      unlimitedStorage: 'for unlimited members and storage',
      readyControl: 'Ready to Take Control?',
      joinThousands: 'Join thousands who\'ve chosen privacy over surveillance',
      noCreditCard: 'No credit card required',
      setupUnder2: 'Setup in under 2 minutes',
      cancelAnytime: 'Cancel anytime',
      createNetwork: 'Create Your Private Network',
      copyright: '© 2024 Conclav. Built with privacy in mind, hosted in France 🇫🇷',
      privacyPolicy: 'Privacy Policy',
      termsService: 'Terms of Service',
      documentation: 'Documentation',
      perMonth: '/month'
    },
    fr: {
      signIn: 'Se connecter',
      getStarted: 'Commencer',
      heroTitle: ['Votre Réseau Privé.', 'Conçu pour la Confidentialité.'],
      heroSubtitle: 'Créez votre réseau privé où la confidentialité prime. Pas de suivi, pas de publicités, pas d\'exploration de données. Votre communauté, vos règles.',
      heroCatchline: 'Enfin, un endroit où votre équipe peut se connecter sans être le produit vendu.',
      startFreeTrial: 'Commencer l\'essai gratuit',
      viewPricing: 'Voir les tarifs',
      joinOrgs: 'Rejoignez plus de 500 organisations qui construisent déjà en privé',
      gdprCompliant: 'Conforme RGPD',
      gdprDesc: 'Protection complète des données UE',
      dataStaysEurope: 'Données en Europe',
      hostedFrance: 'Hébergé en France',
      setupMinutes: 'Configuration en 2 minutes',
      noTechSkills: 'Aucune compétence technique requise',
      zeroTracking: 'Zéro Suivi',
      noAdsAnalytics: 'Pas de pubs, pas d\'analytics',
      builtForOrgs: 'Conçu pour les Organisations qui Valorisent la Confidentialité',
      fourPillars: 'Quatre piliers qui rendent votre réseau sécurisé et simple',
      simplyPowerful: 'Simplement Puissant',
      simplyPowerfulDesc: 'Configuration en minutes, pas en heures. Design intuitif que tout le monde peut maîtriser sans formation.',
      privateCircle: 'Votre Cercle Privé',
      privateCircleDesc: 'Réseaux sur invitation uniquement. Vos conversations, fichiers et créativité restent dans votre cercle de confiance.',
      completeControl: 'Contrôle Total',
      completeControlDesc: 'Conforme RGPD par défaut. Vos données restent en Europe. Exportez à tout moment, annulez instantanément.',
      visualCollab: 'Collaboration Visuelle',
      visualCollabDesc: 'Moodboards, wikis et portfolios. Exprimez vos idées visuellement avec votre équipe.',
      everythingNeed: 'Tout ce Dont Vous Avez Besoin, Rien de Plus',
      coreFeatures: 'Fonctionnalités principales incluses dans chaque plan',
      secureChat: 'Chat Sécurisé',
      realTimeMsg: 'Messages en temps réel',
      fileSharing: 'Partage de Fichiers',
      upTo5TB: 'Jusqu\'à 5 To de stockage',
      events: 'Événements',
      calendarRSVP: 'Calendrier et RSVP',
      wiki: 'Wiki',
      knowledgeBase: 'Base de connaissances',
      polls: 'Sondages',
      decisionsVoting: 'Décisions et votes',
      moodboards: 'Moodboards',
      visualCollabShort: 'Collaboration visuelle',
      monetization: 'Monétisation',
      sellWorkshops: 'Vendre ateliers et événements',
      monetizeAudience: 'Monétisez Votre Audience',
      monetizeDesc: 'Vendez des ateliers, du contenu premium, des événements exclusifs et des offres spéciales directement à vos membres.',
      whyChooseConclav: 'Pourquoi les Organisations Choisissent Conclav',
      onlyPlatformPrivacy: 'La seule plateforme qui met votre confidentialité en premier, pas vos données à vendre',
      keepUnwantedOut: 'Tenez les Regards Indésirables à Distance',
      keepUnwantedDesc: 'Communautés sur invitation uniquement qui restent privées. Pas de profils publics, pas d\'indexation de recherche, pas de collecte de données. Vos conversations vous appartiennent, pas aux publicitaires.',
      dataStaysYours: 'Vos Données Vous Appartiennent',
      dataStaysYoursDesc: 'Pas de publicités, pas d\'analytics, pas de vente de vos informations. Nous gagnons de l\'argent avec les abonnements, pas avec vous. Exportez vos données à tout moment, annulez instantanément.',
      completeControlTitle: 'Vous Avez le Contrôle Total',
      completeControlDesc2: 'Gérez les membres, modérez le contenu et personnalisez tout avec des outils d\'administration simples. Définissez vos propres règles, à votre manière.',
      builtEuropeanPrivacy: 'Conçu pour la Confidentialité Européenne',
      builtEuropeanDesc: 'Conforme RGPD par conception. Vos données ne quittent jamais l\'Europe. Pratiques de confidentialité transparentes que vous pouvez réellement comprendre.',
      setupMinutesTitle: 'Configuration en Minutes, Pas en Jours',
      setupMinutesDesc2: 'Pas de configurations complexes ou de maux de tête informatiques. Créez votre réseau privé en moins de 5 minutes avec notre assistant de configuration simple.',
      builtRealCollab: 'Conçu pour la Vraie Collaboration',
      builtRealCollabDesc: 'Tout ce dont votre équipe a besoin : chat sécurisé, partage de fichiers, planification d\'vénements et annuaires de membres. Pas de manipulation d\'algorithme, juste des connexions authentiques.',
      transparentPricing: 'Tarification Transparente, Sans Surprises',
      noHiddenFees: 'Pas de frais cachés. Pas de vente de données. Juste une tarification honnête.',
      community: 'Communauté',
      forSmallCommunities: 'Pour petites communautés et groupes',
      nonProfit: 'Association',
      forEducational: 'Pour organisations éducatives et associations',
      professional: 'Professionnel',
      forGrowingOrgs: 'Pour organisations en croissance',
      members: 'membres',
      storage: 'stockage',
      adminAccounts: 'comptes admin',
      emailSupport: 'Support par email',
      allCoreFeatures: 'Toutes les fonctions essentielles',
      dayFreeTrial: 'Essai gratuit de 14 jours',
      whiteLabel: 'Option marque blanche',
      prioritySupport: 'Support prioritaire',
      specialNGORate: 'Tarif spécial ONG',
      whiteLabelIncluded: 'Marque blanche incluse',
      mostPopular: 'Choix le plus populaire',
      startFreeTrial2: 'Commencer l\'essai gratuit',
      needMore: 'Besoin de plus ? Consultez nos',
      enterprisePlans: 'Plans entreprise',
      unlimitedStorage: 'pour membres et stockage illimités',
      readyControl: 'Prêt à Prendre le Contrôle ?',
      joinThousands: 'Rejoignez des milliers qui ont choisi la confidentialité plutôt que la surveillance',
      noCreditCard: 'Aucune carte de crédit requise',
      setupUnder2: 'Configuration en moins de 2 minutes',
      cancelAnytime: 'Annulez à tout moment',
      createNetwork: 'Créer Votre Réseau Privé',
      copyright: '© 2024 Conclav. Conçu pour la confidentialité, hébergé en France 🇫🇷',
      privacyPolicy: 'Politique de Confidentialité',
      termsService: 'Conditions d\'Utilisation',
      documentation: 'Documentation',
      perMonth: '/mois'
    },
    es: {
      signIn: 'Iniciar sesión',
      getStarted: 'Empezar',
      heroTitle: ['Tu Red Privada.', 'Creada para la Privacidad.'],
      heroSubtitle: 'Crea tu red privada donde la privacidad es lo primero. Sin rastreo, sin anuncios, sin minería de datos. Tu comunidad, tus reglas.',
      heroCatchline: 'Finalmente, un lugar donde tu equipo puede conectarse sin ser el producto que se vende.',
      startFreeTrial: 'Iniciar prueba gratuita',
      viewPricing: 'Ver precios',
      joinOrgs: 'Únete a más de 500 organizaciones que ya construyen en privado',
      gdprCompliant: 'Cumple con GDPR',
      gdprDesc: 'Protección completa de datos de la UE',
      dataStaysEurope: 'Datos en Europa',
      hostedFrance: 'Alojado en Francia',
      setupMinutes: 'Configuración en 2 minutos',
      noTechSkills: 'No se requieren habilidades técnicas',
      zeroTracking: 'Cero Rastreo',
      noAdsAnalytics: 'Sin anuncios, sin analíticas',
      builtForOrgs: 'Creado para Organizaciones que Valoran la Privacidad',
      fourPillars: 'Cuatro pilares que hacen tu red segura y simple',
      simplyPowerful: 'Simplemente Poderoso',
      simplyPowerfulDesc: 'Configura en minutos, no en horas. Diseño intuitivo que cualquiera puede dominar sin capacitación.',
      privateCircle: 'Tu Círculo Privado',
      privateCircleDesc: 'Redes solo por invitación. Tus conversaciones, archivos y creatividad permanecen dentro de tu círculo de confianza.',
      completeControl: 'Control Total',
      completeControlDesc: 'Cumple con GDPR por defecto. Tus datos permanecen en Europa. Exporta cuando quieras, cancela al instante.',
      visualCollab: 'Colaboración Visual',
      visualCollabDesc: 'Moodboards, wikis y portafolios. Expresa ideas visualmente con tu equipo.',
      everythingNeed: 'Todo lo que Necesitas, Nada Más',
      coreFeatures: 'Características principales incluidas en cada plan',
      secureChat: 'Chat Seguro',
      realTimeMsg: 'Mensajería en tiempo real',
      fileSharing: 'Compartir Archivos',
      upTo5TB: 'Hasta 5TB de almacenamiento',
      events: 'Eventos',
      calendarRSVP: 'Calendario y RSVP',
      wiki: 'Wiki',
      knowledgeBase: 'Base de conocimientos',
      polls: 'Encuestas',
      decisionsVoting: 'Decisiones y votaciones',
      moodboards: 'Moodboards',
      visualCollabShort: 'Colaboración visual',
      monetization: 'Monetización',
      sellWorkshops: 'Vender talleres y eventos',
      monetizeAudience: 'Monetiza Tu Audiencia',
      monetizeDesc: 'Vende talleres, contenido premium, eventos exclusivos y ofertas especiales directamente a los miembros de tu comunidad.',
      whyChooseConclav: 'Por Qué las Organizaciones Eligen Conclav',
      onlyPlatformPrivacy: 'La única plataforma que pone tu privacidad primero, no tus datos en venta',
      keepUnwantedOut: 'Mantén Fuera las Miradas No Deseadas',
      keepUnwantedDesc: 'Comunidades solo por invitación que permanecen privadas. Sin perfiles públicos, sin indexación de búsqueda, sin recolección de datos. Tus conversaciones te pertenecen, no a los anunciantes.',
      dataStaysYours: 'Tus Datos Son Tuyos',
      dataStaysYoursDesc: 'Sin anuncios, sin analíticas, sin venta de tu información. Ganamos dinero con suscripciones, no contigo. Exporta tus datos en cualquier momento, cancela al instante.',
      completeControlTitle: 'Tienes Control Total',
      completeControlDesc2: 'Gestiona miembros, modera contenido y personaliza todo con herramientas de administración simples. Establece tus propias reglas, a tu manera.',
      builtEuropeanPrivacy: 'Creado para la Privacidad Europea',
      builtEuropeanDesc: 'Cumple con GDPR por diseño. Tus datos nunca salen de Europa. Prácticas de privacidad transparentes que realmente puedes entender.',
      setupMinutesTitle: 'Configuración en Minutos, No Días',
      setupMinutesDesc2: 'Sin configuraciones complejas o dolores de cabeza de TI. Crea tu red privada en menos de 5 minutos con nuestro asistente de configuración simple.',
      builtRealCollab: 'Creado para la Colaboración Real',
      builtRealCollabDesc: 'Todo lo que tu equipo necesita: chat seguro, compartir archivos, planificación de eventos y directorios de miembros. Sin manipulación de algoritmos, solo conexiones genuinas.',
      transparentPricing: 'Precios Transparentes, Sin Sorpresas',
      noHiddenFees: 'Sin tarifas ocultas. Sin venta de datos. Solo precios honestos.',
      community: 'Comunidad',
      forSmallCommunities: 'Para comunidades y grupos pequeños',
      nonProfit: 'Sin Fines de Lucro',
      forEducational: 'Para organizaciones educativas y sin fines de lucro',
      professional: 'Profesional',
      forGrowingOrgs: 'Para organizaciones en crecimiento',
      members: 'miembros',
      storage: 'almacenamiento',
      adminAccounts: 'cuentas de administrador',
      emailSupport: 'Soporte por correo',
      allCoreFeatures: 'Todas las funciones principales',
      dayFreeTrial: 'Prueba gratuita de 14 días',
      whiteLabel: 'Opción marca blanca',
      prioritySupport: 'Soporte prioritario',
      specialNGORate: 'Tarifa especial ONG',
      whiteLabelIncluded: 'Marca blanca incluida',
      mostPopular: 'Opción más popular',
      startFreeTrial2: 'Iniciar prueba gratuita',
      needMore: '¿Necesitas más? Consulta nuestros',
      enterprisePlans: 'Planes empresariales',
      unlimitedStorage: 'para miembros y almacenamiento ilimitados',
      readyControl: '¿Listo para Tomar el Control?',
      joinThousands: 'Únete a miles que han elegido la privacidad sobre la vigilancia',
      noCreditCard: 'No se requiere tarjeta de crédito',
      setupUnder2: 'Configuración en menos de 2 minutos',
      cancelAnytime: 'Cancela en cualquier momento',
      createNetwork: 'Crear Tu Red Privada',
      copyright: '© 2024 Conclav. Creado con privacidad en mente, alojado en Francia 🇫🇷',
      privacyPolicy: 'Política de Privacidad',
      termsService: 'Términos de Servicio',
      documentation: 'Documentación',
      perMonth: '/mes'
    }
  };

  const t = translations[language];

  const trustIndicators = [
    { icon: <Shield />, label: t.gdprCompliant, description: t.gdprDesc },
    { icon: <LocationOn />, label: t.dataStaysEurope, description: t.hostedFrance },
    { icon: <Timer />, label: t.setupMinutes, description: t.noTechSkills },
    { icon: <Block />, label: t.zeroTracking, description: t.noAdsAnalytics }
  ];

  const features = [
    {
      id: 'simple',
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      title: t.simplyPowerful,
      description: t.simplyPowerfulDesc,
      color: theme.palette.primary.main
    },
    {
      id: 'private',
      icon: <LockIcon sx={{ fontSize: 40 }} />,
      title: t.privateCircle,
      description: t.privateCircleDesc,
      color: theme.palette.success.main
    },
    {
      id: 'control',
      icon: <AdminPanelSettings sx={{ fontSize: 40 }} />,
      title: t.completeControl,
      description: t.completeControlDesc,
      color: theme.palette.secondary.main
    },
    {
      id: 'creative',
      icon: <ImageIcon sx={{ fontSize: 40 }} />,
      title: t.visualCollab,
      description: t.visualCollabDesc,
      color: theme.palette.error.main
    }
  ];

  const platformFeatures = [
    { icon: <Forum />, name: t.secureChat, description: t.realTimeMsg },
    { icon: <FolderShared />, name: t.fileSharing, description: t.upTo5TB },
    { icon: <Event />, name: t.events, description: t.calendarRSVP },
    { icon: <Description />, name: t.wiki, description: t.knowledgeBase },
    { icon: <Poll />, name: t.polls, description: t.decisionsVoting },
    { icon: <Mood />, name: t.moodboards, description: t.visualCollabShort },
    { icon: <MonetizationOn />, name: t.monetization, description: t.sellWorkshops }
  ];

  const pricingPlans = [
    {
      name: t.community,
      price: 17,
      description: t.forSmallCommunities,
      features: [
        `100 ${t.members}`,
        `10GB ${t.storage}`,
        `2 ${t.adminAccounts}`,
        t.emailSupport,
        t.allCoreFeatures,
        t.dayFreeTrial
      ],
      highlighted: false
    },
    {
      name: t.nonProfit,
      price: 49,
      description: t.forEducational,
      features: [
        `500 ${t.members}`,
        `50GB ${t.storage}`,
        `3 ${t.adminAccounts}`,
        t.whiteLabel,
        t.prioritySupport,
        t.specialNGORate
      ],
      highlighted: false,
      badge: 'NGO/EDU'
    },
    {
      name: t.professional,
      price: 87,
      description: t.forGrowingOrgs,
      features: [
        `500 ${t.members}`,
        `100GB ${t.storage}`,
        `5 ${t.adminAccounts}`,
        t.whiteLabelIncluded,
        t.prioritySupport,
        t.mostPopular
      ],
      highlighted: true,
      badge: 'POPULAR'
    }
  ];

  const handleLanguageClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    handleLanguageClose();
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Three.js Background */}
      <ThreeJSBackground />
      
      {/* Overlay for better text readability */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.background.default, 0.85)} 0%, 
            ${alpha(theme.palette.background.default, 0.75)} 50%, 
            ${alpha(theme.palette.background.default, 0.85)} 100%)`,
          backdropFilter: 'blur(1px)',
          zIndex: 1,
          height: '100%',
        }}
      />

      {/* Navigation */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            Conclav
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              onClick={handleLanguageClick}
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <LanguageIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleLanguageClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={() => handleLanguageSelect('en')} selected={language === 'en'}>
                🇬🇧 English
              </MenuItem>
              <MenuItem onClick={() => handleLanguageSelect('fr')} selected={language === 'fr'}>
                🇫🇷 Français
              </MenuItem>
              <MenuItem onClick={() => handleLanguageSelect('es')} selected={language === 'es'}>
                🇪🇸 Español
              </MenuItem>
            </Menu>
            <Button 
              component={RouterLink} 
              to="/login" 
              variant="outlined"
              size="small"
            >
              {t.signIn}
            </Button>
            <Button 
              component={RouterLink} 
              to="/signup" 
              variant="contained"
              size="small"
            >
              {t.getStarted}
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
          <Fade in timeout={1000}>
            <Typography 
              variant={isMobile ? "h3" : "h1"} 
              sx={{ 
                fontWeight: 900,
                mb: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t.heroTitle[0]}
              <br />
              {t.heroTitle[1]}
            </Typography>
          </Fade>

          <Fade in timeout={1200}>
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 2,
                color: theme.palette.primary.main,
                maxWidth: 800,
                mx: 'auto',
                fontWeight: 500,
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontStyle: 'italic',
                lineHeight: 1.4
              }}
            >
              "{t.heroCatchline}"
            </Typography>
          </Fade>

          <Fade in timeout={1300}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 4, 
                color: theme.palette.text.secondary,
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              {t.heroSubtitle}
            </Typography>
          </Fade>

          <Zoom in timeout={1400}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              justifyContent="center"
              sx={{ mb: 6 }}
            >
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  transition: 'all 0.3s ease'
                }}
                endIcon={<ArrowForward />}
              >
                {t.startFreeTrial}
              </Button>
              <Button
                component={RouterLink}
                to="/pricing"
                variant="outlined"
                size="large"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                {t.viewPricing}
              </Button>
            </Stack>
          </Zoom>

          {/* Social Proof */}
          <Fade in timeout={1600}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
              <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
                {sampleUsers.map((user, index) => (
                  <Avatar key={index} alt={user.name} sx={{ bgcolor: theme.palette.primary.light }}>
                    {user.name[0]}
                  </Avatar>
                ))}
              </AvatarGroup>
              <Typography variant="body2" color="text.secondary">
                {t.joinOrgs}
              </Typography>
            </Box>
          </Fade>

          {/* Trust Indicators */}
          <Grid container spacing={2} justifyContent="center" sx={{ mt: 4 }}>
            {trustIndicators.map((indicator, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Fade in timeout={1800 + index * 100}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: alpha(theme.palette.primary.main, 0.05),
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                      }
                    }}
                  >
                    <Box sx={{ color: 'primary.main', mb: 1 }}>
                      {React.cloneElement(indicator.icon, { sx: { fontSize: 30 } })}
                    </Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight="600">
                      {indicator.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {indicator.description}
                    </Typography>
                  </Paper>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>

      {/* Core Features */}
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, pb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            {t.builtForOrgs}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            {t.fourPillars}
          </Typography>
        </Box>
        
        <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mb: 6 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} lg={3} key={feature.id}>
              <Zoom in timeout={800 + index * 200}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: { xs: 3, md: 4 },
                    border: `2px solid transparent`,
                    background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${alpha(feature.color, 0.2)}, ${alpha(feature.color, 0.05)}) border-box`,
                    borderRadius: 3,
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${alpha(feature.color, 0.03)}, transparent)`,
                      opacity: hoveredFeature === feature.id ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                      borderRadius: 3
                    },
                    '&:hover': {
                      transform: 'translateY(-12px) scale(1.02)',
                      boxShadow: `0 20px 60px ${alpha(feature.color, 0.15)}, 0 8px 20px ${alpha(feature.color, 0.1)}`,
                      border: `2px solid ${alpha(feature.color, 0.2)}`
                    }
                  }}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <Box 
                    sx={{ 
                      position: 'relative',
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <Box 
                      sx={{ 
                        mb: 3,
                        color: feature.color,
                        transform: hoveredFeature === feature.id ? 'scale(1.1)' : 'scale(1)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                  </Box>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Why Organizations Choose Conclav */}
      <Box sx={{ py: 10, position: 'relative', zIndex: 2, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              {t.whyChooseConclav}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
              {t.onlyPlatformPrivacy}
            </Typography>
          </Box>
          
          <Grid container spacing={4} sx={{minWidth: '100%', flexDirection: 'column'}}>
            <Grid item xs={12} md={6} lg={4} sx={{minWidth: '100%', flexDirection: 'column'}}>
              <Fade in timeout={1000}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    width: '100%',
                    p: 4,
                    textAlign: 'center',
                    background: 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  <Security sx={{ fontSize: 50, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h5" fontWeight="600" gutterBottom>
                    {t.keepUnwantedOut}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t.keepUnwantedDesc}
                  </Typography>
                </Card>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <Fade in timeout={1200}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    background: 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  <Block sx={{ fontSize: 50, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h5" fontWeight="600" gutterBottom>
                    {t.dataStaysYours}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t.dataStaysYoursDesc}
                  </Typography>
                </Card>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <Fade in timeout={1400}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    background: 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  <AdminPanelSettings sx={{ fontSize: 50, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h5" fontWeight="600" gutterBottom>
                    {t.completeControlTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t.completeControlDesc2}
                  </Typography>
                </Card>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <Fade in timeout={1600}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    background: 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  <LanguageIcon sx={{ fontSize: 50, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h5" fontWeight="600" gutterBottom>
                    {t.builtEuropeanPrivacy}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t.builtEuropeanDesc}
                  </Typography>
                </Card>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <Fade in timeout={1800}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    background: 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  <Speed sx={{ fontSize: 50, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h5" fontWeight="600" gutterBottom>
                    {t.setupMinutesTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t.setupMinutesDesc2}
                  </Typography>
                </Card>
              </Fade>
            </Grid>
            
            <Grid item xs={12} md={6} lg={4}>
              <Fade in timeout={2000}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 4,
                    textAlign: 'center',
                    background: 'transparent',
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }
                  }}
                >
                  <People sx={{ fontSize: 50, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h5" fontWeight="600" gutterBottom>
                    {t.builtRealCollab}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {t.builtRealCollabDesc}
                  </Typography>
                </Card>
              </Fade>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Platform Features */}
      <Box sx={{ py: 10, position: 'relative', zIndex: 2, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
            {t.everythingNeed}
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            {t.coreFeatures}
          </Typography>
          
          <Grid container spacing={3}>
            {platformFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Fade in timeout={1000 + index * 100}>
                  <Box
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.05),
                        transform: 'translateY(-4px)'
                      }
                    }}
                  >
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {React.cloneElement(feature.icon, { sx: { fontSize: 50 } })}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {feature.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Monetization Section */}
      <Box sx={{ py: 10, position: 'relative', zIndex: 2 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 3 }}>
                {t.monetizeAudience}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                {t.monetizeDesc}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Store sx={{ color: 'primary.main', mr: 2, fontSize: 30 }} />
                    <Typography variant="h6" fontWeight="600">
                      {language === 'en' ? 'Premium Content' : language === 'fr' ? 'Contenu Premium' : 'Contenido Premium'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'en' ? 'Sell exclusive content, courses, and digital products' : 
                     language === 'fr' ? 'Vendez du contenu exclusif, des cours et des produits numériques' :
                     'Vende contenido exclusivo, cursos y productos digitales'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Event sx={{ color: 'primary.main', mr: 2, fontSize: 30 }} />
                    <Typography variant="h6" fontWeight="600">
                      {language === 'en' ? 'Paid Events' : language === 'fr' ? 'Événements Payants' : 'Eventos de Pago'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'en' ? 'Host workshops, masterclasses, and exclusive meetups' : 
                     language === 'fr' ? 'Organisez des ateliers, masterclasses et rencontres exclusives' :
                     'Organiza talleres, masterclasses y encuentros exclusivos'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShoppingCart sx={{ color: 'primary.main', mr: 2, fontSize: 30 }} />
                    <Typography variant="h6" fontWeight="600">
                      {language === 'en' ? 'Special Offers' : language === 'fr' ? 'Offres Spéciales' : 'Ofertas Especiales'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'en' ? 'Create exclusive deals and early access for your community' : 
                     language === 'fr' ? 'Créez des offres exclusives et un accès anticipé pour votre communauté' :
                     'Crea ofertas exclusivas y acceso anticipado para tu comunidad'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AdminPanelSettings sx={{ color: 'primary.main', mr: 2, fontSize: 30 }} />
                    <Typography variant="h6" fontWeight="600">
                      {language === 'en' ? 'Member Tiers' : language === 'fr' ? 'Niveaux de Membres' : 'Niveles de Miembros'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {language === 'en' ? 'Create premium memberships with exclusive access and benefits' : 
                     language === 'fr' ? 'Créez des adhésions premium avec accès et avantages exclusifs' :
                     'Crea membresías premium con acceso exclusivo y beneficios'}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Zoom in timeout={1000}>
                <Card
                  elevation={0}
                  sx={{
                    p: 4,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    borderRadius: 3,
                    textAlign: 'center'
                  }}
                >
                  <MonetizationOn sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                  <Typography variant="h4" fontWeight="700" gutterBottom>
                    {language === 'en' ? 'Turn Your Community Into Revenue' : 
                     language === 'fr' ? 'Transformez Votre Communauté en Revenus' :
                     'Convierte Tu Comunidad en Ingresos'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {language === 'en' ? 'Integrated payment processing, automatic invoicing, and member management - all in one platform.' : 
                     language === 'fr' ? 'Traitement de paiement intégré, facturation automatique et gestion des membres - tout sur une plateforme.' :
                     'Procesamiento de pagos integrado, facturación automática y gestión de miembros - todo en una plataforma.'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Stripe" variant="outlined" size="small" />
                    <Chip label="PayPal" variant="outlined" size="small" />
                    <Chip label={language === 'en' ? 'Bank Transfer' : language === 'fr' ? 'Virement' : 'Transferencia'} variant="outlined" size="small" />
                  </Box>
                </Card>
              </Zoom>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box id="pricing" sx={{ py: 10, position: 'relative', zIndex: 2 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" textAlign="center" gutterBottom sx={{ mb: 2, fontWeight: 700 }}>
            {t.transparentPricing}
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            {t.noHiddenFees}
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            {pricingPlans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Zoom in timeout={1200 + index * 200}>
                  <Card
                    sx={{
                      p: 4,
                      height: '100%',
                      position: 'relative',
                      textAlign: 'center',
                      border: plan.highlighted 
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      background: plan.highlighted
                        ? `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.05)}) border-box`
                        : 'transparent',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.15)}`
                      }
                    }}
                  >
                    {plan.badge && (
                      <Chip
                        label={plan.badge}
                        color={plan.highlighted ? 'primary' : 'default'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 20,
                          right: 20
                        }}
                      />
                    )}
                    
                    <Typography variant="h4" gutterBottom fontWeight="600">
                      {plan.name}
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h2" component="span" fontWeight="700">
                        €{plan.price}
                      </Typography>
                      <Typography variant="h6" component="span" color="text.secondary">
                        {t.perMonth}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                      {plan.description}
                    </Typography>
                    
                    <List sx={{ mb: 4 }}>
                      {plan.features.map((feature, idx) => (
                        <ListItem key={idx} disableGutters sx={{ justifyContent: 'center' }}>
                          <ListItemIcon sx={{ minWidth: 35 }}>
                            <Check color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={feature} />
                        </ListItem>
                      ))}
                    </List>
                    
                    <Button
                      fullWidth
                      variant={plan.highlighted ? 'contained' : 'outlined'}
                      size="large"
                      onClick={() => navigate('/signup')}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        boxShadow: plan.highlighted ? `0 8px 24px ${alpha(theme.palette.primary.main, 0.25)}` : 'none',
                        '&:hover': {
                          boxShadow: plan.highlighted ? `0 12px 32px ${alpha(theme.palette.primary.main, 0.35)}` : 'none'
                        }
                      }}
                    >
                      {t.startFreeTrial2}
                    </Button>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>
          
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body1" color="text.secondary">
              {t.needMore}{' '}
              <Button
                variant="text"
                onClick={() => navigate('/pricing')}
                sx={{ textTransform: 'none' }}
              >
                {t.enterprisePlans}
              </Button>
              {' '}{t.unlimitedStorage}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 10, position: 'relative', zIndex: 2, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              {t.readyControl}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
              {t.joinThousands}
            </Typography>
            
            <Stack spacing={2} sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              {[
                t.noCreditCard,
                t.dayFreeTrial,
                t.setupUnder2,
                t.cancelAnytime
              ].map((item, index) => (
                <Fade in timeout={1600 + index * 100} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <Check color="primary" />
                    <Typography variant="body1">{item}</Typography>
                  </Box>
                </Fade>
              ))}
            </Stack>
            
            <Zoom in timeout={2000}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                endIcon={<ArrowForward />}
                sx={{
                  py: 2,
                  px: 6,
                  fontSize: '1.2rem',
                  borderRadius: 3,
                  boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {t.createNetwork}
              </Button>
            </Zoom>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 6, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`, position: 'relative', zIndex: 2 }}>
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              {t.copyright}
            </Typography>
            <Stack direction="row" spacing={3}>
              <Button variant="text" size="small" onClick={() => navigate('/privacy')}>
                {t.privacyPolicy}
              </Button>
              <Button variant="text" size="small" onClick={() => navigate('/terms')}>
                {t.termsService}
              </Button>
              <Button variant="text" size="small" onClick={() => navigate('/documentation')}>
                {t.documentation}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default EnhancedLandingPage;