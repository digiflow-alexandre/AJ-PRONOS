import { useEffect, useState } from 'react';

import { FOOT_COMPETITIONS } from '@/constants/competitions';
import { supabase } from './supabase';
import { teamMatches } from './team-name-matching';
import { displayTeamName } from './team-display-names';

/**
 * Génère un RÉSUMÉ STATISTIQUE FACTUEL pour un pari foot. Ce n'est PAS
 * une analyse experte rédigée par Julien — c'est un texte assemblé
 * automatiquement à partir des stats disponibles en DB (team_stats +
 * team_head_to_head).
 *
 * Convention UX : à afficher avec un label clair "📊 Résumé statistique"
 * pour ne JAMAIS être confondu avec l'analyse de Julien (qui est dans le
 * champ `reasoning` du pari).
 *
 * Renvoie null si le sport n'est pas foot OU si on n'a pas assez de stats
 * pour produire quelque chose de pertinent (on évite de générer un texte
 * vide ou bidon).
 */

type StatRow = {
  team_name: string;
  team_logo: string | null;
  form: string | null;
  standing_rank: number | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  api_team_id: number;
  api_league_id: number;
};

type H2HRow = {
  team_low_id: number;
  team_high_id: number;
  score_low: number;
  score_high: number;
  match_date: string;
};

function formatFormString(form: string | null | undefined): string | null {
  if (!form) return null;
  // API renvoie "WWDLW" en EN → on traduit V/N/D pour FR
  return form
    .toUpperCase()
    .slice(-5)
    .split('')
    .map((c) => (c === 'W' ? 'V' : c === 'D' ? 'N' : c === 'L' ? 'D' : '-'))
    .reverse()
    .join('');
}

function rankSuffix(rank: number): string {
  if (rank === 1) return '1er';
  return `${rank}ème`;
}

