import { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Chip,
  Stack,
  Paper,
  keyframes,
  alpha
} from '@mui/material';
import {
  Security,
  Speed,
  Group,
  Shield,
  Rocket,
  Block,
  Public,
  ArrowForward,
  Feed,
  Chat,
  EventAvailable,
  MenuBook,
  School,
  Palette,
  Email,
  ConfirmationNumber,
  ContactPage,
  Notifications,
  Favorite,
  AdminPanelSettings,
  FlightTakeoff,
  VerifiedUser
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import screenshot1 from '../assets/screensforsteps/1.png';
import screenshot2 from '../assets/screensforsteps/2.png';
import screenshot3 from '../assets/screensforsteps/3.png';
import helloAssoLogo from '../assets/Logo-HelloAsso.svg.png';

// Define animation keyframes
const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(40px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;


// Translations object
const translations = {
  en: {
  europeanBadge: "🇪🇺 Made in Europe • Independent of Silicon Valley",
  subtitle: "A private social network that truly respects you",
  description: "Create your own trusted micro-networks in minutes, with total privacy. No tracking. No ads. No Big Tech.",
  descriptionStrong: "Only authentic human connections.",
  startFreeTrial: "Start in 5 Minutes",
  seeDemo: "Watch the Demo",
  trialInfo: "14 days free • No credit card required • Cancel anytime",

  howItWorks: "How It Works",
  howItWorksSubtitle: "Your private network in 3 simple steps",

  step1Title: "Create Your Space",
  step1Description: "Name your network, upload your logo, and customize it in seconds. No technical setup required.",
  step2Title: "Invite Your People",
  step2Description: "Invite members by email or link. You decide who joins and what's shared. Nothing goes public unless you choose.",
  step3Title: "Share & Connect",
  step3Description: "Publish posts, organize meetups, or share your work, all inside a safe, ad-free environment.",

  breakFree: "Your Network, Your Rules",
  noTracking: "Take back control from Big Tech. Build communities on your own terms, with complete independence and transparency.",
  fullControl: "Full Admin Control",
  fullControlDesc: "You're in charge. Manage members, moderate content, and customize every aspect of your network. No corporate oversight, no hidden algorithms.",
  trueIndependence: "True Independence",
  trueIndependenceDesc: "Built in Europe, free from Silicon Valley giants. Your community belongs to you, not to advertisers or data brokers.",
  simplicityTrust: "Simple & Trustworthy",
  simplicityTrustDesc: "No tracking. No surveillance. No surprises. Just a straightforward platform designed to serve your community, not exploit it.",

  everythingYouNeed: "Everything you need, nothing you don't.",
  simpleSecure: "Simple & Secure",
  simpleSecureDesc: "Build networks in seconds. Share content, host events, and chat securely with end-to-end protection and zero corporate oversight.",
  europeanAlternative: "Built for Europe",
  europeanAlternativeDesc: "Designed and hosted entirely in Europe. A genuine alternative to Silicon Valley platforms that respect your digital independence.",

  readyToOwn: "Ready to own your digital space?",
  joinThousands: "Join thousands of creators and professionals building authentic, privacy-first communities.",
  startYourFreeTrial: "Start for Free",
  finalTrialInfo: "Free for 14 days • Setup under 5 minutes • Cancel anytime",

  helloAssoTitle: "Fundraising Made Easy",
  helloAssoSubtitle: "Integrated with HelloAsso",
  helloAssoDescription: "Accept donations for your association directly on your network. 100% free, no commission, 0% platform fee. Powered by HelloAsso, France's leading donation platform for associations.",
  helloAssoFeature1: "Zero fees",
  helloAssoFeature1Desc: "No commission, no subscription",
  helloAssoFeature2: "Secure payments",
  helloAssoFeature2Desc: "Certified payment platform",
  helloAssoFeature3: "One-click setup",
  helloAssoFeature3Desc: "Embed your donation form instantly",
  
  featuresTitle: "Everything your community needs to thrive",
  featuresSubtitle: "Powerful tools designed for real human connection",
  
  socialWallTitle: "Social Wall",
  socialWallDesc: "Share moments, ideas, and updates in a beautiful feed",
  
  groupChatTitle: "Group Chat", 
  groupChatDesc: "Real-time conversations that bring your community together",
  
  eventsTitle: "Events",
  eventsDesc: "Organize gatherings, meetings, and celebrations with ease",
  
  wikiTitle: "Wiki",
  wikiDesc: "Build collective knowledge and share resources",
  
  coursesTitle: "Courses",
  coursesDesc: "Create and share learning experiences within your network",
  
  moodboardsTitle: "Moodboards",
  moodboardsDesc: "Curate visual inspiration and creative collections",
  
  newsletterTitle: "Newsletter", 
  newsletterDesc: "Keep everyone informed with beautiful updates",
  
  ticketingTitle: "Ticketing",
  ticketingDesc: "Manage registrations and access to your events",

  directoryTitle: "Directory",
  directoryDesc: "Connect members with a comprehensive contact hub",

  donationsTitle: "Donations",
  donationsDesc: "Accept donations seamlessly with HelloAsso integration",

  notificationsTitle: "Smart Notifications",
  notificationsDesc: "Respectful email updates that value your attention"
},

  fr: {
  europeanBadge: "🇪🇺 Conçu en Europe • Indépendant de la Silicon Valley",
  subtitle: "Le réseau social privé qui vous respecte",
  description: "Créez vos propres micro-réseaux de confiance en quelques minutes, avec une confidentialité totale. Aucun traçage. Aucune pub. Aucun bot. Aucune Big Tech.",
  descriptionStrong: "Uniquement des connexions humaines authentiques.",
  startFreeTrial: "Commencez en 5 minutes",
  seeDemo: "Voir la démo",
  trialInfo: "14 jours gratuits • Aucune carte requise • Annulez à tout moment",

  howItWorks: "Comment ça marche",
  howItWorksSubtitle: "Votre réseau privé en 3 étapes simples",

  step1Title: "Créez votre espace",
  step1Description: "Choisissez un nom, téléchargez votre logo et personnalisez votre réseau en quelques secondes. Aucun réglage technique nécessaire.",
  step2Title: "Invitez vos membres",
  step2Description: "Envoyez des invitations par e-mail ou partagez un lien. Vous contrôlez qui peut entrer et ce qui est partagé. Rien ne devient public sans votre accord.",
  step3Title: "Partagez et connectez-vous",
  step3Description: "Publiez, organisez des événements ou montrez vos projets, dans un espace sûr, sans publicité ni algorithme.",

  breakFree: "Votre réseau, vos règles",
  noTracking: "Reprenez le contrôle face aux Big Tech. Créez des communautés selon vos propres conditions, en toute indépendance et transparence.",
  fullControl: "Contrôle administrateur total",
  fullControlDesc: "Vous êtes aux commandes. Gérez les membres, modérez le contenu et personnalisez chaque aspect de votre réseau. Aucune surveillance, aucun algorithme caché.",
  trueIndependence: "Vraie indépendance",
  trueIndependenceDesc: "Conçu en Europe, libre des géants de la Silicon Valley. Votre communauté vous appartient, pas aux annonceurs ni aux courtiers de données.",
  simplicityTrust: "Simple et de confiance",
  simplicityTrustDesc: "Aucun tracking. Aucune surveillance. Aucune surprise. Juste une plateforme transparente conçue pour servir votre communauté, pas pour l'exploiter.",

  everythingYouNeed: "Tout ce dont vous avez besoin, rien de superflu.",
  simpleSecure: "Simple et sécurisé",
  simpleSecureDesc: "Créez vos réseaux en quelques secondes. Partagez, organisez, discutez en toute sécurité, sans surveillance.",
  europeanAlternative: "Conçu en Europe",
  europeanAlternativeDesc: "Développé et hébergé en Europe. Une alternative aux plateformes de la Silicon Valley.",

  readyToOwn: "Prêt à développer votre espace numérique ?",
  joinThousands: "Rejoignez des milliers de créateurs, d'associations et de professionnels qui construisent des communautés authentiques et respectueuses de la vie privée.",
  startYourFreeTrial: "Commencez gratuitement",
  finalTrialInfo: "14 jours gratuits • Installation en moins de 5 minutes • Annulez à tout moment",

  helloAssoTitle: "Collectez simplement",
  helloAssoSubtitle: "Intégré avec HelloAsso",
  helloAssoDescription: "Acceptez des dons pour votre association directement sur votre réseau. 100% gratuit, sans commission, 0% de frais. Propulsé par HelloAsso, la plateforme de référence pour les associations françaises.",
  helloAssoFeature1: "Zéro frais",
  helloAssoFeature1Desc: "Pas de commission, pas d'abonnement",
  helloAssoFeature2: "Paiements sécurisés",
  helloAssoFeature2Desc: "Plateforme de paiement certifiée",
  helloAssoFeature3: "Installation en un clic",
  helloAssoFeature3Desc: "Intégrez votre formulaire instantanément",
  
  featuresTitle: "Tout ce dont votre communauté a besoin pour s'épanouir",
  featuresSubtitle: "Des outils puissants conçus pour des connexions humaines authentiques",
  
  socialWallTitle: "Mur social",
  socialWallDesc: "Partagez des moments, idées et actualités dans un fil élégant",
  
  groupChatTitle: "Chat de groupe",
  groupChatDesc: "Des conversations en temps réel qui rassemblent votre communauté",
  
  eventsTitle: "Événements", 
  eventsDesc: "Organisez rencontres, réunions et célébrations facilement",
  
  wikiTitle: "Wiki",
  wikiDesc: "Construisez un savoir collectif et partagez des ressources",
  
  coursesTitle: "Cours",
  coursesDesc: "Créez et partagez des expériences d'apprentissage dans votre réseau",
  
  moodboardsTitle: "Moodboards",
  moodboardsDesc: "Créez des collections visuelles inspirantes et créatives",
  
  newsletterTitle: "Newsletter",
  newsletterDesc: "Tenez tout le monde informé avec de belles actualités",
  
  ticketingTitle: "Billetterie",
  ticketingDesc: "Gérez les inscriptions et l'accès à vos événements",

  directoryTitle: "Annuaire",
  directoryDesc: "Connectez les membres avec un répertoire complet",

  donationsTitle: "Dons",
  donationsDesc: "Acceptez des dons facilement avec l'intégration HelloAsso",

  notificationsTitle: "Notifications intelligentes",
  notificationsDesc: "Alertes email respectueuses qui valorisent votre attention"
}

};

// Function to detect browser language
const detectBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.languages[0] || 'en';
  return browserLang.startsWith('fr') ? 'fr' : 'en';
};

const SimpleConclavLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profiles } = useProfile();
  const [language, setLanguage] = useState(detectBrowserLanguage());
  
  // Check if user agent is Safari on iOS
  const isSafariMobile = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && 
    /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  // Redirect logged-in users to their network
  useEffect(() => {
    if (user) {
      if (profiles && profiles.length > 0) {
        // User has profiles, redirect to network
        navigate('/network', { replace: true });
      } else {
        // User has no profiles, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profiles, navigate]);
  
  useEffect(() => {
    setLanguage(detectBrowserLanguage());
  }, []);
  
  const t = translations[language];

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#fafafa',
      // Safari-specific fixes to prevent animation retriggers
      ...(isSafariMobile && {
        WebkitBackfaceVisibility: 'hidden',
        WebkitTransform: 'translate3d(0, 0, 0)',
        WebkitPerspective: 1000,
        transform: 'translateZ(0)' // Force GPU acceleration
      })
    }}>
      {/* Hero Section with gradient background */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }
      }}>
        <Container maxWidth="lg" sx={{ pt: 8, pb: 8 }}>
        <Box 
          textAlign="center" 
          sx={{
            animation: isSafariMobile ? 'none' : `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
            color: 'white',
            position: 'relative',
            zIndex: 1,
            ...(isSafariMobile && {
              opacity: 1,
              transform: 'translateY(0)'
            })
          }}
        >
          {/* European Badge */}
          <Chip 
            label={t.europeanBadge} 
            sx={{ 
              mb: 4, 
              bgcolor: 'rgba(255, 255, 255, 0.2)', 
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
              py: 1,
              px: 2,
              border: '1px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
            }} 
          />
          
          {/* Main Title with Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Box 
              sx={{ 
                mr: 3,
                animation: 'rotate 20s linear infinite',
                '@keyframes rotate': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="80" 
                height="80" 
                viewBox="-125 -125 250 250"
                style={{ filter: 'drop-shadow(0 4px 20px rgba(25, 118, 210, 0.3))' }}
              >
                <defs>
                  <linearGradient id="hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1976d2" stopOpacity="1" />
                    <stop offset="100%" stopColor="#42a5f5" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                {/* Central big disk */}
                <circle cx="0" cy="0" r="35" fill="url(#hero-gradient)" filter="url(#glow)">
                  <animate attributeName="r" values="35;38;35" dur="3s" repeatCount="indefinite" />
                </circle>
                
                {/* Medium disks */}
                <g fill="url(#hero-gradient)">
                  <circle cx="70.00" cy="0.00" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="43.64" cy="54.72" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="0.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-15.57" cy="68.24" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="1s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-63.06" cy="30.37" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-63.06" cy="-30.37" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-15.57" cy="-68.24" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="43.64" cy="-54.72" r="25" opacity="0.9">
                    <animate attributeName="opacity" values="0.9;0.6;0.9" dur="4s" begin="3s" repeatCount="indefinite" />
                  </circle>
                </g>
                
                {/* Small disks */}
                <g fill="#1976d2">
                  <circle cx="85.59" cy="41.21" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="21.13" cy="92.61" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="0.3s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-59.23" cy="74.27" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="0.6s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-95.00" cy="0" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="0.9s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="-59.23" cy="-74.27" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="21.13" cy="-92.61" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="85.59" cy="-41.21" r="12" opacity="0.7">
                    <animate attributeName="r" values="12;15;12" dur="2s" begin="1.8s" repeatCount="indefinite" />
                  </circle>
                </g>
              </svg>
            </Box>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '3rem', md: '5rem' },
                fontWeight: 'bold',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Conclav
            </Typography>
          </Box>
          
          {/* Subtitle */}
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 3, 
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 500,
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            {t.subtitle}
          </Typography>
          
          {/* Description */}
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 5, 
              color: 'rgba(255, 255, 255, 0.85)',
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.8,
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            {t.description} 
            <strong style={{ color: 'white' }}> {t.descriptionStrong}</strong>
          </Typography>

          {/* CTA Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" mb={3}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Rocket />}
              onClick={() => navigate('/signup')}
              sx={{
                py: 2.5,
                px: 5,
                fontSize: '1.2rem',
                borderRadius: 50,
                bgcolor: 'white',
                color: '#667eea',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                ...(!isSafariMobile && {
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.2)'
                  }
                }),
                transition: 'all 0.3s ease'
              }}
            >
              {t.startFreeTrial}
            </Button>

            {/* Demo button hidden until demo is ready */}
            {/* <Button
              variant="outlined"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/demo')}
              sx={{
                py: 2.5,
                px: 5,
                fontSize: '1.2rem',
                borderRadius: 50,
                borderWidth: 2,
                borderColor: 'white',
                color: 'white',
                ...(!isSafariMobile && {
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }),
                transition: 'all 0.3s ease'
              }}
            >
              {t.seeDemo}
            </Button> */}
          </Stack>

          {/* Trial Info */}
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
            {t.trialInfo}
          </Typography>
        </Box>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              animation: isSafariMobile ? 'none' : `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
              textAlign: 'center',
              ...(isSafariMobile && {
                opacity: 1,
                transform: 'translateY(0)'
              })
            }}
          >
            <Typography variant="h3" gutterBottom fontWeight="bold" color="#2c3e50" sx={{ mb: 2 }}>
              {t.howItWorks}
            </Typography>
            <Typography variant="h6" sx={{ color: '#7f8c8d', maxWidth: '600px', mx: 'auto', mb: 6, lineHeight: 1.6 }}>
              {t.howItWorksSubtitle}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 4, justifyContent: 'center', alignItems: 'stretch' }}>
              {/* Step 1 */}
              <Box
                sx={{
                  flex: 1,
                  maxWidth: { xs: '100%', lg: '350px' },
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Box sx={{ position: 'relative', mb: 3 }}>
                  {/* Post-it style wrapper */}
                  <Paper
                    elevation={4}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      backgroundColor: '#fff8e1',
                      border: '1px solid #ffc107',
                      transform: 'rotate(-1deg)',
                      transition: 'all 0.3s ease',
                      ...(!isSafariMobile && {
                        '&:hover': {
                          transform: 'rotate(0deg) translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        }
                      }),
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 40,
                        height: 15,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '0 0 8px 8px',
                        opacity: 0.3
                      }
                    }}
                  >
                    {/* Big step number */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -15,
                        left: -15,
                        width: 60,
                        height: 60,
                        backgroundColor: '#667eea',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        zIndex: 10
                      }}
                    >
                      1
                    </Box>

                    {/* Screenshot */}
                    <Box sx={{ p: 3, pt: 4 }}>
                      <img
                        src={screenshot1}
                        alt="Create Your Network Screenshot"
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      />
                    </Box>
                  </Paper>
                </Box>
                
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Typography variant="h5" gutterBottom fontWeight="bold" color="#2c3e50" sx={{ mb: 2 }}>
                    {t.step1Title}
                  </Typography>
                  <Typography color="#7f8c8d" sx={{ lineHeight: 1.6, fontSize: '1rem' }}>
                    {t.step1Description}
                  </Typography>
                </Box>
              </Box>

              {/* Step 2 */}
              <Box
                sx={{
                  flex: 1,
                  maxWidth: { xs: '100%', lg: '350px' },
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Box sx={{ position: 'relative', mb: 3 }}>
                  {/* Post-it style wrapper */}
                  <Paper
                    elevation={4}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      backgroundColor: '#e8f5e8',
                      border: '1px solid #4caf50',
                      transform: 'rotate(1deg)',
                      transition: 'all 0.3s ease',
                      ...(!isSafariMobile && {
                        '&:hover': {
                          transform: 'rotate(0deg) translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        }
                      }),
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 40,
                        height: 15,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '0 0 8px 8px',
                        opacity: 0.3
                      }
                    }}
                  >
                    {/* Big step number */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -15,
                        left: -15,
                        width: 60,
                        height: 60,
                        backgroundColor: '#4caf50',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                        zIndex: 10
                      }}
                    >
                      2
                    </Box>

                    {/* Screenshot */}
                    <Box sx={{ p: 3, pt: 4 }}>
                      <img
                        src={screenshot2}
                        alt="Invite Your Community Screenshot"
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      />
                    </Box>
                  </Paper>
                </Box>
                
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Typography variant="h5" gutterBottom fontWeight="bold" color="#2c3e50" sx={{ mb: 2 }}>
                    {t.step2Title}
                  </Typography>
                  <Typography color="#7f8c8d" sx={{ lineHeight: 1.6, fontSize: '1rem' }}>
                    {t.step2Description}
                  </Typography>
                </Box>
              </Box>

              {/* Step 3 */}
              <Box
                sx={{
                  flex: 1,
                  maxWidth: { xs: '100%', lg: '350px' },
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Box sx={{ position: 'relative', mb: 3 }}>
                  {/* Post-it style wrapper */}
                  <Paper
                    elevation={4}
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      backgroundColor: '#fce4ec',
                      border: '1px solid #e91e63',
                      transform: 'rotate(1.5deg)',
                      transition: 'all 0.3s ease',
                      ...(!isSafariMobile && {
                        '&:hover': {
                          transform: 'rotate(0deg) translateY(-4px)',
                          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        }
                      }),
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 40,
                        height: 15,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: '0 0 8px 8px',
                        opacity: 0.3
                      }
                    }}
                  >
                    {/* Big step number */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -15,
                        left: -15,
                        width: 60,
                        height: 60,
                        backgroundColor: '#e91e63',
                        color: 'white',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                        zIndex: 10
                      }}
                    >
                      3
                    </Box>

                    {/* Screenshot */}
                    <Box sx={{ p: 3, pt: 4 }}>
                      <img
                        src={screenshot3}
                        alt="Share & Connect Screenshot"
                        style={{
                          width: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        }}
                      />
                    </Box>
                  </Paper>
                </Box>
                
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Typography variant="h5" gutterBottom fontWeight="bold" color="#2c3e50" sx={{ mb: 2 }}>
                    {t.step3Title}
                  </Typography>
                  <Typography color="#7f8c8d" sx={{ lineHeight: 1.6, fontSize: '1rem' }}>
                    {t.step3Description}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Network Features Section */}
      <Box sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              animation: isSafariMobile ? 'none' : `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
              textAlign: 'center',
              ...(isSafariMobile && {
                opacity: 1,
                transform: 'translateY(0)'
              })
            }}
          >
            <Typography
              variant="h3"
              gutterBottom
              fontWeight="bold"
              sx={{
                mb: 2,
                color: 'white',
                textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              {t.featuresTitle}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 255, 255, 0.95)',
                maxWidth: '800px',
                mx: 'auto',
                mb: { xs: 6, md: 10 },
                lineHeight: 1.8,
                fontSize: { xs: '1rem', md: '1.25rem' },
                textShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {t.featuresSubtitle}
            </Typography>

            <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
              {/* Feature cards configuration */}
              {[
                { icon: Feed, color: '#667eea', title: 'socialWallTitle', desc: 'socialWallDesc', delay: '0.2s' },
                { icon: Chat, color: '#4caf50', title: 'groupChatTitle', desc: 'groupChatDesc', delay: '0.3s' },
                { icon: EventAvailable, color: '#e91e63', title: 'eventsTitle', desc: 'eventsDesc', delay: '0.4s' },
                { icon: MenuBook, color: '#2196f3', title: 'wikiTitle', desc: 'wikiDesc', delay: '0.5s' },
                { icon: School, color: '#9c27b0', title: 'coursesTitle', desc: 'coursesDesc', delay: '0.6s' },
                { icon: Palette, color: '#ff5722', title: 'moodboardsTitle', desc: 'moodboardsDesc', delay: '0.7s' },
                { icon: Email, color: '#00bcd4', title: 'newsletterTitle', desc: 'newsletterDesc', delay: '0.8s' },
                { icon: ConfirmationNumber, color: '#ffc107', title: 'ticketingTitle', desc: 'ticketingDesc', delay: '0.9s' },
                { icon: ContactPage, color: '#607d8b', title: 'directoryTitle', desc: 'directoryDesc', delay: '1s' },
                { icon: Favorite, color: '#f06292', title: 'donationsTitle', desc: 'donationsDesc', delay: '1.1s' },
                { icon: Notifications, color: '#26a69a', title: 'notificationsTitle', desc: 'notificationsDesc', delay: '1.2s' }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Box
                      sx={{
                        height: '100%',
                        display: 'flex',
                        animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${feature.delay} both`,
                        ...(isSafariMobile && {
                          opacity: 1,
                          transform: 'translateY(0)'
                        })
                      }}
                    >
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 3.5, md: 4.5 },
                          width: '100%',
                          borderRadius: 4,
                          backgroundColor: 'rgba(255, 255, 255, 0.98)',
                          backdropFilter: 'blur(20px)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          textAlign: 'center',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          minHeight: { xs: '240px', md: '260px' },
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '4px',
                            background: `linear-gradient(90deg, ${feature.color}, ${alpha(feature.color, 0.6)})`,
                            transform: 'scaleX(0)',
                            transformOrigin: 'left',
                            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          },
                          ...(!isSafariMobile && {
                            '&:hover': {
                              transform: 'translateY(-12px)',
                              boxShadow: `0 24px 48px rgba(0, 0, 0, 0.18), 0 0 0 1px ${alpha(feature.color, 0.1)}`,
                              backgroundColor: 'white',
                              borderColor: alpha(feature.color, 0.2),
                              '&::before': {
                                transform: 'scaleX(1)',
                              },
                              '& .feature-icon-wrapper': {
                                transform: 'scale(1.1) rotate(5deg)',
                                bgcolor: alpha(feature.color, 0.15),
                              },
                              '& .feature-icon': {
                                transform: 'scale(1.15)',
                              }
                            }
                          })
                        }}
                      >
                        <Box
                          className="feature-icon-wrapper"
                          sx={{
                            width: { xs: 72, md: 80 },
                            height: { xs: 72, md: 80 },
                            borderRadius: 3,
                            bgcolor: alpha(feature.color, 0.12),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: `0 4px 12px ${alpha(feature.color, 0.15)}`,
                          }}
                        >
                          <Icon
                            className="feature-icon"
                            sx={{
                              fontSize: { xs: 36, md: 40 },
                              color: feature.color,
                              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                          />
                        </Box>
                        <Typography
                          variant="h6"
                          gutterBottom
                          fontWeight="700"
                          color="#2c3e50"
                          sx={{
                            mb: 2,
                            fontSize: { xs: '1.1rem', md: '1.25rem' },
                            letterSpacing: '-0.02em'
                          }}
                        >
                          {t[feature.title]}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="#7f8c8d"
                          sx={{
                            lineHeight: 1.7,
                            flex: 1,
                            fontSize: { xs: '0.9rem', md: '0.95rem' },
                            px: { xs: 0, md: 1 }
                          }}
                        >
                          {t[feature.desc]}
                        </Typography>
                      </Paper>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Anti-GAFAM Section */}
      <Box sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              animation: isSafariMobile ? 'none' : `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
              textAlign: 'center',
              ...(isSafariMobile && {
                opacity: 1,
                transform: 'translateY(0)'
              })
            }}
          >
            <Box mb={{ xs: 6, md: 10 }}>
              <Typography
                variant="h3"
                gutterBottom
                fontWeight="bold"
                color="#2c3e50"
                sx={{
                  mb: 3,
                  fontSize: { xs: '2rem', md: '3rem' },
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 80,
                    height: 4,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    borderRadius: 2
                  }
                }}
              >
                {t.breakFree}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: '#555',
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.8,
                  mt: 5,
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  fontWeight: 400
                }}
              >
                {t.noTracking}
              </Typography>
            </Box>

            <Grid container spacing={{ xs: 3, md: 4 }} justifyContent="center">
              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: 5 },
                    borderRadius: 4,
                    backgroundColor: 'white',
                    border: '2px solid #e9ecef',
                    height: '100%',
                    textAlign: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '5px',
                      background: 'linear-gradient(90deg, #667eea, #764ba2)',
                      transform: 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    ...(!isSafariMobile && {
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: '0 24px 48px rgba(102, 126, 234, 0.15)',
                        borderColor: '#667eea',
                        '&::before': {
                          transform: 'scaleX(1)',
                        },
                        '& .feature-icon-box': {
                          transform: 'scale(1.1)',
                          bgcolor: alpha('#667eea', 0.15),
                        }
                      }
                    })
                  }}
                >
                  <Box
                    className="feature-icon-box"
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: 3,
                      bgcolor: alpha('#667eea', 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `0 8px 24px ${alpha('#667eea', 0.15)}`
                    }}
                  >
                    <AdminPanelSettings sx={{ fontSize: 48, color: '#667eea' }} />
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight="700"
                    color="#2c3e50"
                    sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                  >
                    {t.fullControl}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="#666"
                    sx={{ lineHeight: 1.8, fontSize: { xs: '0.95rem', md: '1rem' } }}
                  >
                    {t.fullControlDesc}
                  </Typography>
                </Paper>
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: 5 },
                    borderRadius: 4,
                    backgroundColor: 'white',
                    border: '2px solid #e9ecef',
                    height: '100%',
                    textAlign: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '5px',
                      background: 'linear-gradient(90deg, #4caf50, #45a049)',
                      transform: 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    ...(!isSafariMobile && {
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: '0 24px 48px rgba(76, 175, 80, 0.15)',
                        borderColor: '#4caf50',
                        '&::before': {
                          transform: 'scaleX(1)',
                        },
                        '& .feature-icon-box': {
                          transform: 'scale(1.1)',
                          bgcolor: alpha('#4caf50', 0.15),
                        }
                      }
                    })
                  }}
                >
                  <Box
                    className="feature-icon-box"
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: 3,
                      bgcolor: alpha('#4caf50', 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `0 8px 24px ${alpha('#4caf50', 0.15)}`
                    }}
                  >
                    <FlightTakeoff sx={{ fontSize: 48, color: '#4caf50' }} />
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight="700"
                    color="#2c3e50"
                    sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                  >
                    {t.trueIndependence}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="#666"
                    sx={{ lineHeight: 1.8, fontSize: { xs: '0.95rem', md: '1rem' } }}
                  >
                    {t.trueIndependenceDesc}
                  </Typography>
                </Paper>
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 4, md: 5 },
                    borderRadius: 4,
                    backgroundColor: 'white',
                    border: '2px solid #e9ecef',
                    height: '100%',
                    textAlign: 'center',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '5px',
                      background: 'linear-gradient(90deg, #2196f3, #1976d2)',
                      transform: 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                    ...(!isSafariMobile && {
                      '&:hover': {
                        transform: 'translateY(-12px)',
                        boxShadow: '0 24px 48px rgba(33, 150, 243, 0.15)',
                        borderColor: '#2196f3',
                        '&::before': {
                          transform: 'scaleX(1)',
                        },
                        '& .feature-icon-box': {
                          transform: 'scale(1.1)',
                          bgcolor: alpha('#2196f3', 0.15),
                        }
                      }
                    })
                  }}
                >
                  <Box
                    className="feature-icon-box"
                    sx={{
                      width: 90,
                      height: 90,
                      borderRadius: 3,
                      bgcolor: alpha('#2196f3', 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: `0 8px 24px ${alpha('#2196f3', 0.15)}`
                    }}
                  >
                    <VerifiedUser sx={{ fontSize: 48, color: '#2196f3' }} />
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    fontWeight="700"
                    color="#2c3e50"
                    sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '1.5rem' } }}
                  >
                    {t.simplicityTrust}
                  </Typography>
                  <Typography
                    variant="body1"
                    color="#666"
                    sx={{ lineHeight: 1.8, fontSize: { xs: '0.95rem', md: '1rem' } }}
                  >
                    {t.simplicityTrustDesc}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

      {/* Why Conclav Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: '#f8f9fa' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              animation: isSafariMobile ? 'none' : `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both`,
              textAlign: 'center',
              ...(isSafariMobile && {
                opacity: 1,
                transform: 'translateY(0)'
              })
            }}
          >
            <Typography
              variant="h3"
              textAlign="center"
              fontWeight="bold"
              color="#2c3e50"
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                lineHeight: 1.4
              }}
            >
              {t.everythingYouNeed}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container maxWidth="md" textAlign="center">
          <Box
            sx={{
              animation: isSafariMobile ? 'none' : `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s both`,
              color: 'white',
              ...(isSafariMobile && {
                opacity: 1,
                transform: 'translateY(0)'
              })
            }}
          >
            <Typography variant="h3" gutterBottom fontWeight="bold" color="white" sx={{ mb: 3 }}>
              {t.readyToOwn}
            </Typography>
            <Typography variant="h6" sx={{ mb: 5, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 1.6 }}>
              {t.joinThousands}
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<Rocket />}
              onClick={() => navigate('/signup')}
              sx={{
                py: 3,
                px: 6,
                fontSize: '1.3rem',
                borderRadius: 50,
                bgcolor: 'white',
                color: '#667eea',
                fontWeight: 'bold',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                ...(!isSafariMobile && {
                  '&:hover': {
                    bgcolor: '#f8f9fa',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.2)'
                  }
                }),
                transition: 'all 0.3s ease'
              }}
            >
              {t.startYourFreeTrial}
            </Button>

            <Typography variant="body2" sx={{ mt: 3, opacity: 0.8 }}>
              {t.finalTrialInfo}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* HelloAsso Integration Section */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              animation: isSafariMobile ? 'none' : `${fadeInUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both`,
              ...(isSafariMobile && {
                opacity: 1,
                transform: 'translateY(0)'
              })
            }}
          >
            {/* Header with logo */}
            <Box textAlign="center" mb={6}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: '#f8f9fa',
                  border: '2px solid #e9ecef'
                }}
              >
                <img
                  src={helloAssoLogo}
                  alt="HelloAsso"
                  style={{
                    height: '50px',
                    width: 'auto'
                  }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    color: '#2c3e50',
                    fontWeight: 'bold',
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  ×
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#667eea',
                    fontWeight: 'bold',
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  Conclav
                </Typography>
              </Box>

              <Typography
                variant="h3"
                gutterBottom
                fontWeight="bold"
                color="#2c3e50"
                sx={{ mb: 2 }}
              >
                {t.helloAssoTitle}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  color: '#7f8c8d',
                  maxWidth: '700px',
                  mx: 'auto',
                  lineHeight: 1.8,
                  mb: 1
                }}
              >
                {t.helloAssoDescription}
              </Typography>
            </Box>

            {/* Features Grid */}
            <Grid container spacing={4} justifyContent="center">
              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 4,
                    border: '1px solid #e9ecef',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    ...(!isSafariMobile && {
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 30px rgba(102, 126, 234, 0.15)',
                        borderColor: '#667eea',
                      }
                    })
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        bgcolor: '#e8f5e8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                      }}
                    >
                      <Typography variant="h3" sx={{ color: '#4caf50' }}>
                        0%
                      </Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                      {t.helloAssoFeature1}
                    </Typography>
                    <Typography color="#7f8c8d">
                      {t.helloAssoFeature1Desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 4,
                    border: '1px solid #e9ecef',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    ...(!isSafariMobile && {
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 30px rgba(102, 126, 234, 0.15)',
                        borderColor: '#667eea',
                      }
                    })
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        bgcolor: '#fff8e1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                      }}
                    >
                      <Shield sx={{ fontSize: 40, color: '#ffc107' }} />
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                      {t.helloAssoFeature2}
                    </Typography>
                    <Typography color="#7f8c8d">
                      {t.helloAssoFeature2Desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid
                item
                xs={12}
                md={4}
                sx={{
                  animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s both`,
                  ...(isSafariMobile && {
                    opacity: 1,
                    transform: 'translateY(0)'
                  })
                }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    p: 4,
                    border: '1px solid #e9ecef',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    ...(!isSafariMobile && {
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 30px rgba(102, 126, 234, 0.15)',
                        borderColor: '#667eea',
                      }
                    })
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        bgcolor: '#e3f2fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3
                      }}
                    >
                      <Speed sx={{ fontSize: 40, color: '#667eea' }} />
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                      {t.helloAssoFeature3}
                    </Typography>
                    <Typography color="#7f8c8d">
                      {t.helloAssoFeature3Desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default SimpleConclavLanding;