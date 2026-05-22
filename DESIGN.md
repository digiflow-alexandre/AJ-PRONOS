# DESIGN.md — AJ Pronos

> Direction artistique pour AJ Pronos — service de conseil en paris sportifs.
> Générée le 2026-05-12. Pivot dark → light mode + retrait des mentions IA + nommage de Julien.
> Ce fichier guide l'implémentation visuelle du site Next.js. La maquette `variant-output/variant-aj-pronos-A.html` est la référence implémentation directe.

---

## 1. Atmosphère

AJ Pronos est un **cabinet de conseil en pari sportif** — pas une startup tech, pas un opérateur de paris. La direction artistique évoque un magazine sérieux, une revue éditoriale, un cabinet de conseil premium : fond crème chaud comme du papier journal, accents or sobres comme l'estampille d'une vieille édition, texte noir respirable, beaucoup d'air.

Le visiteur doit ressentir le sérieux et la rigueur dès l'arrivée. Pas de hype, pas de promesse de gain facile, pas d'animations agressives. Juste une méthode, deux experts (Alex + Julien) qui assument leur travail, et une transparence brutale sur les résultats (gains ET pertes affichés).

Tonalité visuelle : **éditorial premium**, plus proche de Substack premium ou The Athletic que d'un SaaS startup. Le grain papier subtil et les eyebrows en mono gold avec tiret renforcent l'identité magazine.

### Caractéristiques clés
- Fond crème chaud `#FAFAF7` — jamais pur blanc
- Texte noir profond `#0A0A0A` — jamais pur noir
- Accent or text-safe `#B8941F` (AA sur clair) — eyebrows, mots accentués, chiffres
- Or décoratif `#D4AF37` — badges, hover, accents non-texte
- CTA primaire : **noir solide**, jamais gold (plus premium en light mode)
- Typographie : Geist Sans (display + body) + Geist Mono (chiffres, eyebrows)
- Animations : calmes, 700-900ms ease-out, stagger 80-100ms
- Grain SVG noise 4% en `mix-blend-mode: multiply`
- Rythme vertical généreux : sections `padding-block: 5rem+`

---

## 2. Palette

### Tokens (CSS custom properties)

```css
:root {
  /* Fonds */
  --color-bg-base: #FAFAF7;
  --color-bg-elevated: #FFFFFF;
  --color-bg-deeper: #F5F4ED;
  --color-bg-warm: #FAF6E3;

  /* Bordures */
  --color-border-faint: rgba(10, 10, 10, 0.06);
  --color-border-soft: rgba(10, 10, 10, 0.1);
  --color-border-strong: rgba(10, 10, 10, 0.18);

  /* Texte */
  --color-text-primary: #0A0A0A;
  --color-text-muted: #525252;
  --color-text-dim: #737373;

  /* Or */
  --color-gold-500: #D4AF37;  /* badges, hover, décoratif */
  --color-gold-600: #B8941F;  /* texte AA sur clair */
  --color-gold-300: #E8C95A;  /* highlights subtils */
  --color-gold-glow: rgba(212, 175, 55, 0.2);

  /* CTA */
  --color-cta-bg: #0A0A0A;
  --color-cta-text: #FAFAF7;

  /* Fonctionnels */
  --color-success: #047857;  /* gains, AA sur clair */
  --color-danger: #B91C1C;   /* pertes, AA sur clair */
}
```

### Rôles

| Token | Hex | Rôle | Contrast |
|---|---|---|---|
| bg-base | #FAFAF7 | Fond dominant | — |
| bg-elevated | #FFFFFF | Cards, sections élevées | — |
| bg-deeper | #F5F4ED | Alternance sections | — |
| text-primary | #0A0A0A | Titres + body | 19.8:1 sur bg-base ✅ |
| text-muted | #525252 | Sous-titres | 7.7:1 sur bg-base ✅ |
| gold-600 | #B8941F | Texte accent | 4.6:1 sur bg-base ✅ AA |
| gold-500 | #D4AF37 | Badges, décoratif | 3:1 — AA large only |
| cta-bg | #0A0A0A | CTA primary fond | — |

---

## 3. Typographie

### Familles

| Rôle | Police | Fallback | Weights |
|---|---|---|---|
| Display + Body | Geist Sans | -apple-system, sans-serif | 400, 500, 600, 700 |
| Mono (chiffres, eyebrows) | Geist Mono | ui-monospace, monospace | 400, 500 |

Chargement via `next/font/google` dans `src/app/layout.tsx`.

### Hiérarchie

