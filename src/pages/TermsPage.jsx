import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Divider,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function TermsPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 6 } }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Conditions Générales d'Utilisation
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ '& h2': { mt: 4, mb: 2 }, '& p': { mb: 2 } }}>
          <Typography variant="h5" component="h2">
            1. Objet et acceptation des conditions
          </Typography>
          <Typography variant="body1" paragraph>
            Les présentes conditions générales d'utilisation (ci-après "CGU") régissent l'utilisation de la plateforme Conclav (ci-après "la Plateforme") éditée par [Nom de votre société], société [forme juridique] au capital de [montant] euros, immatriculée au RCS de [ville] sous le numéro [numéro], dont le siège social est situé [adresse].
          </Typography>
          <Typography variant="body1" paragraph>
            L'utilisation de la Plateforme implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la Plateforme.
          </Typography>

          <Typography variant="h5" component="h2">
            2. Description du service
          </Typography>
          <Typography variant="body1" paragraph>
            Conclav est une plateforme de création et de gestion de réseaux privés permettant aux utilisateurs de :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Créer et administrer des réseaux privés</Typography>
            <Typography component="li" variant="body1">Inviter et gérer des membres</Typography>
            <Typography component="li" variant="body1">Organiser des événements</Typography>
            <Typography component="li" variant="body1">Partager des actualités et des fichiers</Typography>
            <Typography component="li" variant="body1">Communiquer via messagerie instantanée</Typography>
            <Typography component="li" variant="body1">Créer et partager du contenu collaboratif</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            3. Conditions d'accès et d'inscription
          </Typography>
          <Typography variant="body1" paragraph>
            L'accès à la Plateforme est réservé aux personnes physiques âgées d'au moins 16 ans ou aux personnes morales légalement constituées. Pour les mineurs de moins de 16 ans, l'autorisation des parents ou tuteurs légaux est requise conformément au RGPD.
          </Typography>
          <Typography variant="body1" paragraph>
            Lors de l'inscription, l'utilisateur s'engage à fournir des informations exactes, complètes et à jour. L'utilisateur est responsable de la confidentialité de ses identifiants de connexion.
          </Typography>

          <Typography variant="h5" component="h2">
            4. Protection des données personnelles
          </Typography>
          <Typography variant="body1" paragraph>
            Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, nous nous engageons à protéger vos données personnelles.
          </Typography>
          <Typography variant="body1" paragraph>
            Les données collectées sont nécessaires au fonctionnement du service et sont traitées conformément à notre <Link href="/privacy" sx={{ cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Politique de Confidentialité</Link>.
          </Typography>
          <Typography variant="body1" paragraph>
            Vous disposez des droits suivants sur vos données :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Droit d'accès</Typography>
            <Typography component="li" variant="body1">Droit de rectification</Typography>
            <Typography component="li" variant="body1">Droit à l'effacement</Typography>
            <Typography component="li" variant="body1">Droit à la limitation du traitement</Typography>
            <Typography component="li" variant="body1">Droit à la portabilité</Typography>
            <Typography component="li" variant="body1">Droit d'opposition</Typography>
          </Box>
          <Typography variant="body1" paragraph>
            Pour exercer ces droits, contactez-nous à : privacy@moncercle.app
          </Typography>

          <Typography variant="h5" component="h2">
            5. Propriété intellectuelle
          </Typography>
          <Typography variant="body1" paragraph>
            La Plateforme et l'ensemble de ses contenus (textes, images, logos, marques, logiciels) sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation non autorisée est interdite.
          </Typography>
          <Typography variant="body1" paragraph>
            Les contenus publiés par les utilisateurs restent leur propriété. En les publiant sur la Plateforme, ils accordent une licence non exclusive d'utilisation pour les besoins du service.
          </Typography>

          <Typography variant="h5" component="h2">
            6. Obligations et responsabilités des utilisateurs
          </Typography>
          <Typography variant="body1" paragraph>
            Les utilisateurs s'engagent à :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Respecter les lois et règlements en vigueur</Typography>
            <Typography component="li" variant="body1">Ne pas publier de contenus illicites, diffamatoires, discriminatoires ou portant atteinte aux droits de tiers</Typography>
            <Typography component="li" variant="body1">Ne pas utiliser la Plateforme à des fins commerciales non autorisées</Typography>
            <Typography component="li" variant="body1">Respecter les autres utilisateurs et maintenir un comportement courtois</Typography>
            <Typography component="li" variant="body1">Ne pas porter atteinte à la sécurité ou au bon fonctionnement de la Plateforme</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            7. Modération et sanctions
          </Typography>
          <Typography variant="body1" paragraph>
            Nous nous réservons le droit de modérer les contenus publiés et de prendre des mesures en cas de non-respect des présentes CGU, incluant :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Suppression de contenus</Typography>
            <Typography component="li" variant="body1">Suspension temporaire du compte</Typography>
            <Typography component="li" variant="body1">Résiliation définitive du compte</Typography>
            <Typography component="li" variant="body1">Signalement aux autorités compétentes si nécessaire</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            8. Limitation de responsabilité
          </Typography>
          <Typography variant="body1" paragraph>
            La Plateforme est fournie "en l'état". Nous ne garantissons pas l'absence d'interruptions, d'erreurs ou de bugs. Notre responsabilité est limitée aux dommages directs et prévisibles, à l'exclusion des dommages indirects.
          </Typography>
          <Typography variant="body1" paragraph>
            Nous ne sommes pas responsables des contenus publiés par les utilisateurs, ni des interactions entre utilisateurs.
          </Typography>

          <Typography variant="h5" component="h2">
            9. Durée et résiliation
          </Typography>
          <Typography variant="body1" paragraph>
            Les présentes CGU sont conclues pour une durée indéterminée. L'utilisateur peut résilier son compte à tout moment depuis les paramètres de son profil.
          </Typography>
          <Typography variant="body1" paragraph>
            Nous nous réservons le droit de résilier le compte d'un utilisateur en cas de manquement grave aux présentes CGU.
          </Typography>

          <Typography variant="h5" component="h2">
            10. Modifications des CGU
          </Typography>
          <Typography variant="body1" paragraph>
            Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications substantielles par email ou notification sur la Plateforme.
          </Typography>
          <Typography variant="body1" paragraph>
            La poursuite de l'utilisation de la Plateforme après modification vaut acceptation des nouvelles CGU.
          </Typography>

          <Typography variant="h5" component="h2">
            11. Droit de rétractation
          </Typography>
          <Typography variant="body1" paragraph>
            Conformément au Code de la consommation français, vous disposez d'un délai de 14 jours à compter de la souscription d'un abonnement payant pour exercer votre droit de rétractation, sauf si vous avez expressément renoncé à ce droit en commençant à utiliser le service.
          </Typography>

          <Typography variant="h5" component="h2">
            12. Médiation
          </Typography>
          <Typography variant="body1" paragraph>
            En cas de litige, vous pouvez recourir gratuitement au service de médiation suivant : [Nom et coordonnées du médiateur], conformément aux articles L.616-1 et R.616-1 du Code de la consommation.
          </Typography>
          <Typography variant="body1" paragraph>
            Plateforme de règlement en ligne des litiges : <Link href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">https://ec.europa.eu/consumers/odr</Link>
          </Typography>

          <Typography variant="h5" component="h2">
            13. Loi applicable et juridiction compétente
          </Typography>
          <Typography variant="body1" paragraph>
            Les présentes CGU sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.
          </Typography>
          <Typography variant="body1" paragraph>
            Pour les consommateurs résidant dans l'Union européenne, les règles impératives de protection des consommateurs de leur pays de résidence s'appliquent.
          </Typography>

          <Typography variant="h5" component="h2">
            14. Contact
          </Typography>
          <Typography variant="body1" paragraph>
            Pour toute question concernant ces CGU, vous pouvez nous contacter :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Par email : legal@moncercle.app</Typography>
            <Typography component="li" variant="body1">Par courrier : [Adresse postale]</Typography>
            <Typography component="li" variant="body1">Directeur de la publication : [Nom du directeur]</Typography>
            <Typography component="li" variant="body1">Hébergeur : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA</Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            Ces conditions générales d'utilisation sont conformes au droit français et européen, 
            notamment au RGPD et à la Directive sur les droits des consommateurs.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default TermsPage;