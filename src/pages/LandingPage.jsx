// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Use alias to avoid naming conflict
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link'; // MUI Link component
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import LanguageIcon from '@mui/icons-material/Language';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { AnimatedCard, PageTransition } from '../components/AnimatedComponents';
import MicroLogo from '../assets/micro.svg';


import EuFlag from '../assets/eu_flag.jpg';
import Logo from '../assets/logo.svg';

import ThreeJSBackground from '../components/ThreeJSBackground';

// Import Icons
import PeopleIcon from '@mui/icons-material/People'; // For closed networks
import AccountBoxIcon from '@mui/icons-material/AccountBox'; // For portfolios
import LockIcon from '@mui/icons-material/Lock'; // For privacy/security
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'; // For admin controls
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EventIcon from '@mui/icons-material/Event'; // For event organization
import SupportAgentIcon from '@mui/icons-material/SupportAgent'; // For human assistance
import BrushIcon from '@mui/icons-material/Brush'; // For white-label options
import TextCycler from '../components/TextCycler';

// --- Component Definition ---
function LandingPage() {
  // Language state
  const [language, setLanguage] = useState('en');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const slidingAnimation = {
    '@keyframes slide': {
      '0%': { transform: 'translateX(0)' },
      '100%': { transform: 'translateX(-50%)' }
    },
    animation: 'slide 20s linear infinite',
    '&:hover': {
      animationPlayState: 'paused'
    }
  };


  

  const clients = [
    {
      name: "Colas",
      logo: "https://doublegeste.com/dg1/Clients/Colas_logo_vector.webp",
      style: { filter: 'invert() brightness(0)' }
    },
    {
      name: "Armani",
      logo: "https://doublegeste.com/dg1/Clients/Armani-Logo.wine.svg",
      style: { transform: 'scale(1.6)' }
    },
    {
      name: "Nike",
      logo: "https://doublegeste.com/dg1/Clients/Nike%2C_Inc.-Nike-White-Logo.wine.svg",
      style: { filter: 'invert(100%)' }
    },
    {
      name: "La Fémis",
      logo: "https://doublegeste.com/dg1/Clients/800px-La_F%C3%A9mis_logo.svg.webp"
    },
    {
      name: "Beaux Arts",
      logo: "https://doublegeste.com/dg1/Clients/800px-Logo_Beaux_Arts.webp"
    },
    {
      name: "EDF",
      logo: "https://doublegeste.com/dg1/Clients/edf-logo-2.webp",
      style: { filter: 'brightness(0) grayscale(200%)' }
    },
    {
      name: "Air France",
      logo: "https://doublegeste.com/dg1/Clients/PikPng.com_air-france-logo-png_3594396.webp"
    },
    {
      name: "Panzani",
      logo: "https://doublegeste.com/dg1/Clients/panzani_noir.webp"
    },
    {
      name: "L'Oréal",
      logo: "https://doublegeste.com/dg1/Clients/LOreal_logo.svg"
    },
    {
      name: "Le Fooding",
      logo: "https://doublegeste.com/dg1/Clients/lefooding-com-logos-idwUqLDSKp.svg"
    },
    {
      name: "GPS",
      logo: "https://doublegeste.com/dg1/Clients/logo_GPS.svg"
    },
    // Add remaining clients...
  ];

  // Add DGLogo component
const DGLogo = () => (
  <svg 
    viewBox="0 0 92 68"
    style={{
      width: '40px',
      height: '30px',
      marginRight: '8px',
      // filter: 'invert(100%)',
      opacity: 1,
      color: '#0c3f9c'
    }}
  >
    <g id="Layer_1-2" data-name="Layer 1">
      <path 
        d="M48.79,23.73,48,22.44a308.41,308.41,0,0,1,43.64-7.81,1,1,0,0,0-.34,0c-1.81.13-3.63.23-5.44.42-3.75.39-7.51.77-11.26,1.26-4.3.56-8.6,1.16-12.87,1.88-4.8.82-9.57,1.79-14.35,2.7a.53.53,0,0,1-.64-.24A86.49,86.49,0,0,0,31.31,3.89a25.37,25.37,0,0,0-5-3.39A3.85,3.85,0,0,0,24.6,0a.76.76,0,0,0-.83.72,4,4,0,0,0,0,1.09,18.66,18.66,0,0,0,1.38,4.12c1.67,3.77,3.4,7.52,5.05,11.3,1,2.34,2,4.73,3,7.14l-.4.12a112.53,112.53,0,0,0-17,6.28,46.44,46.44,0,0,0-9.14,5.59,19.85,19.85,0,0,0-5.29,6.1,11.18,11.18,0,0,0-1.34,6.7,16.18,16.18,0,0,0,1.61,5.21A21.54,21.54,0,0,0,8.35,62.2a34.48,34.48,0,0,0,13.36,6,8.46,8.46,0,0,0,2.05.13,5.08,5.08,0,0,0,1.48-.12,21.23,21.23,0,0,0,4.94-1.42A59.12,59.12,0,0,0,47,54.51a30.57,30.57,0,0,0,5.63-8.07A17.56,17.56,0,0,0,54.33,40a19.22,19.22,0,0,0-1-6.89A42.9,42.9,0,0,0,48.79,23.73ZM36.45,39.79a27.63,27.63,0,0,1-2.13,9.52,52.88,52.88,0,0,1-5.11,9.49c-1.11,1.67-2.25,3.31-3.38,5a10,10,0,0,1-2.39,2.47h0a3.84,3.84,0,0,1-3.63.49,26.35,26.35,0,0,1-6.1-3.21A15.45,15.45,0,0,1,8.6,57.68a13.76,13.76,0,0,1-1.34-6.53,17,17,0,0,1,4.45-10.7,34.35,34.35,0,0,1,7.86-6.61,74,74,0,0,1,12.7-6.3l1.82-.71c.5,1.84,1,3.61,1.46,5.4A28.35,28.35,0,0,1,36.45,39.79ZM48,22.44c-.08.1-13.74,4.33-13.89,4.36a21.28,21.28,0,0,1-.79-2.38s13-3.29,13.75-3.57"
        fill="currentColor"
      />
    </g>
  </svg>
);

  // --- Text content for different languages ---
  const content = {
    en: {
      appName: 'Conclav App',
      navFeatures: 'Features',
      navLogin: 'Login',
      navSignUp: 'Sign Up',
      heroSubtitle: 'Easily create and manage closed networks for your members to connect, share portfolios, and display contact information securely.',
      getStarted: 'Get Started',
      trustTitle: "They Trust Us",
      viewDemo: 'View Demo',
      poweredBy: "Powered by Double Geste",
      heroTitle: 'Your', // Fixed part
    animatedPhrases: ["private network", "organization's hub", "community directory", "space to share"],

      featuresTitle: 'Why Choose Conclav?',
      features: [
        {
          title: 'Closed Networks',
          description: 'Create private, invite-only networks for your union, organization, or group members.'
        },
        {
          title: 'Member Portfolios',
          description: 'Allow members to showcase their work, skills, and professional profiles easily.'
        },
        {
          title: 'Secure & Private',
          description: 'Control access and keep your network\'s data secure within your defined group.'
        },
        {
          title: 'Admin Controls',
          description: 'Manage members, roles, and network settings with simple administrative tools.'
        },
        {
          title: 'Zero Tracking by Design',
          description: 'Your data stays private with no analytics or tracking technologies - we respect your privacy completely.'
        },
        {
          title: 'Event Coordination',
          description: 'Seamlessly organize meetings, events, and gatherings with integrated scheduling and RSVP features.'
        },
        {
          title: '24/7 Human Support',
          description: 'Access real human assistance any day of the week with our dedicated support team ready to help.'
        },
        {
          title: 'White-Label Solution',
          description: 'Customize the platform with your own branding to create a seamless experience for your members.'
        }
      ],
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      gdprCompliant: 'GDPR Compliant',
      madeInFrance: 'Designed in France',
      dataProtection: 'Your data stays in Europe'
    },
    fr: {
      appName: 'Conclav',
      navFeatures: 'Fonctionnalités',
      navLogin: 'Connexion',
      navSignUp: 'S\'inscrire',
      heroSubtitle: 'Créez et gérez facilement des réseaux fermés pour permettre à vos membres de se connecter, partager leurs portfolios et afficher leurs coordonnées en toute sécurité.',
      getStarted: 'Commencer',
      trustTitle: "Ils nous font confiance",
      viewDemo: 'Voir la Démo',
      poweredBy: "Propulsé par Double Geste",
      heroTitle: 'Votre', // Fixed part
    animatedPhrases: ["réseau privé", "plateforme d'organisation", "annuaire communautaire", "espace de partage"],

      featuresTitle: 'Pourquoi Choisir Conclav?',
      features: [
        {
          title: 'Réseaux Fermés',
          description: 'Créez des réseaux privés, sur invitation, pour votre association, organisation professionnelle ou tout autre groupe.'
        },
        {
          title: 'Portfolios des Membres',
          description: 'Permettez aux membres de présenter facilement leur travail, compétences et profils professionnels, sans contenus tiers, sans pub, sans tracking.'
        },
        {
          title: 'Sécurisé et Privé',
          description: 'Contrôlez l\'accès et maintenez les données de votre réseau en sécurité au sein de votre groupe défini.'
        },
        {
          title: 'Contrôles Administratifs',
          description: 'Gérez les membres, les rôles et les paramètres du réseau avec des outils administratifs simples.'
        },
        {
          title: 'Zéro Pistage par Conception',
          description: 'Vos données restent privées sans aucune analyse ni technologie de suivi - nous respectons totalement votre vie privée.'
        },
        {
          title: 'Coordination d\'Événements',
          description: 'Organisez facilement des réunions, événements et rassemblements avec des fonctionnalités intégrées de planification et de confirmation de présence.'
        },
        {
          title: 'Assistance Humaine 7j/7',
          description: 'Accédez à une assistance par de vrais humains tous les jours de la semaine avec notre équipe de support dédiée prête à vous aider.'
        },
        {
          title: 'Solution Marque Blanche',
          description: 'Personnalisez la plateforme avec votre propre identité visuelle pour créer une expérience sur mesure pour vos membres.'
        }
      ],
      privacy: 'Politique de Confidentialité',
      terms: 'Conditions d\'Utilisation',
      gdprCompliant: 'Conforme RGPD',
      madeInFrance: 'Conçu en France',
      dataProtection: 'Vos données restent en Europe'
    },
    es: {
      appName: 'Mon Cercle App',
      navFeatures: 'Características',
      navLogin: 'Iniciar Sesión',
      navSignUp: 'Registrarse',
      heroSubtitle: 'Crea y gestiona fácilmente redes cerradas para que tus miembros se conecten, compartan portafolios y muestren información de contacto de forma segura.',
      getStarted: 'Empezar',
      viewDemo: 'Ver Demo',
      featuresTitle: '¿Por Qué Elegir Üni?',
      heroTitle: 'Tu', // Fixed part
      animatedPhrases: ["red privada", "centro organizativo", "directorio comunitario", "espacio para compartir"],
      features: [
        {
          title: 'Redes Cerradas',
          description: 'Crea redes privadas exclusivas por invitación para tu sindicato, organización o grupo de miembros.'
        },
        {
          title: 'Portafolios de Miembros',
          description: 'Permite que los miembros muestren su trabajo, habilidades y perfiles profesionales fácilmente.'
        },
        {
          title: 'Seguro y Privado',
          description: 'Controla el acceso y mantén los datos de tu red seguros dentro de tu grupo definido.'
        },
        {
          title: 'Controles Administrativos',
          description: 'Gestiona miembros, roles y configuraciones de red con herramientas administrativas simples.'
        },
        {
          title: 'Cero Rastreo por Diseño',
          description: 'Tus datos permanecen privados sin análisis ni tecnologías de seguimiento - respetamos completamente tu privacidad.'
        },
        {
          title: 'Coordinación de Eventos',
          description: 'Organiza reuniones, eventos y encuentros con funciones integradas de programación y confirmación.'
        },
        {
          title: 'Soporte Humano 24/7',
          description: 'Accede a asistencia humana real cualquier día de la semana con nuestro equipo de soporte dedicado.'
        },
        {
          title: 'Solución White-Label',
          description: 'Personaliza la plataforma con tu propia marca para una experiencia unificada para tus miembros.'
        }
      ],
      privacy: 'Política de Privacidad',
      terms: 'Términos de Servicio'
    },
    de: {
      appName: 'Mon Cercle App',
      navFeatures: 'Funktionen',
      navLogin: 'Anmelden',
      navSignUp: 'Registrieren',
      heroSubtitle: 'Erstellen und verwalten Sie geschlossene Netzwerke, in denen sich Mitglieder sicher verbinden, Portfolios teilen und Kontaktinformationen austauschen können.',
      getStarted: 'Loslegen',
      viewDemo: 'Demo Ansehen',
      featuresTitle: 'Warum Üni Wählen?',
      heroTitle: 'Ihr', // Fixed part
    animatedPhrases: ["privates Netzwerk", "Organisations-Hub", "Gemeinschaftsverzeichnis", "Raum zum Teilen"],
      features: [
        {
          title: 'Geschlossene Netzwerke',
          description: 'Erstellen Sie private, einladungsbasierte Netzwerke für Gewerkschaften, Organisationen oder Mitgliedergruppen.'
        },
        {
          title: 'Mitglieder-Portfolios',
          description: 'Mitglieder können ihre Arbeiten, Fähigkeiten und beruflichen Profile einfach präsentieren.'
        },
        {
          title: 'Sicher & Privat',
          description: 'Behalten Sie die Kontrolle über den Zugriff und schützen Sie die Daten Ihres Netzwerks innerhalb Ihrer Gruppe.'
        },
        {
          title: 'Admin-Steuerung',
          description: 'Verwalten Sie Mitglieder, Rollen und Netzwerkeinstellungen mit einfachen Administrationswerkzeugen.'
        },
        {
          title: 'Kein Tracking durch Design',
          description: 'Ihre Daten bleiben privat - keine Analysen oder Tracking-Technologien. Wir respektieren Ihre Privatsphäre vollständig.'
        },
        {
          title: 'Veranstaltungsplanung',
          description: 'Organisieren Sie mühelos Treffen, Events und Versammlungen mit integrierter Terminplanung und RSVP-Funktionen.'
        },
        {
          title: '24/7 Menschlicher Support',
          description: 'Täglich erreichbarer Support durch unser engagiertes Team - jederzeit bereit zu helfen.'
        },
        {
          title: 'White-Label-Lösung',
          description: 'Passen Sie die Plattform mit Ihrem Branding an für eine nahtlose Erfahrung Ihrer Mitglieder.'
        }
      ],
      privacy: 'Datenschutzrichtlinie',
      terms: 'Nutzungsbedingungen'
    },
    
    it: {
    appName: 'Mon Cercle App',
    navFeatures: 'Caratteristiche',
    navLogin: 'Accedi',
    navSignUp: 'Registrati',
    heroSubtitle: 'Crea e gestisci facilmente reti chiuse per consentire ai membri di connettersi, condividere portfolio e visualizzare informazioni di contatto in modo sicuro.',
    getStarted: 'Inizia Ora',
    viewDemo: 'Vedi Demo',
    featuresTitle: 'Perché Scegliere Üni?',
    heroTitle: 'Il Tuo', // Fixed part
    animatedPhrases: ["network privato", "hub organizzativo", "directory della comunità", "spazio per condividere"],
    features: [
      {
        title: 'Reti Chiuse',
        description: 'Crea reti private ad invito per sindacati, organizzazioni o gruppi di membri'
      },
      {
        title: 'Portfolio Membri',
        description: 'Mostra lavoro, competenze e profili professionali senza contenuti di terzi'
      },
      {
        title: 'Sicuro e Privato',
        description: 'Controllo degli accessi e protezione dei dati all\'interno del gruppo definito'
      },
      {
        title: 'Controlli Admin',
        description: 'Gestione membri, ruoli e impostazioni della rete con strumenti semplici'
      },
      {
        title: 'Zero Tracciamento',
        description: 'Nessuna analisi o tecnologia di tracciamento - privacy totale garantita'
      },
      {
        title: 'Organizzazione Eventi',
        description: 'Pianifica incontri ed eventi con funzioni integrate di programmazione'
      },
      {
        title: 'Supporto Umano 24/7',
        description: 'Assistenza reale ogni giorno con il nostro team dedicato'
      },
      {
        title: 'Soluzione White-Label',
        description: 'Personalizza la piattaforma con il tuo branding aziendale'
      }
    ],
    privacy: 'Privacy Policy',
    terms: 'Termini di Servizio'
  },
  pt: {
    appName: 'Mon Cercle App',
    navFeatures: 'Recursos',
    navLogin: 'Entrar',
    navSignUp: 'Inscrever-se',
    heroSubtitle: 'Crie e gerencie redes fechadas para membros se conectarem, compartilharem portfólios e informações de contato com segurança.',
    getStarted: 'Começar',
    viewDemo: 'Ver Demonstração',
    featuresTitle: 'Por Que Escolher Conclav?',
    heroTitle: 'Seu', // Fixed part
    animatedPhrases: ["rede privada", "hub organizacional", "diretório comunitário", "espaço para compartilhar"],
    features: [
      {
        title: 'Redes Fechadas',
        description: 'Crie redes privadas por convite para sindicatos ou organizações'
      },
      {
        title: 'Portfólios',
        description: 'Exiba trabalhos, habilidades e perfis profissionais dos membros'
      },
      {
        title: 'Seguro e Privado',
        description: 'Controle de acesso e proteção de dados dentro do grupo'
      },
      {
        title: 'Controles Admin',
        description: 'Gerencie membros e configurações com ferramentas simples'
      },
      {
        title: 'Sem Rastreamento',
        description: 'Nenhuma análise ou tecnologia de tracking - privacidade total'
      },
      {
        title: 'Eventos',
        description: 'Organize reuniões e eventos com agendamento integrado'
      },
      {
        title: 'Suporte 24/7',
        description: 'Assistência humana real disponível todos os dias'
      },
      {
        title: 'White-Label',
        description: 'Personalize com sua marca para experiência consistente'
      }
    ],
    privacy: 'Política de Privacidade',
    terms: 'Termos de Serviço'
  },
  ar: {
    appName: 'مون سيركل',
    navFeatures: 'الميزات',
    navLogin: 'تسجيل الدخول',
    navSignUp: 'التسجيل',
    heroSubtitle: 'أنشئ وشبكات مغلقة لإتاحة التواصل الآمن بين الأعضاء ومشاركة الأعمال وعرض معلومات الاتصال.',
    getStarted: 'ابدأ الآن',
    viewDemo: 'عرض التجربة',
    featuresTitle: 'لماذا تختار يوني؟',
    heroTitle: 'مركز', // Fixed part - using original Arabic term that means "Your Center"
    animatedPhrases: ["الشبكات الخاصة", "التنظيم الخاص بك", "دليل المجتمع", "مساحة المشاركة"],
    features: [
      {
        title: 'شبكات مغلقة',
        description: 'شبكات خاصة بالدعوة فقط للنقابات أو المنظمات'
      },
      {
        title: 'ملفات الأعضاء',
        description: 'عرض الأعمال والمهارات والملفات المهنية بدون محتوى تابع لجهات خارجية'
      },
      {
        title: 'آمن وخاص',
        description: 'تحكم كامل في الوصول وحماية البيانات داخل المجموعة'
      },
      {
        title: 'إعدادات الأدمن',
        description: 'إدارة الأعضاء والإعدادات بأدوات بسيطة'
      },
      {
        title: 'بدون تتبع',
        description: 'لا تحليلات أو تقنيات تتبع - خصوصية كاملة'
      },
      {
        title: 'تنظيم الفعاليات',
        description: 'خطط للاجتماعات والأحداث مع أدوات متكاملة'
      },
      {
        title: 'دعم بشري 24/7',
        description: 'مساعدة حقيقية متاحة كل أيام الأسبوع'
      },
      {
        title: 'تخصيص كامل',
        description: 'اطبع شبكتك بعلامتك التجارية الخاصة'
      }
    ],
    privacy: 'سياسة الخصوصية',
    terms: 'شروط الخدمة'
  },
  nl: {
    appName: 'Mon Cercle App',
    navFeatures: 'Functies',
    navLogin: 'Inloggen',
    navSignUp: 'Aanmelden',
    heroSubtitle: 'Maak en beheer gesloten netwerken zodat leden veilig kunnen verbinden, portfolio\'s delen en contactgegevens tonen.',
    getStarted: 'Start Nu',
    viewDemo: 'Demo Bekijken',
    featuresTitle: 'Waarom Conclav Kiezen?',
    heroTitle: 'Uw', // Fixed part
    animatedPhrases: ["privé netwerk", "organisatiehub", "gemeenschapsindex", "ruimte om te delen"],
    features: [
      {
        title: 'Gesloten Netwerken',
        description: 'Privé uitnodigingsnetwerken voor vakbonden/organisaties'
      },
      {
        title: 'Ledenportfolio\'s',
        description: 'Toon werk, vaardigheden en profielen zonder externe content'
      },
      {
        title: 'Veilig & Privé',
        description: 'Toegangscontrole en databescherming binnen de groep'
      },
      {
        title: 'Admin Tools',
        description: 'Leden en netwerkinstellingen eenvoudig beheren'
      },
      {
        title: 'Geen Tracking',
        description: 'Geen analyses of tracking - volledige privacy'
      },
      {
        title: 'Evenementen',
        description: 'Plan bijeenkomsten met geïntegreerde tools'
      },
      {
        title: '24/7 Support',
        description: 'Echte menselijke hulp elke dag beschikbaar'
      },
      {
        title: 'White-Label',
        description: 'Aanpassen met uw eigen huisstijl'
      }
    ],
    privacy: 'Privacybeleid',
    terms: 'Servicevoorwaarden'
  },
  el: {
    appName: 'Mon Cercle',
    navFeatures: 'Χαρακτηριστικά',
    navLogin: 'Σύνδεση',
    navSignUp: 'Εγγραφή',
    heroSubtitle: 'Δημιουργήστε κλειστά δίκτυα για ασφαλή σύνδεση μελών, κοινή χρήση portfolio και επαφών.',
    getStarted: 'Ξεκινήστε Τώρα',
    viewDemo: 'Προβολή Demo',
    featuresTitle: 'Γιατί να Επιλέξετε το Üni;',
    heroTitle: 'Το', // Fixed part
    animatedPhrases: ["ιδιωτικό σας δίκτυο", "κέντρο οργάνωσης", "κατάλογος κοινότητας", "χώρος κοινής χρήσης"],
    features: [
      {
        title: 'Κλειστά Δίκτυα',
        description: 'Ιδιωτικά δίκτυα με πρόσκληση για συνδικάτα/οργανώσεις'
      },
      {
        title: 'Portfolio Μελών',
        description: 'Προβολή εργασιών, δεξιοτήτων και επαγγελματικών προφίλ'
      },
      {
        title: 'Ασφαλής & Ιδιωτικό',
        description: 'Έλεγχος πρόσβασης και προστασία δεδομένων'
      },
      {
        title: 'Διαχείριση',
        description: 'Διαχείριση μελών και ρυθμίσεων με απλά εργαλεία'
      },
      {
        title: 'Χωρίς Παρακολούθηση',
        description: 'Ούτε ανάλυση ούτε τεχνολογίες tracking'
      },
      {
        title: 'Διοργάνωση Εκδηλώσεων',
        description: 'Προγραμματισμός συναντήσεων και events'
      },
      {
        title: '24/7 Υποστήριξη',
        description: 'Πραγματική βοήθεια από ανθρώπους κάθε μέρα'
      },
      {
        title: 'White-Label',
        description: 'Προσαρμογή με το branding σας'
      }
    ],
    privacy: 'Πολιτική Απορρήτου',
    terms: 'Όροι Χρήσης'
  },
  pl: {
    appName: 'Mon Cercle',
    navFeatures: 'Funkcje',
    navLogin: 'Zaloguj',
    navSignUp: 'Zarejestruj',
    heroSubtitle: 'Twórz zamknięte sieci dla bezpiecznego kontaktu członków, udostępniania portfolio i informacji kontaktowych.',
    getStarted: 'Rozpocznij',
    viewDemo: 'Zobacz Demo',
    featuresTitle: 'Dlaczego Üni?',
    heroTitle: 'Twoje', // Fixed part
    animatedPhrases: ["sieć prywatna", "centrum organizacji", "katalog społeczności", "przestrzeń do udostępniania"],
    features: [
      {
        title: 'Sieci Zamknięte',
        description: 'Prywatne sieci tylko z zaproszeniami dla związków/organizacji'
      },
      {
        title: 'Portfolio Członków',
        description: 'Pokazuj prace, umiejętności i profile zawodowe'
      },
      {
        title: 'Bezpieczne i Prywatne',
        description: 'Kontrola dostępu i ochrona danych w grupie'
      },
      {
        title: 'Panel Admina',
        description: 'Zarządzaj członkami i ustawieniami sieci'
      },
      {
        title: 'Brak Śledzenia',
        description: 'Zero analityki i technologii śledzących'
      },
      {
        title: 'Organizacja Wydarzeń',
        description: 'Planuj spotkania zintegrowanym kalendarzem'
      },
      {
        title: 'Wsparcie 24/7',
        description: 'Prawdziwa pomoc dostępna każdego dnia'
      },
      {
        title: 'White-Label',
        description: 'Dostosuj platformę do swojej marki'
      }
    ],
    privacy: 'Polityka Prywatności',
    terms: 'Warunki Użytkowania'
  },
  zh: {
    appName: 'ÜNI 圈子',
    navFeatures: '功能',
    navLogin: '登录',
    navSignUp: '注册',
    heroSubtitle: '创建和管理封闭网络，让成员安全连接、共享作品集并显示联系信息。',
    getStarted: '立即开始',
    viewDemo: '查看演示',
    heroTitle: '您的', // Fixed part
    animatedPhrases: ["私人网络", "组织中心", "社区目录", "共享空间"],
    featuresTitle: '为什么选择ÜNI？',
    features: [
      {
        title: '封闭网络',
        description: '为工会/组织创建仅限邀请的私人网络'
      },
      {
        title: '成员作品集',
        description: '展示作品、技能和专业档案'
      },
      {
        title: '安全私密',
        description: '访问控制和组内数据保护'
      },
      {
        title: '管理控制',
        description: '使用简单工具管理成员和设置'
      },
      {
        title: '无追踪设计',
        description: '没有分析或跟踪技术 - 完全隐私'
      },
      {
        title: '活动组织',
        description: '使用集成工具计划会议和活动'
      },
      {
        title: '24/7 人工支持',
        description: '每天提供真人协助'
      },
      {
        title: '白标解决方案',
        description: '使用您的品牌自定义平台'
      }
    ],
    privacy: '隐私政策',
    terms: '服务条款'
  }
};

// Update language selector in AppBar:


// ... rest of the component remains unchanged
  


  // Get current language content
  const t = content[language];

  // Features with icons
  const featureIcons = [
    <PeopleIcon fontSize="medium" color="primary" />,
    <AccountBoxIcon fontSize="medium" color="primary" />,
    <LockIcon fontSize="medium" color="primary" />,
    <AdminPanelSettingsIcon fontSize="medium" color="primary" />,
    <VisibilityOffIcon fontSize="medium" color="primary" />,
    <EventIcon fontSize="medium" color="primary" />,
    <SupportAgentIcon fontSize="medium" color="primary" />,
    <BrushIcon fontSize="medium" color="primary" />
  ];

  // Handle language change
  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  // --- JSX Structure ---
  return (
    <PageTransition>
      <Box sx={{ 
        flexGrow: 1,
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
              // backgroundColor: '#f3f3f3'

        backgroundColor: '#eef4f9'
      }}>
        {/* Three.js Background Animation */}
        <ThreeJSBackground />
        
        {/* Content positioned above the background */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* --- Navigation AppBar --- */}
        <AppBar 
          position="relative"
          color="transparent" 
          elevation={0} 
          sx={{ 
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 10
          }}
        >
          <div className="toolbar-wrapper" style={{ position: 'relative', zIndex: 50 }}>
            <Toolbar sx={{ flexWrap: 'wrap' }}>
              <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                <Box 
                  component="img"
                  src={Logo}
                  alt="Mon Cercle Logo"
                  sx={{ 
                    height: 60,
                    display: 'inline-block',
                    padding: '10px'
                  }}
                />
                <Typography 
                  variant="h5" 
                  component="span" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: '#1976d2',
                    ml: 1,
                  }}
                >
                  Conclav
                </Typography>
              </Typography>
              <nav style={{ display: 'flex', alignItems: 'center' }}>
                {/* Language selector */}
                <FormControl size="small" sx={{ minWidth: 120, mr: 2 }}>
                <Select
                  value={language}
                  onChange={handleLanguageChange}
                  displayEmpty
                  size="small"
                  startAdornment={<LanguageIcon fontSize="small" sx={{ mr: 1 }} />}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="it">Italiano</MenuItem>
                  <MenuItem value="pt">Português</MenuItem>
                  <MenuItem value="ar">العربية</MenuItem>
                  <MenuItem value="nl">Nederlands</MenuItem>
                  <MenuItem value="el">Ελληνικά</MenuItem>
                  <MenuItem value="pl">Polski</MenuItem>
                  <MenuItem value="zh">中文</MenuItem>
                </Select>
              </FormControl>
                
                {/* Navigation links */}
                <Link
                  variant="button"
                  color="text.primary"
                  href="#features"
                  sx={{ my: 1, mx: 1.5, display: { xs: 'none', md: 'block' } }}
                >
                  {t.navFeatures}
                </Link>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="outlined"
                  sx={{ my: 1, mx: 1.5 }}
                >
                  {t.navLogin}
                </Button>
              </nav>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                sx={{ my: 1, mx: 1.5 }}
              >
                {t.navSignUp}
              </Button>
            </Toolbar>
          </div>
        </AppBar>

        {/* --- Hero Section --- */}
        {/* Hero Container */}
