// AJ Pronos — Edge Function : enrich-tennis-players-wikidata
//
// Complète les bio statiques des joueurs tennis (handedness, height_cm,
// weight_kg, turned_pro_year) que l'API api-tennis.com ne fournit pas,
// en interrogeant Wikidata via SPARQL.
//
// Stratégie de matching :
//   - Recherche par nom de famille extrait de full_name
//   - Filtre instance_of=human + sport=tennis
//   - Prend le 1er résultat (rang Q par défaut → joueur le plus notable)
//
// Conso : 1 call SPARQL par joueur. Top 200 ATP+WTA = 400 calls.
//   Wikidata est gratuit (pas de rate-limit strict ; on espace en batch
//   de 10 parallèles pour rester courtois et tenir le timeout Supabase).
//
// Cron : monthly (les bio évoluent peu). Voir migration 027.
//
// Déploiement :
//   supabase functions deploy enrich-tennis-players-wikidata --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

// On utilise l'API REST MediaWiki (wbsearchentities + wbgetentities) plutôt
// que SPARQL : 50-100× plus rapide (~100ms vs 5-10s par query SPARQL).
const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';

// QID Wikidata → valeur normalisée
const HANDEDNESS_MAP: Record<string, 'left' | 'right' | 'ambidextrous'> = {
  Q5165: 'left',
  Q789447: 'right',
  Q1041245: 'ambidextrous',
};

// TTL : on rafraîchit un joueur tous les 30 jours (les bio évoluent peu)
const TTL_DAYS = 30;

// Joueurs traités par RUN. Avec wbsearchentities+wbgetentities (rapide, ~200ms
// par joueur), on peut monter à 100 sans risque de timeout.
const PLAYERS_PER_RUN = 100;

// Top N par circuit (limite l'univers de joueurs candidat à enrich)
const TOP_N = 200;

type WikidataEnrichment = {
  qid: string;
  height_cm: number | null;
  weight_kg: number | null;
  handedness: 'left' | 'right' | 'ambidextrous' | null;
  turned_pro_year: number | null;
};

const UA = 'AJ-Pronos/1.0 (contact@ajpronos.fr)';

type ClaimValue = { mainsnak?: { datavalue?: { value: unknown } } };
type EntityClaims = Record<string, ClaimValue[]>;

async function searchEntity(name: string): Promise<string | null> {
  // wbsearchentities : recherche par label, retourne les top candidats (très rapide)
  const url = `${WIKIDATA_API}?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=5&format=json&origin=*`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const json = await res.json();
    const candidates = (json.search ?? []) as Array<{ id: string; description?: string }>;
    if (candidates.length === 0) return null;
    // Préfère le 1er candidat dont la description mentionne "tennis"
    const tennisMatch = candidates.find((c) =>
      c.description?.toLowerCase().includes('tennis'),
    );
    return (tennisMatch ?? candidates[0]).id;
  } catch {
    return null;
  }
}

async function getEntity(qid: string): Promise<EntityClaims | null> {
  // wbgetentities : récupère les claims (P2048 height, P741 handedness, etc.)
  const url = `${WIKIDATA_API}?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.entities?.[qid]?.claims ?? null) as EntityClaims | null;
  } catch {
    return null;
  }
}

function readQuantityCm(claims: EntityClaims, prop: string): number | null {
  const value = claims[prop]?.[0]?.mainsnak?.datavalue?.value as
    | { amount?: string; unit?: string }
    | undefined;
  if (!value?.amount) return null;
  const amount = parseFloat(value.amount);
  if (!Number.isFinite(amount)) return null;
  // Unit Wikidata "Q174728" = cm, "Q11573" = m, "Q39369" = kg
  if (value.unit?.endsWith('Q11573')) return Math.round(amount * 100);
  return Math.round(amount);
}

function readQid(claims: EntityClaims, prop: string): string | null {
  const value = claims[prop]?.[0]?.mainsnak?.datavalue?.value as
    | { id?: string }
    | undefined;
  return value?.id ?? null;
}

function readYear(claims: EntityClaims, prop: string): number | null {
  const value = claims[prop]?.[0]?.mainsnak?.datavalue?.value as
    | { time?: string }
    | undefined;
  // Format Wikidata : "+2003-00-00T00:00:00Z"
  const time = value?.time;
  if (!time) return null;
  const match = time.match(/^[+-]?(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchWikidataPlayer(fullName: string): Promise<WikidataEnrichment | null> {
  const cleanName = fullName.trim();
  if (cleanName.length < 3) return null;
  const qid = await searchEntity(cleanName);
  if (!qid) return null;
  const claims = await getEntity(qid);
  if (!claims) return null;

  const handQid = readQid(claims, 'P741'); // playing hand (préféré au handedness P552)
  const handedness = handQid ? HANDEDNESS_MAP[handQid] ?? null : null;
  return {
    qid,
    height_cm: readQuantityCm(claims, 'P2048'),
    weight_kg: readQuantityCm(claims, 'P2067'),
    handedness,
    turned_pro_year: readYear(claims, 'P2031'),
  };
}

serve(async () => {
  const cutoff = new Date(Date.now() - TTL_DAYS * 86400 * 1000).toISOString();

  // Sélectionne les top joueurs ATP/WTA pas encore enrichis (ou TTL expiré).
  // On limite à PLAYERS_PER_RUN pour rester sous les limites worker Edge.
  // Plusieurs runs successifs couvriront l'intégralité du top 200.
  const { data: candidates } = await supabase
    .from('tennis_players')
    .select('id, full_name, name, wikidata_synced_at, ranking')
    .in('circuit', ['ATP', 'WTA'])
    .not('ranking', 'is', null)
    .lte('ranking', TOP_N)
    .or(`wikidata_synced_at.is.null,wikidata_synced_at.lt.${cutoff}`)
    .order('ranking', { ascending: true })
    .limit(PLAYERS_PER_RUN);

  const players = candidates ?? [];
  if (players.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, message: 'no players to enrich', enriched: 0 }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  const CONCURRENCY = 8;
  let enriched = 0;
  let notFound = 0;
  let dbErrors = 0;
  const now = new Date().toISOString();

  for (let i = 0; i < players.length; i += CONCURRENCY) {
    const batch = players.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (p) => {
        const data = await fetchWikidataPlayer(p.full_name || p.name);
        if (!data) {
          // Marque qu'on a tenté pour ne pas re-tenter avant TTL
          await supabase
            .from('tennis_players')
            .update({ wikidata_synced_at: now })
            .eq('id', p.id);
          return { ok: false as const, notFound: true };
        }
        const { error } = await supabase
          .from('tennis_players')
          .update({
            wikidata_qid: data.qid,
            handedness: data.handedness,
            height_cm: data.height_cm,
            weight_kg: data.weight_kg,
            turned_pro_year: data.turned_pro_year,
            wikidata_synced_at: now,
          })
          .eq('id', p.id);
        return { ok: !error, dbError: !!error, notFound: false };
      }),
    );
    for (const r of results) {
      if (r.ok) enriched++;
      else if (r.dbError) dbErrors++;
      else notFound++;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      total: players.length,
      enriched,
      notFound,
      dbErrors,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