| Élément | Police | Taille | Weight | Line-height | Letter-spacing |
|---|---|---|---|---|---|
| Eyebrow | Mono | 0.75rem | 500 | 1 | 0.1em uppercase |
| H1 Hero | Sans | clamp(2.5rem, 6vw, 4.5rem) | 700 | 1.1 | -0.02em |
| H2 Section | Sans | clamp(2rem, 4vw, 3rem) | 700 | 1.15 | -0.02em |
| H3 Card | Sans | 1.25rem | 600 | 1.3 | -0.01em |
| Lead | Sans | 1.125rem | 400 | 1.7 | normal |
| Body | Sans | 1rem | 400 | 1.7 | normal |
| Button | Sans | 0.9375rem | 600 | 1 | 0.01em |
| Stats numbers | Mono | clamp(2rem, 4vw, 3rem) | 500 | 1 | -0.02em |
| Step numbers (01/02/03) | Mono | clamp(3rem, 5vw, 4.5rem) | 500 | 1 | -0.02em |

---

## 4. Signatures visuelles

### Eyebrow éditorial
Label mono gold-600 majuscule **précédé d'un tiret court gold**. Référence Substack premium / The Athletic.

```css
.eyebrow {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-gold-600);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.eyebrow::before { content: "— "; color: var(--color-gold-500); }
```

### Mot accentué dans le H1
Un mot clé du titre principal en em italic gold-600 avec underline gradient subtil. Donne le côté magazine.

Exemple : "Le pari sportif, **avec méthode.**" — "avec méthode" en em italic gold avec `::after` gradient.

### Numéros d'étape 01/02/03
Chiffres en Geist Mono 500 gold-600, alignés à côté du titre de chaque étape. Crée le rythme pédagogique.

### Portraits stylisés (médaillons)
Initiales **A** et **J** dans des médaillons circulaires 120px, fond radial gradient bg-elevated → bg-warm, initiale Geist Sans 700 gold-600. Évoque l'estampille / signature éditoriale. Remplaceront des photos quand fournies (traitement duotone noir/or).

### Grain papier
Texture SVG noise en `mix-blend-mode: multiply`, opacity 4%, fixed. Donne la matière papier sans alourdir.

### Cards
Bordure 1px border-faint, radius 16px, fond white pur, ombre douce. Hover : border gold-500 (alpha 0.4) + lift -2px + ombre renforcée.

---

## 5. Direction photographique

**Pas de photos** pour le moment. Le site fonctionne avec :
- Logo wordmark (placeholder texte : "AJ" gold-600 + "PRONOS" small caps gris)
- Médaillons portraits (initiales A/J)
- Icônes SVG inline pour les 4 cards méthode d'analyse
- Mock cards de paris (sport, équipes, cote, résultat) en tableau stylisé
- Pas de stock photo, pas de mockup dashboard

Quand le logo final sera fourni : remplacer placeholder texte. Si photos Alex/Julien fournies : duotone noir/or pour cohérence éditoriale.

---

## 6. Composants clés

### Hero
- Centré, eyebrow + H1 long + sub 3 lignes + 2 CTA + scroll indicator
- Fond crème + radial gradient or subtil au sommet `radial-gradient(ellipse at top, rgba(212,175,55,0.08), transparent 60%)`
- Grain papier overlay

### Cards (méthode d'analyse, pricing, etc.)
- `background: #FFFFFF`
- `border: 1px solid rgba(10,10,10,0.06)`
- `border-radius: 16px`
- `padding: 2rem`
- `box-shadow: 0 1px 2px rgba(10,10,10,0.04)`
- Hover : `border-color: rgba(212,175,55,0.4)`, `translateY(-2px)`, `box-shadow: 0 8px 32px rgba(10,10,10,0.06), 0 0 0 1px rgba(212,175,55,0.2)`
- `transition: 300ms ease`

### Navigation
- Sticky top, transparente sur fond crème, opaque au scroll (border-bottom apparaît)
- Logo gauche + liens centrés/droite + CTA "Commencer" (noir solide)
- Mobile : burger + drawer plein écran

### CTA primaire
```css
.btn-primary {
  background: var(--color-cta-bg);
  color: var(--color-cta-text);
  padding: 0.875rem 1.75rem;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(10,10,10,0.1), 0 4px 12px rgba(10,10,10,0.04);
  transition: all 200ms ease;
}
.btn-primary:hover { transform: scale(1.02); background: #000; }
.btn-primary:focus-visible { outline: 2px solid var(--color-gold-500); outline-offset: 2px; }
```

