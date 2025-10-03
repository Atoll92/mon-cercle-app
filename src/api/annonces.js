// File: src/api/annonces.js
// API functions for annonces moderation

// Mock email data parsed from .eml files for demo purposes
const MOCK_EMAILS = [
  {
    id: '1',
    sender_email: 'fleururbaine.paris@gmail.com',
    sender_name: 'Fleur Urbaine',
    subject: 'Mise à disposition salle - événement - lieu d\'exploration',
    content: 'Bonjour Le Rezo,\n\nIci l\'atelier Rafale dont je fais partie. Lieu d\'atelier et d\'exploration artistique, sociale et artisanale autour de la question du vivant.\n\nNous avons une salle que nous mettons de temps en temps à disposition pour différents types d\'événements (expositions, location d\'espace, concert, performance, lectures, pop-up, …).\n\nLa salle est de 55m2, pignon sur la rue pastoret (cours julien) et peut être gérée en autonomie.\n\nNous sommes ouvertes à toutes sortes de propositions, initiatives et « crash tests » :) autour de nos valeurs communes : le commun, l\'engagement, la rencontre, le vivant et la création.\n\nPour découvrir notre univers: @atelier.rafale\nPour proposer un projet : atelier.rafale@gmail.com',
    category: null,
    status: 'pending',
    created_at: '2025-09-23T15:42:45.000Z'
  },
  {
    id: '2',
    sender_email: 'user@example.com',
    sender_name: 'Jean Dupont',
    subject: 'VENDS 2 places pour WAXX le 04 octobre à l\'Olympia',
    content: 'Bonjour,\n\nJe vends 2 places pour le concert de WAXX le 04 octobre à l\'Olympia à Paris.\n\nPrix: 45€ la place (prix initial 50€)\n\nSi intéressé, contactez-moi rapidement!',
    category: null,
    status: 'pending',
    created_at: '2025-09-24T10:30:00.000Z'
  },
  {
    id: '3',
    sender_email: 'marie.martin@example.com',
    sender_name: 'Marie Martin',
    subject: 'Vente monocycle',
    content: 'Bonjour à tous,\n\nJe vends mon monocycle 20 pouces en très bon état.\n\nMarque: Impact\nTaille de roue: 20"\nPrix: 120€\n\nIdéal pour débuter ou pour un utilisateur confirmé.\n\nContact: marie.martin@example.com',
    category: null,
    status: 'pending',
    created_at: '2025-09-25T08:15:00.000Z'
  },
  {
    id: '4',
    sender_email: 'sophie@example.com',
    sender_name: 'Sophie Laurent',
    subject: 'Reprise des trainings scéniques pros',
    content: 'Chers collègues,\n\nJe reprends mes sessions de training scénique professionnel à partir du 1er octobre.\n\nAu programme:\n- Travail sur la présence scénique\n- Techniques de respiration et de gestion du trac\n- Improvisation et créativité\n\nSéances tous les mardis de 19h à 21h.\nTarif: 25€/séance ou 200€ pour 10 séances.\n\nInscriptions: sophie@example.com',
    category: null,
    status: 'pending',
    created_at: '2025-09-26T14:20:00.000Z'
  },
  {
    id: '5',
    sender_email: 'piano.teacher@example.com',
    sender_name: 'Pierre Durand',
    subject: 'Propose cours particuliers de Piano adaptés pour débutants',
    content: 'Bonjour,\n\nPianiste professionnel propose cours particuliers de piano pour débutants et intermédiaires.\n\nMéthode pédagogique adaptée à chaque élève.\nPossibilité de cours à domicile ou dans mon studio.\n\nTarifs:\n- 30€ pour 45min\n- 40€ pour 1h\n\nPremier cours d\'essai offert!\n\nContact: piano.teacher@example.com',
    category: null,
    status: 'pending',
    created_at: '2025-09-27T11:00:00.000Z'
  },
  {
    id: '6',
    sender_email: 'chorale.luminy@example.com',
    sender_name: 'Caroline Petit',
    subject: 'Propose chorale à Luminy',
    content: 'Bonjour à tous,\n\nJe lance une chorale amateur à Luminy ouverte à tous les niveaux!\n\nRépertoire varié: chanson française, gospel, pop...\n\nRépétitions tous les jeudis de 20h à 22h à la salle polyvalente de Luminy.\n\nPremière séance gratuite pour essayer.\nCotisation: 10€/mois\n\nVenez nombreux!',
    category: null,
    status: 'pending',
    created_at: '2025-09-28T09:45:00.000Z'
  },
  {
    id: '7',
    sender_email: 'artist@example.com',
    sender_name: 'Thomas Bernard',
    subject: 'Dessin au dessus du Mont Rose à Marseille',
    content: 'Salut,\n\nJ\'organise une session de dessin en plein air au-dessus du Mont Rose à Marseille ce samedi.\n\nRDV à 14h au parking du Mont Rose.\nApportez votre matériel de dessin.\n\nActivité gratuite et ouverte à tous les niveaux.\n\nÀ samedi!',
    category: null,
    status: 'pending',
    created_at: '2025-09-29T16:30:00.000Z'
  },
  {
    id: '8',
    sender_email: 'writer@example.com',
    sender_name: 'Émilie Rousseau',
    subject: 'PROJET ECRITURE ACCOMPAGNEMENT',
    content: 'Bonjour,\n\nAutrice et coach en écriture, je propose un accompagnement personnalisé pour vos projets d\'écriture.\n\nQue vous souhaitiez:\n- Écrire un roman\n- Développer un projet autobiographique\n- Améliorer votre style\n- Surmonter le syndrome de la page blanche\n\nJe vous accompagne avec bienveillance et professionnalisme.\n\nSéances individuelles ou en petit groupe.\n\nContact: writer@example.com',
    category: null,
    status: 'pending',
    created_at: '2025-09-30T12:00:00.000Z'
  },
  {
    id: '9',
    sender_email: 'contact.impro@example.com',
    sender_name: 'Laura Moreau',
    subject: 'Atelier + Jam de danse Contact Improvisation pour toustes reprise samedi 4 octobre',
    content: 'Coucou la communauté!\n\nOn reprend nos ateliers de Contact Improvisation ce samedi 4 octobre!\n\nAu programme:\n- Échauffement collectif (14h-15h)\n- Atelier guidé (15h-17h)\n- Jam libre (17h-19h)\n\nOuvert à tous les niveaux, débutants bienvenus.\n\nLieu: Studio Danse, 12 rue de la République\nPAF: 10€\n\nÀ samedi!',
    category: null,
    status: 'pending',
    created_at: '2025-10-01T10:15:00.000Z'
  },
  {
    id: '10',
    sender_email: 'subloc@example.com',
    sender_name: 'Alexandre Blanc',
    subject: 'Propose Sous-loc 19 oct - 10 nov Marseille 6e',
    content: 'Bonjour,\n\nJe propose une sous-location de mon appartement T2 dans le 6e arrondissement de Marseille du 19 octobre au 10 novembre.\n\nCaractéristiques:\n- 2 pièces, 45m²\n- 2e étage avec ascenseur\n- Quartier calme, proche métro\n- Entièrement équipé\n\nLoyer: 600€ charges comprises\n\nContact: subloc@example.com',
    category: null,
    status: 'pending',
    created_at: '2025-10-01T13:25:00.000Z'
  },
  {
    id: '11',
    sender_email: 'urgent.logement@example.com',
    sender_name: 'Julie Garcia',
    subject: 'URGENT propose sous-loc T2 Camas du 13 octobre au 2 novembre',
    content: 'URGENT!\n\nJe propose une sous-location de mon T2 à Camas du 13 octobre au 2 novembre.\n\nAppartement lumineux, calme, avec parking.\n\nLoyer: 550€/mois charges comprises\n\nIdéal pour personne ou couple.\n\nDisponible immédiatement!\n\nContact: urgent.logement@example.com',
    category: null,
    status: 'pending',
    created_at: '2025-10-01T15:40:00.000Z'
  },
  {
    id: '12',
    sender_email: 'appart.marseille@example.com',
    sender_name: 'Nathalie Simon',
    subject: 'Propose Sous Location T2 Marseille (5ème) entre le 1er novembre et le 17 janvier',
    content: 'Bonjour à tous,\n\nJe propose une sous-location de mon appartement T2 dans le 5ème arrondissement de Marseille du 1er novembre au 17 janvier.\n\nCaractéristiques:\n- 50m², lumineux\n- Proche transports\n- Cuisine équipée\n- Balcon\n\nLoyer: 650€ charges comprises\n\nParfait pour quelqu\'un en déplacement professionnel ou personnel.\n\nContact: appart.marseille@example.com',
    category: null,
    status: 'pending',
    created_at: '2025-10-01T17:55:00.000Z'
  }
];

