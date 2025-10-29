import React, { useState, useEffect, useRef } from 'react';
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
  alpha,
  useTheme
} from '@mui/material';
import { 
  Security, 
  Speed, 
  Group, 
  Shield, 
  Rocket,
  Block,
  Public,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontext';
import { useProfile } from '../context/profileContext';
import screenshot1 from '../assets/screensforsteps/1.png';
import screenshot2 from '../assets/screensforsteps/2.png';
import screenshot3 from '../assets/screensforsteps/3.png';

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

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

// Translations object
const translations = {
  en: {
  europeanBadge: "🇪🇺 Made in Europe • Independent of Silicon Valley",
  subtitle: "A private social network that truly respects you",
  description: "Create your own trusted micro-networks in minutes — with total privacy. No tracking. No ads. No Big Tech.",
  descriptionStrong: "Only authentic human connections.",
  startFreeTrial: "Start in 5 Minutes",
  seeDemo: "Watch the Demo",
  trialInfo: "30 days free • No credit card required • Cancel anytime",

  howItWorks: "How It Works",
  howItWorksSubtitle: "Your private network in 3 simple steps",

  step1Title: "Create Your Space",
  step1Description: "Name your network, upload your logo, and customize it in seconds. No technical setup required.",
  step2Title: "Invite Your People",
  step2Description: "Invite members by email or link. You decide who joins and what’s shared — nothing goes public unless you choose.",
  step3Title: "Share & Connect",
  step3Description: "Publish posts, organize meetups, or share your work — all inside a safe, ad-free environment.",

  breakFree: "Break Free from Big Tech",
  noTracking: "No Google. No Meta. No Amazon. No Apple. No Microsoft — ever watching you.",
  europeanPrivacy: "European Privacy",
  europeanPrivacyDesc: "GDPR by design. Your data stays securely in Europe under the world’s strongest privacy protections.",
  zeroBloat: "Lightning Fast",
  zeroBloatDesc: "No ads, trackers, or bloated scripts. Conclav loads instantly and keeps you focused on people, not algorithms.",
  yourNetworks: "Your Networks, Your Rules",
  yourNetworksDesc: "Create unlimited private communities. You own the space, the content, and the access.",

  everythingYouNeed: "Everything you need — nothing you don’t.",
  simpleSecure: "Simple & Secure",
  simpleSecureDesc: "Build networks in seconds. Share content, host events, and chat securely — with end-to-end protection and zero corporate oversight.",
  europeanAlternative: "Built for Europe",
  europeanAlternativeDesc: "Designed and hosted entirely in Europe — a genuine alternative to Silicon Valley platforms that respect your digital independence.",

  readyToOwn: "Ready to own your digital space?",
  joinThousands: "Join thousands of creators and professionals building authentic, privacy-first communities.",
  startYourFreeTrial: "Start for Free",
  finalTrialInfo: "Free for 30 days • Setup under 5 minutes • Cancel anytime"
},

  fr: {
  europeanBadge: "🇪🇺 Conçu en Europe • Indépendant de la Silicon Valley",
  subtitle: "Le réseau social privé qui vous respecte vraiment",
  description: "Créez vos propres micro-réseaux de confiance en quelques minutes — avec une confidentialité totale. Aucun traçage. Aucune pub. Aucun bot. Aucune Big Tech.",
  descriptionStrong: "Uniquement des connexions humaines authentiques.",
  startFreeTrial: "Commencez en 5 minutes",
  seeDemo: "Voir la démo",
  trialInfo: "30 jours gratuits • Aucune carte requise • Annulez à tout moment",

  howItWorks: "Comment ça marche",
  howItWorksSubtitle: "Votre réseau privé en 3 étapes simples",

  step1Title: "Créez votre espace",
  step1Description: "Choisissez un nom, téléchargez votre logo et personnalisez votre réseau en quelques secondes. Aucun réglage technique nécessaire.",
  step2Title: "Invitez vos membres",
  step2Description: "Envoyez des invitations par e-mail ou partagez un lien. Vous contrôlez qui peut entrer et ce qui est partagé — rien ne devient public sans votre accord.",
  step3Title: "Partagez et connectez-vous",
  step3Description: "Publiez, organisez des événements ou montrez vos projets — dans un espace sûr, sans publicité ni algorithme.",

  breakFree: "Libérez-vous des Big Tech",
  noTracking: "Zéro tracking. Pas de Google, Meta, qui espionnent vos données.",
  europeanPrivacy: "Confidentialité européenne",
  europeanPrivacyDesc: "Conforme au RGPD dès la conception. Vos données restent en Europe, protégées par les lois les plus strictes au monde.",
  zeroBloat: "Rapide et léger",
  zeroBloatDesc: "Pas de pubs, pas de traceurs, pas de scripts lourds. Conclav se charge instantanément et met les gens avant les algorithmes.",
  yourNetworks: "Vos réseaux, vos règles",
  yourNetworksDesc: "Créez des communautés privées librement. Vous possédez votre espace, votre contenu et vos membres.",

  everythingYouNeed: "Tout ce dont vous avez besoin — rien de superflu.",
  simpleSecure: "Simple et sécurisé",
  simpleSecureDesc: "Créez vos réseaux en quelques secondes. Partagez, organisez, discutez en toute sécurité, sans surveillance.",
  europeanAlternative: "Conçu en Europe",
  europeanAlternativeDesc: "Développé et hébergé en Europe — une véritable alternative aux plateformes de la Silicon Valley.",

  readyToOwn: "Prêt à développer votre espace numérique ?",
  joinThousands: "Rejoignez des milliers de créateurs et de professionnels qui construisent des communautés authentiques et respectueuses de la vie privée.",
  startYourFreeTrial: "Commencez gratuitement",
  finalTrialInfo: "30 jours gratuits • Installation en moins de 5 minutes • Annulez à tout moment"
}

};

// Function to detect browser language
const detectBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.languages[0] || 'en';
  return browserLang.startsWith('fr') ? 'fr' : 'en';
};

