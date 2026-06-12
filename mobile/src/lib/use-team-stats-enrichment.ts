import { useEffect, useState } from 'react';

import { supabase } from './supabase';
import { teamMatches } from './team-name-matching';
import type { FormSlot } from '@/types/prono';

type TeamStatsRow = {
  team_name: string;
  team_logo: string | null;
  form: string | null;
  standing_rank: number | null;
  standing_points: number | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
};

export type TeamEnrichment = {
  homePosition?: number;
  awayPosition?: number;
  teamHomeForm?: FormSlot[];
  teamAwayForm?: FormSlot[];
  /** Logos remontés depuis team_stats si l'admin a oublié de les coller. */
  homeLogo?: string;
  awayLogo?: string;
};

/**
 * Parse une chaîne API-Football "WWDLW" en FormSlot[]. Retourne les 5
 * derniers résultats du plus récent au plus ancien. Renvoie undefined
 * si la chaîne est vide ou invalide.
 */
function parseForm(form: string | null | undefined): FormSlot[] | undefined {
  if (!form) return undefined;
  const slots: FormSlot[] = [];
  // API-Football donne la forme du plus ancien au plus récent. On inverse
  // pour avoir les 5 derniers du plus récent au plus ancien (convention
  // de notre UI).
  const chars = form.toUpperCase().split('').reverse().slice(0, 5);
  for (const ch of chars) {
    if (ch === 'W' || ch === 'D' || ch === 'L') slots.push(ch);
  }
  return slots.length > 0 ? slots : undefined;
}

/**
 * Enrichit un prono foot avec la position, la forme et le logo des 2
 * équipes en lookant up dans `team_stats` (alimenté par l'Edge Function
 * refresh-team-stats toutes les 6h).
 *
 * Utile pour les paris publiés à la main par Julien sans MatchPicker —
 * leur `prono.stats` est null mais on peut quand même peupler position
 * + forme à la volée pour le hero et le Stats Center.
 *
 * Retourne `{}` si pas de match en DB (la UI fallback alors sur prono.stats
 * tel qu'il est).
 */
export function useTeamStatsEnrichment(
  competitionLabel: string | undefined,
  teamHome: string | undefined,
  teamAway: string | undefined,
  sport: 'foot' | 'tennis' | undefined,
): TeamEnrichment {
  const [enrichment, setEnrichment] = useState<TeamEnrichment>({});

  useEffect(() => {
    if (sport !== 'foot' || !competitionLabel || !teamHome || !teamAway) {
      setEnrichment({});
      return;
    }
    const ac = new AbortController();
    (async () => {
      // On cherche dans toutes les ligues (pas juste celle du pari) :
      // une coupe nationale n'a pas de classement, mais on peut retrouver
      // l'équipe via sa ligue domestique pour récupérer position + form.
      const { data, error } = await supabase
        .from('team_stats')
        .select(
          'team_name, team_logo, form, standing_rank, standing_points, played, wins, draws, losses, goals_for, goals_against',
        )
        .order('season', { ascending: false });
      if (ac.signal.aborted) return;
      if (error || !data) {
        setEnrichment({});
        return;
      }
      const rows = data as TeamStatsRow[];
      // Détection compétition féminine : pour les équipes nationales,
      // API-Football suffixe avec "W" (Germany W, Norway W). Pour les
      // clubs féminins type "Lyon (W)" ou "Bayern Frauen", c'est inclus
      // directement dans le nom — le matcher standard suffit.
      const isFeminine = /\b(féminin|feminin|women|wsl|nwsl|frauen|\(f\))\b/i.test(
        competitionLabel,
      );
      const findTeam = (query: string) => {
        if (isFeminine) {
          const withW = rows.find(
            (r) =>
              teamMatches(r.team_name.replace(/\s+(W|Women)\b/i, ''), query) &&
              /\s+(W|Women)\b/i.test(r.team_name),
          );
          if (withW) return withW;
        }
        return rows.find((r) => teamMatches(r.team_name, query));
      };
      const home = findTeam(teamHome);
      const away = findTeam(teamAway);
      setEnrichment({
        homePosition: home?.standing_rank ?? undefined,
        awayPosition: away?.standing_rank ?? undefined,
        teamHomeForm: parseForm(home?.form),
        teamAwayForm: parseForm(away?.form),
        homeLogo: home?.team_logo ?? undefined,
        awayLogo: away?.team_logo ?? undefined,
      });
    })();
    return () => {
      ac.abort();
    };
  }, [competitionLabel, teamHome, teamAway, sport]);

  return enrichment;
}
