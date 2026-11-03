# Springr (nom provisoire)

Plateforme d'emploi pour les 16 à 35 ans qui résident en Belgique : jobs étudiants, stages, alternance, CDD et CDI, en français et en néerlandais.

## Ce que fait le prototype

- **Inscription** avec vérification de résidence : adresse belge complète, code postal valide (1000 à 9992, la région est détectée automatiquement), déclaration sur l'honneur, âge entre 16 et 35 ans, consentement RGPD.
- **Offres** agrégées depuis Le Forem (open data) et Adzuna Belgique, avec suppression des doublons. Sans clé d'API, des offres de démonstration s'affichent.
- **Score de correspondance** de 0 à 100, avec les raisons affichées (contrat, région, compétences, langues).
- **Vue swipe** : glisser à droite ou « Je garde » pour sauvegarder, à gauche ou « Je passe » pour ignorer.
- **Lettre de motivation** rédigée par l'IA Claude (ou un modèle de base sans clé).
- **Suivi des candidatures** avec statut et date de rappel (rappel automatique à 7 jours).
- Interface complète en **français** et en **néerlandais** (`/fr` et `/nl`).

Pour l'instant, le profil et les candidatures sont gardés dans le navigateur. Le fichier `supabase/schema.sql` prépare la vraie base de données.

## Lancer en local

```bash
npm install
cp .env.example .env.local   # puis remplir les clés
npm run dev                  # http://localhost:3000
```

## Clés à obtenir

| Variable | Où l'obtenir | Coût |
|---|---|---|
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | developer.adzuna.com | Gratuit |
| `FOREM_DATASET_URL` | Portail open data ODWB (jeu de données des offres du Forem, à confirmer) | Gratuit |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Payant à l'usage |

## Prochaines étapes

1. Brancher Supabase (comptes, profils, candidatures) et l'e-mail de confirmation.
2. Collecte planifiée des offres en base, avec Careerjet et les pages carrières.
3. Demandes d'accès à VDAB et Actiris.
4. Génération de CV, rappels par e-mail, offre Pro, espace recruteur.
5. Pages légales : politique de confidentialité, conditions d'utilisation, cookies.
