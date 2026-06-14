import { useEffect, useState } from 'react';

import { supabase } from './supabase';

export type TennisCompetition = {
  /** competition_id côté matches (= tournament_key API-Tennis, ex "2646") */
  id: string;
  /** Label enrichi désambiguïsé : "Berlin · WTA", "Halle · ATP doubles"… */
  label: string;
  /** Label brut du tournoi sans suffixe ("Berlin", "Halle") — utile en V1.5. */
  rawLabel: string;
  /** Surface du tournoi quand connue (utile pour les sous-labels) */
  surface: 'hard' | 'clay' | 'grass' | 'hard_indoor' | 'carpet' | null;
  /** Catégorie déduite via api_league_id (event_type_key tennis) */
  category: 'ATP' | 'WTA' | 'ATP_DOUBLES' | 'WTA_DOUBLES' | 'OTHER';
};

// Mapping event_type_key API-Tennis (= api_league_id en DB) → catégorie + suffixe
const LEAGUE_CATEGORY: Record<
  number,
  { category: TennisCompetition['category']; suffix: string }
> = {
  265: { category: 'ATP', suffix: 'ATP' },
  266: { category: 'WTA', suffix: 'WTA' },
  267: { category: 'ATP_DOUBLES', suffix: 'ATP doubles' },
  268: { category: 'WTA_DOUBLES', suffix: 'WTA doubles' },
};

/**
 * Liste distincte des tournois tennis avec des matchs à venir.
 * Permet au picker admin de filtrer les matchs par tournoi (comme on le
 * fait pour les compétitions foot via FOOT_COMPETITIONS).
 *
 * Source : table `matches` filtrée sport='tennis' + matchs futurs.
 * Dédup par competition_id (= tournament_key API-Tennis). Le label est
 * enrichi du suffixe catégorie (ATP / WTA / doubles) car un même nom de
 * tournoi ("Berlin") peut exister en plusieurs versions (ATP femmes, WTA
 * hommes, doubles…) — sans suffixe le picker afficherait des doublons.
 */
export function useTennisCompetitions(): TennisCompetition[] {
  const [comps, setComps] = useState<TennisCompetition[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('matches')
        .select('competition_id, competition_label, surface, api_league_id')
        .eq('sport', 'tennis')
        .gte('match_start_at', new Date().toISOString());

      if (cancelled || !data) return;

      const seen = new Map<string, TennisCompetition>();
      for (const row of data as Array<{
        competition_id: string;
        competition_label: string;
        surface: TennisCompetition['surface'];
        api_league_id: number | null;
      }>) {
        if (!row.competition_id) continue;
        if (seen.has(row.competition_id)) continue;
        const cat = row.api_league_id != null
          ? LEAGUE_CATEGORY[row.api_league_id] ?? { category: 'OTHER' as const, suffix: '' }
          : { category: 'OTHER' as const, suffix: '' };
        const label = cat.suffix
          ? `${row.competition_label} · ${cat.suffix}`
          : row.competition_label;
        seen.set(row.competition_id, {
          id: row.competition_id,
          label,
          rawLabel: row.competition_label,
          surface: row.surface ?? null,
          category: cat.category,
        });
      }
      // Tri : par nom brut (Berlin avant Halle), puis ATP avant WTA, simples avant doubles
      const order: Record<TennisCompetition['category'], number> = {
        ATP: 0,
        WTA: 1,
        ATP_DOUBLES: 2,
        WTA_DOUBLES: 3,
        OTHER: 4,
      };
      const list = Array.from(seen.values()).sort((a, b) => {
        const byName = a.rawLabel.localeCompare(b.rawLabel, 'fr');
        if (byName !== 0) return byName;
        return order[a.category] - order[b.category];
      });
      setComps(list);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return comps;
}
