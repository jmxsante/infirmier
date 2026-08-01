# CABINET — Système d'exploitation pour infirmier·e libéral·e

Nom de travail : **Cabinet**. Interface 100 % française. Mobile-first, hors-ligne, Supabase (EU-Paris), pré-HDS.

---

## 0. Ce que j'ai vérifié avant d'écrire ce plan

- Recherche sur la NGAP Titre XVI (AMI/AIS/BSI, lettres-clés, majorations, IFD/IK, règle de non-cumul art. 11).
- État du projet : template TanStack Start vierge (`src/routes/index.tsx` = placeholder), Supabase connecté (`nvhnbxmctiopmlyfzjqw`), **base vide** — aucune table, aucun bucket, seul un event-trigger `rls_auto_enable` existe.
- Conséquence : on part d'une feuille blanche, sans dette. Tout ci-dessous est du neuf.

Réserve honnête : je n'ai pas encore parsé le PDF NGAP du 21/06/2026 que tu as fourni. **Étape 1 du build** = parsing intégral de ce PDF pour produire le catalogue d'actes officiel (voir §3). Les sources web secondaires se contredisent sur les coefficients ; seul le PDF fait foi.

---

## 1. Le problème réel (avant de parler de features)

Une IDEL sans cabinet ne gère pas « des rendez-vous ». Elle gère **une contrainte de temps-distance sous obligation légale**.

```
6h30 ──────────────── 13h30        17h00 ─────── 19h30
  ~30 actes, 25-35 domiciles         ~15 actes
  ↑ chaque acte = 4-15 min de soin + 3-9 min de trajet
  ↑ certains actes ont une fenêtre imposée (insuline avant repas,
    anticoagulant à heure fixe, pansement J+2, perfusion 2×/j espacée de 12h)
  ↑ chaque acte doit être couvert par une ordonnance valide, cotable,
    et tracé — sinon rejet CPAM ou faute professionnelle
```

Les 5 façons de perdre : **(1)** un patient hors zone CPAM accepté par erreur, **(2)** une ordonnance périmée → soin non payé, **(3)** une cotation fausse → rejet/indu/contrôle, **(4)** une tournée surchargée → retard cumulé, soins bâclés, **(5)** une transmission absente → rupture de continuité lors du relais binôme/remplaçante.

**Le plan traite ces 5 risques comme les 5 fonctions centrales du produit.** Tout le reste est secondaire.

---

## 2. Architecture générale

```
┌───────────────────────── CLIENT (PWA, mobile-first) ─────────────────────────┐
│  React 19 + TanStack Start/Router + TanStack Query                            │
│  ┌────────────┬────────────┬────────────┬────────────┬───────────────────┐   │
│  │ TOURNÉE    │ DOSSIERS   │ ADMISSION  │ FACTURATION│ PILOTAGE          │   │
│  │ (le cœur)  │ patients   │ (funnel)   │ NGAP       │ (KPI/URSSAF)      │   │
│  └────────────┴────────────┴────────────┴────────────┴───────────────────┘   │
│  Couche offline : IndexedDB (Dexie) + file d'attente de mutations + LWW/CRDT  │
└───────────────────────────────────┬───────────────────────────────────────────┘
                                    │ HTTPS, JWT porteur
┌───────────────────────────────────▼───────────────────────────────────────────┐
│  SERVEUR — TanStack `createServerFn` (edge worker)                             │
│  • moteur de cotation NGAP   • optimiseur de tournée   • contrôle zone CPAM    │
│  • liens d'accès médecin     • export facturation      • journal d'audit       │
└───────────────────────────────────┬───────────────────────────────────────────┘
┌───────────────────────────────────▼───────────────────────────────────────────┐
│  SUPABASE (eu-west-3 Paris) — Postgres + RLS + Storage chiffré + Auth          │
│  RLS sur 100 % des tables · pgcrypto pour NIR/données sensibles · audit_log    │
│  append-only · buckets privés + URLs signées 60 s                              │
└────────────────────────────────────────────────────────────────────────────────┘
```

Décisions structurantes :
- **Aucune Edge Function.** Toute logique serveur = `createServerFn` (stack TanStack).
- **Le serveur est la seule source de vérité pour la cotation et la zone.** Le client ne calcule jamais un tarif qui part en facturation.
- **Append-only partout où c'est médico-légal.** Une transmission de soin ne se modifie pas : elle se corrige par une nouvelle entrée liée (comme un dossier de soins papier).