<Container
  disableGutters
  component="main"
  sx={{
    pt: { xs: 6, sm: 10, md: 20 },
    pb: { xs: 4, sm: 5, md: 12 },
    position: 'relative',
    zIndex: 2,
    '& h1, & h5': {
      textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
    },
    overflow: 'hidden'
  }}
>
  {/* Title Section with Animation */}
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left',
      mb: { xs: 3, md: 6 },
      px: 2
    }}
  >
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'left',
        width: '100%'
      }}
    >
      {/* Fixed "Your" text */}
      <Typography
        component="span"
        variant="h1"
        sx={{
          fontSize: { xs: '1.5rem', sm: '2.5rem', md: '4.5rem', lg: '6rem' },
          fontWeight: 800,
          color: 'rgb(4, 13, 22)',
          lineHeight: 1,
          textAlign: { xs: 'center', sm: 'right' }
        }}
      >
    {t.heroTitle}&nbsp;
    </Typography>
      
      {/* Animated Text Container */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: '3rem', sm: '4rem', md: '5rem', lg: '6.5rem' },
          width: { xs: '260px', sm: '300px', md: '400px', lg: '500px' },
        }}
      >
        <TextCycler
          phrases={t.animatedPhrases}
          interval={3000}
        />
      </Box>
    </Box>
  </Box>
  
  {/* Hero Subtitle */}
  <Typography
    variant="h5"
    align="left"
    component="p"
    sx={{
      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.3rem' },
      lineHeight: 1.6,
      fontWeight: 'medium',
      color: 'rgb(4, 13, 22)',
      mb: 2,
      // mx: 'auto',
      maxWidth: '90%',
      px: 2
    }}
  >
    {t.heroSubtitle}
  </Typography>
  
  {/* Privacy Badge */}
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2,
    mb: { xs: 4, md: 8 },
    px: 2
  }}>
    <Chip 
      icon={<LockIcon />} 
      label={t.gdprCompliant}
      size="small"
      sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        '& .MuiChip-icon': { fontSize: 16 }
      }}
    />
    <Typography variant="caption" sx={{ color: 'rgba(0, 0, 0, 0.6)' }}>
      {t.dataProtection}
    </Typography>
  </Box>


          <Stack
            sx={{ pt: 2 }}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button 
              component={RouterLink} 
              to="/signup" 
              variant="contained" 
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '2rem',
                boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {t.getStarted}
            </Button>
            <Button 
              component={RouterLink}
              to="/create-network"
              variant="contained" 
              color="secondary"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '2rem',
                boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Create Your Network
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              component={RouterLink}
              to="/demo"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '2rem',
                borderColor: 'white',
                color: ' rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(5px)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {t.viewDemo}
            </Button>
          </Stack>
        </Container>

