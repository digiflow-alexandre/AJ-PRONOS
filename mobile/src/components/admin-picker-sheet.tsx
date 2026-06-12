import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

export type PickerOption = {
  id: string;
  label: string;
  /** URL d'image (drapeau, logo) affichée en avatar. */
  imageUrl?: string;
  /** SF Symbol affiché quand pas d'imageUrl (fallback pour compétitions
   *  internationales : trophy, tennis racket, globe, etc.). */
  iconFallback?: string;
  /** Texte secondaire (sous-titre, ex pays pour un joueur tennis). */
  subtitle?: string;
};

/**
 * Bottom sheet générique pour sélectionner un item dans une liste avec
 * recherche (filtre live). Utilisé par CompetitionPicker, TeamPicker, etc.
 */
export function AdminPickerSheet({
  visible,
  title,
  options,
  onSelect,
  onClose,
  searchPlaceholder = 'Rechercher…',
  allowCustom = true,
  customLabel = 'Autre…',
  onCustomSelect,
}: {
  visible: boolean;
  title: string;
  options: PickerOption[];
  onSelect: (option: PickerOption) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  allowCustom?: boolean;
  customLabel?: string;
  onCustomSelect?: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  function close() {
    setQuery('');
    onClose();
  }

  function pick(option: PickerOption) {
    onSelect(option);
    close();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: c.bgElevated,
                paddingBottom: insets.bottom + Spacing.three,
                borderTopColor: c.borderSoft,
              },
            ]}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: c.borderStrong }]} />

            {/* Header */}
            <Text style={[styles.title, { color: c.text }]}>{title}</Text>

            {/* Recherche */}
            <View
              style={[
                styles.searchBox,
                { backgroundColor: c.bgDeeper, borderColor: c.borderSoft },
              ]}>
              <SymbolView
                name="magnifyingglass"
                size={14}
                tintColor={c.textDim}
                weight="medium"
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={c.textDim}
                autoCorrect={false}
                autoCapitalize="none"
                style={[styles.searchInput, { color: c.text }]}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={6}>
                  <SymbolView
                    name="xmark.circle.fill"
                    size={16}
                    tintColor={c.textDim}
                    weight="medium"
                  />
                </Pressable>
              ) : null}
            </View>

            {/* Liste */}
            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {filtered.length === 0 ? (
                <Text style={[styles.empty, { color: c.textMuted }]}>
                  Aucun résultat.
                </Text>
              ) : (
                filtered.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => pick(opt)}
                    style={({ pressed }) => [
                      styles.row,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}>
                    {opt.imageUrl ? (
                      <Image
                        source={{ uri: opt.imageUrl }}
                        style={styles.rowImage}
                        contentFit="contain"
                      />
                    ) : opt.iconFallback ? (
                      <View
                        style={[
                          styles.rowIconFallback,
                          { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
                        ]}>
                        <SymbolView
                          name={opt.iconFallback as never}
                          size={16}
                          tintColor={c.gold}
                          weight="semibold"
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.rowImage,
                          { backgroundColor: c.bgDeeper },
                        ]}
                      />
                    )}
                    <View style={styles.rowText}>
                      <Text
                        style={[styles.rowLabel, { color: c.text }]}
                        numberOfLines={1}>
                        {opt.label}
                      </Text>
                      {opt.subtitle ? (
                        <Text
                          style={[
                            styles.rowSubtitle,
                            { color: c.textMuted },
                          ]}>
                          {opt.subtitle}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                ))
              )}
              {allowCustom && onCustomSelect ? (
                <Pressable
                  onPress={() => {
                    onCustomSelect();
                    close();
                  }}
                  style={({ pressed }) => [
                    styles.customRow,
                    {
                      backgroundColor: c.bgWarm,
                      borderColor: c.goldDecorative,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <SymbolView
                    name="pencil"
                    size={14}
                    tintColor={c.gold}
                    weight="semibold"
                  />
                  <Text style={[styles.customText, { color: c.text }]}>
                    {customLabel}
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '85%',
    gap: Spacing.three,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  list: {
    maxHeight: 500,
  },
  empty: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rowImage: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  rowIconFallback: {
    width: 28,
    height: 28,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  customText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