---

## 3. Modèle de données (≈ 30 tables)

### 3.1 Vue d'ensemble

```
                    ┌──────────────┐
                    │  cabinets    │  (la structure : elle + binôme + remplaçantes)
                    └──────┬───────┘
        ┌──────────────────┼──────────────────┬───────────────────┐
   ┌────▼─────┐      ┌─────▼──────┐     ┌─────▼──────┐     ┌──────▼──────┐
   │ soignants│      │  patients  │     │ prescripteurs│    │ zones_cpam  │
   │ (profils)│      │            │     │  (médecins)  │    │ (polygones) │
   └────┬─────┘      └─────┬──────┘     └─────┬───────┘     └─────────────┘
        │                  │                   │
        │            ┌─────▼──────────┐        │
        │            │  ordonnances   │◄───────┘
        │            │ (scan + dates) │
        │            └─────┬──────────┘
        │                  │
        │            ┌─────▼──────────────┐    ┌────────────────────┐
        │            │ plans_de_soins     │───►│ catalogue_actes    │
        │            │ (protocole récurr.)│    │  (NGAP officiel)   │
        │            └─────┬──────────────┘    └─────────┬──────────┘
        │                  │ génère                       │ référence
   ┌────▼──────────────────▼──────┐                 ┌─────▼─────────┐
   │      interventions           │────────────────►│ actes_realises│
   │ (1 passage = 1 créneau)      │                 └─────┬─────────┘
   └────┬─────────────────────────┘                       │
        │                                           ┌─────▼─────────┐
   ┌────▼──────────┐  ┌────────────┐                │  cotations    │
   │  tournees     │  │transmissions│               └─────┬─────────┘
   │ (jour+soignant│  │ (texte+audio)│                     │
   └───────────────┘  └────────────┘                ┌─────▼─────────┐
                                                    │  factures     │
   ┌───────────────┐  ┌──────────────┐              │  + paiements  │
   │  audit_log    │  │ documents    │              └───────────────┘
   │ (append-only) │  │ (storage)    │
   └───────────────┘  └──────────────┘
```

### 3.2 Tables clés (champs métier, hors id/dates)