<Container
  id="features"
  sx={{
    py: { xs: 4, md: 6 },
    borderRadius: 2,
    border: 'solid white 1px',
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgb(24 118 210 / 22%);',
    position: 'relative',
    zIndex: 2,
    maxWidth: '95%' // Consider using standard MUI maxWidths like 'lg' or 'xl' if '95%' isn't essential
  }}
  maxWidth="lg" // Using 'lg' here is good practice
>
  <Typography
    component="h2"
    variant="h3"
    align="center"
    color="white"
    gutterBottom
    sx={{
      mb: 4,
      fontWeight: 700,
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
    }}
  >
    {t.featuresTitle}
  </Typography>

  {/* Features grid - This setup IS responsive */}
  <Grid
    container
    spacing={{ xs: 2, sm: 3, md: 4 }}
    // columns prop is often unnecessary if using standard 12 columns, but fine here.
    // columns={{ xs: 12, sm: 12, md: 12 }} 
    justifyContent="center"
    alignItems="stretch" // Added: Ensures cards in the same row stretch to the same height if needed
  >
    {t.features.map((feature, index) => (
      <Grid
        item
        key={feature.title}
        xs={12} // Full width on extra-small screens
        sm={6}  // Half width on small screens and up
        md={4}  // One-third width on medium screens and up
      >
        <AnimatedCard
          sx={{
            height: '100%', // Makes card fill the Grid item height (works with alignItems="stretch" on container)
            display: 'flex',
            flexDirection: 'column', // Changed from column to row to match icon/text layout
            // alignItems: 'center', // Align items vertically if needed within the row
            borderRadius: 2,
            // maxWidth: '45%',
            // width: '100%', // Correct: Card fills its Grid item horizontally
            overflow: 'hidden',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            animation: `fadeInUp 0.4s ease-out ${index * 100}ms forwards`,
            opacity: 0,
            '@keyframes fadeInUp': {
              from: {
                opacity: 0,
                transform: 'translateY(30px)',
              },
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
            // maxHeight: '140px' // Consider removing maxHeight if height: '100%' and alignItems="stretch" work better
          }}
        >
          {/* Icon part */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(25, 118, 210, 0.05)',
              p: 2,
              // height: '100%', // No longer needed if Card is flex row
              minWidth: '80px' // Keeps icon area consistent
            }}
          >
            {featureIcons[index]}
          </Box>
          {/* Content part */}
          <CardContent sx={{ p: 2, flex: 1 /* Allows content to take remaining space */ }}>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              sx={{
                fontWeight: 600,
                fontSize: '2rem',
                // color: 'rgb(4, 13, 22)',

              }}
            >
              {feature.title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.875rem',
                lineHeight: 1.5
              }}
            >
              {feature.description}
            </Typography>
          </CardContent>
        </AnimatedCard>
      </Grid>
    ))}
  </Grid>
