# ATOMIC FLIX — Documentation Technique

---

## PARTIE 1 : Flux de navigation Détail → Lecteur

### 1. Arrivée sur AnimeDetailScreen

Quand l'utilisateur clique sur un anime dans l'accueil, la navigation envoie deux paramètres :
- `animeUrl` : l'identifiant de l'anime (ex: `one-piece`)
- `animeTitle` : le titre affiché

L'écran appelle immédiatement `animeAPI.getDetails(animeId)` :

```
GET https://anime-sama-scraper.vercel.app/api/anime/{id}
```

La réponse contient un tableau `seasons` avec **tous les types de contenu** : Saisons, Sagas, Films, OAV, Kai, etc.
L'API les retourne tous de la même façon, chacun avec :
- `name` → ex: `"Saison 1"`, `"Film 1"`, `"OAV"`, `"Saga 11"`, `"Kai"`
- `value` → ex: `"saison1"`, `"film1"`, `"oav"`, `"saga11"`
- `number`, `languages`, `episodeCount`, `url`, `available`

Ils sont tous affichés sous forme de cartes dans la section "Saisons & Films", sans distinction de type.

---

### 2. Navigation vers AnimePlayerScreen

Quand l'utilisateur clique sur une carte (peu importe le type), la fonction `goToPlayer(season)` est appelée :

```typescript
navigation.navigate('AnimePlayer', {
  animeUrl: animeUrl,       // ID de l'anime
  seasonData: season,       // Objet saison complet (film, oav, saga...)
  animeTitle: animeTitle
});
```

---

### 3. Chargement des épisodes dans AnimePlayerScreen

Le lecteur reçoit `seasonData` et appelle :

```
GET https://anime-sama-scraper.vercel.app/api/episodes/{animeId}
    ?season={season.value}
    &language={VF|VOSTFR}
    &includeSources=true
```

`season.value` est la clé qui détermine le type de contenu chargé :

| Valeur `season.value` | Type de contenu chargé         |
|-----------------------|-------------------------------|
| `saison1`             | Épisodes d'une saison classique |
| `saga11`              | Épisodes d'une saga (ex: One Piece) |
| `film1`               | Film (souvent 1 seul épisode)  |
| `oav`                 | OAV                            |
| `kai`                 | Version Kai                    |

L'app ne fait aucune distinction de type — tout passe par le même `season.value`.

---

### 4. Chargement des sources de streaming

Pour chaque épisode, les sources sont d'abord cherchées dans la réponse (`includeSources=true`).
Si absentes, une seconde requête est lancée :

```
GET https://anime-sama-scraper.vercel.app/api/embed?url={encodeURIComponent(episode.url)}
```

Les sources sont ensuite **priorisées** : le serveur Sibnet est mis en premier automatiquement.

---

### 5. Changement de langue

Lors d'un changement VF ↔ VOSTFR, les épisodes sont rechargés avec le nouveau code langue :

```
GET /api/episodes/{animeId}?season={season.value}&language={VF|VOSTFR}
```

L'épisode équivalent (même numéro) est retrouvé automatiquement et chargé dans la nouvelle langue.

---

## PARTIE 2 : Configuration WebView — Blocage pubs et redirections

### Couche 1 — Propriétés natives du WebView

Ces options React Native définissent le comportement de base :

| Propriété | Valeur | Rôle |
|---|---|---|
| `setSupportMultipleWindows` | `false` | Empêche l'ouverture de nouveaux onglets/fenêtres |
| `allowFileAccess` | `false` | Bloque l'accès aux fichiers locaux |
| `allowUniversalAccessFromFileURLs` | `false` | Bloque les accès cross-origin depuis fichiers locaux |
| `mixedContentMode` | `"never"` | Bloque les contenus HTTP dans une page HTTPS |
| `originWhitelist` | `['*']` | L'interception réelle est gérée par `onShouldStartLoadWithRequest` |

---

### Couche 2 — JavaScript injecté avant le chargement (`injectedJavaScriptBeforeContentLoaded`)

Ce code s'exécute dans la page **avant même** que son propre JavaScript ne tourne. Il neutralise toutes les APIs JavaScript de navigation.

#### Blocage de `window.location`
La propriété entière est surchargée. Toute tentative d'affectation (`window.location = "pub.com"`) retourne `false` silencieusement.

#### Blocage de `window.open`
Remplacé par une fonction vide qui retourne `null`. Les pop-ups n'ouvrent jamais de nouvel onglet.

#### Blocage de `location.href`, `location.replace`, `location.assign`
Les trois méthodes de redirection JavaScript sont toutes neutralisées.

#### Interception des clics (en phase capture)
Tous les clics sur des balises `<a>` avec un vrai `href` (ni `#` ni `javascript:`) sont stoppés :
- `e.preventDefault()`
- `e.stopPropagation()`
- `e.stopImmediatePropagation()`

Les boutons avec `onclick` contenant "location" ou "open", ou ayant un attribut `data-href`, sont aussi bloqués.

#### Blocage des formulaires
Toute soumission `<form>` vers une vraie URL est annulée avant envoi.

#### Wrapping de `addEventListener`
Les écouteurs de type `click` et `touchstart` posés par les scripts publicitaires sont interceptés : si l'élément ciblé a un attribut `data-redirect` ou `onclick`, la propagation est arrêtée.

---

### Couche 3 — `onShouldStartLoadWithRequest` (barrière native)

Pour **chaque URL** que le WebView tente de charger, cette fonction native décide si elle est autorisée. Elle retourne `true` (autorisé) ou `false` (bloqué).

#### Blocage immédiat des deeplinks dangereux
Ces schémas sont bloqués en priorité absolue :
```
tel:, mailto:, sms:, market://, intent://, android-app://, itms://, itms-apps://
```

#### Liste blanche des domaines vidéo autorisés
```
sibnet.ru          vidmoly.to         sendvid.com
dailymotion.com    youtube.com        youtu.be
vimeo.com          mp4upload.com      streamtape.com
kwik.cx            okru               netu.tv
dropload.io        anime-sama.fr      anime-sama.eu
cloudflare.com     hcaptcha.com       recaptcha.net
google.com         cdn.statically.io
```

**Règle finale :** Tout domaine absent de cette liste → `return false` → chargement refusé.

Le même domaine que la source actuelle est toujours autorisé (sous-domaines inclus).

---

### Couche 4 — `onOpenWindow`

Si malgré tout une fenêtre tente de s'ouvrir (via `target="_blank"` ou autre), cet événement natif la capture et retourne `false`.

---

### Résumé du flux de blocage

```
Clic ou redirection dans la WebView
           ↓
[JS] window.open / location.href → neutralisé par surcharge
           ↓
[JS] Listener de clic → stoppé si lien externe détecté
           ↓
[Natif] onShouldStartLoadWithRequest → URL vérifiée contre whitelist
           ↓
[Natif] onOpenWindow → nouvelle fenêtre bloquée
```

Chaque couche est indépendante. Même si une publicité contourne l'une, les suivantes l'arrêtent.
