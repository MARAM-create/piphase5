-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 15 avr. 2026 à 10:09
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `locavia`
--

-- --------------------------------------------------------

--
-- Structure de la table `annonces_service`
--

CREATE TABLE `annonces_service` (
  `id` bigint(20) NOT NULL,
  `agent_id` bigint(20) DEFAULT NULL,
  `capacite_vehicule` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `disponibilites` varchar(255) DEFAULT NULL,
  `photos` varchar(255) DEFAULT NULL,
  `specialite` varchar(255) DEFAULT NULL,
  `statut` enum('EN_ATTENTE','ACTIVE','SUSPENDUE') DEFAULT NULL,
  `tarif` double DEFAULT NULL,
  `titre` varchar(255) DEFAULT NULL,
  `type_service` enum('TRANSPORT','NETTOYAGE','MAINTENANCE') DEFAULT NULL,
  `zone` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `annonce_location`
--

CREATE TABLE `annonce_location` (
  `id_annonce` bigint(20) NOT NULL,
  `code_postal` varchar(255) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `pays` varchar(255) DEFAULT NULL,
  `rue` varchar(255) DEFAULT NULL,
  `ville` varchar(255) DEFAULT NULL,
  `charges_mensuelles` decimal(38,2) DEFAULT NULL,
  `date_creation` datetime(6) DEFAULT NULL,
  `date_dispo_debut` date DEFAULT NULL,
  `date_dispo_fin` date DEFAULT NULL,
  `date_modification` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `etage` int(11) DEFAULT NULL,
  `etat_annonce` enum('BROUILLON','PUBLIEE','INDISPONIBLE','ARCHIVEE','SUSPENDUE') DEFAULT NULL,
  `mode_location` enum('ENTIER','PAR_CHAMBRE') DEFAULT NULL,
  `montant_caution` decimal(38,2) DEFAULT NULL,
  `nombre_pieces` int(11) DEFAULT NULL,
  `prix_mensuel` decimal(38,2) DEFAULT NULL,
  `statut_moderation` enum('EN_ATTENTE','VALIDE','REFUSE','SIGNALE') DEFAULT NULL,
  `surface` double DEFAULT NULL,
  `titre` varchar(255) DEFAULT NULL,
  `type_logement` enum('STUDIO','APPARTEMENT','MAISON','COLOCATION','CHAMBRE_SEULE') DEFAULT NULL,
  `type_meublage` enum('MEUBLE','NON_MEUBLE','SEMI_MEUBLE') DEFAULT NULL,
  `version` bigint(20) DEFAULT NULL,
  `proprietaire_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `avis`
--

CREATE TABLE `avis` (
  `id` bigint(20) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `commentaire` text DEFAULT NULL,
  `rating` int(11) NOT NULL,
  `sentiment` enum('POSITIVE','NEGATIVE','NEUTRAL') DEFAULT NULL,
  `trusted` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Déchargement des données de la table `avis`
--

INSERT INTO `avis` (`id`, `titre`, `commentaire`, `rating`, `sentiment`, `trusted`, `created_at`, `updated_at`) VALUES
(1, 'Excellent service', 'Très satisfait du service de colocation.', 5, 'NEUTRAL', 1, '2026-04-05 17:49:36', '2026-04-05 17:49:36'),
(2, 'Super Expérience', 'La voiture était parfaite et le propriétaire très accueillant. Je recommande vivement.', 5, 'NEUTRAL', 1, '2026-04-05 17:55:16', '2026-04-05 17:55:16'),
(3, 'Très bien', 'Bonne voiture, propre, mais la climatisation était un peu faible.', 4, 'NEUTRAL', 1, '2026-04-05 17:55:16', '2026-04-05 17:55:16'),
(4, 'Expérience moyenne', 'Prix correct mais la voiture avait quelques rayures non signalées.', 3, 'NEUTRAL', 1, '2026-04-05 17:55:16', '2026-04-05 17:55:16'),
(5, 'Décevant', 'Le véhicule n\'était pas celui de la photo et il manquait d\'entretien.', 2, 'NEUTRAL', 1, '2026-04-05 17:55:16', '2026-04-05 17:55:16'),
(6, 'A fuir !', 'Propriétaire injoignable, réservation annulée à la dernière minute. Honteux.', 1, 'NEUTRAL', 1, '2026-04-05 17:55:16', '2026-04-05 17:55:16'),
(7, 'Bon rapport qualité/prix', 'Idéal pour un petit weekend. La consommation est très faible.', 4, 'NEUTRAL', 1, '2026-04-05 17:55:16', '2026-04-05 17:55:16'),
(8, 'Correct', 'Fait le job, sans plus.', 3, 'NEUTRAL', 1, '2026-04-05 17:55:16', '2026-04-05 17:55:16'),
(9, 'Catastrophique', 'Voiture en panne sur l\'autoroute. Plus jamais.', 1, 'NEUTRAL', 1, '2026-04-05 17:55:16', '2026-04-05 17:55:16'),
(10, 'Super ExpÚrience', 'La voiture Útait parfaite et le propriÚtaire trÞs accueillant. Je recommande vivement.', 5, 'POSITIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(11, 'TrÞs bien', 'Bonne voiture, propre, mais la climatisation Útait un peu faible.', 4, 'POSITIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(12, 'ExpÚrience moyenne', 'Prix correct mais la voiture avait quelques rayures non signalÚes.', 3, 'NEUTRAL', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(13, 'DÚcevant', 'Le vÚhicule n\'Útait pas celui de la photo et il manquait d\'entretien.', 2, 'NEGATIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(14, 'A fuir !', 'PropriÚtaire injoignable, rÚservation annulÚe Ó la derniÞre minute. Honteux.', 1, 'NEGATIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(15, 'Bon rapport qualitÚ/prix', 'IdÚal pour un petit weekend. La consommation est trÞs faible.', 4, 'POSITIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(16, 'Correct', 'Fait le job, sans plus.', 3, 'NEUTRAL', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(17, 'Catastrophique', 'Voiture en panne sur l\'autoroute. Plus jamais.', 1, 'NEGATIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(18, 'Logement parfait', 'Appartement propre, bien situÚ, exactement comme sur les photos.', 5, 'POSITIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(19, 'Bruyant la nuit', 'Quartier trÞs bruyant, impossible de dormir correctement.', 2, 'NEGATIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(20, 'Bon sÚjour', 'Rien Ó redire, le logement correspondait Ó la description.', 4, 'POSITIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13'),
(21, 'Pas terrible', 'PropretÚ douteuse et meubles ab¯mÚs. Peut largement mieux faire.', 2, 'NEGATIVE', 1, '2026-04-07 08:44:13', '2026-04-07 08:44:13');

-- --------------------------------------------------------

--
-- Structure de la table `chambre`
--

CREATE TABLE `chambre` (
  `id_chambre` bigint(20) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `etat_chambre` enum('DISPONIBLE','RESERVEE','LOUEE','HORS_SERVICE') DEFAULT NULL,
  `numero` int(11) DEFAULT NULL,
  `prix_mensuel` decimal(38,2) DEFAULT NULL,
  `surface` double DEFAULT NULL,
  `titre` varchar(255) DEFAULT NULL,
  `annonce_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `commandes`
--

CREATE TABLE `commandes` (
  `id` bigint(20) NOT NULL,
  `acheteur_id` bigint(20) DEFAULT NULL,
  `avec_transporteur` bit(1) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `date_commande` datetime(6) DEFAULT NULL,
  `date_livraison` datetime(6) DEFAULT NULL,
  `meuble_id` bigint(20) DEFAULT NULL,
  `statut` enum('EN_ATTENTE','EN_COURS_LIVRAISON','LIVRE','ANNULE') DEFAULT NULL,
  `transporteur_id` bigint(20) DEFAULT NULL,
  `vendeur_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `contrat_location`
--

CREATE TABLE `contrat_location` (
  `id` bigint(20) NOT NULL,
  `image_scanne_url` varchar(255) DEFAULT NULL,
  `pdf_vierge_url` varchar(255) DEFAULT NULL,
  `raison_ia` text DEFAULT NULL,
  `statut_contrat` enum('BROUILLON','EN_ATTENTE_PAIEMENT','ACTIF') NOT NULL,
  `statut_ia` enum('EN_ATTENTE','EN_COURS_ANALYSE','VALIDE','REJETE') NOT NULL,
  `annonce_id` bigint(20) NOT NULL,
  `bailleur_id` bigint(20) NOT NULL,
  `demande_id` bigint(20) DEFAULT NULL,
  `locataire_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `conversation`
--

CREATE TABLE `conversation` (
  `id` bigint(20) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `demande_location_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demande_location`
--

CREATE TABLE `demande_location` (
  `id` bigint(20) NOT NULL,
  `autre_disponibilite` text DEFAULT NULL,
  `budget` double DEFAULT NULL,
  `creneau_convient` bit(1) DEFAULT NULL,
  `creneau_propose` datetime(6) DEFAULT NULL,
  `critere_principal` varchar(255) DEFAULT NULL,
  `date_demande` datetime(6) NOT NULL,
  `date_entree` date DEFAULT NULL,
  `duree_location` varchar(255) DEFAULT NULL,
  `jours_disponibles` varchar(255) DEFAULT NULL,
  `message_candidat` text NOT NULL,
  `mode_visite` varchar(255) DEFAULT NULL,
  `nombre_personnes` int(11) NOT NULL,
  `plage_horaire` varchar(255) DEFAULT NULL,
  `remarque_visite` text DEFAULT NULL,
  `statut` enum('EN_ATTENTE','ACCEPTEE','REFUSEE') NOT NULL,
  `ville_actuelle` varchar(255) DEFAULT NULL,
  `annonce_id` bigint(20) NOT NULL,
  `etudiant_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `message`
--

CREATE TABLE `message` (
  `id` bigint(20) NOT NULL,
  `contenu` text NOT NULL,
  `date_envoi` datetime(6) NOT NULL,
  `est_lu` bit(1) NOT NULL,
  `conversation_id` bigint(20) NOT NULL,
  `expediteur_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `meubles`
--

CREATE TABLE `meubles` (
  `id` bigint(20) NOT NULL,
  `acheteur_id` bigint(20) DEFAULT NULL,
  `categorie` enum('LIT','BUREAU','CANAPE','ARMOIRE','AUTRE') DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `etat` enum('NEUF','BON_ETAT','USAGE') DEFAULT NULL,
  `localisation` varchar(255) DEFAULT NULL,
  `photos` longtext DEFAULT NULL,
  `prix` double DEFAULT NULL,
  `statut` enum('DISPONIBLE','COMMANDE','VENDU','SUSPENDU') DEFAULT NULL,
  `titre` varchar(255) DEFAULT NULL,
  `transporteur_id` bigint(20) DEFAULT NULL,
  `type_vendeur` enum('ETUDIANT','PRO') DEFAULT NULL,
  `vendeur_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `photo`
--

CREATE TABLE `photo` (
  `id` bigint(20) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `date_upload` datetime(6) DEFAULT NULL,
  `ordre` int(11) DEFAULT NULL,
  `url` longtext NOT NULL,
  `annonce_id` bigint(20) DEFAULT NULL,
  `chambre_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `photos_profil`
--

CREATE TABLE `photos_profil` (
  `id` bigint(20) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `date_upload` datetime(6) DEFAULT NULL,
  `url` longtext NOT NULL,
  `utilisateur_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `profil_etudiant`
--

CREATE TABLE `profil_etudiant` (
  `id` bigint(20) NOT NULL,
  `a_animaux` bit(1) DEFAULT NULL,
  `accepte_animaux` bit(1) DEFAULT NULL,
  `accepte_fumeur` bit(1) DEFAULT NULL,
  `annee_diplome` int(11) DEFAULT NULL,
  `budget_max` double DEFAULT NULL,
  `budget_max_colocation` double DEFAULT NULL,
  `description_personnelle` varchar(1000) DEFAULT NULL,
  `filiere` varchar(255) DEFAULT NULL,
  `frequence_invites` varchar(255) DEFAULT NULL,
  `fumeur` bit(1) DEFAULT NULL,
  `hobbies` varchar(500) DEFAULT NULL,
  `horaire_type` varchar(255) DEFAULT NULL,
  `meme_universite_prefere` bit(1) DEFAULT NULL,
  `niveau_etude` enum('LICENCE_1','LICENCE_2','LICENCE_3','MASTER_1','MASTER_2','DOCTORAT','AUTRE') DEFAULT NULL,
  `niveau_proprete` varchar(255) DEFAULT NULL,
  `numero_etudiant` varchar(255) DEFAULT NULL,
  `sexe_prefere_colocataire` varchar(255) DEFAULT NULL,
  `tranche_age_recherche` varchar(255) DEFAULT NULL,
  `type_logement` varchar(255) DEFAULT NULL,
  `universite` varchar(255) DEFAULT NULL,
  `vecteur_personnalite` varchar(4000) DEFAULT NULL,
  `ville_recherche` varchar(255) DEFAULT NULL,
  `ville_recherche_colocation` varchar(255) DEFAULT NULL,
  `utilisateur_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `profil_prestataire`
--

CREATE TABLE `profil_prestataire` (
  `id` bigint(20) NOT NULL,
  `certifications` text DEFAULT NULL,
  `disponibilite` varchar(255) DEFAULT NULL,
  `experience_annees` int(11) DEFAULT NULL,
  `site_web` varchar(255) DEFAULT NULL,
  `specialite` varchar(255) DEFAULT NULL,
  `tarif_horaire` double DEFAULT NULL,
  `zone_intervention` varchar(255) DEFAULT NULL,
  `utilisateur_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `profil_proprietaire`
--

CREATE TABLE `profil_proprietaire` (
  `id` bigint(20) NOT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `code_postal` varchar(255) DEFAULT NULL,
  `description_biens` text DEFAULT NULL,
  `nb_proprietes` int(11) DEFAULT NULL,
  `numero_fiscal` varchar(255) DEFAULT NULL,
  `type_bien` varchar(255) DEFAULT NULL,
  `ville` varchar(255) DEFAULT NULL,
  `utilisateur_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reclamation`
--

CREATE TABLE `reclamation` (
  `id` bigint(20) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('TECHNICAL','SERVICE','BILLING','OTHER','PAYMENT','CLEANLINESS','OWNER','FRAUD') NOT NULL DEFAULT 'OTHER',
  `status` enum('PENDING','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `priority` enum('HIGH','MEDIUM','LOW') DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `resolved_at` timestamp NULL DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `reclamation`
--

INSERT INTO `reclamation` (`id`, `titre`, `description`, `type`, `status`, `priority`, `category`, `created_at`, `updated_at`, `resolved_at`, `email`) VALUES
(1, 'Application très lente', 'L\'application prend beaucoup de temps à charger la carte.', 'TECHNICAL', 'PENDING', 'LOW', 'OTHER', '2026-04-05 17:55:15', '2026-04-05 17:55:15', NULL, 'user1@example.com'),
(2, 'Facturation double', 'J\'ai été facturé deux fois pour le trajet de la semaine dernière.', 'BILLING', 'PENDING', 'LOW', 'OTHER', '2026-04-05 17:55:16', '2026-04-05 17:55:16', NULL, 'user2@example.com'),
(3, 'Véhicule sale', 'Le véhicule loué était plein de poussière à l\'intérieur.', 'CLEANLINESS', 'PENDING', 'LOW', 'OTHER', '2026-04-05 17:55:16', '2026-04-05 17:55:16', NULL, 'user3@example.com'),
(4, 'Retard du propriétaire', 'Le propriétaire est arrivé 30 minutes en retard sans prévenir.', 'OWNER', 'PENDING', 'LOW', 'OTHER', '2026-04-05 17:55:16', '2026-04-05 17:55:16', NULL, 'user4@example.com'),
(5, 'Moyen de paiement refusé', 'Impossible d\'ajouter ma nouvelle carte bancaire.', 'PAYMENT', 'PENDING', 'LOW', 'OTHER', '2026-04-05 17:55:16', '2026-04-05 17:55:16', NULL, 'user5@example.com'),
(6, 'Suspicion de fraude', 'Quelqu\'un a essayé de louer une voiture avec mon compte.', 'FRAUD', 'PENDING', 'LOW', 'OTHER', '2026-04-05 17:55:16', '2026-04-05 17:55:16', NULL, 'user6@example.com'),
(7, 'Problème de service client', 'Le support ne m\'a pas répondu depuis 2 jours.', 'SERVICE', 'PENDING', 'LOW', 'OTHER', '2026-04-05 17:55:16', '2026-04-05 17:55:16', NULL, 'user7@example.com'),
(8, 'Question générale', 'Puis-je louer un véhicule pour traverser la frontière ?', 'OTHER', 'PENDING', 'LOW', 'OTHER', '2026-04-05 17:55:16', '2026-04-05 17:55:16', NULL, 'user8@example.com'),
(9, 'il n\'ya pas de service de menage !!!', 's\'il vous plait j\'ai besoin d\'une femme de ménage le plus tot possible !', 'SERVICE', 'PENDING', 'LOW', 'OTHER', '2026-04-05 18:00:51', '2026-04-05 18:00:51', NULL, 'attia.imeed@gmail.com'),
(10, 'manque de ujytgrfds', 'yhtrfvsx', 'OTHER', 'PENDING', 'LOW', 'OTHER', '2026-04-05 18:09:30', '2026-04-05 18:09:30', NULL, 'attia.imeed@gmail.com'),
(11, 'cccccccccccccccccc', 'ccccccccccccccc', 'TECHNICAL', 'PENDING', 'LOW', 'OTHER', '2026-04-05 18:13:47', '2026-04-05 18:13:47', NULL, 'attia.imeed@gmail.com'),
(12, 'application lente', 'elle prend plus de temps lors de l\'ouverture', 'OTHER', 'PENDING', 'LOW', 'OTHER', '2026-04-05 18:16:12', '2026-04-05 18:16:12', NULL, 'attia.imeed@gmail.com'),
(13, 'Application trÞs lente', 'L\'application prend beaucoup de temps Ó charger la carte.', 'TECHNICAL', 'PENDING', 'HIGH', 'TECHNICAL', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user1@example.com'),
(14, 'Facturation double', 'J\'ai ÚtÚ facturÚ deux fois pour le trajet de la semaine derniÞre.', 'BILLING', 'PENDING', 'HIGH', 'PAYMENT', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user2@example.com'),
(15, 'VÚhicule sale', 'Le vÚhicule louÚ Útait plein de poussiÞre Ó l\'intÚrieur.', 'CLEANLINESS', 'IN_PROGRESS', 'MEDIUM', 'CLEANLINESS', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user3@example.com'),
(16, 'Retard du propriÚtaire', 'Le propriÚtaire est arrivÚ 30 minutes en retard sans prÚvenir.', 'OWNER', 'PENDING', 'MEDIUM', 'OWNER', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user4@example.com'),
(17, 'Moyen de paiement refusÚ', 'Impossible d\'ajouter ma nouvelle carte bancaire.', 'PAYMENT', 'RESOLVED', 'LOW', 'PAYMENT', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user5@example.com'),
(18, 'Suspicion de fraude', 'Quelqu\'un a essayÚ de louer une voiture avec mon compte.', 'FRAUD', 'PENDING', 'HIGH', 'FRAUD', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user6@example.com'),
(19, 'ProblÞme de service client', 'Le support ne m\'a pas rÚpondu depuis 2 jours.', 'SERVICE', 'IN_PROGRESS', 'LOW', 'OTHER', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user7@example.com'),
(20, 'Question gÚnÚrale', 'Puis-je louer un vÚhicule pour traverser la frontiÞre ?', 'OTHER', 'RESOLVED', 'LOW', 'OTHER', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user8@example.com'),
(21, 'Chauffage en panne', 'Le chauffage de l\'appartement ne fonctionne plus depuis 3 jours.', 'TECHNICAL', 'PENDING', 'HIGH', 'TECHNICAL', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user9@example.com'),
(22, 'Remboursement non reþu', 'J\'attends mon remboursement depuis 2 semaines sans nouvelles.', 'BILLING', 'IN_PROGRESS', 'MEDIUM', 'PAYMENT', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user10@example.com'),
(23, 'Odeur dÚsagrÚable', 'L\'appartement sent le moisi, c\'est insupportable.', 'CLEANLINESS', 'PENDING', 'MEDIUM', 'CLEANLINESS', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user11@example.com'),
(24, 'Proprio agressif', 'Le propriÚtaire m\'a parlÚ de maniÞre trÞs agressive et irrespectueuse.', 'OWNER', 'PENDING', 'HIGH', 'OWNER', '2026-04-07 08:43:47', '2026-04-07 08:43:47', NULL, 'user12@example.com');

-- --------------------------------------------------------

--
-- Structure de la table `reservations`
--

CREATE TABLE `reservations` (
  `id` bigint(20) NOT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `adresse_arrivee` varchar(255) DEFAULT NULL,
  `adresse_depart` varchar(255) DEFAULT NULL,
  `annonce_service_id` bigint(20) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `creneau` varchar(255) DEFAULT NULL,
  `date_reservation` datetime(6) DEFAULT NULL,
  `description_chargement` varchar(255) DEFAULT NULL,
  `description_panne` varchar(255) DEFAULT NULL,
  `etudiant_id` bigint(20) DEFAULT NULL,
  `statut` enum('EN_ATTENTE','CONFIRMEE','EN_COURS','TERMINEE','ANNULEE') DEFAULT NULL,
  `type_nettoyage` enum('STANDARD','GRAND','FIN_BAIL') DEFAULT NULL,
  `type_panne` varchar(255) DEFAULT NULL,
  `type_service` enum('TRANSPORT','NETTOYAGE','MAINTENANCE') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `transaction_paiement`
--

CREATE TABLE `transaction_paiement` (
  `id` bigint(20) NOT NULL,
  `date_paiement` datetime(6) DEFAULT NULL,
  `fichier_recu_pdf_url` varchar(255) DEFAULT NULL,
  `montant_total` decimal(10,2) NOT NULL,
  `statut_paiement` enum('INITIE','VALIDE','ECHOUE') NOT NULL,
  `stripe_session_id` varchar(255) DEFAULT NULL,
  `client_id` bigint(20) NOT NULL,
  `contrat_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

CREATE TABLE `utilisateurs` (
  `id` bigint(20) NOT NULL,
  `age` int(11) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `bloque_jusqu_a` datetime(6) DEFAULT NULL,
  `cree_le` datetime(6) DEFAULT NULL,
  `dernier_ip` varchar(45) DEFAULT NULL,
  `dernier_user_agent` varchar(500) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `email_verifie` bit(1) DEFAULT NULL,
  `expiration_token_email` datetime(6) DEFAULT NULL,
  `expiration_token_mdp` datetime(6) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL,
  `mis_a_jour_le` datetime(6) DEFAULT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `nom` varchar(100) NOT NULL,
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expiration` datetime(6) DEFAULT NULL,
  `photo_profil` varchar(500) DEFAULT NULL,
  `prenom` varchar(100) NOT NULL,
  `role` enum('ETUDIANT','PROPRIETAIRE','PRESTATAIRE','ADMIN') NOT NULL,
  `statut` enum('EN_ATTENTE_EMAIL','EN_ATTENTE_ADMIN','ACTIF','REJETE','BANNI') DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `tentatives_connexion` int(11) DEFAULT NULL,
  `token_reinit_mdp` varchar(255) DEFAULT NULL,
  `token_verification_email` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `age`, `bio`, `bloque_jusqu_a`, `cree_le`, `dernier_ip`, `dernier_user_agent`, `email`, `email_verifie`, `expiration_token_email`, `expiration_token_mdp`, `google_id`, `mis_a_jour_le`, `mot_de_passe`, `nom`, `otp_code`, `otp_expiration`, `photo_profil`, `prenom`, `role`, `statut`, `telephone`, `tentatives_connexion`, `token_reinit_mdp`, `token_verification_email`) VALUES
(9, NULL, NULL, NULL, '2026-04-15 07:56:47.000000', '0:0:0:0:0:0:0:1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', 'nadaa.slaamaa@gmail.com', b'1', NULL, NULL, NULL, '2026-04-15 07:59:30.000000', '$2a$10$7zjqnjV9fikZt1EMASjzU.VZIB0V4ynBBvZ/ZhhdMnegWraCQasgu', 'slama', '177763', '2026-04-15 08:06:47.000000', NULL, 'Nada', 'ADMIN', 'ACTIF', '', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `visite`
--

CREATE TABLE `visite` (
  `id` bigint(20) NOT NULL,
  `commentaire` text DEFAULT NULL,
  `date_heure_proposee` datetime(6) NOT NULL,
  `statut` enum('EN_ATTENTE','CONFIRMEE','ANNULEE','REPORTEE','TERMINEE') NOT NULL,
  `annonce_id` bigint(20) NOT NULL,
  `etudiant_id` bigint(20) NOT NULL,
  `proprietaire_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `annonces_service`
--
ALTER TABLE `annonces_service`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `annonce_location`
--
ALTER TABLE `annonce_location`
  ADD PRIMARY KEY (`id_annonce`),
  ADD KEY `FKeage7ymup9by26cfhjkp9oeye` (`proprietaire_id`);

--
-- Index pour la table `avis`
--
ALTER TABLE `avis`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `chambre`
--
ALTER TABLE `chambre`
  ADD PRIMARY KEY (`id_chambre`),
  ADD KEY `FK4b94qt94sqy9t9h5h7i10tkn5` (`annonce_id`);

--
-- Index pour la table `commandes`
--
ALTER TABLE `commandes`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `contrat_location`
--
ALTER TABLE `contrat_location`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_84s7agr3pvafjohqa9d48hrwt` (`demande_id`),
  ADD KEY `FK530ylb8h1xo5gvpakyqc5j0vw` (`annonce_id`),
  ADD KEY `FK3et9fb2xd1ljbh2piwa6vtj6i` (`bailleur_id`),
  ADD KEY `FKa6fudjgnnkfw0atx8af8t1vp2` (`locataire_id`);

--
-- Index pour la table `conversation`
--
ALTER TABLE `conversation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_t7f36ecc46lb60ql6yotn5gw2` (`demande_location_id`);

--
-- Index pour la table `demande_location`
--
ALTER TABLE `demande_location`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK9dlwkdpl19s0aqpvyeohjs0al` (`annonce_id`),
  ADD KEY `FKk5d5ckjdocgf61tudhsysgkq2` (`etudiant_id`);

--
-- Index pour la table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK6yskk3hxw5sklwgi25y6d5u1l` (`conversation_id`),
  ADD KEY `FKromu4hkp669mcq7eq3lvc6gte` (`expediteur_id`);

--
-- Index pour la table `meubles`
--
ALTER TABLE `meubles`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `photo`
--
ALTER TABLE `photo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKogyg7v3wisawjwimdvn93rlt2` (`annonce_id`),
  ADD KEY `FKi9wb87y5vvluos1ye4lyx3ey1` (`chambre_id`);

--
-- Index pour la table `photos_profil`
--
ALTER TABLE `photos_profil`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_2237cm29iuvrolsoqhd5lvpk2` (`utilisateur_id`);

--
-- Index pour la table `profil_etudiant`
--
ALTER TABLE `profil_etudiant`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_sg3sm7muwsf8utfd6pjyskoqc` (`utilisateur_id`);

--
-- Index pour la table `profil_prestataire`
--
ALTER TABLE `profil_prestataire`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_r620s8tlwkfih4jlw7lt033q2` (`utilisateur_id`);

--
-- Index pour la table `profil_proprietaire`
--
ALTER TABLE `profil_proprietaire`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_cp8ou9ufdtc9xtaucygbl2ppn` (`utilisateur_id`);

--
-- Index pour la table `reclamation`
--
ALTER TABLE `reclamation`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `transaction_paiement`
--
ALTER TABLE `transaction_paiement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKojx928x9off5f6k617koy70d5` (`client_id`),
  ADD KEY `FK2jmkpq5dmwvo5wfipd4uk5q9j` (`contrat_id`);

--
-- Index pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK_6ldvumu3hqvnmmxy1b6lsxwqy` (`email`);

--
-- Index pour la table `visite`
--
ALTER TABLE `visite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKf1a4212i35nmy4q2b93ox9ya4` (`annonce_id`),
  ADD KEY `FK5rp5f3gk21e0ms89lyfertsxy` (`etudiant_id`),
  ADD KEY `FK6ya1xl6dv3edeg1q1vynfg8ph` (`proprietaire_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `annonces_service`
--
ALTER TABLE `annonces_service`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `annonce_location`
--
ALTER TABLE `annonce_location`
  MODIFY `id_annonce` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `avis`
--
ALTER TABLE `avis`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `chambre`
--
ALTER TABLE `chambre`
  MODIFY `id_chambre` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `commandes`
--
ALTER TABLE `commandes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `contrat_location`
--
ALTER TABLE `contrat_location`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `conversation`
--
ALTER TABLE `conversation`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `demande_location`
--
ALTER TABLE `demande_location`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `message`
--
ALTER TABLE `message`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `meubles`
--
ALTER TABLE `meubles`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `photo`
--
ALTER TABLE `photo`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `photos_profil`
--
ALTER TABLE `photos_profil`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `profil_etudiant`
--
ALTER TABLE `profil_etudiant`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `profil_prestataire`
--
ALTER TABLE `profil_prestataire`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `profil_proprietaire`
--
ALTER TABLE `profil_proprietaire`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `reclamation`
--
ALTER TABLE `reclamation`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT pour la table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `transaction_paiement`
--
ALTER TABLE `transaction_paiement`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `utilisateurs`
--
ALTER TABLE `utilisateurs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT pour la table `visite`
--
ALTER TABLE `visite`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `annonce_location`
--
ALTER TABLE `annonce_location`
  ADD CONSTRAINT `FKeage7ymup9by26cfhjkp9oeye` FOREIGN KEY (`proprietaire_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `chambre`
--
ALTER TABLE `chambre`
  ADD CONSTRAINT `FK4b94qt94sqy9t9h5h7i10tkn5` FOREIGN KEY (`annonce_id`) REFERENCES `annonce_location` (`id_annonce`);

--
-- Contraintes pour la table `contrat_location`
--
ALTER TABLE `contrat_location`
  ADD CONSTRAINT `FK3et9fb2xd1ljbh2piwa6vtj6i` FOREIGN KEY (`bailleur_id`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `FK530ylb8h1xo5gvpakyqc5j0vw` FOREIGN KEY (`annonce_id`) REFERENCES `annonce_location` (`id_annonce`),
  ADD CONSTRAINT `FKa6fudjgnnkfw0atx8af8t1vp2` FOREIGN KEY (`locataire_id`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `FKddbgup4kwokvwcgvaf7hka36a` FOREIGN KEY (`demande_id`) REFERENCES `demande_location` (`id`);

--
-- Contraintes pour la table `conversation`
--
ALTER TABLE `conversation`
  ADD CONSTRAINT `FK4r6w1qxlxet638jw22ne3sutr` FOREIGN KEY (`demande_location_id`) REFERENCES `demande_location` (`id`);

--
-- Contraintes pour la table `demande_location`
--
ALTER TABLE `demande_location`
  ADD CONSTRAINT `FK9dlwkdpl19s0aqpvyeohjs0al` FOREIGN KEY (`annonce_id`) REFERENCES `annonce_location` (`id_annonce`),
  ADD CONSTRAINT `FKk5d5ckjdocgf61tudhsysgkq2` FOREIGN KEY (`etudiant_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `FK6yskk3hxw5sklwgi25y6d5u1l` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`id`),
  ADD CONSTRAINT `FKromu4hkp669mcq7eq3lvc6gte` FOREIGN KEY (`expediteur_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `photo`
--
ALTER TABLE `photo`
  ADD CONSTRAINT `FKi9wb87y5vvluos1ye4lyx3ey1` FOREIGN KEY (`chambre_id`) REFERENCES `chambre` (`id_chambre`),
  ADD CONSTRAINT `FKogyg7v3wisawjwimdvn93rlt2` FOREIGN KEY (`annonce_id`) REFERENCES `annonce_location` (`id_annonce`);

--
-- Contraintes pour la table `photos_profil`
--
ALTER TABLE `photos_profil`
  ADD CONSTRAINT `FKox44g68xhwqvw1g6e6j6jdtyh` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `profil_etudiant`
--
ALTER TABLE `profil_etudiant`
  ADD CONSTRAINT `FKp0n4cupd1bcbx1jtugcktiubo` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `profil_prestataire`
--
ALTER TABLE `profil_prestataire`
  ADD CONSTRAINT `FKlaywd9qtlua3v7xf9bka5l4sa` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `profil_proprietaire`
--
ALTER TABLE `profil_proprietaire`
  ADD CONSTRAINT `FK4gpeok5twfkxp46fe5m59igma` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `transaction_paiement`
--
ALTER TABLE `transaction_paiement`
  ADD CONSTRAINT `FK2jmkpq5dmwvo5wfipd4uk5q9j` FOREIGN KEY (`contrat_id`) REFERENCES `contrat_location` (`id`),
  ADD CONSTRAINT `FKojx928x9off5f6k617koy70d5` FOREIGN KEY (`client_id`) REFERENCES `utilisateurs` (`id`);

--
-- Contraintes pour la table `visite`
--
ALTER TABLE `visite`
  ADD CONSTRAINT `FK5rp5f3gk21e0ms89lyfertsxy` FOREIGN KEY (`etudiant_id`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `FK6ya1xl6dv3edeg1q1vynfg8ph` FOREIGN KEY (`proprietaire_id`) REFERENCES `utilisateurs` (`id`),
  ADD CONSTRAINT `FKf1a4212i35nmy4q2b93ox9ya4` FOREIGN KEY (`annonce_id`) REFERENCES `annonce_location` (`id_annonce`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
