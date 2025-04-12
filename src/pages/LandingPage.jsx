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
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

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

// --- Component Definition ---
function LandingPage() {
  // Language state
  const [language, setLanguage] = useState('en');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // --- Text content for different languages ---
  const content = {
    en: {
      appName: 'Mon Cercle App',
      navFeatures: 'Features',
      navLogin: 'Login',
      navSignUp: 'Sign Up',
      heroTitle: 'Your Private Network Hub',
      heroSubtitle: 'Easily create and manage closed networks for your members to connect, share portfolios, and display contact information securely.',
      getStarted: 'Get Started',
      viewDemo: 'View Demo',
      featuresTitle: 'Why Choose Üni?',
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
      terms: 'Terms of Service'
    },
    fr: {
      appName: 'Mon Cercle',
      navFeatures: 'Fonctionnalités',
      navLogin: 'Connexion',
      navSignUp: 'S\'inscrire',
      heroTitle: 'Votre Plateforme de Réseau Privé',
      heroSubtitle: 'Créez et gérez facilement des réseaux fermés pour permettre à vos membres de se connecter, partager leurs portfolios et afficher leurs coordonnées en toute sécurité.',
      getStarted: 'Commencer',
      viewDemo: 'Voir la Démo',
      featuresTitle: 'Pourquoi Choisir Mon Cercle?',
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
      terms: 'Conditions d\'Utilisation'
    },
    es: {
      appName: 'Mon Cercle App',
      navFeatures: 'Características',
      navLogin: 'Iniciar Sesión',
      navSignUp: 'Registrarse',
      heroTitle: 'Tu Centro de Redes Privadas',
      heroSubtitle: 'Crea y gestiona fácilmente redes cerradas para que tus miembros se conecten, compartan portafolios y muestren información de contacto de forma segura.',
      getStarted: 'Empezar',
      viewDemo: 'Ver Demo',
      featuresTitle: '¿Por Qué Elegir Üni?',
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
      heroTitle: 'Ihr Privates Netzwerk-Zentrum',
      heroSubtitle: 'Erstellen und verwalten Sie geschlossene Netzwerke, in denen sich Mitglieder sicher verbinden, Portfolios teilen und Kontaktinformationen austauschen können.',
      getStarted: 'Loslegen',
      viewDemo: 'Demo Ansehen',
      featuresTitle: 'Warum Üni Wählen?',
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
    }
      ,
    it: {
    appName: 'Mon Cercle App',
    navFeatures: 'Caratteristiche',
    navLogin: 'Accedi',
    navSignUp: 'Registrati',
    heroTitle: 'Il Tuo Hub di Reti Private',
    heroSubtitle: 'Crea e gestisci facilmente reti chiuse per consentire ai membri di connettersi, condividere portfolio e visualizzare informazioni di contatto in modo sicuro.',
    getStarted: 'Inizia Ora',
    viewDemo: 'Vedi Demo',
    featuresTitle: 'Perché Scegliere Üni?',
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
    heroTitle: 'Seu Hub de Rede Privada',
    heroSubtitle: 'Crie e gerencie redes fechadas para membros se conectarem, compartilharem portfólios e informações de contato com segurança.',
    getStarted: 'Começar',
    viewDemo: 'Ver Demonstração',
    featuresTitle: 'Por Que Escolher Üni?',
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
    heroTitle: 'مركز الشبكات الخاصة الخاص بك',
    heroSubtitle: 'أنشئ وشبكات مغلقة لإتاحة التواصل الآمن بين الأعضاء ومشاركة الأعمال وعرض معلومات الاتصال.',
    getStarted: 'ابدأ الآن',
    viewDemo: 'عرض التجربة',
    featuresTitle: 'لماذا تختار يوني؟',
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
    heroTitle: 'Uw Privé Netwerk Hub',
    heroSubtitle: 'Maak en beheer gesloten netwerken zodat leden veilig kunnen verbinden, portfolio\'s delen en contactgegevens tonen.',
    getStarted: 'Start Nu',
    viewDemo: 'Demo Bekijken',
    featuresTitle: 'Waarom Üni Kiezen?',
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
    heroTitle: 'Κέντρο Ιδιωτικών Δικτύων',
    heroSubtitle: 'Δημιουργήστε κλειστά δίκτυα για ασφαλή σύνδεση μελών, κοινή χρήση portfolio και επαφών.',
    getStarted: 'Ξεκινήστε Τώρα',
    viewDemo: 'Προβολή Demo',
    featuresTitle: 'Γιατί να Επιλέξετε το Üni;',
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
    heroTitle: 'Twoje Centrum Sieci Prywatnych',
    heroSubtitle: 'Twórz zamknięte sieci dla bezpiecznego kontaktu członków, udostępniania portfolio i informacji kontaktowych.',
    getStarted: 'Rozpocznij',
    viewDemo: 'Zobacz Demo',
    featuresTitle: 'Dlaczego Üni?',
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
    heroTitle: '您的私人网络中心',
    heroSubtitle: '创建和管理封闭网络，让成员安全连接、共享作品集并显示联系信息。',
    getStarted: '立即开始',
    viewDemo: '查看演示',
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
    <Box sx={{ 
      flexGrow: 1,
      position: 'relative',
      minHeight: '100vh',
      overflow: 'hidden',
      backgroundColor: '#001428'
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
                  ÜNI
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
        <Container 
          disableGutters 
          maxWidth="md" 
          component="main" 
          sx={{ 
            pt: { xs: 6, md: 8 }, 
            pb: { xs: 4, md: 6 },
            position: 'relative',
            zIndex: 2,
            '& h1, & h5': {
              textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
            }
          }}
        >
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="white"
            gutterBottom
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              mb: 3
            }}
          >
            {t.heroTitle}
          </Typography>
          <Paper
            elevation={3}
            sx={{
              p: { xs: 2, md: 3 },
              mb: 4,
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '90%',
              mx: 'auto'
            }}
          >
            <Typography 
              variant="h5" 
              align="center" 
              color="text.primary" 
              component="p" 
              sx={{ 
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                lineHeight: 1.6,
                fontWeight: 'bold'
              }}
            >
              {t.heroSubtitle}
            </Typography>
          </Paper>
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
              variant="outlined" 
              size="large"
              color="secondary"
              component={RouterLink}
              to="/demo"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: '2rem',
                borderColor: 'white',
                color: 'white',
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
        <Card
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
            transition: 'all 0.2s ease-in-out',
            textAlign: 'center',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)'
            },
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
                fontSize: '1rem'
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
        </Card>
      </Grid>
    ))}
  </Grid>
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
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
            position: 'relative',
            zIndex: 2
          }}
        >
          <Grid container spacing={3} alignItems="center" justifyContent="center">
            <Grid item xs={12} sm="auto">
              <Box 
                component="img"
                src={EuFlag}
                alt="European Union Flag"
                sx={{ 
                  height: 40,
                  display: 'block',
                  mx: 'auto'
                }}
              />
            </Grid>
            <Grid item xs={12} sm="auto">
              <Typography variant="body2" color="text.secondary" align="center">
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
                <Link component={RouterLink} to="/privacy" variant="body2" color="text.secondary">
                  {t.privacy}
                </Link>
                <Link component={RouterLink} to="/terms" variant="body2" color="text.secondary">
                  {t.terms}
                </Link>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}

export default LandingPage;