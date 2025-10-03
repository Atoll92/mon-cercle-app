// src/pages/RezoProSpecSignupPage.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseclient';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  LockOutlined as LockIcon,
  ArticleOutlined as CharterIcon,
} from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ThreeJSBackground from '../components/ThreeJSBackground';
import { validatePassword, getPasswordStrength, getPasswordStrengthLabel, getPasswordRequirementsText } from '../utils/passwordValidation';

const REZOPROSPEC_NETWORK_ID = '99a9ee13-fef0-416d-bbb3-dd8c73fd07af'; // Replace with actual network ID

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea', // Purple color for Rezo Pro Spec branding
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Charter text
const CHARTER_TEXT = `Bonjour,

Voici quelques précisions sur les objectifs et le fonctionnement de la communauté rezoprospec qui en constituent la charte.

Objectifs :

rezopropec signifie : RESeau PROfessionnel du SPEctacle et de la Culture

C'est une plateforme communautaire gratuite de mutualisation de moyens, d'échange de services, de partage de savoir et d'entraide destinée à faciliter le partage de message entre toutes les personnes physiques pour aider à la production, la diffusion de l'art, au développement culturel et des pratiques artistiques en Région Provence Alpes Cote d'Azur.

L'inscription et l'utilisation du rezo sont libres et gratuites.

Le simple fait de s'inscrire constitue un engagement à respecter cette charte et la Netiquette, charte de bonne conduite des acteurs de l'Internet, qu'ils soient utilisateurs professionnels ou particuliers que vous pouvez consulter à cette adresse: Nétiquette

C'est aussi un engagement à répondre aux messages partagés dans la mesure de vos possibilités.

L'utilisation des liste sur Riseup.net est soumise à l'acceptation des conditions que vous trouverez à l'adresse: https://riseup.net/about-us/policy/tos

Les messages sont modérés.

L'objectif est de faciliter le partage de messages sur les thèmes suivants :

→ L'offre, la demande et la recherche, d'emplois dans le secteur culturel, CDD, CDI, de stage…

→ La mise en place de projets : créations, événements, programmations à thèmes…

→ La mutualisation de moyens : locaux de répétions, logements d'artiste, coloc, résidences, moyens de transport, covoiturage, dons, échanges, prêts de matériel…

→ Le partage de compétences : formation, transmission, stages…

→ L'échange de savoirs : techniques, administratives, infos légales…

→ La recherche de partenaires : coproduction, personnes ressources, appels à projets…

→ Annoncer des événements exceptionnels : création, sortie d'ateliers, répétitions publiques et gratuites, sortie de CD, vernissages…

Ce groupe n'est pas destinée à rechercher du public pour des spectacles à entrée payante même pas chère. Merci donc de ne pas envoyer de messages publicitaires, promotionnels sur des programmations ponctuelles ou régulières.

Ce n'est pas non plus un forum, il n'est donc pas destinée à faire circuler des messages à caractère politiques, militants, ou des appels à pétition, il existe déjà de nombreuses listes de diffusion ou forums dédiés à cela.

Nous ne partageons pas les appel à crowfunding pour lesquels il faut partir de son propre réseau

Le principal ennemi des listes de diffusion est la perte d'information engendrée par une surabondance de messages, il est donc important de vérifier la conformité du vôtre à la charte avant tout envoi. En cas de doute, n'hésitez pas à interroger les modérateurs.

Fonctionnement :

Le principe de base est simple, une fois inscrit : vous envoyez votre message à l'adresse:

" rezoprospec@lists.riseup.net "

et il est partagé, après validation par un modérateur, avec tous-tes les abonné-e-s, environ 1400 au 25 janvier 2021. Les messages doivent être en texte brut, les pièces jointes ne sont pas autorisées afin de garantir la légèreté des messages et une circulation fluide y compris auprès des abonnés qui ne disposeraient pas d'une connexion haut débit.

Il est vivement conseillé de ne pas utiliser les options HTML et texte riche.

Pour s'abonner, il suffit d'envoyer un message, présentant vos liens professionnels avec les arts et la culture et votre motivation pour rejoindre le groupe,

à l'adresse suivante: rezoprospec-subscribe@lists.riseup.net Vous recevrez une demande de confirmation à laquelle il suffira de répondre sans en modifier le message.

Vous recevez ensuite ce texte qui est le garant du bon fonctionnement de la liste. Si vous ne recevez pas de demande de confirmation, elle est probablement dans vos spam. Si vous rencontrez des difficultés, contactez-nous.

Une procédure de désinscription rapide est prévue, et figure à la fin de tous les messages, il suffit d'expédier un message à l'adresse :

rezoprospec-unsubscribe@lists.riseup.net

Il n'est pas indispensable de créer une adresse Riseup pour vous inscrire, vous pouvez le faire avec n'importe quelle adresse.

Envoi et rédaction des messages : Les messages doivent être rédigé au format texte. Il est très important de mentionner un objet indiquant la teneur du message et une signature explicite.

Les pièces jointes et le html ne sont pas autorisées.

Pour éviter la multiplication des messages, les réponses doivent être envoyé seulement à l'expéditeur du message.

Même si rezoprospec est virtuel, il relie des femmes et des hommes il est donc important de soigner la rédaction des envois en évitant le langage télégraphique ou SMS, le style « petites annonces » ou « tract publicitaire » , et en utilisant pour débuter et conclure les formules de convivialité de votre choix.

Présentez vous brièvement lors de l'envoi de vos messages.

Les messages doivent être signé du nom de leur auteur-e

Les messages concernant la location d'un logement (seules sont diffusés les offres et demandes de colloc, sous-loc, les locations temporaires pour résidences d'artistes ou techniciens, les offres de reprises de bail), sont réservés aux professionnel-le-s.

Leur objet doit obligatoirement comporter certaines informations en objet:

Commencer par: Cherche ou Propose
Suivi de  Ss loc ou Colloc
préciser ensuite
- la ville et le quartier éventuellement
- les dates de disponibilités.

Dans le message pensez à indiquer le loyer mensuel ou le prix pour la période. L'indication du tarif à la nuit n'est pas acceptée. Les demandes de sous loc sont limitées à quelques semaines, 3 mois max.

Les sous-locations et collocations sont soumises à des règlementation que vous-vous engagez à respecter dans vos messages à partager:

https://www.service-public.fr/particuliers/vosdroits/F34661

https://www.service-public.fr/particuliers/vosdroits/F2449

Ces messages sont partagés seulement les mardis et vendredi

Si vous faites des envois multiples, mettez les adresses en Cci afin de ne pas révéler à tout le monde les adresses de vos correspondants. Si vous réacheminez ou transférez des messages sur la liste, retravaillez les, faites plutôt des copier collé, incorporez au corps du message le texte des pièces jointes et supprimez-les, effacez les éléments superflus des entêtes et signatures publicitaires des serveurs.

Les engagement de Rezo Pro Spe C se bornent à faire respecter cette charte, les divers échanges suivant le partage des message sont sous l'entière responsabilité des auteurs et répondants.

Les archives sont consultables par les membres de la communauté à cette adresse : https://lists.riseup.net/www/arc/rezoprospec

Aide : https://riseup.net/lists

Pour écrire aux modérateurs utilisez l'adresse : contact.rezoprospec@sfr.fr

Texte mis à jour le 25 janvier 2021 à l'occasion du changement d'adresse du rezo

Il a été crée au mois de mars 2004 par Pascale et Gilbert Ceccaldi de l'Association

REZO EVENEMENTIEL

Conseil -Formation - Médiation Culturelle-Photographie`;

function RezoProSpecSignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [charterAccepted, setCharterAccepted] = useState(false);
  const [charterDialogOpen, setCharterDialogOpen] = useState(false);
  const navigate = useNavigate();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleOpenCharter = () => {
    setCharterDialogOpen(true);
  };

  const handleCloseCharter = () => {
    setCharterDialogOpen(false);
  };

  const handleAcceptCharter = () => {
    setCharterAccepted(true);
    setCharterDialogOpen(false);
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage('');

    // Validate charter acceptance
    if (!charterAccepted) {
      setError("Vous devez accepter la charte avant de vous inscrire.");
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(' '));
      return;
    }

    // Password Confirmation Check
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create the auth account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: import.meta.env.VITE_SITE_URL
            ? `${import.meta.env.VITE_SITE_URL}/auth/callback`
            : `${window.location.origin}/auth/callback`
        }
      });

      if (signUpError) throw signUpError;

      if (!data?.user?.id) {
        throw new Error("Aucun identifiant utilisateur retourné lors de l'inscription");
      }

      // 2. Create profile for Rezo Pro Spec network
      try {
        // Delay to allow Supabase to create default records
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create profile for Rezo Pro Spec network
        const { createProfileForNetwork: apiCreateProfile } = await import('../api/profiles');
        const profileResult = await apiCreateProfile(data.user.id, REZOPROSPEC_NETWORK_ID, {
          contact_email: email,
          role: 'member'
        });

        if (profileResult.error) {
          throw new Error(profileResult.error);
        }

        console.log('Profil créé avec succès pour Rezo Pro Spec:', profileResult.data);

        // Set active profile
        const { setActiveProfile: apiSetActiveProfile } = await import('../api/profiles');
        await apiSetActiveProfile(profileResult.data.id);

        // Add user to Sympa subscription queue
        try {
          const { subscribeToSympa } = await import('../api/sympaSync');
          await subscribeToSympa(
            profileResult.data.id,
            email,
            ['immobilier', 'ateliers', 'cours', 'materiel', 'echange', 'casting', 'annonces', 'dons'], // All categories by default
            '' // No motivation required for signup
          );
          console.log('Added to Sympa subscription queue');
        } catch (sympaError) {
          console.error('Error adding to Sympa subscription queue:', sympaError);
          // Don't fail the signup if Sympa queue fails
        }

        setMessage('Inscription réussie ! Vous avez été ajouté à Rezo Pro Spec. Votre demande d\'inscription à la liste de diffusion est en attente d\'approbation par un administrateur. Veuillez vérifier votre email pour confirmer votre compte.');
      } catch (profileError) {
        console.error('Erreur lors de la création du profil:', profileError);
        setError(`L'inscription a réussi, mais impossible de rejoindre le réseau : ${profileError.message}. Veuillez contacter le support.`);
        return;
      }

      // Clear form on success
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCharterAccepted(false);

      // Give a moment for the profile to be saved
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to dashboard
      console.log('Redirection vers le tableau de bord après inscription à Rezo Pro Spec');
      window.location.href = '/dashboard?from_rezoprospec=true';

    } catch (error) {
      setError(error.message || "Échec de l'inscription");
      console.error("Erreur d'inscription:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <ThreeJSBackground/>
      <Container maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 9
          }}
        >
          <Card
            elevation={3}
            sx={{
              width: '100%',
              borderRadius: 2,
              overflow: 'hidden',
              zIndex: 9
            }}
          >
            {/* Card Header */}
            <Box
              sx={{
                p: 3,
                bgcolor: 'primary.main',
                color: 'white',
              }}
            >
              <Typography variant="h4" component="h1" align="center">
                Rejoindre Rezo Pro Spec
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                RESeau PROfessionnel du SPEctacle et de la Culture
              </Typography>
            </Box>

            {/* Card Content / Form */}
            <CardContent sx={{ p: 4 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Plateforme communautaire gratuite</strong> de mutualisation de moyens,
                  d'échange de services et d'entraide pour les professionnels du spectacle et de la culture
                  en Région Provence Alpes Côte d'Azur.
                </Typography>
              </Alert>

              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 3 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}
              {message && (
                <Alert
                  severity="success"
                  sx={{ mb: 3 }}
                  onClose={() => setMessage('')}
                >
                  {message}
                </Alert>
              )}

              <form onSubmit={handleSignup}>
                <Stack spacing={3}>
                  {/* Email Field */}
                  <TextField
                    fullWidth
                    required
                    id="email"
                    label="Adresse email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />

                  {/* Password Field */}
                  <FormControl variant="outlined" fullWidth required error={!!error && error.includes('mot de passe')}>
                    <InputLabel htmlFor="password">Mot de passe</InputLabel>
                    <OutlinedInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        const newPassword = e.target.value;
                        setPassword(newPassword);

                        const validation = validatePassword(newPassword);
                        setPasswordErrors(validation.errors);

                        const strength = getPasswordStrength(newPassword);
                        setPasswordStrength(strength);
                      }}
                      inputProps={{ minLength: 6 }}
                      startAdornment={
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      }
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="afficher/masquer le mot de passe"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Mot de passe"
                    />
                    {password && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(passwordStrength / 5) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getPasswordStrengthLabel(passwordStrength).color
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ color: getPasswordStrengthLabel(passwordStrength).color, mt: 0.5 }}>
                          {getPasswordStrengthLabel(passwordStrength).label}
                        </Typography>
                      </Box>
                    )}
                  </FormControl>

                  {/* Confirm Password Field */}
                  <FormControl variant="outlined" fullWidth required error={!!error && error.includes('correspondent pas')}>
                    <InputLabel htmlFor="confirm-password">Confirmer le mot de passe</InputLabel>
                    <OutlinedInput
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      inputProps={{ minLength: 6 }}
                      startAdornment={
                        <InputAdornment position="start">
                          <LockIcon />
                        </InputAdornment>
                      }
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="afficher/masquer le mot de passe"
                            onClick={handleClickShowConfirmPassword}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Confirmer le mot de passe"
                    />
                  </FormControl>

                  {/* Charter Acceptance */}
                  <Box
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: charterAccepted ? '#a8e6a3' : 'grey.300',
                      borderRadius: 1,
                      backgroundColor: charterAccepted ? '#dbfddd' : 'grey.50'
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={charterAccepted}
                          onChange={(e) => setCharterAccepted(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          J'ai lu et j'accepte la charte de la communauté Rezo Pro Spec
                        </Typography>
                      }
                    />
                    <Button
                      startIcon={<CharterIcon />}
                      onClick={handleOpenCharter}
                      size="small"
                      sx={{ mt: 1, ml: 4 }}
                    >
                      Lire la charte
                    </Button>
                  </Box>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading || !charterAccepted}
                    sx={{
                      mt: 2,
                      py: 1.2,
                      position: 'relative',
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          size={24}
                          sx={{
                            color: 'white',
                            position: 'absolute',
                            left: '50%',
                            marginLeft: '-12px',
                          }}
                        />
                        <span>Inscription en cours...</span>
                      </>
                    ) : (
                      "S'inscrire à Rezo Pro Spec"
                    )}
                  </Button>
                </Stack>
              </form>

              {/* Link to Login Page */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Vous avez déjà un compte ?{' '}
                  <RouterLink
                    to="/login"
                    style={{
                      color: theme.palette.primary.main,
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Se connecter
                  </RouterLink>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>

      {/* Charter Dialog */}
      <Dialog
        open={charterDialogOpen}
        onClose={handleCloseCharter}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" component="div">
            Charte de la communauté Rezo Pro Spec
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography
            component="pre"
            sx={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              lineHeight: 1.6
            }}
          >
            {CHARTER_TEXT}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCharter} color="inherit">
            Fermer
          </Button>
          <Button onClick={handleAcceptCharter} variant="contained" color="primary">
            Accepter la charte
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default RezoProSpecSignupPage;