</Container>

{/* GDPR and European Origin Section */}
<Container sx={{ 
  py: 4,
  position: 'relative',
  zIndex: 2,
  my: 4
}}>
  <Box sx={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3,
    opacity: 0.8
  }}>
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      color: 'white'
    }}>
      <Box 
        component="img"
        src={EuFlag}
        alt="European Union"
        sx={{ 
          height: 20,
          opacity: 0.7
        }}
      />
      <Typography variant="body2">
        {t.madeInFrance}
      </Typography>
    </Box>
    
    <Typography variant="body2" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
      <LockIcon sx={{ fontSize: 18 }} />
      {t.gdprCompliant}
    </Typography>
    
    <Typography variant="body2" sx={{ color: 'white' }}>
      {t.dataProtection}
    </Typography>
  </Box>
</Container>

<Container sx={{ 
  py: 8,
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: 'rgb(24 118 210 / 22%);',
  backdropFilter: 'blur(10px)',
  my: 8
}}>
  <Typography variant="h3" align="center" gutterBottom sx={{ 
    color: 'white',
    mb: 6,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 4
  }}>
    {t.trustTitle}
  </Typography>

  <Box sx={{
    display: 'flex',
    animation: 'slide 40s linear infinite',
    '@keyframes slide': {
      '0%': { transform: 'translateX(0)' },
      '100%': { transform: 'translateX(-50%)' }
    },
    '&:hover': {
      animationPlayState: 'paused'
    }
  }}>
    {[...clients, ...clients].map((client, index) => (
      <Box key={index} sx={{ 
        px: 4,
        display: 'flex',
        alignItems: 'center',
        height: 80,
        filter: 'invert(100%)',
        '&:hover': {
          transform: 'scale(1.1)',
          filter: 'invert(100%) brightness(1.2)'
        },
        transition: 'all 0.3s ease'
      }}>
        <img 
          src={client.logo} 
          alt={client.name}
          style={{ 
            height: '100%', 
            width: 'auto', 
            maxWidth: 200,
            ...client.style 
          }}
        />
      </Box>
    ))}
  </Box>