### CTA secondaire
- Background transparent, border 1px border-soft, color text-primary
- Hover : border gold-500

### FAQ accordéon
- Border-bottom border-soft entre items
- Chevron rotation 180° à l'ouverture
- Animation `max-height` 300ms ease

---

## 7. À éviter

- **JAMAIS** mentionner "IA", "algorithme", "système", "intelligence artificielle" dans le texte visible. Décision stratégique (positionnement humain + Julien). L'outil IA reste INTERNE.
- Pas de pur blanc `#FFF` pour les fonds — utiliser `#FAFAF7` (crème chaud)
- Pas de pur noir `#000` pour le texte — utiliser `#0A0A0A`
- Pas de CTA solide en or — réserver l'or aux accents, badges, hover ; le CTA primary est **noir**
- Pas d'esthétique "trading/Bloomberg/dashboard" — refusé par Alex
- Pas de promesse de gain dans le copy ("gagnez à tous les coups", "ROI garanti") — illégal + contraire au positionnement transparence
- Pas de bouton arrondi pill (`border-radius: 9999px`) — garder 8-12px
- Pas de gradients multicolores — palette stricte 3 couleurs (crème + noir + or)
- Pas de stock photo générique — abstract visuals seulement jusqu'au logo final

---

## 8. Références

| Type | Référence | Ce qu'on garde |
|---|---|---|
| Site SaaS | fusionai.framer.website | Structure home (hero, features, pricing, FAQ) |
| Site SaaS | heymessage.framer.ai | Ton chaleureux, animations subtiles |
| Site SaaS | setrex-saas-template.framer.ai | Toggle pricing mensuel/annuel |
| Magazine | Substack premium | Eyebrow mono avec tiret, ton éditorial |
| Magazine | The Athletic | Hiérarchie typographique, beaucoup d'air |
| Brand | Apple marketing | CTA noir solide en light mode |
| **Maquette HTML** | **variant-output/variant-aj-pronos-A.html** | **Référence implémentation directe — la home Next.js doit fidèlement reproduire cette maquette** |

---

## 9. Quick tokens (cheat sheet pour coder vite)

```
Background page    : bg-[#FAFAF7]   var(--color-bg-base)
Background card    : bg-white        var(--color-bg-elevated)
Background deeper  : bg-[#F5F4ED]   var(--color-bg-deeper)
Text primary       : text-[#0A0A0A] var(--color-text-primary)
Text muted         : text-[#525252] var(--color-text-muted)
Accent text        : text-[#B8941F] var(--color-gold-600)
Accent decorative  : bg-[#D4AF37]   var(--color-gold-500)
CTA primary        : bg-black text-[#FAFAF7]
Border faint       : border-black/[0.06]
Success            : text-[#047857] var(--color-success)
Danger             : text-[#B91C1C] var(--color-danger)

Display font       : Geist Sans (variable, weights 400/500/600/700)
Mono font          : Geist Mono (variable, weights 400/500)
Body line-height   : 1.7
Heading line-height: 1.1 → 1.3
Letter-spacing H   : -0.02em
Eyebrow letter-sp  : 0.1em uppercase
Stagger reveal     : 80-100ms
Reveal duration    : 700-900ms ease-out
Grain noise        : SVG, opacity 0.04, mix-blend multiply, fixed
```

---

## 10. Mapping maquette → Next.js

La maquette HTML monolithique (`variant-output/variant-aj-pronos-A.html`, ~52 KB) doit être découpée en composants Next.js :

```
src/
├── app/
│   ├── layout.tsx          # fonts, metadata, globals
│   ├── page.tsx            # home, compose les sections
│   └── globals.css         # tokens CSS + base resets
├── components/
│   ├── site/
│   │   ├── Nav.tsx
│   │   ├── Hero.tsx
│   │   ├── StatsBand.tsx
│   │   ├── Method.tsx          # 3 étapes "On analyse / Julien sélectionne / WhatsApp"
│   │   ├── WhoWeAre.tsx        # portraits Alex + Julien
│   │   ├── AnalysisMethod.tsx  # 4 cards compositions/value bets/h2h/forme
│   │   ├── Transparency.tsx    # ROI + liste 12 paris
│   │   ├── Pricing.tsx         # 4 packs + toggle mensuel/annuel
│   │   ├── Faq.tsx             # 6 questions accordéon
│   │   ├── CtaFinal.tsx
│   │   └── Footer.tsx
│   └── ui/                 # Shadcn components (button, accordion, etc.)
└── lib/
    └── pricing.ts          # données pricing single source of truth
```
