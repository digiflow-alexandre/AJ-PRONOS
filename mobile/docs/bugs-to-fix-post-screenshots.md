# Bugs à fixer après les captures App Store

Notes du 2026-06-10 — à régler avant le lancement.

## ✅ Fixé immédiatement

- **Bouton "Démarrer mon essai" caché par la tab bar dans l'onboarding** : ajout de `BottomTabInset` au paddingBottom du screen onboarding (cf. `src/components/onboarding-screen.tsx`)

## 🔄 À fixer après les captures App Store

### 1. Pas de pseudo affiché sur les messages du salon VIP
- **Symptôme** : les bulles de messages ne montrent pas qui les a postés (juste le texte + l'heure)
- **À voir** : `src/app/(app)/vip/index.tsx` ligne ~378 (composant `MessageBubble`)
- **Solution attendue** : afficher `message.sender_display_name` au-dessus de la bulle (sauf pour mes propres messages, où ça reste inutile)
- **Bonus** : ajouter une couleur dorée pour le pseudo des staff (validator/admin) pour distinguer visuellement les messages de Julien

### 2. Compte Julien temporaire à nettoyer
Si laissé en place après les screenshots :
```sql
-- Supprimer les 3 messages de démo
delete from public.vip_messages
where sender_display_name = 'Julien'
  and sender_id = 'UUID_DE_JULIEN_TEMPORAIRE';

-- Supprimer le compte Julien temporaire (à faire via Supabase UI : Auth → Users → julien@ajpronos.fr → Delete)
```

→ Ou garder le compte Julien si on veut s'en servir pour le vrai launch.
