# AJ Pronos — App mobile

App native iOS + Android pour les abonnés AJ Pronos.
Stack **Expo SDK 56 + Expo Router + Supabase**.

> Vitrine web : `../site/` · Admin web (Julien/Alex) : `../app/`

---

## 1. Premier démarrage (5 min)

```bash
cp .env.local.example .env.local
```

Ouvre `.env.local` et colle les valeurs Supabase (mêmes que `../app/.env.local`).

```bash
npm install
npx expo start
```

Tu vas voir un **QR code** dans le terminal + une URL `exp://192.168.x.x:8081`.

## 2. Tester sur ton iPhone (le plus simple)

1. **App Store** → installe **Expo Go**
2. Lance Expo Go
3. Tape « **Scan QR Code** »
4. Scanne le QR du terminal
5. L'app charge en ~10s

> Ton iPhone et ton Mac doivent être sur le **même Wi-Fi**. Si ça plante, lance `npx expo start --tunnel` (plus lent mais marche partout).

## 3. Tester sur simulateur iOS (si tu as Xcode)

```bash
npx expo start --ios
```

## 4. Parcours à tester

- L'app s'ouvre → écran **Connexion**
- Tape « Créer un compte » → écran **Inscription**
- Email + mdp (8 caractères mini) + checkbox 18 ans → **Créer mon compte**
- Tu reçois un email Supabase → clique le lien de confirmation → ton compte est activé
- Reviens dans Expo Go → connecte-toi → tu arrives sur l'écran **Bienvenue**
- Onglet **Pronos** (placeholder « Bientôt »)
- Bouton **Se déconnecter** → retour à l'écran connexion

> ⚠️ **Important** : dans le dashboard Supabase → **Authentication** → **URL Configuration**, ajoute `exp://*` et `aj-pronos://` dans les Redirect URLs si tu veux deep-linker plus tard. Pour l'instant le mail confirme via web puis tu reviens à l'app — ça suffit pour la v1.

## 5. Structure

```
src/
├── app/                   ← Routes Expo Router
│   ├── _layout.tsx        ← AuthProvider + gating
│   ├── (auth)/            ← Publiques (sign-in, sign-up)
│   └── (app)/             ← Protégées (membre connecté)
├── components/
│   └── branded-button.tsx ← Boutons + champs DA AJ Pronos
├── constants/
│   └── theme.ts           ← Palette + spacing + radius (DA validée)
├── hooks/                 ← Hooks template Expo (theme, splash)
└── lib/
    ├── supabase.ts        ← Client Supabase + LargeSecureStore
    ├── auth-context.tsx   ← Provider auth (session, signIn, signUp, signOut)
    └── use-theme-colors.ts
```

## 6. Commandes utiles

| Commande | Effet |
|---|---|
| `npx expo start` | Lance le bundler + QR code |
| `npx expo start --clear` | Idem en vidant le cache (utile quand ça bug) |
| `npx expo start --ios` | + ouvre le simulateur iOS |
| `npx expo start --android` | + ouvre l'émulateur Android |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck |

## 7. Suite (roadmap)

- [ ] Tableau de bord pronostics (liste du jour)
- [ ] Push notifications (Expo Notifications + Supabase trigger)
- [ ] Onglet salon VIP (chat Supabase Realtime)
- [ ] Intégration RevenueCat (paiement Apple IAP + Google Play, quand SIRET OK)
- [ ] Deep linking confirmation email (scheme `aj-pronos://`)
- [ ] Build EAS (production iOS + Android) puis soumission stores