</Container>
        {/* --- End Features Section --- */}

        {/* --- Footer --- */}
        <Container
          maxWidth="md"
          component="footer"
          sx={{
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            mt: 8,
            py: [3, 6],
            backgroundColor: 'rgb(24 118 210 / 22%);',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            zIndex: 2,
            color: 'white'
          }}
        >
<Grid container spacing={3} alignItems="center" justifyContent="center">
  <Grid item xs={12} sm="auto">
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box 
        component="img"
        src={EuFlag}
        alt="European Union Flag"
        sx={{ 
          height: 20,
          opacity: 0.6
        }}
      />
      <Typography variant="caption" sx={{ color: '#0c3f9c', opacity: 0.8 }}>
        {t.gdprCompliant}
      </Typography>
    </Box>
  </Grid>
  
  {/* Add Double Geste logo */}
  <Grid item xs={12} sm="auto">
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      color: '#0c3f9c',
      '&:hover': {
        color: 'text.primary'
      },
      transition: 'color 0.3s ease'
    }}>
      <DGLogo sx={{ 
      
      color: '#0c3f9c'
    }}/>
      <Typography variant="h5">
        {t.poweredBy}
      </Typography>
    </Box>
  </Grid>

  <Grid item xs={12} sm="auto">
    <Typography variant="body2" color="#0c3f9c" align="center">
      {'© '}
      <Link color="inherit" href="#">
        {t.appName}
      </Link>{' '}
      {new Date().getFullYear()}
    </Typography>
    <Stack 
      direction={{ xs: 'column', sm: 'row' }} 
      justifyContent="center" 
      spacing={{ xs: 1, sm: 2 }} 
      sx={{ mt: 1 }}
    >
      <Link component={RouterLink} to="/privacy" variant="body2" color="#0c3f9c">
        {t.privacy}
      </Link>
      <Link component={RouterLink} to="/terms" variant="body2" color="#0c3f9c">
        {t.terms}
      </Link>
    </Stack>
  </Grid>
</Grid>
        </Container>
      </Box>
    </Box>
    </PageTransition>
  );
}

export default LandingPage;





