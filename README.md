<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=6C63FF&height=200&section=header&text=ATOMIC%20FLIX&fontSize=70&fontColor=ffffff&fontAlignY=38&desc=🎌%20Ton%20streamer%20anime%20ultime&descAlignY=58&descSize=20&animation=fadeIn" width="100%"/>

<br/>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=22&pause=1000&color=6C63FF&center=true&vCenter=true&width=600&lines=Anime+Streaming+App+%F0%9F%8E%8C;Construit+avec+Expo+%2B+React+Native;Mises+%C3%A0+jour+automatiques+OTA;Design+Neon+Dark+%F0%9F%94%AE)](https://git.io/typing-svg)

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-6C63FF?style=for-the-badge&logo=semver&logoColor=white" alt="Version"/>
  <img src="https://img.shields.io/badge/Platform-Android-00D4FF?style=for-the-badge&logo=android&logoColor=white" alt="Android"/>
  <img src="https://img.shields.io/badge/Expo-SDK%2054-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo"/>
  <img src="https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/OTA-Updates-FF2D78?style=for-the-badge&logo=expo&logoColor=white" alt="OTA"/>
</p>

<br/>

> **ATOMIC FLIX** est une application mobile de streaming d'anime moderne et immersive,  
> construite avec Expo et React Native. Design neon dark, navigation fluide et mises à jour automatiques.

</div>

---

## ✨ Aperçu

<div align="center">

| Accueil | Détail Anime | Lecteur |
|:---:|:---:|:---:|
| 🏠 Hero banner animé | 🎭 Synopsis + Saisons | 📺 WebView intégrée |
| Sections populaires | Badges langues & flags | Prev / Next épisodes |
| Ajouts récents | Genres & métadonnées | Multi-serveurs |
| Recommandations | Grille de saisons/films | Sélecteur de langue |

</div>

---

## 🚀 Fonctionnalités

<details>
<summary><b>🏠 Écran d'accueil</b></summary>
<br/>

- **Hero Banner** rotatif avec les animes populaires (auto-slide toutes les 6s)
- **Ajouts récents** — derniers épisodes sortis avec flag de langue
- **Recommandations** personnalisées
- **Pépites & Classiques** — catégories curatées
- Pull-to-refresh pour actualiser le contenu

</details>

<details>
<summary><b>🔍 Recherche</b></summary>
<br/>

- Recherche en temps réel dès 2 caractères
- Grille de résultats avec thumbnails
- Navigation directe vers le détail

</details>

<details>
<summary><b>📅 Planning</b></summary>
<br/>

- Calendrier hebdomadaire des sorties
- Filtres par jour (Lun → Dim)
- Heure de sortie, saison et langue affichées

</details>

<details>
<summary><b>🎭 Détail Anime</b></summary>
<br/>

- Image hero plein écran avec gradient
- Synopsis, genres, statut, studio, année
- Grille de saisons/films avec badge de type (`SAISON`, `FILM`, `OVA`)
- Flags de langue par saison

</details>

<details>
<summary><b>📺 Lecteur</b></summary>
<br/>

- WebView native pour la lecture
- Sélecteur de langue (VO, VF, VA…) avec flags
- Sélecteur d'épisode et de serveur
- Boutons **Précédent / Suivant** épisode
- Multi-serveurs avec indicateur de qualité (HD, FHD…)

</details>

---

## 🛠️ Stack Technique

<div align="center">

| Catégorie | Technologie |
|-----------|-------------|
| **Framework** | Expo SDK 54 + React Native 0.81 |
| **Navigation** | Expo Router v6 (file-based) |
| **Language** | TypeScript 5.9 |
| **Animations** | React Native Animated + Reanimated 4 |
| **Data Fetching** | TanStack Query (React Query) |
| **UI Icons** | Expo Vector Icons (Feather) |
| **Safe Area** | React Native Safe Area Context |
| **WebView** | React Native WebView |
| **Build** | EAS Build |
| **Updates OTA** | EAS Update (expo-updates) |
| **API** | anime-sama-scraper (Vercel) |

</div>

---

## 📦 Architecture

```
atomic-flix/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Tab bar avec safe area Android
│   │   ├── index.tsx         # Écran d'accueil
│   │   └── planning.tsx      # Planning hebdomadaire
│   ├── anime/
│   │   └── [id].tsx          # Détail anime
│   ├── player.tsx            # Lecteur vidéo
│   ├── search.tsx            # Recherche
│   └── _layout.tsx           # Layout racine
├── components/
│   ├── LoadingScreen.tsx     # Loader neon animé 🔮
│   ├── AnimeCard.tsx         # Carte anime
│   ├── HeroBanner.tsx        # Banner hero
│   ├── SkeletonCard.tsx      # Skeleton loading
│   └── NeonGlow.tsx          # Effet glow
├── hooks/
│   ├── useAnime.ts           # Hooks React Query
│   └── useColors.ts          # Design tokens
├── constants/
│   └── colors.ts             # Palette neon dark
└── lib/
    └── api.ts                # Client API
```

---

## 🎨 Design System

<div align="center">

| Token | Couleur | Usage |
|-------|---------|-------|
| `neonPurple` | ![#6C63FF](https://via.placeholder.com/12/6C63FF/6C63FF.png) `#6C63FF` | Accent principal, boutons actifs |
| `neonBlue` | ![#00D4FF](https://via.placeholder.com/12/00D4FF/00D4FF.png) `#00D4FF` | Accents secondaires, infos |
| `neonPink` | ![#FF2D78](https://via.placeholder.com/12/FF2D78/FF2D78.png) `#FF2D78` | Alertes, highlights |
| `background` | ![#08080F](https://via.placeholder.com/12/08080F/08080F.png) `#08080F` | Fond principal |
| `card` | ![#10101E](https://via.placeholder.com/12/10101E/10101E.png) `#10101E` | Cartes & surfaces |

</div>

---

## ⚙️ Installation & Développement

```bash
# Cloner le repo
git clone https://github.com/cidmarco/atomic-flix.git
cd atomic-flix

# Installer les dépendances
pnpm install

# Lancer le serveur Expo
pnpm --filter @workspace/atomic-flix run dev
```

Scanner le QR code avec **Expo Go** sur Android.

---

## 🏗️ Build & Déploiement

### Build APK (Preview)
```bash
cd artifacts/atomic-flix
npx eas build --platform android --profile preview --non-interactive
```

### Build APK (Production)
```bash
cd artifacts/atomic-flix
npx eas build --platform android --profile production --non-interactive
```

### Mise à jour OTA (sans rebuild)
```bash
cd artifacts/atomic-flix
npx eas update --branch production --message "Description de la mise à jour"
```

> 💡 Les mises à jour OTA sont appliquées automatiquement au prochain lancement de l'app.

---

## 🔄 Canaux de déploiement

| Canal | Profil | Usage |
|-------|--------|-------|
| `development` | `eas build --profile development` | Tests internes |
| `preview` | `eas build --profile preview` | Beta testeurs |
| `production` | `eas build --profile production` | Utilisateurs finaux |

---

## 📱 Configuration Android

```json
{
  "package": "com.animestreamer.app",
  "adaptiveIcon": "✅ Configuré",
  "backgroundColor": "#08080F",
  "updates": "OTA via EAS Update"
}
```

---

## 📡 API

L'app se connecte à l'API **anime-sama-scraper** :

| Endpoint | Description |
|----------|-------------|
| `GET /recent` | Derniers épisodes ajoutés |
| `GET /popular` | Animes populaires par catégorie |
| `GET /recommendations` | Recommandations |
| `GET /planning?day={jour}` | Planning du jour (`lundi`…`dimanche`) |
| `GET /search?query={q}` | Recherche par titre |
| `GET /seasons/{id}` | Saisons + métadonnées d'un anime |
| `GET /episodes/{id}?season=&language=` | Liste des épisodes |

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=6C63FF&height=120&section=footer&animation=fadeIn" width="100%"/>

<br/>

**Made with 💜 by cidmarco**

[![Expo](https://img.shields.io/badge/Powered%20by-Expo-000020?style=flat-square&logo=expo)](https://expo.dev)
[![EAS](https://img.shields.io/badge/Built%20with-EAS-4630EB?style=flat-square&logo=expo)](https://expo.dev/eas)

</div>
