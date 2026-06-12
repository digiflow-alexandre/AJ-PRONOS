-- AJ Pronos — Migration 014 : activer Realtime sur published_bets
--
-- Sans ça, le hook usePublishedBets fait son fetch initial au mount mais ne
-- reçoit jamais les events postgres_changes → un pari fraîchement publié
-- depuis l'admin ne s'affiche pas dans la liste sans remount manuel.

alter publication supabase_realtime add table public.published_bets;
alter publication supabase_realtime add table public.published_bet_selections;