// In-memory storage for moderation state (for demo purposes)
let mockAnnoncesState = [...MOCK_EMAILS];

/**
 * Fetch annonces for a network with optional status filter
 * Uses mock data from .eml files for demo purposes
 * @param {string} networkId - Network ID (not used in mock mode)
 * @param {string|null} status - Status filter: 'pending', 'approved', 'rejected', or null for all
 * @returns {Promise<Array>} Array of annonces
 */
export const fetchAnnonces = async (networkId, status = null) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Filter by status if provided
    let filteredEmails = mockAnnoncesState;
    if (status) {
      filteredEmails = mockAnnoncesState.filter(email => email.status === status);
    }

    return filteredEmails;
  } catch (error) {
    console.error('Error fetching annonces:', error);
    throw error;
  }
};

/**
 * Moderate an annonce (approve, reject, or change category)
 * Uses in-memory storage for demo purposes
 * @param {string} annonceId - Annonce ID
 * @param {string|null} status - New status: 'approved', 'rejected', 'pending', or null to keep current
 * @param {string|null} category - New category or null to keep current
 * @returns {Promise<Object>} Updated annonce
 */
export const moderateAnnonce = async (annonceId, status = null, category = null) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const annonceIndex = mockAnnoncesState.findIndex(a => a.id === annonceId);
    if (annonceIndex === -1) {
      throw new Error('Annonce not found');
    }

    const updates = {
      updated_at: new Date().toISOString()
    };

    // Update status if provided
    if (status) {
      updates.status = status;
      updates.moderated_at = new Date().toISOString();
    }

    // Update category if provided
    if (category !== null) {
      updates.category = category;
    }

    // Update the mock state
    mockAnnoncesState[annonceIndex] = {
      ...mockAnnoncesState[annonceIndex],
      ...updates
    };

    return mockAnnoncesState[annonceIndex];
  } catch (error) {
    console.error('Error moderating annonce:', error);
    throw error;
  }
};

/**
 * Reset mock data to initial state (for demo purposes)
 */
export const resetMockAnnonces = () => {
  mockAnnoncesState = [...MOCK_EMAILS];
};
