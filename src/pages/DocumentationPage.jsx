import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Link,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  Shield as ShieldIcon,
  Payment as PaymentIcon,
  Storage as StorageIcon,
  Support as SupportIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DocumentationPage = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedAccordion, setExpandedAccordion] = useState(false);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };

  const faqCategories = [
    {
      title: 'Démarrage',
      icon: <HelpIcon />,
      faqs: [
        {
          question: "Qu'est-ce que Conclav ?",
          answer: "Conclav est une plateforme collaborative pour créer et gérer des communautés privées. Chaque cercle (network) dispose d'outils de communication, de partage de fichiers, d'événements, et bien plus pour faciliter la collaboration entre membres."
        },
        {
          question: "Comment créer mon premier cercle ?",
          answer: "Après inscription, cliquez sur 'Créer un cercle' depuis votre tableau de bord. Suivez l'assistant de configuration qui vous guidera à travers le choix du nom, la description, les fonctionnalités activées et le niveau de confidentialité."
        },
        {
          question: "Quelle est la différence entre un admin et un membre ?",
          answer: "Les administrateurs peuvent gérer tous les aspects du cercle : inviter/supprimer des membres, modérer le contenu, créer des événements, personnaliser les paramètres. Les membres peuvent participer aux activités mais n'ont pas accès aux fonctions d'administration."
        }
      ]
    },
    {
      title: 'Fonctionnalités',
      icon: <CodeIcon />,
      faqs: [
        {
          question: "Comment fonctionne le chat en temps réel ?",
          answer: "Le chat utilise WebSocket pour des messages instantanés. Vous pouvez mentionner des membres avec @, répondre à des messages spécifiques, et partager des médias (images, vidéos, PDF). Les messages supportent le formatage Markdown."
        },
        {
          question: "Qu'est-ce qu'un moodboard ?",
          answer: "Un moodboard est un espace créatif visuel où vous pouvez organiser des images, du texte et d'autres contenus. Parfait pour brainstormer, créer des mood boards de projets ou partager des inspirations visuelles."
        },
        {
          question: "Comment fonctionnent les événements ?",
          answer: "Les administrateurs peuvent créer des événements avec date, lieu (avec carte), capacité maximale et description. Les membres peuvent confirmer leur participation. Les événements apparaissent dans le calendrier du cercle."
        },
        {
          question: "Puis-je créer des sondages ?",
          answer: "Oui ! Les administrateurs peuvent créer des sondages à choix multiples, oui/non, ou avec sélection de dates. Les votes peuvent être anonymes ou publics selon les paramètres choisis."
        }
      ]
    },
    {
      title: 'Membres & Invitations',
      icon: <PersonIcon />,
      faqs: [
        {
          question: "Comment inviter de nouveaux membres ?",
          answer: "Deux méthodes : 1) Invitation directe par email depuis l'onglet Membres, 2) Création de liens d'invitation réutilisables avec QR code. Vous pouvez définir le rôle (admin/membre) et une limite d'utilisation."
        },
        {
          question: "Comment gérer les badges d'engagement ?",
          answer: "Les badges récompensent l'activité des membres. Créez des badges personnalisés avec icônes et couleurs, définissez des critères automatiques (nombre de posts, participations) ou attribuez-les manuellement."
        },
        {
          question: "Puis-je modérer les membres ?",
          answer: "Les administrateurs peuvent suspendre temporairement ou restreindre des membres, masquer/signaler du contenu inapproprié. Toutes les actions sont enregistrées dans les logs de modération."
        }
      ]
    },
    {
      title: 'Sécurité & Confidentialité',
      icon: <ShieldIcon />,
      faqs: [
        {
          question: "Mes données sont-elles sécurisées ?",
          answer: "Oui. Nous utilisons le chiffrement SSL/TLS pour toutes les communications, l'authentification Supabase sécurisée, et des politiques RLS (Row Level Security) pour protéger l'accès aux données. Les fichiers sont stockés de manière sécurisée sur Supabase Storage."
        },
        {
          question: "Qui peut voir le contenu de mon cercle ?",
          answer: "Cela dépend du niveau de confidentialité : Public (visible par tous), Privé (membres uniquement), Sur invitation (accès restreint). Les administrateurs contrôlent totalement qui peut rejoindre et voir le contenu."
        },
        {
          question: "Comment supprimer mon compte ?",
          answer: "Contactez le support via un ticket. La suppression est définitive et entraîne la perte de toutes vos données. Si vous êtes le seul admin d'un cercle, transférez d'abord les droits ou supprimez le cercle."
        }
      ]
    },
    {
      title: 'Abonnement & Facturation',
      icon: <PaymentIcon />,
      faqs: [
        {
          question: "Quels sont les plans disponibles ?",
          answer: "Starter (gratuit) : jusqu'à 10 membres, 2GB stockage. Community (17€/mois) : 50 membres, 10GB. Professional (47€/mois) : 200 membres, 50GB. Business (97€/mois) : 500 membres, 100GB. Enterprise (297€/mois) : illimité, 5TB."
        },
        {
          question: "Comment changer de plan ?",
          answer: "Depuis l'administration du cercle > Facturation, vous pouvez upgrader ou downgrader instantanément. Les changements sont calculés au prorata. Le downgrade peut nécessiter de réduire le nombre de membres ou l'espace utilisé."
        },
        {
          question: "Quels moyens de paiement acceptez-vous ?",
          answer: "Nous acceptons les cartes de crédit/débit via Stripe (Visa, Mastercard, American Express). Les paiements sont sécurisés et conformes PCI DSS. Factures disponibles dans votre espace facturation."
        }
      ]
    },
    {
      title: 'Stockage & Médias',
      icon: <StorageIcon />,
      faqs: [
        {
          question: "Quels types de fichiers puis-je partager ?",
          answer: "Images (JPG, PNG, GIF, WebP), Vidéos (MP4, WebM), Audio (MP3, WAV), Documents (PDF), et plus. Taille max par fichier : 50MB pour images/audio, 200MB pour vidéos, 100MB pour PDF."
        },
        {
          question: "Comment est calculé mon espace de stockage ?",
          answer: "L'espace inclut tous les fichiers uploadés par les membres du cercle : médias dans les messages, fichiers partagés, images d'événements, etc. Un indicateur visuel montre l'utilisation en temps réel."
        },
        {
          question: "Que se passe-t-il si j'atteins ma limite ?",
          answer: "Les nouveaux uploads sont bloqués jusqu'à ce que vous libériez de l'espace ou passiez à un plan supérieur. Les fichiers existants restent accessibles. Nous vous alertons à 80% et 95% d'utilisation."
        }
      ]
    },
    {
      title: 'Support & Aide',
      icon: <SupportIcon />,
      faqs: [
        {
          question: "Comment contacter le support ?",
          answer: "Les administrateurs peuvent créer des tickets support depuis leur interface d'administration. Catégorisez votre demande (technique, facturation, bug, suggestion) et définissez la priorité. Réponse sous 24-48h."
        },
        {
          question: "Où puis-je suggérer de nouvelles fonctionnalités ?",
          answer: "Créez un ticket de type 'Feature Request' depuis l'administration. Décrivez votre idée en détail. Les suggestions populaires sont évaluées pour les futures mises à jour."
        },
        {
          question: "Y a-t-il des tutoriels vidéo ?",
          answer: "Nous développons actuellement une bibliothèque de tutoriels. En attendant, cette documentation et les info-bulles dans l'interface vous guident. Pour une aide spécifique, créez un ticket support."
        }
      ]
    }
  ];

  const quickLinks = [
    { title: "Créer un cercle", path: "/dashboard", description: "Démarrez votre communauté" },
    { title: "Voir les prix", path: "/pricing", description: "Plans et tarifs" },
    { title: "Conditions d'utilisation", path: "/terms", description: "CGU et mentions légales" },
    { title: "Se connecter", path: "/login", description: "Accéder à votre compte" }
  ];

  // Filter FAQs based on search
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Centre d'aide Conclav
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Trouvez rapidement des réponses à vos questions
        </Typography>
        
        {/* Search Bar */}
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher dans la documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* Quick Links */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {quickLinks.map((link, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => navigate(link.path)}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {link.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {link.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={selectedTab} 
          onChange={(e, v) => setSelectedTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="FAQ" />
          <Tab label="Fonctionnalités" />
          <Tab label="Premiers pas" />
          <Tab label="Contact" />
        </Tabs>
      </Paper>

      {/* FAQ Section */}
      {selectedTab === 0 && (
        <Box>
          {searchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0)} résultats pour "{searchQuery}"
            </Typography>
          )}
          
          {filteredCategories.map((category, categoryIndex) => (
            <Box key={categoryIndex} mb={4}>
              <Box display="flex" alignItems="center" mb={2}>
                {category.icon}
                <Typography variant="h5" ml={1}>
                  {category.title}
                </Typography>
              </Box>
              
              {category.faqs.map((faq, faqIndex) => (
                <Accordion 
                  key={faqIndex}
                  expanded={expandedAccordion === `${categoryIndex}-${faqIndex}`}
                  onChange={handleAccordionChange(`${categoryIndex}-${faqIndex}`)}
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}

          {filteredCategories.length === 0 && searchQuery && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                Aucun résultat trouvé pour "{searchQuery}"
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Essayez avec d'autres mots-clés ou contactez le support
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Features Tab */}
      {selectedTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Communication
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Chat en temps réel"
                    secondary="Messages instantanés avec mentions et réponses"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Messages directs"
                    secondary="Conversations privées entre membres"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Mur social"
                    secondary="Flux d'actualités et partage de contenu"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Organisation
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Événements"
                    secondary="Création et gestion avec carte et inscriptions"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Wiki"
                    secondary="Base de connaissances collaborative"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Fichiers partagés"
                    secondary="Stockage et partage sécurisés"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Getting Started Tab */}
      {selectedTab === 2 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>
            Guide de démarrage rapide
          </Typography>
          
          <Box component="ol" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1" paragraph>
              <strong>Créez votre compte</strong> - Inscrivez-vous avec votre email
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Créez ou rejoignez un cercle</strong> - Utilisez l'assistant ou un lien d'invitation
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Complétez votre profil</strong> - Ajoutez photo et informations
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Invitez des membres</strong> - Partagez le lien ou envoyez des invitations
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Configurez les fonctionnalités</strong> - Activez chat, événements, wiki selon vos besoins
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Commencez à collaborer !</strong> - Créez du contenu et interagissez
            </Typography>
          </Box>

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Besoin d'aide supplémentaire ?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              N'hésitez pas à créer un ticket support depuis votre interface d'administration
              pour une assistance personnalisée.
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Contact Tab */}
      {selectedTab === 3 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SupportIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Contactez notre équipe
          </Typography>
          
          <Typography variant="body1" paragraph>
            Pour toute question technique, demande de fonctionnalité ou problème de facturation
          </Typography>

          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Pour les administrateurs de cercle
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Créez un ticket support directement depuis votre interface d'administration.
              Notre équipe vous répondra sous 24-48h.
            </Typography>
            
            <Typography variant="h6" gutterBottom mt={3}>
              Pour les autres demandes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email : support@moncercle.app
            </Typography>
          </Box>

          <Box mt={4} p={3} bgcolor="primary.light" borderRadius={2}>
            <Typography variant="body2">
              💡 Astuce : Les tickets créés depuis l'interface d'administration
              sont traités en priorité et permettent un meilleur suivi.
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default DocumentationPage;