export function useStatSummary(
  sport: 'foot' | 'tennis' | undefined,
  competitionLabel: string | undefined,
  teamHome: string | undefined,
  teamAway: string | undefined,
  result?: 'pending' | 'live' | 'win' | 'loss' | 'void',
  finalScore?: string,
  prediction?: string,
): { text: string | null; isLoading: boolean } {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sport !== 'foot' || !competitionLabel || !teamHome || !teamAway) {
      setSummary(null);
      setIsLoading(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      setIsLoading(true);

      // Lookup les 2 équipes dans team_stats (toutes ligues confondues
      // pour gérer les coupes / Champions League : on remonte les stats
      // de la ligue domestique de chaque équipe).
      const { data: allRows } = await supabase
        .from('team_stats')
        .select(
          'team_name, team_logo, form, standing_rank, played, wins, draws, losses, goals_for, goals_against, api_team_id, api_league_id',
        )
        .order('season', { ascending: false });
      if (ac.signal.aborted) return;
      const rows = (allRows ?? []) as StatRow[];

      // Détection compétition féminine : si oui, on cherche en priorité
      // les équipes avec le suffixe "W" ou "Women" (convention API-Football
      // pour les équipes nationales féminines : "Germany W", "Norway W").
      const isFeminine = /\b(féminin|feminin|women|wsl|nwsl|frauen|\(f\))\b/i.test(
        competitionLabel,
      );
      const findTeam = (query: string) => {
        if (isFeminine) {
          // 1. Match strict avec suffixe W/Women
          const withW = rows.find(
            (r) =>
              teamMatches(r.team_name.replace(/\s+(W|Women)\b/i, ''), query) &&
              /\s+(W|Women)\b/i.test(r.team_name),
          );
          if (withW) return withW;
        }
        // 2. Fallback : match standard (pour les clubs féminins type Lyon, PSG…
        //    qui ont souvent un suffixe (W) directement dans le nom)
        return rows.find((r) => teamMatches(r.team_name, query));
      };
      const home = findTeam(teamHome);
      const away = findTeam(teamAway);

      // Si on a aucune stat pour les 2 équipes → pas de résumé
      if (!home && !away) {
        setSummary(null);
        setIsLoading(false);
        return;
      }

      // H2H
      let h2hText: string | null = null;
      if (home && away) {
        const lowId = Math.min(home.api_team_id, away.api_team_id);
        const highId = Math.max(home.api_team_id, away.api_team_id);
        const { data: h2hRows } = await supabase
          .from('team_head_to_head')
          .select('team_low_id, team_high_id, score_low, score_high, match_date')
          .eq('team_low_id', lowId)
          .eq('team_high_id', highId)
          .order('match_date', { ascending: false })
          .limit(5);
        if (h2hRows && h2hRows.length > 0) {
          let homeWins = 0;
          let awayWins = 0;
          let draws = 0;
          for (const h of h2hRows as H2HRow[]) {
            const homeIsLow = home.api_team_id === h.team_low_id;
            const sh = homeIsLow ? h.score_low : h.score_high;
            const sa = homeIsLow ? h.score_high : h.score_low;
            if (sh > sa) homeWins++;
            else if (sa > sh) awayWins++;
            else draws++;
          }
          const n = h2hRows.length;
          if (homeWins > awayWins) {
            h2hText = `H2H sur ${n} dernières confrontations : ${homeWins} victoire${homeWins > 1 ? 's' : ''} ${displayTeamName(teamHome)}, ${awayWins} ${displayTeamName(teamAway)}, ${draws} nul${draws > 1 ? 's' : ''}.`;
          } else if (awayWins > homeWins) {
            h2hText = `H2H sur ${n} dernières confrontations : ${awayWins} victoire${awayWins > 1 ? 's' : ''} ${displayTeamName(teamAway)}, ${homeWins} ${displayTeamName(teamHome)}, ${draws} nul${draws > 1 ? 's' : ''}.`;
          } else {
            h2hText = `H2H sur ${n} dernières : équilibré (${homeWins}-${draws}-${awayWins}).`;
          }
        }
      }

      // Compétition (pour contextualiser "1er Ligue 1")
      const baseLabel = competitionLabel.split('·')[0].trim();
      const comp = FOOT_COMPETITIONS.find(
        (c) => c.label.toLowerCase() === baseLabel.toLowerCase(),
      );
      const compShort = comp?.label ?? baseLabel;

      // === Compose le texte ===
      const parts: string[] = [];

      // Phrase 1 : positions + forme
      if (home && home.standing_rank) {
        const form = formatFormString(home.form);
        parts.push(
          `${displayTeamName(teamHome)} est ${rankSuffix(home.standing_rank)} en ${compShort}${form ? ` (forme : ${form})` : ''}.`,
        );
      } else {
        parts.push(`Stats ${displayTeamName(teamHome)} non disponibles.`);
      }
      if (away && away.standing_rank) {
        const form = formatFormString(away.form);
        parts.push(
          `${displayTeamName(teamAway)} est ${rankSuffix(away.standing_rank)}${form ? ` (forme : ${form})` : ''}.`,
        );
      } else {
        parts.push(`Stats ${displayTeamName(teamAway)} non disponibles.`);
      }

      // Phrase 2 : moyennes offensives/défensives
      if (home && home.played && home.played > 0) {
        const goalsFor = ((home.goals_for ?? 0) / home.played).toFixed(2);
        const goalsAgainst = ((home.goals_against ?? 0) / home.played).toFixed(2);
        parts.push(
          `${displayTeamName(teamHome)} marque ${goalsFor} buts/match et en concède ${goalsAgainst}.`,
        );
      }
      if (away && away.played && away.played > 0) {
        const goalsFor = ((away.goals_for ?? 0) / away.played).toFixed(2);
        const goalsAgainst = ((away.goals_against ?? 0) / away.played).toFixed(2);
        parts.push(
          `${displayTeamName(teamAway)} marque ${goalsFor} buts/match et en concède ${goalsAgainst}.`,
        );
      }

      // Phrase 3 : H2H si dispo
      if (h2hText) parts.push(h2hText);

      // Phrase 4 : pronostic + résultat (si résolu)
      if (prediction) {
        const predLine = result === 'win'
          ? `Pronostic ${prediction} → ✅ Gagné${finalScore ? ` (${finalScore})` : ''}.`
          : result === 'loss'
            ? `Pronostic ${prediction} → ❌ Perdu${finalScore ? ` (${finalScore})` : ''}.`
            : result === 'void'
              ? `Pronostic ${prediction} → ⊘ Annulé.`
              : null;
        if (predLine) parts.push(predLine);
      }

      setSummary(parts.length > 0 ? parts.join(' ') : null);
      setIsLoading(false);
    })();
    return () => {
      ac.abort();
    };
  }, [sport, competitionLabel, teamHome, teamAway, result, finalScore, prediction]);

  return { text: summary, isLoading };
}
