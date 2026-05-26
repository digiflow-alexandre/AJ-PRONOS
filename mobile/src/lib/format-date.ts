/**
 * Helpers de formatage de date en français pour AJ Pronos.
 * Volontairement simples — pas d'Intl ICU heavy.
 */

export function formatHour(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

const DAYS_FR = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
];

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

/** Retourne 'today' | 'tomorrow' | 'later' selon la date ISO. */
export function getDayBucket(iso: string): 'today' | 'tomorrow' | 'later' {
  const target = new Date(iso);
  const now = new Date();
  const todayDateStr = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateStr = tomorrow.toDateString();

  const targetDateStr = target.toDateString();
  if (targetDateStr === todayDateStr) return 'today';
  if (targetDateStr === tomorrowDateStr) return 'tomorrow';
  return 'later';
}
