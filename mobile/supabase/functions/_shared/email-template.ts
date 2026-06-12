// AJ Pronos — Coque commune des emails transactionnels.
//
// Style premium : header noir + logo or AJ Pronos, body crème, CTA noir
// avec liseré or, footer 18+ joueurs-info-service.fr.
//
// Chaque email fournit juste son `content` HTML et la fonction renvoie
// la version complète prête à envoyer via Resend.

const LOGO_URL = 'https://ajpronos.fr/aj-pronos-logo-white.png';
const SITE_URL = 'https://ajpronos.fr';

export type EmailVariant = 'default' | 'danger';

/**
 * Bloc "Pack card" — la carte crème avec liseré or qui met en avant
 * une info clé (pack souscrit, montant, statut…).
 */
export function packCard(opts: {
  eyebrow: string;
  title: string;
  meta?: string;
  /** Force la couleur du titre (par défaut or, peut être rouge pour erreur). */
  titleColor?: string;
}): string {
  return `
    <div style="margin:0 32px 24px;background:linear-gradient(135deg,#FAFAF7,#F5F4ED);border:1px solid #E5E1D4;border-radius:14px;padding:22px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#E8C95A,#D4AF37);"></div>
      <div style="font-size:10px;letter-spacing:1.2px;text-transform:uppercase;font-weight:800;color:#999;margin-bottom:6px;">${opts.eyebrow}</div>
      <p style="font-size:24px;font-weight:900;color:${opts.titleColor ?? '#B8941F'};letter-spacing:-0.3px;margin:0;">${opts.title}</p>
      ${opts.meta ? `<p style="font-size:13px;color:#666;margin:8px 0 0;">${opts.meta}</p>` : ''}
    </div>
  `;
}

/**
 * Bloc "Steps" — liste à puces numérotées avec cercles noir/or.
 */
export function stepsList(steps: Array<{ title: string; desc: string; num?: string }>): string {
  const items = steps
    .map((s, i) => {
      const num = s.num ?? String(i + 1);
      return `
        <li style="display:flex;gap:14px;padding:14px 0;border-bottom:1px solid #f0f0f0;">
          <div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:#0A0A0A;color:#E8C95A;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;">${num}</div>
          <div style="flex:1;padding-top:3px;">
            <p style="font-weight:700;font-size:14px;color:#0A0A0A;margin:0 0 2px;">${s.title}</p>
            <p style="font-size:13px;color:#666;line-height:1.5;margin:0;">${s.desc}</p>
          </div>
        </li>
      `;
    })
    .join('');
  return `<ul style="padding:0 32px 24px;margin:0;list-style:none;">${items}</ul>`;
}

/**
 * Bloc "Section title" — eyebrow gris au-dessus d'une liste de steps.
 */
export function sectionTitle(label: string): string {
  return `<p style="padding:0 32px 12px;font-size:13px;letter-spacing:0.8px;text-transform:uppercase;font-weight:800;color:#999;margin:0;">${label}</p>`;
}

/**
 * Bloc "Info card" coloré — pour les alertes / suggestions / confirmations.
 * Variant: 'success' (vert), 'warning' (jaune), 'neutral' (gris), 'gold' (or).
 */
export function infoCard(opts: {
  variant: 'success' | 'warning' | 'neutral' | 'gold';
  html: string;
}): string {
  const palette = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', leftBorder: '#16A34A', text: '#14532D' },
    warning: { bg: '#FFFBEB', border: '#FCD34D', leftBorder: '#F59E0B', text: '#78350F' },
    neutral: { bg: '#FAFAF7', border: '#e5e1d4', leftBorder: '#999', text: '#666' },
    gold: { bg: '#FAFAF7', border: '#e5e1d4', leftBorder: '#B8941F', text: '#444' },
  }[opts.variant];
  return `
    <div style="margin:0 32px 24px;background:${palette.bg};border:1px solid ${palette.border};border-left:4px solid ${palette.leftBorder};border-radius:8px;padding:16px 18px;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:${palette.text};">${opts.html}</p>
    </div>
  `;
}

/**
 * Bloc CTA — bouton principal + lien secondaire.
 */