**`cabinets`** — nom, SIRET, n° ADELI/RPPS gérant, adresse de rattachement.
**`soignants`** — profil lié à `auth.users` : nom, rôle (`titulaire` | `associee` | `remplacante` | `admin`), n° ADELI, n° RPPS, téléphone, couleur d'agenda, statut actif. **Les rôles vivent dans une table `soignant_roles` séparée** + fonction `has_role()` SECURITY DEFINER (jamais de rôle sur le profil : escalade de privilèges).
**`patients`** — civilité, nom, nom de naissance, prénom, date de naissance, **NIR chiffré (pgcrypto)**, régime/caisse, mutuelle + n° adhérent, exonération (ALD, maternité, AT/MP, CMU-C/C2S), tiers-payant, médecin traitant, adresse complète + `lat/lng` + `zone_cpam_id`, étage/code d'accès/où est la clé/présence d'un chien, personne de confiance, contact d'urgence, aidant, degré de dépendance (GIR), allergies, antécédents, risques (chute, contagion, agressivité), statut du dossier.
**`patient_acces`** — quel soignant/prescripteur voit quel dossier, et jusqu'à quand. Pas d'accès implicite.
**`prescripteurs`** — nom, spécialité, RPPS, cabinet, tél, email, statut du portail, mode de contact préféré.
**`ordonnances`** — patient, prescripteur, date de prescription, date de fin/validité, renouvelable oui/non, nb de renouvellements, scan (Storage), texte OCR, actes prescrits (liste), ALD liée, **statut calculé : valide / expire sous 7 j / expirée**.
**`catalogue_actes`** — **issu du PDF NGAP** : code, libellé exact, chapitre/article du Titre XVI, lettre-clé (AMI/AIS/AMX/BSI/DI...), coefficient, tarif unitaire, durée moyenne de réalisation (paramétrable), règles de cumul, exigences (prescription obligatoire, DSI/BSI requis, matériel), majorations applicables, actif oui/non, `version_ngap` + `date_effet` (versionné : les anciennes factures gardent l'ancien barème).
**`plans_de_soins`** — patient + ordonnance : actes, récurrence (RRULE : « 2×/j, 7j/7, 21 jours », « lundi-mercredi-vendredi »), fenêtre horaire imposée (ex. 6h30-8h00), durée, soignant préféré, date début/fin, notes de protocole.
**`interventions`** — LE créneau : patient, soignant, tournée, début/fin planifiés, début/fin réels (GPS optionnel + horodatage), statut (planifié / en route / réalisé / refusé / absent / annulé / à replanifier), motif, ordre dans la tournée, distance depuis le point précédent.
**`actes_realises`** — intervention + acte du catalogue + quantité + observations. C'est ce qui déclenche la cotation.
**`cotations`** — moteur serveur : lignes retenues, application de l'article 11 (100 % / 50 % / 0 %), majorations (MAU, MCI, dimanche/férié MD, nuit MN, MIE), IFD, IK avec km calculés, total. **Trace de la décision** (pourquoi telle règle) — auditabilité.
**`factures`** / **`lignes_facture`** / **`paiements`** — période, patient, part AMO / part AMU (mutuelle) / part patient, statut (à envoyer → envoyée → payée / rejetée / en litige), motif de rejet, date de paiement, rapprochement. Export CSV/JSON vers son logiciel SESAM-Vitale agréé.
**`tournees`** — date, soignant, période (matin/soir), interventions ordonnées, km total, durée estimée vs réelle, statut, verrouillage.
**`partage_jours`** — le calendrier partagé : qui prend quel jour/quelle période, règle de rotation (alternance, semaine paire/impaire, personnalisée), remplaçante affectée, période de validité. **C'est la table qui permet « rythmes variables ».**
**`transmissions`** — texte, **note audio (Storage) + transcription**, type (observation / alerte / consigne / relais), gravité, patient, intervention, auteur, lu-par. Append-only.
**`taches`** / **`rappels`** — checklists et to-do liés à un patient ou à une tournée, échéance, récurrence, assignation.
**`documents`** — ordonnances, comptes-rendus, photos de plaies (avec échelle et suivi d'évolution), consentements. Bucket privé, URL signée courte.
**`zones_cpam`** — polygones GeoJSON de la zone conventionnée (38100 Grenoble + Échirolles + communes limitrophes), avec un anneau « périphérie à valider ».
**`stocks`** — dispositifs (aiguilles, pansements, DASRI), seuils d'alerte, dates de péremption. Le fourgon roulant est une pharmacie.
**`audit_log`** — append-only, immuable : qui, quoi, quand, avant/après, IP, appareil. Sur toute lecture de dossier patient aussi (traçabilité d'accès = exigence santé).
**`incidents`** — événement indésirable, chute, refus de soin, matériovigilance.

Chaque table `public` : `GRANT` explicites → `authenticated` + `service_role`, jamais `anon` sur du médical, RLS activée, policies scopées par `cabinet_id` + `has_role()`.

---

## 4. Les 5 moteurs

### 4.1 Moteur NGAP (le plus critique)

Trois couches :
1. **Catalogue** — extrait du PDF officiel, versionné, avec date d'effet. Recherche instantanée par mot-clé, chapitre, lettre-clé.
2. **Cotation** — fonction serveur pure et **testée unitairement** : entrée = actes réalisés + contexte (heure, jour, patient, distance) ; sortie = lignes cotées + justification.
   - Article 11 : acte le plus cher à 100 %, second à 50 %, les suivants à 0 % (avec les exceptions listées).
   - Majorations : MAU (acte unique), MCI (coordination infirmière), MD (dimanche/férié), MN (nuit 20h-8h), MIE (< 7 ans).
   - Déplacement : IFD systématique + IK au-delà de la franchise, distance réelle depuis le domicile professionnel.
   - Forfaits BSI/BSA-BSB-BSC pour patients dépendants (exclusif des AIS).
3. **Garde-fous** — le moteur refuse ou alerte : ordonnance expirée, acte non prescrit, cumul interdit, BSI manquant. **Bloquant avant facturation, jamais avant le soin** (on ne bloque pas un soin pour une raison administrative).

### 4.2 Moteur de tournée

- **Vue jour** en rail temporel (6h30→13h30 / 17h→19h30), colonnes par soignant, glisser-déposer avec recalcul du trajet en temps réel.
- **Détection de conflit** en direct : chevauchement, fenêtre horaire violée, trajet impossible (« 14 min de route pour 6 min disponibles » en rouge).
- **Carte synchronisée** : la tournée tracée, réordonnancement par glissement, matrice de distances mise en cache.
- **Optimisation** : bouton « Optimiser » → réordonne sous contraintes (fenêtres imposées, patients à horaire fixe verrouillés) ; propose, n'impose jamais. Elle valide.
- **Génération** : les plans de soins projettent automatiquement les interventions sur 4 semaines ; les jours sont attribués selon `partage_jours`.
- **Mode conduite** : un seul patient à l'écran, gros boutons — « Arrivée », « Soin fait », « Absent », « Note vocale », « Suivant » + itinéraire.

### 4.3 Funnel d'admission (< 90 secondes)

```
Appel entrant
  │
  ├─▶ [1] Adresse tapée ──▶ géocodage ──▶ dans la zone CPAM ?
  │        VERT = OK · ORANGE = limite, à valider · ROUGE = hors zone (motif affiché)
  │
  ├─▶ [2] Acte demandé ──▶ recherche catalogue ──▶ je le fais ? charge ? matériel ?
  │
  ├─▶ [3] Ordonnance ──▶ photo immédiate ou « à récupérer » (tâche créée)
  │
  ├─▶ [4] Créneaux ──▶ les 3 meilleurs proposés (détour minimal), 1 tap = réservé
  │
  └─▶ [5] Dossier patient créé, plan de soins pré-rempli, récap SMS au patient
```

### 4.4 Moteur hors-ligne

Dexie (IndexedDB) miroir des données de la tournée du jour ± 7 j. File de mutations horodatée, rejeu à la reconnexion, résolution par « dernier écrivain gagne » sauf sur les transmissions (append-only, jamais de conflit). Indicateur de synchro permanent : **on doit toujours savoir si c'est parti**. Les notes audio sont mises en file et uploadées en tâche de fond.

### 4.5 Portail prescripteur

Accès **par lien signé à durée limitée**, périmètre strictement défini par patient et par le consentement : évolution des soins, transmissions marquées « visible médecin », photos de plaie, alertes. Lecture seule + un canal de message. Chaque ouverture est journalisée et visible par le patient dans son dossier.

---

## 5. Sécurité, RGPD, trajectoire HDS

| Exigence | Mise en œuvre dès maintenant |
|---|---|
| Hébergement | Supabase **eu-west-3 (Paris)** uniquement. Aucun sous-traitant hors UE sur la donnée de santé. |
| Chiffrement | TLS en transit ; AES au repos ; **NIR et identifiants sensibles chiffrés en colonne (pgcrypto)**, déchiffrés côté serveur seulement. |
| Cloisonnement | RLS sur 100 % des tables, scopée `cabinet_id` ; `has_role()` SECURITY DEFINER ; zéro policy `USING (true)`. |
| Traçabilité | `audit_log` append-only : accès en lecture aux dossiers inclus. Rétention 3 ans. |
| Authentification | Email + mot de passe fort, protection HIBP activée, **2FA obligatoire** pour les soignants, session courte, déconnexion auto. |
| Droits patients | Export du dossier (PDF/JSON), rectification, effacement raisonné (conservation légale 20 ans pour le dossier de soins → suppression logique + purge programmée). |
| Registre RGPD | Généré par l'app : finalités, durées, sous-traitants, mesures. Modèles de consentement patient et médecin fournis. |
| **Trajectoire HDS** | L'app reste 100 % portable : Postgres standard + Storage S3-compatible. Migration = restauration d'un dump sur un hébergeur certifié HDS (OVHcloud, Scaleway, Clever Cloud) + changement de variables d'environnement. **Jalon obligatoire avant toute donnée patient réelle** — l'app démarrera en mode « données de démonstration » verrouillé jusqu'à ta validation. |

Modèle de menace explicite : téléphone volé (chiffrement + verrouillage + effacement à distance de la session), remplaçante qui part (révocation d'accès immédiate + périmètre daté), curiosité (accès patient journalisé et notifié), rejet CPAM (justification de cotation conservée), perte de réseau en tournée (offline), contrôle CPAM (export complet horodaté).

---

## 6. Design system — « Clinique, pas hospitalier »

Refus explicite : le bleu-hôpital générique, Inter/Poppins, dégradés violets, cartes flottantes molles. Ce n'est pas un dashboard SaaS de plus.

- **Palette** — fond ardoise très clair le jour / graphite profond en mode nuit (utilisable à 6h du matin en voiture, phares éteints). Accent **vert eucalyptus** (soin, calme). Sémantique stricte : ambre = attention administrative, corail = urgence clinique, **jamais de rouge décoratif**. Tokens oklch dans `src/styles.css`, aucune couleur en dur dans les composants.
- **Typographie** — une grotesque suisse à chasse serrée pour les titres et les heures, une sans humaniste très lisible pour le corps. **Chiffres tabulaires partout** (heures, coefficients, montants s'alignent).
- **Densité** — deux modes assumés : *Planification* (desktop, dense, tableur-like) et *Terrain* (mobile, cibles ≥ 56 px, une action par écran, gantable).
- **Métaphore** — le rail horaire physique : les créneaux sont des blocs qu'on saisit, qui claquent en place, qui résistent quand c'est impossible. Retour haptique à la validation d'un soin.
- **Mouvement** — retenu. Rien ne rebondit. Les transitions servent l'orientation spatiale (le bloc va d'ici à là), jamais la décoration.
- **Accessibilité** — contraste AA minimum partout, AAA sur les heures et les posologies ; tout utilisable au pouce d'une seule main.

---

## 7. Phases de livraison

| Phase | Contenu | Vérifiable par |
|---|---|---|
| **0 — Socle** | Schéma complet + RLS + audit + auth 2FA + design system + coquille PWA | Linter Supabase vert, tests RLS (un soignant ne voit pas un autre cabinet) |
| **1 — Catalogue NGAP** | Parsing du PDF officiel → catalogue versionné + moteur de cotation + tests unitaires sur cas réels | Suite de tests de cotation (art. 11, majorations, IFD/IK) |
| **2 — Dossiers patients** | Dossier complet, ordonnances + scan, plans de soins, transmissions texte/audio, documents, checklists | Parcours création patient → plan de soins → transmission |
| **3 — Tournée** ★ | Rail horaire, drag & drop, carte, conflits, optimisation, partage de jours, mode conduite | Journée de 30 actes construite en < 10 min, conflits détectés |
| **4 — Admission** | Funnel appel entrant + contrôle zone CPAM cartographique | Chrono : appel → RDV posé en < 90 s |
| **5 — Hors-ligne** | Miroir IndexedDB, file de mutations, synchro, upload audio différé | Tournée complète en mode avion puis synchro |
| **6 — Facturation** | Cotation → facture → suivi tiers-payant → relance impayés → export | Cycle complet sur un mois simulé |
| **7 — Pilotage & portail** | KPI (CA, actes/jour, km, temps réel vs planifié), indicateurs URSSAF/BNC, portail prescripteur | Tableau de bord + accès médecin tracé |
| **8 — Durcissement** | Scan de sécurité, tests de charge, dossier RGPD, bascule HDS | Scan sans finding critique |

★ = ta priorité déclarée, avec la phase 2.

---

## 8. Tests machine-vérifiables (à chaque phase)

- **Unitaires (Vitest)** : moteur de cotation (jeu de ~60 cas NGAP), calcul de fenêtres horaires, RRULE, résolution de conflits offline.
- **Intégration** : politiques RLS testées en tant que soignant A / soignant B / remplaçante révoquée / anon.
- **E2E (Playwright)** : les 6 parcours critiques (admission, journée de tournée, relais binôme, ordonnance expirée bloquant la facture, mode hors-ligne, accès médecin).
- **Contrôles automatiques** : typecheck, lint, linter Supabase, scan de sécurité.

---

## 9. Ce que je te demanderai en cours de route

1. Le PDF NGAP : je le parse, puis **tu valides le catalogue** avant qu'il serve à facturer (je ne veux pas d'un tarif inventé dans ton système).
2. Le périmètre exact de la zone CPAM validée (communes/codes postaux) — je pars sur 38100 + Échirolles + limitrophes, à confirmer.
3. Les durées moyennes réelles de ses actes les plus fréquents (ça pilote tout le moteur de tournée).
4. Le nom définitif du produit.

---

**Prochaine étape si tu valides :** Phase 0 + Phase 1 — schéma de base de données complet avec RLS et audit, design system, puis parsing du PDF NGAP et moteur de cotation testé. Dis-moi ce que tu veux modifier, retirer ou renforcer.
