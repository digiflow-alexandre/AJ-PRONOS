import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { supabase } from './supabase';

const BUCKET = 'bet-screenshots';

/**
 * Upload une capture d'écran bookmaker dans le bucket Supabase Storage.
 * Compresse l'image (max 1200px, qualité 0.7) avant upload pour réduire
 * la bande passante et le stockage.
 *
 * @param localUri URI locale de l'image (depuis expo-image-picker)
 * @returns L'URL publique de l'image uploadée, ou null si échec
 */
export async function uploadBookmakerScreenshot(
  localUri: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    // 1) Compression / resize : max 1200px sur le côté le plus long
    const manipulated = await manipulateAsync(
      localUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: SaveFormat.JPEG },
    );

    // 2) Lecture du fichier en bytes (via fetch sur le local URI)
    const response = await fetch(manipulated.uri);
    const arrayBuffer = await response.arrayBuffer();

    // 3) Génère un nom unique
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 10);
    const filename = `${timestamp}-${random}.jpg`;

    // 4) Upload sur Storage
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(filename, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadErr) {
      return { url: null, error: uploadErr.message };
    }

    // 5) Récupère l'URL publique
    const { data: publicData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    return { url: publicData.publicUrl, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    return { url: null, error: msg };
  }
}

/**
 * Supprime une capture d'écran du bucket Storage à partir de son URL
 * publique. Utilisé quand l'admin remplace ou retire une capture.
 */
export async function deleteBookmakerScreenshot(
  publicUrl: string,
): Promise<{ error: string | null }> {
  try {
    // Extrait le nom de fichier depuis l'URL publique
    // Format typique : https://xxx.supabase.co/storage/v1/object/public/bet-screenshots/FILE.jpg
    const match = publicUrl.match(/\/bet-screenshots\/(.+)$/);
    if (!match) return { error: 'URL invalide' };
    const filename = match[1];

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([filename]);

    if (error) return { error: error.message };
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    return { error: msg };
  }
}
