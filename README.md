# Find-house

Application de veille immobilière 100% statique déployée sur GitHub Pages. Les annonces sont collectées par un workflow GitHub Actions et publiées dans des fichiers JSON consommés par l'UI React.

## Structure

- `config/` : configuration des sources (`sources.json`) et règles de scoring / filtrage (`filters.json`).
- `data/` : données générées par le collecteur (committées par les actions).
- `scripts/collector/` : collecteur TypeScript (tests Vitest) exécuté par GitHub Actions.
- `web/` : application Vite + React consommant les fichiers JSON publics.
- `.github/workflows/collector.yml` : collecte planifiée et push automatique des données.
- `.github/workflows/pages.yml` : build & déploiement GitHub Pages.

## Collecteur (Node + TypeScript)

### Installation locale

```bash
cd scripts/collector
npm install
npm test
npm run collect
```

Le collecteur lit `config/sources.json` et `config/filters.json`, récupère les sources RSS/JSON (HTML best effort désactivé par défaut), normalise les annonces, calcule le scoring et €/m², détecte les anomalies et produit :

- `data/listings.json`
- `data/sources_status.json`
- `data/stats.json`

Les alertes optionnelles se déclenchent uniquement pour les nouvelles annonces avec `score >= minScore` :

- Webhook : `ALERT_WEBHOOK_URL`
- Telegram : `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`

Les sources retournant 403/429 sont marquées `blocked` pour stopper les tentatives automatiques. Un cooldown par fréquence (minutes) évite les hits intempestifs.

### Tests

Les tests Vitest couvrent le scoring, les filtres et la détection d'anomalies.

```bash
cd scripts/collector
npm test
```

## UI (Vite + React)

L'UI consomme les JSON statiques depuis `/data` et `/config` (copiés automatiquement dans `web/public` via `predev`/`prebuild`).

```bash
cd web
npm install
npm run dev
npm run build
```

Pages principales :

- `/` Dashboard : volume d'annonces, sources actives/bloquées, dernières erreurs, stats €/m².
- `/listings` : liste filtrable (prix, surface, score, tri date/score/€/m²) + marquage « déjà vu » (localStorage).
- `/sources` : statut des sources (enabled/blocked/lastRun/tags).

## Déploiement GitHub Pages

- URL cible : `https://<user>.github.io/<repo>/` (exemple demandé : https://mikka0808.github.io/Find-house/).
- Activer GitHub Pages sur la branche `gh-pages` (gérée automatiquement par le workflow).
- Le workflow `pages.yml` build l'app (`npm run build` dans `web/`) avec `BASE_PATH=/<repo>/` puis déploie via `actions/deploy-pages`.
- Une page `web/public/404.html` assure la redirection SPA pour les routes profondes (`/listings`, `/sources`) sur GitHub Pages.

## Configuration des filtres

`config/filters.json` contient :

- `minScore` : seuil pour alertes.
- `keywords` / `penalties` : poids positif/négatif pour les termes (scoring 0-100).
- `anomaly` : multiplicateurs d'écart-type pour flagger les anomalies €/m².
- `filters.keywords` : mots-clés obligatoires dans titre/description.

## Gestion des sources

`config/sources.json` structure chaque source :

- `id`, `name`, `type` (`rss|json|html`), `url`
- `enabled` (bool), `frequencyMinutes`
- `tags` (optionnel)

Les sources `html` sont désactivées par défaut (option « HTML best effort »). En cas de 403/429/captcha, la source est marquée `blocked` et ignorée jusqu'à réactivation manuelle.

## Données de stats et anomalies

Le collecteur calcule `€/m²` quand prix + surface sont disponibles, puis la moyenne/écart-type par ville ou code postal sur 30 jours. Les annonces sont marquées `anomaly_low` ou `anomaly_high` lorsqu'elles sortent de l'intervalle `[mean ± std * multiplier]`.

## Déduplication & fingerprints

Les annonces sont dédupliquées via un fingerprint SHA1 basé sur (URL, titre, prix, surface, code postal, source). Les actions GitHub poussent automatiquement les fichiers modifiés `data/*.json` sur la branche par défaut.
