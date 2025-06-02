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

function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={0} sx={{ p: { xs: 3, md: 6 } }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Politique de Confidentialité
        </Typography>
        
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ '& h2': { mt: 4, mb: 2 }, '& p': { mb: 2 } }}>
          <Typography variant="h5" component="h2">
            1. Introduction
          </Typography>
          <Typography variant="body1" paragraph>
            Conclav (ci-après "nous", "notre" ou "la Plateforme") accorde une importance primordiale à la protection de vos données personnelles. Cette politique de confidentialité décrit comment nous collectons, utilisons, stockons et protégeons vos informations conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi française Informatique et Libertés.
          </Typography>

          <Typography variant="h5" component="h2">
            2. Responsable du traitement
          </Typography>
          <Typography variant="body1" paragraph>
            Le responsable du traitement des données est [Nom de votre société], société [forme juridique] au capital de [montant] euros, immatriculée au RCS de [ville] sous le numéro [numéro], dont le siège social est situé [adresse].
          </Typography>
          <Typography variant="body1" paragraph>
            Contact du délégué à la protection des données (DPO) : privacy@conclav.club
          </Typography>

          <Typography variant="h5" component="h2">
            3. Données collectées
          </Typography>
          <Typography variant="body1" paragraph>
            Nous collectons les données suivantes :
          </Typography>
          
          <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
            3.1 Données d'identification
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Nom complet</Typography>
            <Typography component="li" variant="body1">Adresse email</Typography>
            <Typography component="li" variant="body1">Photo de profil (optionnelle)</Typography>
            <Typography component="li" variant="body1">Informations de profil (bio, compétences, liens professionnels)</Typography>
          </Box>

          <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
            3.2 Données d'utilisation
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Historique de connexion</Typography>
            <Typography component="li" variant="body1">Activités sur la plateforme (messages, publications, événements)</Typography>
            <Typography component="li" variant="body1">Préférences et paramètres</Typography>
            <Typography component="li" variant="body1">Données de navigation (cookies, adresse IP)</Typography>
          </Box>

          <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
            3.3 Données de paiement
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Informations de facturation</Typography>
            <Typography component="li" variant="body1">Historique des transactions</Typography>
            <Typography component="li" variant="body1">Les données de carte bancaire sont traitées par notre prestataire Stripe et ne sont pas stockées sur nos serveurs</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            4. Finalités du traitement
          </Typography>
          <Typography variant="body1" paragraph>
            Vos données sont collectées pour les finalités suivantes :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Création et gestion de votre compte utilisateur</Typography>
            <Typography component="li" variant="body1">Fourniture des services de la plateforme</Typography>
            <Typography component="li" variant="body1">Communication entre utilisateurs</Typography>
            <Typography component="li" variant="body1">Gestion des abonnements et facturation</Typography>
            <Typography component="li" variant="body1">Envoi de notifications relatives au service</Typography>
            <Typography component="li" variant="body1">Amélioration de nos services</Typography>
            <Typography component="li" variant="body1">Respect de nos obligations légales</Typography>
            <Typography component="li" variant="body1">Prévention de la fraude et sécurité</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            5. Base légale du traitement
          </Typography>
          <Typography variant="body1" paragraph>
            Le traitement de vos données repose sur les bases légales suivantes :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">L'exécution du contrat : pour fournir nos services</Typography>
            <Typography component="li" variant="body1">Le consentement : pour l'envoi de communications marketing</Typography>
            <Typography component="li" variant="body1">L'intérêt légitime : pour améliorer nos services et assurer la sécurité</Typography>
            <Typography component="li" variant="body1">L'obligation légale : pour respecter nos obligations légales et réglementaires</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            6. Destinataires des données
          </Typography>
          <Typography variant="body1" paragraph>
            Vos données peuvent être partagées avec :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Les autres membres de votre réseau (selon vos paramètres de confidentialité)</Typography>
            <Typography component="li" variant="body1">Nos prestataires techniques (hébergement, paiement, email)</Typography>
            <Typography component="li" variant="body1">Les autorités compétentes en cas d'obligation légale</Typography>
          </Box>
          <Typography variant="body1" paragraph>
            Nous ne vendons jamais vos données personnelles à des tiers.
          </Typography>

          <Typography variant="h5" component="h2">
            7. Transferts internationaux
          </Typography>
          <Typography variant="body1" paragraph>
            Certains de nos prestataires peuvent être situés en dehors de l'Union européenne. Dans ce cas, nous nous assurons que des garanties appropriées sont mises en place (clauses contractuelles types, certification Privacy Shield, décision d'adéquation).
          </Typography>
          <Typography variant="body1" paragraph>
            Nos principaux prestataires sont :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Supabase (Infrastructure) : États-Unis</Typography>
            <Typography component="li" variant="body1">Vercel (Hébergement) : États-Unis</Typography>
            <Typography component="li" variant="body1">Stripe (Paiements) : États-Unis</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            8. Durée de conservation
          </Typography>
          <Typography variant="body1" paragraph>
            Nous conservons vos données selon les durées suivantes :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Données de compte : pendant toute la durée de votre inscription + 3 ans</Typography>
            <Typography component="li" variant="body1">Données de facturation : 10 ans (obligation légale)</Typography>
            <Typography component="li" variant="body1">Logs de connexion : 1 an</Typography>
            <Typography component="li" variant="body1">Cookies : selon leur durée spécifique (maximum 13 mois)</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            9. Vos droits
          </Typography>
          <Typography variant="body1" paragraph>
            Conformément au RGPD, vous disposez des droits suivants :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1"><strong>Droit d'accès</strong> : obtenir une copie de vos données</Typography>
            <Typography component="li" variant="body1"><strong>Droit de rectification</strong> : corriger vos données inexactes</Typography>
            <Typography component="li" variant="body1"><strong>Droit à l'effacement</strong> : demander la suppression de vos données</Typography>
            <Typography component="li" variant="body1"><strong>Droit à la limitation</strong> : limiter le traitement de vos données</Typography>
            <Typography component="li" variant="body1"><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</Typography>
            <Typography component="li" variant="body1"><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</Typography>
            <Typography component="li" variant="body1"><strong>Droit de retirer votre consentement</strong> : à tout moment pour les traitements basés sur le consentement</Typography>
          </Box>
          <Typography variant="body1" paragraph>
            Pour exercer ces droits, contactez-nous à : privacy@conclav.club
          </Typography>
          <Typography variant="body1" paragraph>
            Vous avez également le droit d'introduire une réclamation auprès de la CNIL : www.cnil.fr
          </Typography>

          <Typography variant="h5" component="h2">
            10. Sécurité des données
          </Typography>
          <Typography variant="body1" paragraph>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Chiffrement des données en transit (HTTPS)</Typography>
            <Typography component="li" variant="body1">Chiffrement des données au repos</Typography>
            <Typography component="li" variant="body1">Authentification sécurisée</Typography>
            <Typography component="li" variant="body1">Accès restreint aux données</Typography>
            <Typography component="li" variant="body1">Sauvegardes régulières</Typography>
            <Typography component="li" variant="body1">Tests de sécurité réguliers</Typography>
          </Box>

          <Typography variant="h5" component="h2">
            11. Cookies et technologies similaires
          </Typography>
          <Typography variant="body1" paragraph>
            Nous utilisons des cookies pour :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Maintenir votre session de connexion</Typography>
            <Typography component="li" variant="body1">Mémoriser vos préférences</Typography>
            <Typography component="li" variant="body1">Analyser l'utilisation de la plateforme (via Vercel Analytics)</Typography>
          </Box>
          <Typography variant="body1" paragraph>
            Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
          </Typography>

          <Typography variant="h5" component="h2">
            12. Mineurs
          </Typography>
          <Typography variant="body1" paragraph>
            La plateforme est destinée aux personnes de plus de 16 ans. Pour les mineurs de moins de 16 ans, le consentement des parents ou tuteurs légaux est requis.
          </Typography>

          <Typography variant="h5" component="h2">
            13. Modifications de la politique
          </Typography>
          <Typography variant="body1" paragraph>
            Nous pouvons modifier cette politique de confidentialité. Les modifications substantielles vous seront notifiées par email ou via la plateforme. La date de dernière mise à jour est indiquée en haut de ce document.
          </Typography>

          <Typography variant="h5" component="h2">
            14. Contact
          </Typography>
          <Typography variant="body1" paragraph>
            Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" variant="body1">Email : privacy@conclav.club</Typography>
            <Typography component="li" variant="body1">Courrier : [Adresse postale]</Typography>
            <Typography component="li" variant="body1">DPO : dpo@conclav.club</Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            Cette politique de confidentialité est conforme au RGPD (Règlement UE 2016/679) 
            et à la loi française Informatique et Libertés.
          </Typography>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
            Voir aussi nos <Link href="/terms" sx={{ cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); navigate('/terms'); }}>Conditions Générales d'Utilisation</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}

export default PrivacyPage;