const SimpleConclavLanding = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
            
            <Button
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
            </Button>
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

      {/* Anti-GAFAM Section */}
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
          <Box mb={8}>
            <Block sx={{ fontSize: 80, color: '#ff4757', mb: 3 }} />
            <Typography variant="h3" gutterBottom fontWeight="bold" color="#2c3e50" sx={{ mb: 3 }}>
              {t.breakFree}
            </Typography>
            <Typography variant="h5" sx={{ color: '#7f8c8d', maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}>
              {t.noTracking}
            </Typography>
          </Box>

          <Grid container spacing={4} justifyContent="center">
            <Grid 
              item 
              xs={12} 
              md={4} 
              textAlign="center"
              sx={{
                animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both`,
                ...(isSafariMobile && {
                  opacity: 1,
                  transform: 'translateY(0)'
                })
              }}
            >
              <Box sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                ...(!isSafariMobile && {
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    borderColor: '#667eea',
                  }
                })
              }}>
                <Shield sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                  {t.europeanPrivacy}
                </Typography>
                <Typography color="#7f8c8d" sx={{ lineHeight: 1.6 }}>
                  {t.europeanPrivacyDesc}
                </Typography>
              </Box>
            </Grid>

            <Grid 
              item 
              xs={12} 
              md={4} 
              textAlign="center"
              sx={{
                animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both`,
                ...(isSafariMobile && {
                  opacity: 1,
                  transform: 'translateY(0)'
                })
              }}
            >
              <Box sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                ...(!isSafariMobile && {
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    borderColor: '#667eea',
                  }
                })
              }}>
                <Speed sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                  {t.zeroBloat}
                </Typography>
                <Typography color="#7f8c8d" sx={{ lineHeight: 1.6 }}>
                  {t.zeroBloatDesc}
                </Typography>
              </Box>
            </Grid>

            <Grid 
              item 
              xs={12} 
              md={4} 
              textAlign="center"
              sx={{
                animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s both`,
                ...(isSafariMobile && {
                  opacity: 1,
                  transform: 'translateY(0)'
                })
              }}
            >
              <Box sx={{
                p: 4,
                borderRadius: 4,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef',
                height: '100%',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                ...(!isSafariMobile && {
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    borderColor: '#667eea',
                  }
                })
              }}>
                <Group sx={{ fontSize: 60, color: '#667eea', mb: 2 }} />
                <Typography variant="h6" gutterBottom fontWeight="bold" color="#2c3e50">
                  {t.yourNetworks}
                </Typography>
                <Typography color="#7f8c8d" sx={{ lineHeight: 1.6 }}>
                  {t.yourNetworksDesc}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          </Box>
        </Container>
      </Box>

      {/* Why Conclav Section */}
      <Box sx={{ py: 8, bgcolor: '#f8f9fa' }}>
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
          <Typography variant="h3" textAlign="center" gutterBottom fontWeight="bold" mb={8} color="#2c3e50">
            {t.everythingYouNeed}
          </Typography>
          
          <Grid container spacing={4}>
          <Grid 
            item 
            xs={12} 
            md={6}
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
                p: 5, 
                height: '100%',
                backgroundColor: 'white',
                borderRadius: 4,
                border: '1px solid #e9ecef',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ...(!isSafariMobile && {
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    borderColor: '#667eea',
                  }
                }),
              }}
            >
              <Security sx={{ fontSize: 48, color: '#667eea', mb: 3 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold" color="#2c3e50">
                {t.simpleSecure}
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#7f8c8d' }}>
                {t.simpleSecureDesc}
              </Typography>
            </Paper>
          </Grid>

          <Grid 
            item 
            xs={12} 
            md={6}
            sx={{
              animation: isSafariMobile ? 'none' : `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s both`,
              ...(isSafariMobile && {
                opacity: 1,
                transform: 'translateY(0)'
              })
            }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 5, 
                height: '100%',
                backgroundColor: 'white',
                borderRadius: 4,
                border: '1px solid #e9ecef',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ...(!isSafariMobile && {
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    borderColor: '#667eea',
                  }
                }),
              }}
            >
              <Public sx={{ fontSize: 48, color: '#667eea', mb: 3 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold" color="#2c3e50">
                {t.europeanAlternative}
              </Typography>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#7f8c8d' }}>
                {t.europeanAlternativeDesc}
              </Typography>
            </Paper>
          </Grid>
          </Grid>
        </Box>
        </Container>
      </Box>

      {/* Final CTA Section */}
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

    </Box>
  );
};

export default SimpleConclavLanding;