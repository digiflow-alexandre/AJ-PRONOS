import { useEffect, useState } from 'react';

import { supabase } from './supabase';

/**
 * Récupère la liste des équipes foot connues depuis team_stats (alimenté
 * par l'Edge Function refresh-team-stats). Dédupliqué par nom.
 *
 * Utilisé par le picker admin quand on saisit un pari sur une compétition
 * sans liste hardcodée d'équipes (amicaux, compétitions exotiques...) —
 * on propose alors un autocomplete sur toutes les équipes vues par
 * API-Football.
 */
export function useFootTeamsFromDb(): {
  teams: { name: string; logo: string | null }[];
  isLoading: boolean;
} {
  const [teams, setTeams] = useState<{ name: string; logo: string | null }[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      const { data } = await supabase
        .from('team_stats')
        .select('team_name, team_logo')
        .order('team_name', { ascending: true });
      if (ac.signal.aborted || !data) {
        setIsLoading(false);
        return;
      }
      // Dédupe par nom (une équipe peut être dans plusieurs ligues)
      const seen = new Set<string>();
      const unique: { name: string; logo: string | null }[] = [];
      for (const row of data as { team_name: string; team_logo: string | null }[]) {
        if (seen.has(row.team_name)) continue;
        seen.add(row.team_name);
        unique.push({ name: row.team_name, logo: row.team_logo });
      }
      setTeams(unique);
      setIsLoading(false);
    })();
    return () => {
      ac.abort();
    };
  }, []);

  return { teams, isLoading };
}