export function cta(opts: {
  label: string;
  url: string;
  variant?: EmailVariant;
  secondaryText?: string;
  secondaryHref?: string;
}): string {
  const accentColor = opts.variant === 'danger' ? '#DC2626' : '#B8941F';
  return `
    <div style="padding:0 32px 28px;text-align:center;">
      <a href="${opts.url}" style="display:inline-block;background:#0A0A0A;color:#FAFAF7;padding:15px 32px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.3px;box-shadow:0 0 0 2px ${accentColor} inset;">${opts.label} →</a>
      ${opts.secondaryText && opts.secondaryHref ? `
        <p style="margin:14px 0 0;font-size:13px;color:#999;">
          ${opts.secondaryText} <a href="${opts.secondaryHref}" style="color:#B8941F;font-weight:700;text-decoration:none;">${opts.secondaryHref.replace('mailto:', '')}</a>
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Génère un email complet. Le `content` HTML est ce qui est injecté
 * entre le header et le footer.
 */
export function buildEmail(opts: {
  variant?: EmailVariant;
  eyebrow: string;
  title: string;
  titleAccent?: string;
  lead: string;
  /** HTML libre injecté après le lead (pack card, steps, etc.) */
  content?: string;
  signoff?: string;
}): string {
  const variant = opts.variant ?? 'default';
  const headerGradient = variant === 'danger'
    ? 'radial-gradient(circle, rgba(220,38,38,0.3), transparent 70%)'
    : 'radial-gradient(circle, rgba(232,201,90,0.22), transparent 70%)';
  const eyebrowColor = variant === 'danger' ? '#DC2626' : '#B8941F';
  const accentReplacement = opts.titleAccent
    ? opts.title.replace(opts.titleAccent, `<em style="color:#B8941F;font-style:normal;">${opts.titleAccent}</em>`)
    : opts.title;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;color:#0A0A0A;">
  <!-- Header -->
  <div style="background:#0A0A0A;padding:28px 32px 24px;text-align:center;position:relative;overflow:hidden;">
    <div style="position:absolute;top:-100px;right:-100px;width:280px;height:280px;background:${headerGradient};pointer-events:none;"></div>
    <img src="${LOGO_URL}" alt="AJ Pronos" width="56" style="display:inline-block;width:56px;height:auto;position:relative;z-index:1;" />
  </div>

  <!-- Eyebrow + Title + Lead -->
  <div style="padding:28px 32px 0;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;font-weight:800;color:${eyebrowColor};">— ${opts.eyebrow}</div>
  <h1 style="padding:8px 32px 16px;font-size:28px;line-height:1.15;font-weight:900;letter-spacing:-0.5px;color:#0A0A0A;margin:0;">${accentReplacement}</h1>
  <p style="padding:0 32px 24px;font-size:15px;line-height:1.6;color:#4a4a4a;margin:0;">${opts.lead}</p>

  ${opts.content ?? ''}

  ${opts.signoff ? `<p style="padding:0 32px 24px;font-size:14px;color:#666;line-height:1.6;">${opts.signoff}</p>` : ''}

  <!-- Footer -->
  <div style="background:#FAFAF7;padding:24px 32px;border-top:1px solid #eee;">
    <div style="text-align:center;margin-bottom:14px;font-size:11px;color:#aaa;">
      <a href="${SITE_URL}" style="color:#888;text-decoration:none;margin:0 6px;">Site</a> ·
      <a href="${SITE_URL}/compte" style="color:#888;text-decoration:none;margin:0 6px;">Mon compte</a> ·
      <a href="${SITE_URL}/cgv" style="color:#888;text-decoration:none;margin:0 6px;">CGV</a> ·
      <a href="${SITE_URL}/confidentialite" style="color:#888;text-decoration:none;margin:0 6px;">Confidentialité</a>
    </div>
    <p style="margin:0;font-size:10px;line-height:1.6;color:#999;text-align:center;">
      <strong style="color:#B8941F;">+18 ans uniquement.</strong> Les paris sportifs comportent des risques d'addiction et de pertes financières.<br/>
      Joueurs Info Service : <a href="tel:0974751313" style="color:#B8941F;text-decoration:none;">09 74 75 13 13</a> ·
      <a href="https://joueurs-info-service.fr" style="color:#B8941F;text-decoration:none;">joueurs-info-service.fr</a>
    </p>
  </div>
</div>
</body>
</html>`;
}
