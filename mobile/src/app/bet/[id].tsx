/**
 * Route racine /bet/[id] — wrapper de /(app)/pronos/[id].
 *
 * Pourquoi : quand l'utilisateur ouvre une fiche prono depuis l'Accueil
 * (= tab Index), Expo Router push /(app)/pronos/[id] dans la sous-stack
 * du tab Pronos. Conséquence : taper sur l'onglet Pronos restaure
 * automatiquement cette fiche au lieu d'afficher la liste, parce que
 * la stack Pronos garde [id] en sommet.
 *
 * En passant par /bet/[id] (route au niveau Stack racine, pas dans le
 * tab Pronos), la fiche s'empile au-dessus des tabs sans polluer la
 * sous-stack Pronos. Au retour, on retombe simplement sur le tab actif
 * précédent (Accueil) et l'onglet Pronos reste sur sa liste.
 */
export { default } from '@/app/(app)/pronos/[id]';
