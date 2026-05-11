# 📖 Documentation Complète — Locavia

> **Locavia** est une plateforme de gestion de logements étudiants intégrant un système de réclamations, d'avis et un chatbot IA.  
> Version : 1.0 | Dernière mise à jour : Avril 2026

---

## 📑 Table des Matières

1. [Présentation du Projet](#1--présentation-du-projet)
2. [Architecture Globale](#2--architecture-globale)
3. [Technologies Utilisées](#3--technologies-utilisées)
4. [Structure du Projet](#4--structure-du-projet)
5. [Backend — Spring Boot](#5--backend--spring-boot)
   - 5.1 [Entités (Entity)](#51-entités-entity)
   - 5.2 [DTOs](#52-dtos)
   - 5.3 [Enums](#53-enums)
   - 5.4 [Repositories](#54-repositories)
   - 5.5 [Services](#55-services)
   - 5.6 [Contrôleurs (Controllers)](#56-contrôleurs-controllers)
   - 5.7 [Mappers](#57-mappers)
   - 5.8 [Gestion des Exceptions](#58-gestion-des-exceptions)
   - 5.9 [Service Email](#59-service-email)
   - 5.10 [Service IA (Gemini)](#510-service-ia-gemini)
6. [Frontend — Angular](#6--frontend--angular)
   - 6.1 [Composants](#61-composants)
   - 6.2 [Services Angular](#62-services-angular)
   - 6.3 [Modèles TypeScript](#63-modèles-typescript)
   - 6.4 [Routes](#64-routes)
7. [Service IA — Python Flask](#7--service-ia--python-flask)
8. [Base de Données — MySQL](#8--base-de-données--mysql)
9. [API REST — Endpoints](#9--api-rest--endpoints)
10. [Docker & Déploiement](#10--docker--déploiement)
11. [Configuration](#11--configuration)
12. [Installation & Démarrage](#12--installation--démarrage)
13. [Tests](#13--tests)
14. [Dépannage & Problèmes Courants](#14--dépannage--problèmes-courants)

---

## 1 — Présentation du Projet

**Locavia** est une application web complète destinée à la gestion de logements étudiants. Elle offre les fonctionnalités suivantes :

| Fonctionnalité | Description |
|---|---|
| 🏠 **Gestion des Réclamations** | Création, suivi, mise à jour et résolution des plaintes des utilisateurs |
| ⭐ **Gestion des Avis** | Publication et consultation d'avis avec analyse de sentiment automatique |
| 🤖 **Chatbot IA** | Assistant intelligent basé sur Google Gemini pour répondre aux questions |
| 📧 **Notifications Email** | Emails automatiques de confirmation et de résolution des réclamations |
| 📊 **Tableau de Bord** | Statistiques en temps réel (distributions par statut, priorité, sentiment) |
| 🧠 **Classification IA** | Catégorisation et priorisation automatiques des réclamations via NLP |

---

## 2 — Architecture Globale

L'application suit une **architecture microservices à 3 couches** :

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular 19)                │
│               http://localhost:4200                     │
│  ┌───────────┬──────────────┬─────────┬──────────┐      │
│  │ Dashboard │ Réclamations │  Avis   │   Chat   │      │
│  └───────────┴──────────────┴─────────┴──────────┘      │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP (REST API)
                    ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND (Spring Boot 3.x)                 │
│               http://localhost:8080                      │
│  ┌────────────┬──────────────┬───────────────────┐      │
│  │ Controllers│   Services   │    Repositories   │      │
│  ├────────────┼──────────────┼───────────────────┤      │
│  │ Reclamation│ AIService    │ ReclamationRepo   │      │
│  │ Avis       │ EmailService │ AvisRepo          │      │
│  │ Chat       │ GeminiService│                   │      │
│  └────────────┴──────┬───────┴────────┬──────────┘      │
└──────────────────────┼────────────────┼─────────────────┘
                       │                │
          ┌────────────┘                └────────────┐
          ▼                                          ▼
┌──────────────────────┐              ┌──────────────────────┐
│  SERVICE IA (Flask)  │              │    BASE DE DONNÉES   │
│ http://localhost:5000│              │     MySQL 8.0        │
│  - Sentiment         │              │  localhost:3306       │
│  - Classification    │              │  DB: locavia         │
│  - Priorité          │              └──────────────────────┘
└──────────────────────┘
          +
┌──────────────────────┐
│    GEMINI API         │
│  (Google Cloud)       │
│  Chatbot IA           │
└──────────────────────┘
```

---

## 3 — Technologies Utilisées

### Backend
| Technologie | Version | Rôle |
|---|---|---|
| **Java** | 17+ | Langage de programmation principal |
| **Spring Boot** | 3.x | Framework backend |
| **Spring Data JPA** | 3.x | ORM / Accès aux données |
| **Hibernate** | 6.x | Implémentation JPA |
| **Lombok** | 1.18.x | Réduction du code boilerplate |
| **Jakarta Validation** | 3.x | Validation des données |
| **Spring Mail** | 3.x | Envoi d'emails SMTP |

### Frontend
| Technologie | Version | Rôle |
|---|---|---|
| **Angular** | 19.2.x | Framework SPA |
| **TypeScript** | 5.7.x | Langage typé |
| **RxJS** | 7.8.x | Programmation réactive |
| **Chart.js** | 4.5.x | Graphiques et visualisations |
| **SCSS** | — | Pré-processeur CSS |

### Service IA
| Technologie | Version | Rôle |
|---|---|---|
| **Python** | 3.11 | Langage du microservice IA |
| **Flask** | 3.0.3 | Framework API Python |
| **TextBlob** | 0.18.0 | Analyse de sentiment NLP |
| **Gunicorn** | 22.0.0 | Serveur WSGI de production |
| **Flask-CORS** | 5.0.0 | Gestion des requêtes cross-origin |

### Infrastructure
| Technologie | Version | Rôle |
|---|---|---|
| **MySQL** | 8.0 | Base de données relationnelle |
| **Docker / Docker Compose** | — | Conteneurisation |
| **Google Gemini API** | v1beta | Chatbot conversationnel |
| **Gmail SMTP** | — | Service d'envoi d'emails |

---

## 4 — Structure du Projet

```
Locavia/
├── backend/                          # 🟢 Backend Spring Boot
│   └── src/main/java/com/PiCloud/locavia/
│       ├── BackendApplication.java   # Point d'entrée de l'application
│       ├── controller/               # Contrôleurs REST
│       │   ├── ReclamationController.java
│       │   ├── AvisController.java
│       │   └── ChatController.java
│       ├── dto/                      # Data Transfer Objects
│       │   ├── ReclamationDTO.java
│       │   └── AvisDTO.java
│       ├── entity/                   # Entités JPA
│       │   ├── Reclamation.java
│       │   └── Avis.java
│       ├── enums/                    # Énumérations
│       │   ├── ReclamationType.java
│       │   ├── ReclamationStatus.java
│       │   ├── ReclamationPriority.java
│       │   └── SentimentType.java
│       ├── exception/                # Gestion d'erreurs
│       │   ├── GlobalExceptionHandler.java
│       │   └── ResourceNotFoundException.java
│       ├── mapper/                   # Mappers Entity ↔ DTO
│       │   ├── ReclamationMapper.java
│       │   └── AvisMapper.java
│       ├── repository/               # Couche d'accès aux données
│       │   ├── ReclamationRepository.java
│       │   └── AvisRepository.java
│       └── service/                  # Logique métier
│           ├── ReclamationService.java (interface)
│           ├── AvisService.java      (interface)
│           ├── AIService.java
│           ├── GeminiService.java
│           ├── EmailService.java
│           └── impl/
│               ├── ReclamationServiceImpl.java
│               └── AvisServiceImpl.java
│
├── frontend/                         # 🔵 Frontend Angular 19
│   └── src/app/
│       ├── app.component.ts          # Composant racine
│       ├── app.routes.ts             # Configuration des routes
│       ├── components/               # Composants visuels
│       │   ├── dashboard/            # Tableau de bord avec statistiques
│       │   ├── reclamation-list/     # Liste et gestion des réclamations
│       │   ├── avis-list/            # Liste et gestion des avis
│       │   ├── chat/                 # Interface du chatbot IA
│       │   └── navbar/               # Barre de navigation
│       ├── models/                   # Interfaces TypeScript
│       │   ├── reclamation.model.ts
│       │   └── avis.model.ts
│       └── services/                 # Services HTTP
│           ├── reclamation.service.ts
│           ├── avis.service.ts
│           └── chat.service.ts
│
├── ai-service/                       # 🟡 Microservice IA Python
│   ├── app.py                        # Application Flask
│   ├── requirements.txt              # Dépendances Python
│   ├── Dockerfile                    # Image Docker
│   └── test_ai.py                    # Tests unitaires
│
├── database/                         # 🗄️ Scripts SQL
│   ├── schema.sql                    # Schéma de la base de données
│   └── seed.sql                      # Données initiales
│
├── docs/                             # 📚 Documentation existante
│   ├── api.md
│   ├── architecture.md
│   └── setup.md
│
├── postman/                          # 📬 Collections de tests API
├── docker-compose.yml                # Orchestration Docker
└── DOCUMENTATION.md                  # 📖 Ce fichier
```

---

## 5 — Backend — Spring Boot

### 5.1 Entités (Entity)

#### `Reclamation.java`

Représente une **réclamation** (plainte) soumise par un utilisateur.

| Champ | Type | Description |
|---|---|---|
| `id` | `Long` | Identifiant unique (auto-généré) |
| `titre` | `String` | Titre de la réclamation (**obligatoire**) |
| `description` | `String (TEXT)` | Description détaillée |
| `type` | `ReclamationType` | Type de réclamation (TECHNICAL, BILLING, etc.) |
| `status` | `ReclamationStatus` | Statut actuel (PENDING, IN_PROGRESS, RESOLVED, REJECTED) |
| `priority` | `ReclamationPriority` | Niveau de priorité (HIGH, MEDIUM, LOW) — par défaut : `LOW` |
| `category` | `String` | Catégorie détectée automatiquement par l'IA |
| `email` | `String` | Email de l'utilisateur pour les notifications |
| `createdAt` | `LocalDateTime` | Date de création (auto) |
| `updatedAt` | `LocalDateTime` | Date de dernière modification (auto) |
| `resolvedAt` | `LocalDateTime` | Date de résolution |

#### `Avis.java`

Représente un **avis** (review) laissé par un utilisateur.

| Champ | Type | Description |
|---|---|---|
| `id` | `Long` | Identifiant unique (auto-généré) |
| `titre` | `String` | Titre de l'avis (**obligatoire**) |
| `commentaire` | `String (TEXT)` | Commentaire détaillé |
| `rating` | `Integer` | Note de 1 à 5 (**obligatoire**) |
| `sentiment` | `SentimentType` | Sentiment détecté par l'IA (POSITIVE, NEGATIVE, NEUTRAL) |
| `trusted` | `Boolean` | Indique si l'avis est fiable — par défaut : `true` |
| `createdAt` | `LocalDateTime` | Date de création (auto) |
| `updatedAt` | `LocalDateTime` | Date de dernière modification (auto) |

---

### 5.2 DTOs

Les DTOs (Data Transfer Objects) servent d'intermédiaires entre le client et les entités JPA.

#### `ReclamationDTO.java`

- Mêmes champs que l'entité `Reclamation`
- Validations Jakarta :
  - `@NotBlank` sur `titre`
  - `@NotNull` sur `type`
  - `@Email` sur `email`

#### `AvisDTO.java`

- Mêmes champs que l'entité `Avis`
- Validations Jakarta :
  - `@NotBlank` sur `titre`
  - `@NotNull` sur `rating`
  - `@Min(1)` et `@Max(5)` sur `rating`

---

### 5.3 Enums

#### `ReclamationType`
```
TECHNICAL | SERVICE | BILLING | OTHER | PAYMENT | CLEANLINESS | OWNER | FRAUD
```

#### `ReclamationStatus`
```
PENDING | IN_PROGRESS | RESOLVED | REJECTED
```

#### `ReclamationPriority`
```
HIGH | MEDIUM | LOW
```

#### `SentimentType`
```
POSITIVE | NEGATIVE | NEUTRAL
```

---

### 5.4 Repositories

#### `ReclamationRepository`

Étend `JpaRepository<Reclamation, Long>` et fournit :

| Méthode | Description |
|---|---|
| `findByStatus(status)` | Filtrer par statut |
| `findByType(type)` | Filtrer par type |
| `findByPriority(priority)` | Filtrer par priorité |
| `findByCategory(category)` | Filtrer par catégorie |
| `countByStatus(status)` | Compter par statut |
| `countByPriority(priority)` | Compter par priorité |
| `getStatusDistribution()` | Distribution des statuts (requête JPQL) |
| `getPriorityDistribution()` | Distribution des priorités (requête JPQL) |
| `getCategoryDistribution()` | Distribution des catégories (requête JPQL) |

#### `AvisRepository`

Étend `JpaRepository<Avis, Long>` et fournit :

| Méthode | Description |
|---|---|
| `findByRating(rating)` | Filtrer par note |
| `findBySentiment(sentiment)` | Filtrer par sentiment |
| `countBySentiment(sentiment)` | Compter par sentiment |
| `getAverageRating()` | Moyenne des notes |
| `getSentimentDistribution()` | Distribution des sentiments (requête JPQL) |

---

### 5.5 Services

#### `ReclamationServiceImpl`

Logique métier principale pour les réclamations :

| Méthode | Description |
|---|---|
| `getAll()` | Récupérer toutes les réclamations |
| `getById(id)` | Récupérer une réclamation par son ID |
| `create(dto)` | Créer une réclamation — **appelle l'IA** pour classifier et détecter la priorité — **envoie un email** de confirmation |
| `update(id, dto)` | Mettre à jour — si statut passe à `RESOLVED`, enregistre `resolvedAt` et **envoie un email** |
| `delete(id)` | Supprimer une réclamation |
| `getStats()` | Récupérer les statistiques (distributions) |

**Flux de création d'une réclamation :**
```
1. Réception du DTO
2. Conversion en entité (Mapper)
3. Statut par défaut = PENDING
4. 🧠 IA : classification automatique de la catégorie
5. 🧠 IA : détection automatique de la priorité
6. 💾 Sauvegarde en BDD
7. 📧 Envoi email de confirmation (asynchrone)
8. Retour du DTO créé
```

#### `AvisServiceImpl`

Logique métier pour les avis :

| Méthode | Description |
|---|---|
| `getAll()` | Récupérer tous les avis |
| `getById(id)` | Récupérer un avis par son ID |
| `create(dto)` | Créer un avis — **appelle l'IA** pour analyser le sentiment |
| `update(id, dto)` | Mettre à jour — **ré-analyse le sentiment** automatiquement |
| `delete(id)` | Supprimer un avis |
| `getStats()` | Récupérer les statistiques (moyenne, sentiment) |

#### `AIService`

Service d'intégration avec le microservice Python Flask :

| Méthode | Endpoint Flask | Description |
|---|---|---|
| `analyzeSentiment(text)` | `POST /sentiment` | Analyse le sentiment du texte |
| `classifyReclamation(text)` | `POST /classify` | Classifie la réclamation |
| `detectPriority(text)` | `POST /priority` | Détecte le niveau de priorité |

> ⚠️ En cas d'erreur de connexion au service IA, des valeurs par défaut sont utilisées : `NEUTRAL`, `OTHER`, `LOW`.

#### `GeminiService`

Service d'intégration avec l'API Google Gemini pour le chatbot :

- Envoie les messages au modèle `gemini-2.0-flash`
- Contexte système : assistant pour la plateforme Locavia, réponses en français
- **Mécanisme de retry** avec backoff exponentiel (3 tentatives, délais de 3s → 6s → 12s) en cas de rate limiting (`HTTP 429`)
- Messages d'erreur en français pour l'utilisateur

#### `EmailService`

Service d'envoi d'emails via Gmail SMTP :

| Méthode | Déclencheur | Contenu |
|---|---|---|
| `sendReclamationConfirmation(...)` | Création d'une réclamation | Confirmation avec référence, sujet et priorité |
| `sendReclamationResolved(...)` | Passage au statut RESOLVED | Notification de résolution |

> ℹ️ Les emails sont envoyés de manière **asynchrone** grâce à l'annotation `@Async`.

---

### 5.6 Contrôleurs (Controllers)

#### `ReclamationController` — `/api/reclamations`

| Méthode HTTP | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reclamations` | Lister toutes les réclamations |
| `GET` | `/api/reclamations/{id}` | Obtenir une réclamation par ID |
| `POST` | `/api/reclamations` | Créer une nouvelle réclamation |
| `PUT` | `/api/reclamations/{id}` | Modifier une réclamation |
| `DELETE` | `/api/reclamations/{id}` | Supprimer une réclamation |
| `GET` | `/api/reclamations/stats` | Obtenir les statistiques |

#### `AvisController` — `/api/avis`

| Méthode HTTP | Endpoint | Description |
|---|---|---|
| `GET` | `/api/avis` | Lister tous les avis |
| `GET` | `/api/avis/{id}` | Obtenir un avis par ID |
| `POST` | `/api/avis` | Créer un nouvel avis |
| `PUT` | `/api/avis/{id}` | Modifier un avis |
| `DELETE` | `/api/avis/{id}` | Supprimer un avis |
| `GET` | `/api/avis/stats` | Obtenir les statistiques |

#### `ChatController` — `/api/chat`

| Méthode HTTP | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Envoyer un message au chatbot IA |

**Corps de la requête :**
```json
{
  "message": "Comment trouver un logement étudiant ?"
}
```

**Réponse :**
```json
{
  "response": "Pour trouver un logement étudiant sur Locavia, vous pouvez..."
}
```

---

### 5.7 Mappers

Les mappers effectuent la **conversion bidirectionnelle** entre entités et DTOs :

#### `ReclamationMapper`
- `toDTO(Reclamation) → ReclamationDTO` — Conversion complète
- `toEntity(ReclamationDTO) → Reclamation` — Conversion sans l'ID
- `updateEntity(Reclamation, ReclamationDTO)` — Mise à jour partielle (seuls les champs non-null sont mis à jour pour `status`, `priority`, `category`, `email`)

#### `AvisMapper`
- `toDTO(Avis) → AvisDTO` — Conversion complète
- `toEntity(AvisDTO) → Avis` — Conversion sans l'ID, `trusted` par défaut à `true`
- `updateEntity(Avis, AvisDTO)` — Met à jour `titre`, `commentaire` et `rating`

---

### 5.8 Gestion des Exceptions

#### `GlobalExceptionHandler` (`@RestControllerAdvice`)

| Exception | Code HTTP | Réponse |
|---|---|---|
| `ResourceNotFoundException` | `404 Not Found` | `{ timestamp, status, error, message }` |
| `MethodArgumentNotValidException` | `400 Bad Request` | `{ timestamp, status, error, errors: { champ: message } }` |

#### `ResourceNotFoundException`

Exception personnalisée levée quand une entité n'est pas trouvée en base :
```java
throw new ResourceNotFoundException("Reclamation", id);
// → "Reclamation with id 42 not found"
```

---

### 5.9 Service Email

**Configuration SMTP (Gmail) :**
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=nadaa.slaamaa@gmail.com
spring.mail.password=samm kbrd pzrc rnok    # Mot de passe d'application Google
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

> ⚠️ **Important** : Le mot de passe doit être un **mot de passe d'application** généré dans les paramètres de sécurité Google, pas le mot de passe du compte Gmail.

**Emails envoyés :**

1. **Email de confirmation** — Lors de la création d'une réclamation
   - Sujet : `✅ Réclamation #ID reçue – Locavia`
   - Contient : référence, sujet, priorité, statut

2. **Email de résolution** — Lorsqu'une réclamation passe au statut `RESOLVED`
   - Sujet : `🎉 Réclamation #ID résolue – Locavia`
   - Contient : référence, sujet, confirmation de résolution

---

### 5.10 Service IA (Gemini)

Le `GeminiService` communique avec l'API Google Gemini pour le chatbot conversationnel.

**Configuration :**
```properties
gemini.api.key=AIzaSyCkjqRkyxZ4Qpnc35hscuh833rwSws7ZQ0
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
```

**Mécanisme de résilience :**
- 3 tentatives max en cas d'erreur `429 Too Many Requests`
- Backoff exponentiel : 3s → 6s → 12s
- Messages d'erreur localisés en français

---

## 6 — Frontend — Angular

### 6.1 Composants

| Composant | Chemin | Description |
|---|---|---|
| `DashboardComponent` | `/dashboard` | Tableau de bord principal avec graphiques Chart.js (statistiques réclamations et avis) |
| `ReclamationListComponent` | `/reclamations` | Liste CRUD complète des réclamations avec formulaire de création/modification |
| `AvisListComponent` | `/avis` | Liste CRUD complète des avis avec formulaire, affichage du sentiment |
| `ChatComponent` | `/chat` | Interface de messagerie avec le chatbot Gemini |
| `NavbarComponent` | (inclus dans le layout) | Barre de navigation entre les écrans |

### 6.2 Services Angular

| Service | URL API | Méthodes |
|---|---|---|
| `ReclamationService` | `http://localhost:8080/api/reclamations` | `getAll()`, `getById(id)`, `create(rec)`, `update(id, rec)`, `delete(id)`, `getStats()` |
| `AvisService` | `http://localhost:8080/api/avis` | `getAll()`, `getById(id)`, `create(avis)`, `update(id, avis)`, `delete(id)`, `getStats()` |
| `ChatService` | `http://localhost:8080/api/chat` | `sendMessage(message)` — retourne un `Observable<string>` |

### 6.3 Modèles TypeScript

#### `Reclamation`
```typescript
interface Reclamation {
  id?: number;
  titre: string;
  description: string;
  type: string;
  status?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string;
}
```

#### `Avis`
```typescript
interface Avis {
  id?: number;
  titre: string;
  commentaire: string;
  rating: number;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  trusted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

#### `ReclamationStats`
```typescript
interface ReclamationStats {
  total: number;
  statusDistribution: { [key: string]: number };
  priorityDistribution: { [key: string]: number };
  categoryDistribution: { [key: string]: number };
}
```

#### `AvisStats`
```typescript
interface AvisStats {
  averageRating: number;
  totalReviews: number;
  sentimentDistribution: { [key: string]: number };
}
```

### 6.4 Routes

| Chemin | Composant | Description |
|---|---|---|
| `/` | ➜ redirection | Redirige vers `/dashboard` |
| `/dashboard` | `DashboardComponent` | Tableau de bord |
| `/reclamations` | `ReclamationListComponent` | Gestion des réclamations |
| `/avis` | `AvisListComponent` | Gestion des avis |
| `/chat` | `ChatComponent` | Interface de chat IA |

---

## 7 — Service IA — Python Flask

Le microservice IA est une application **Flask** qui fournit des capacités d'analyse de texte en français.

### Endpoints

| Méthode | Endpoint | Entrée | Sortie |
|---|---|---|---|
| `POST` | `/sentiment` | `{ "text": "..." }` | `{ "sentiment": "POSITIVE", "polarity": 0.45 }` |
| `POST` | `/classify` | `{ "text": "..." }` | `{ "category": "PAYMENT" }` |
| `POST` | `/priority` | `{ "text": "..." }` | `{ "priority": "HIGH" }` |
| `POST` | `/analyze-reclamation` | `{ "text": "..." }` | `{ "category": "...", "priority": "...", "sentiment": "..." }` |
| `GET` | `/health` | — | `{ "status": "UP" }` |

### Analyse de Sentiment

Utilise **TextBlob** pour calculer la polarité du texte :
- `polarity > 0.1` → `POSITIVE`
- `polarity < -0.1` → `NEGATIVE`
- sinon → `NEUTRAL`

### Classification des Réclamations

Détection par mots-clés en français :

| Catégorie | Mots-clés |
|---|---|
| `FRAUD` | arnaque, fraude, escroquerie, faux, tromperie, vol |
| `PAYMENT` | argent, payer, paiement, facture, remboursement, prix, coût |
| `CLEANLINESS` | sale, propre, propreté, nettoyage, hygiène, poussière, odeur |
| `OWNER` | propriétaire, bailleur, logeur, proprio |
| `TECHNICAL` | bug, technique, panne, cassé, fuite, électricité, plomberie, chauffage |
| `OTHER` | (par défaut) |

### Détection de Priorité

| Priorité | Mots-clés déclencheurs |
|---|---|
| `HIGH` | arnaque, urgent, fraude, danger, escroquerie, immédiat, grave, critique |
| `MEDIUM` | retard, problème, attente, délai, lent, dysfonctionnement |
| `LOW` | (par défaut) |

---

## 8 — Base de Données — MySQL

### Schéma

#### Table `reclamation`

```sql
CREATE TABLE reclamation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type ENUM('TECHNICAL','SERVICE','BILLING','OTHER','PAYMENT','CLEANLINESS','OWNER','FRAUD') NOT NULL DEFAULT 'OTHER',
    status ENUM('PENDING','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) DEFAULT 'LOW',
    category VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);
```

#### Table `avis`

```sql
CREATE TABLE avis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    commentaire TEXT,
    rating INT NOT NULL,
    sentiment VARCHAR(20),
    trusted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)
);
```

### Configuration de la BDD

| Paramètre | Valeur par défaut |
|---|---|
| Hôte | `localhost` |
| Port | `3306` |
| Base | `locavia` |
| Utilisateur | `root` |
| Mot de passe | *(vide)* |
| Charset | `utf8mb4` |
| Collation | `utf8mb4_unicode_ci` |

> ℹ️ Hibernate est configuré en mode `ddl-auto=update` : les tables sont créées/mises à jour automatiquement au démarrage.

---

## 9 — API REST — Endpoints

### Réclamations

```
GET    /api/reclamations          → Liste de toutes les réclamations
GET    /api/reclamations/{id}     → Détails d'une réclamation
POST   /api/reclamations          → Créer une réclamation
PUT    /api/reclamations/{id}     → Modifier une réclamation
DELETE /api/reclamations/{id}     → Supprimer une réclamation
GET    /api/reclamations/stats    → Statistiques des réclamations
```

**Exemple — Créer une réclamation :**
```bash
curl -X POST http://localhost:8080/api/reclamations \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Problème de facturation",
    "description": "J'\''ai été facturé deux fois.",
    "type": "BILLING",
    "email": "user@example.com"
  }'
```

**Réponse :**
```json
{
  "id": 1,
  "titre": "Problème de facturation",
  "description": "J'ai été facturé deux fois.",
  "type": "BILLING",
  "status": "PENDING",
  "priority": "HIGH",
  "category": "PAYMENT",
  "email": "user@example.com",
  "createdAt": "2026-04-05T20:00:00",
  "updatedAt": "2026-04-05T20:00:00",
  "resolvedAt": null
}
```

### Avis

```
GET    /api/avis          → Liste de tous les avis
GET    /api/avis/{id}     → Détails d'un avis
POST   /api/avis          → Créer un avis
PUT    /api/avis/{id}     → Modifier un avis
DELETE /api/avis/{id}     → Supprimer un avis
GET    /api/avis/stats    → Statistiques des avis
```

**Exemple — Créer un avis :**
```bash
curl -X POST http://localhost:8080/api/avis \
  -H "Content-Type: application/json" \
  -d '{
    "titre": "Super expérience",
    "commentaire": "Logement parfait, je recommande vivement !",
    "rating": 5
  }'
```

**Réponse :**
```json
{
  "id": 1,
  "titre": "Super expérience",
  "commentaire": "Logement parfait, je recommande vivement !",
  "rating": 5,
  "sentiment": "POSITIVE",
  "trusted": true,
  "createdAt": "2026-04-05T20:00:00",
  "updatedAt": "2026-04-05T20:00:00"
}
```

### Chat

```
POST   /api/chat          → Envoyer un message au chatbot
```

### Statistiques — Réponse type

**`GET /api/reclamations/stats`**
```json
{
  "total": 8,
  "statusDistribution": {
    "PENDING": 5,
    "IN_PROGRESS": 2,
    "RESOLVED": 1
  },
  "priorityDistribution": {
    "HIGH": 3,
    "MEDIUM": 2,
    "LOW": 3
  },
  "categoryDistribution": {
    "PAYMENT": 2,
    "FRAUD": 1,
    "CLEANLINESS": 1,
    "OTHER": 4
  }
}
```

**`GET /api/avis/stats`**
```json
{
  "averageRating": 3.25,
  "totalReviews": 8,
  "sentimentDistribution": {
    "POSITIVE": 3,
    "NEGATIVE": 3,
    "NEUTRAL": 2
  }
}
```

---

## 10 — Docker & Déploiement

### Docker Compose

Le fichier `docker-compose.yml` orchestre **2 conteneurs** :

| Service | Image | Port |
|---|---|---|
| `mysql` | `mysql:8.0` | `3306` |
| `ai-service` | Build local (`./ai-service`) | `5000` |

**Lancer les services :**
```bash
docker-compose up -d
```

**Arrêter les services :**
```bash
docker-compose down
```

### Dockerfile — Service IA

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m textblob.download_corpora
COPY app.py .
EXPOSE 5000
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

---

## 11 — Configuration

### `application.properties` — Backend

```properties
# Profil actif
spring.profiles.active=dev

# Base de données MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/locavia?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Serveur
server.port=8080

# Jackson (JSON)
spring.jackson.serialization.write-dates-as-timestamps=false

# Service IA Python
ai.service.url=http://localhost:5000

# Gemini API
gemini.api.key=VOTRE_CLE_API
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent

# Email SMTP Gmail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=votre.email@gmail.com
spring.mail.password=votre-mot-de-passe-application
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### Variables d'Environnement

Toutes les valeurs sensibles peuvent être surchargées par des variables d'environnement :

| Variable | Défaut | Description |
|---|---|---|
| `DB_HOST` | `localhost` | Hôte MySQL |
| `DB_PORT` | `3306` | Port MySQL |
| `DB_NAME` | `locavia` | Nom de la base |
| `DB_USERNAME` | `root` | Utilisateur MySQL |
| `DB_PASSWORD` | *(vide)* | Mot de passe MySQL |
| `SERVER_PORT` | `8080` | Port du backend |
| `AI_SERVICE_URL` | `http://localhost:5000` | URL du microservice IA |
| `GEMINI_API_KEY` | — | Clé API Google Gemini |
| `MAIL_HOST` | `smtp.gmail.com` | Serveur SMTP |
| `MAIL_PORT` | `587` | Port SMTP |
| `MAIL_USERNAME` | — | Adresse email d'envoi |
| `MAIL_PASSWORD` | — | Mot de passe d'application |

---

## 12 — Installation & Démarrage

### Prérequis

- **Java 17+** (JDK)
- **Node.js 18+** et **npm**
- **Python 3.11+** (pour le service IA sans Docker)
- **MySQL 8.0** (ou XAMPP/WAMP/Laragon)
- **Docker & Docker Compose** (optionnel)

### Étape 1 — Base de données

```bash
# Créez la base de données
mysql -u root -e "CREATE DATABASE IF NOT EXISTS locavia;"

# (Optionnel) Chargez le schéma et les données initiales
mysql -u root locavia < database/schema.sql
mysql -u root locavia < database/seed.sql
```

> ℹ️ Avec `ddl-auto=update`, Hibernate créera automatiquement les tables au premier démarrage.

### Étape 2 — Service IA (Python)

**Option A : Sans Docker**
```bash
cd ai-service
pip install -r requirements.txt
python -m textblob.download_corpora
python app.py
# → Service démarré sur http://localhost:5000
```

**Option B : Avec Docker**
```bash
docker-compose up -d ai-service
```

### Étape 3 — Backend (Spring Boot)

```bash
cd backend
./mvnw spring-boot:run
# → Backend démarré sur http://localhost:8080
```

### Étape 4 — Frontend (Angular)

```bash
cd frontend
npm install
npm start
# → Frontend démarré sur http://localhost:4200
```

### Vérification

| Service | URL | Test |
|---|---|---|
| Frontend | http://localhost:4200 | Ouvrir dans le navigateur |
| Backend | http://localhost:8080/api/reclamations | Doit retourner du JSON |
| Service IA | http://localhost:5000/health | Doit retourner `{"status": "UP"}` |
| phpMyAdmin | http://localhost/phpmyadmin | Vérifier les tables `locavia` |

---

## 13 — Tests

### Service IA — Tests Python

```bash
cd ai-service
python test_ai.py
```

### Backend — Vérification API

Utilisation des collections Postman dans le dossier `postman/` ou via `curl` :

```bash
# Vérifier la liste des réclamations
curl http://localhost:8080/api/reclamations

# Vérifier les statistiques d'avis
curl http://localhost:8080/api/avis/stats

# Tester le chatbot
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Bonjour !"}'

# Tester le service IA
curl -X POST http://localhost:5000/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Excellent service, très satisfait !"}'
```

---

## 14 — Dépannage & Problèmes Courants

### ❌ `Gemini API rate limit hit`

**Cause :** Trop de requêtes vers l'API Gemini (limite du tier gratuit : ~15 req/min).

**Solution :** Un mécanisme de retry avec backoff exponentiel est déjà implémenté (3 tentatives, 3s/6s/12s). Si le problème persiste, attendez quelques secondes avant de réessayer.

---

### ❌ `530 Must issue a STARTTLS command first`

**Cause :** La propriété `starttls.enable` était mal configurée dans `application.properties`.

**Solution :** Vérifier que la propriété est correcte :
```properties
spring.mail.properties.mail.smtp.starttls.enable=true
```
> ⚠️ Attention à ne pas avoir d'espace dans le nom de la propriété.

---

### ❌ `Connection refused` vers le service IA

**Cause :** Le microservice Python Flask n'est pas démarré sur le port 5000.

**Solution :**
1. Vérifier que le service tourne : `curl http://localhost:5000/health`
2. Lancer le service : `python ai-service/app.py`
3. Ou via Docker : `docker-compose up -d ai-service`

> ℹ️ Le backend continuera de fonctionner même sans le service IA, avec des valeurs par défaut.

---

### ❌ `Table doesn't exist`

**Cause :** La base de données n'a pas encore été initialisée.

**Solution :**
1. Créer la base : `CREATE DATABASE locavia;`
2. Redémarrer le backend : Hibernate créera les tables automatiquement grâce à `ddl-auto=update`

---

### ❌ CORS — Requête bloquée depuis le frontend

**Cause :** Le navigateur bloque les requêtes cross-origin.

**Solution :** Les contrôleurs sont configurés avec `@CrossOrigin(origins = "*")`. Si le problème persiste, vérifiez que le backend est bien sur le port `8080` et le frontend sur le port `4200`.

---

> 📝 **Document maintenu par l'équipe PiCloud** — Avril 2026
