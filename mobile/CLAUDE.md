@AGENTS.md

# AJ Pronos — App (Expo / React Native)

> App unique iOS + Android + web. Stack Expo SDK 56 + Expo Router + Supabase.
> Sœur de `../site/` (vitrine publique Next.js). Inclut l'espace membre ET
> l'admin (gated par role), pas de Next.js admin séparé.

@../CLAUDE.md

## Posture

- Stack : **Expo SDK 56 + Expo Router + React Native 0.85 + React 19**.
- TypeScript strict, `paths: { "@/*": ["./src/*"] }`.
- **PAS de NativeWind pour la v1** — `StyleSheet` + tokens dans `src/constants/theme.ts`. On évalue NativeWind quand le produit est stable.
- Storage session Supabase via **`LargeSecureStore`** (clé AES-256 dans SecureStore, payload chiffré dans AsyncStorage) — pattern officiel Supabase pour Expo.
- Theme dark mode auto (suit `useColorScheme`).
- **AGENTS.md** dit que Expo a changé ; toujours lire `https://docs.expo.dev/versions/v56.0.0/` avant d'écrire du code Expo.

## Architecture routes

```
src/app/
├── _layout.tsx          ← AuthProvider + Stack.Protected (gating)
├── (auth)/              ← Routes publiques
│   ├── _layout.tsx
│   ├── sign-in.tsx
│   └── sign-up.tsx
└── (app)/               ← Routes protégées (membre connecté)
    ├── _layout.tsx      ← NativeTabs (Accueil + Pronos)
    ├── index.tsx
    └── explore.tsx
```

Gating via **`Stack.Protected guard={!!session}`** dans `_layout.tsx`
racine — pattern recommandé Expo Router. Pas de `Redirect` manuel.

## Paiement — règle inviolable iOS

Sur iOS, **interdit d'utiliser Stripe in-app** pour des abos digitaux.
On utilisera **RevenueCat** (abstraction Apple IAP + Google Play Billing
+ Stripe web) en Phase 2, quand Alex aura son SIRET. La vitrine continue
de prendre les abos web via Stripe (paiement hors-app).

## Démarrage

```bash
cp .env.local.example .env.local   # remplir EXPO_PUBLIC_SUPABASE_*
npm install
npx expo start
```

Puis : Expo Go sur iPhone → scanner le QR code.

## Skills à mobiliser

- `claude-api` — agents IA (côté serveur, jamais dans le bundle mobile)
- `lint-and-validate` — après chaque change (MANDATORY)

## En cas de doute

1. Lire `docs.expo.dev/versions/v56.0.0/`
2. Lire `../CLAUDE.md` pour positionnement + règles gambling
3. Vérifier la DA dans `../DESIGN.md` avant tout choix visuel
