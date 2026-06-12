import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import {
  deleteBookmakerScreenshot,
  uploadBookmakerScreenshot,
} from '@/lib/upload-screenshot';

/**
 * Permet à l'admin (Julien) d'uploader la capture d'écran du ticket
 * bookmaker pour un prono. Affiche une preview une fois uploadée.
 *
 * - tap "Ajouter" → ActionSheet (photothèque / appareil photo)
 * - upload automatique vers Supabase Storage avec compression
 * - tap "Retirer" → supprime le fichier du Storage + reset l'URL
 *
 * Rappel anonymisation : Julien doit flouter / masquer ses infos perso
 * (solde, username) AVANT de prendre la capture.
 */
export function ScreenshotPicker({
  value,
  onChange,
}: {
  /** URL publique du screenshot uploadé (ou undefined si pas encore). */
  value?: string;
  onChange: (url: string | undefined) => void;
}) {
  const c = useThemeColors();
  const [uploading, setUploading] = useState(false);
  // Ratio intrinsic de l'image (width/height) — détecté au chargement
  // pour adapter dynamiquement le container (au lieu d'imposer 9:16 fixe).
  const [imageRatio, setImageRatio] = useState<number | null>(null);

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Accès refusé',
        'Active l’accès à tes photos dans les Réglages iOS pour pouvoir ajouter une capture.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await handleUpload(result.assets[0].uri);
    }
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Accès refusé',
        'Active l’accès à la caméra dans les Réglages iOS.',
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await handleUpload(result.assets[0].uri);
    }
  }

  async function handleUpload(localUri: string) {
    setUploading(true);
    const { url, error } = await uploadBookmakerScreenshot(localUri);
    setUploading(false);
    if (error || !url) {
      Alert.alert('Upload échoué', error ?? 'Erreur inconnue');
      return;
    }
    // Si une capture précédente existait, on la supprime
    if (value) {
      await deleteBookmakerScreenshot(value);
    }
    onChange(url);
  }

  async function handleRemove() {
    Alert.alert(
      'Retirer cette capture ?',
      'L’image sera supprimée du serveur et le prono publié sans capture.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            if (value) {
              await deleteBookmakerScreenshot(value);
            }
            onChange(undefined);
          },
        },
      ],
    );
  }

  function openSourcePicker() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annuler', 'Photothèque', 'Prendre une photo'],
          cancelButtonIndex: 0,
        },
        (idx) => {
          if (idx === 1) pickFromLibrary();
          else if (idx === 2) pickFromCamera();
        },
      );
    } else {
      // Android : pour V1 on propose direct la photothèque (caméra à brancher
      // plus tard quand on ciblera Android pour le V1.5)
      pickFromLibrary();
    }
  }

  return (
    <View style={styles.block}>
      <Text style={[styles.label, { color: c.text }]}>
        Capture du ticket bookmaker
      </Text>
      <Text style={[styles.hint, { color: c.textDim }]}>
        ⚠️ Masque tes infos perso (solde, username) avant de prendre la capture.
      </Text>

      {value ? (
        <View
          style={[
            styles.previewBox,
            { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
          ]}>
          <Image
            source={{ uri: value }}
            style={[
              styles.previewImage,
              imageRatio != null ? { aspectRatio: imageRatio } : null,
            ]}
            contentFit="contain"
            onLoad={(e) => {
              const w = e?.source?.width;
              const h = e?.source?.height;
              if (w && h) setImageRatio(w / h);
            }}
          />
          <View style={styles.previewActions}>
            <Pressable
              onPress={openSourcePicker}
              disabled={uploading}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: c.bgWarm,
                  borderColor: c.goldDecorative,
                  opacity: pressed || uploading ? 0.7 : 1,
                },
              ]}>
              <SymbolView
                name="arrow.triangle.2.circlepath"
                size={14}
                tintColor={c.gold}
                weight="semibold"
              />
              <Text style={[styles.actionText, { color: c.text }]}>
                Remplacer
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRemove}
              disabled={uploading}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: 'transparent',
                  borderColor: c.danger,
                  opacity: pressed || uploading ? 0.7 : 1,
                },
              ]}>
              <SymbolView
                name="trash"
                size={14}
                tintColor={c.danger}
                weight="semibold"
              />
              <Text style={[styles.actionText, { color: c.danger }]}>
                Retirer
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={openSourcePicker}
          disabled={uploading}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: c.bgElevated,
              borderColor: c.borderSoft,
              opacity: pressed || uploading ? 0.7 : 1,
            },
          ]}>
          <SymbolView
            name={uploading ? 'arrow.up.circle' : 'photo.badge.plus'}
            size={24}
            tintColor={uploading ? c.textDim : c.gold}
            weight="semibold"
          />
          <Text style={[styles.addText, { color: c.text }]}>
            {uploading ? 'Upload en cours…' : 'Ajouter la capture du ticket'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    lineHeight: 14,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 6,
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewBox: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.two,
    marginTop: 6,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 9 / 16, // ratio par défaut (avant onLoad), écrasé dynamiquement
    maxHeight: 360,
    borderRadius: Radius.sm,
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
