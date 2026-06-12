-- AJ Pronos — Migration 013 : activer Realtime sur user_bets
--
-- Sans cette ligne, le hook useUserBets s'abonne au channel postgres_changes
-- mais ne reçoit jamais d'event quand on insert un user_bet → les autres
-- écrans (Accueil, Carnet) ne se rafraîchissent pas tant qu'on ne remount
-- pas le composant.

alter publication supabase_realtime add table public.user_bets;
