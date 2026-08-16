# Générer l'APK Android — Tahiti 2026 (TWA via Bubblewrap)

Cette procédure génère un vrai APK Android à partir de la PWA Vercel, sans modifier une seule ligne du code Next.js.

## Prérequis

Installe ces deux outils **une seule fois** :

1. **Node.js 18+** — https://nodejs.org
2. **Java JDK 11+** — https://adoptium.net (Temurin)

Vérifie l'installation :
```bash
node -v       # doit afficher 18.x ou plus
java -version # doit afficher 11.x ou plus
```

## Étape 1 — Installer Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

## Étape 2 — Initialiser le projet TWA

Dans un dossier vide (ex: `tahiti-twa/`) :

```bash
mkdir tahiti-twa && cd tahiti-twa

bubblewrap init --manifest https://[TA-URL-VERCEL]/manifest.webmanifest
```

> Remplace `[TA-URL-VERCEL]` par l'URL réelle du déploiement Vercel, ex :
> `https://tahiti-voyage.vercel.app/manifest.webmanifest`

Bubblewrap va poser des questions interactives. Voici les réponses recommandées :

| Question | Réponse |
|---|---|
| Application ID | `com.tahiti2026.app` |
| App name | `Tahiti 2026` |
| Short name | `Tahiti` |
| Start URL | `/` |
| Theme color | `#0284C7` |
| Background color | `#FFFFFF` |
| Display mode | `standalone` |
| Orientation | `portrait` |
| Icon URL | Laisser l'URL du manifest (icon.svg) |
| Maskable icon | Laisser l'URL du manifest (icon-maskable.svg) |
| Key store password | Choisis un mot de passe (note-le !) |
| Key alias | `tahiti2026` |
| Key password | Même mot de passe |

## Étape 3 — Construire l'APK

```bash
bubblewrap build
```

Durée : 2-5 minutes selon la connexion (télécharge le SDK Android automatiquement).

## Étape 4 — Récupérer l'APK

L'APK signé se trouve dans :
```
tahiti-twa/app-release-signed.apk
```

## Installation sur Android

### Option A — Sideload (sans Play Store)
1. Sur le téléphone Android : **Paramètres → Sécurité → Sources inconnues** → Activer
2. Envoie `app-release-signed.apk` par email, WhatsApp, ou Google Drive
3. Ouvre le fichier sur le téléphone → **Installer**

### Option B — Play Store (si souhaité plus tard)
- Crée un compte Google Play Developer (25 $ une fois)
- Upload l'APK via la Play Console
- Suit le processus de publication Google

## Lien Digital Asset Links (si nécessaire)

Si Chrome Android refuse de valider le TWA, il faut associer l'app à la PWA via un fichier JSON :

Crée `public/.well-known/assetlinks.json` dans le projet Next.js :

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.tahiti2026.app",
    "sha256_cert_fingerprints": ["<FINGERPRINT>"]
  }
}]
```

Le fingerprint s'obtient avec :
```bash
keytool -list -v -keystore ./android.keystore -alias tahiti2026
```

Copie le `SHA-256` et remplace `<FINGERPRINT>` ci-dessus.

---

**La PWA est déjà opérationnelle** — l'APK est un bonus pour une installation "native" sur Android.
Les utilisateurs iOS peuvent déjà utiliser Safari → "Ajouter sur l'écran d'accueil".
