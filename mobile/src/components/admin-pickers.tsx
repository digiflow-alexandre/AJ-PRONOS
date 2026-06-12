import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  AdminPickerSheet,
  type PickerOption,
} from '@/components/admin-picker-sheet';
import {
  TENNIS_COUNTRIES,
  TENNIS_PLAYERS,
  getCompetitionsForSport,
  getFlagUrl,
  getTeamsForCompetition,
} from '@/constants/competitions';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import { getCompetitorLogo } from '@/lib/team-logos';
import { useFootTeamsFromDb } from '@/lib/use-foot-teams-from-db';
import type { Sport } from '@/types/prono';

// =============================================================================
// CompetitionPicker — sélection de la compétition filtré par sport
// =============================================================================
export function CompetitionPicker({
  sport,
  competitionId,
  customLabel,
  onChange,
}: {
  sport: Sport;
  /** ID de la compétition (depuis getCompetitionsForSport) OU "custom" si saisie libre */
  competitionId: string | null;
  /** Si competitionId="custom", le label saisi à la main */
  customLabel: string;
  /** Appelé avec (id, label final affiché côté membre). */
  onChange: (opts: { id: string; label: string; customLabel?: string }) => void;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(competitionId === 'custom');

  const options = useMemo<PickerOption[]>(() => {
    return getCompetitionsForSport(sport).map((comp) => ({
      id: comp.id,
      label: comp.label,
      imageUrl: getFlagUrl(comp.countryCode),
      iconFallback: comp.iconFallback,
    }));
  }, [sport]);

  const selectedComp = competitionId
    ? getCompetitionsForSport(sport).find((c) => c.id === competitionId)
    : null;
  const selectedFlagUrl = selectedComp ? getFlagUrl(selectedComp.countryCode) : undefined;
  const displayLabel =
    competitionId === 'custom'
      ? customLabel || 'Compétition personnalisée'
      : selectedComp?.label ?? 'Choisir une compétition';

  function handlePick(opt: PickerOption) {
    setCustomMode(false);
    onChange({ id: opt.id, label: opt.label });
  }

  function handleCustom() {
    setCustomMode(true);
    onChange({ id: 'custom', label: '', customLabel: '' });
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, { color: c.text }]}>Compétition</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.selectBtn,
          {
            backgroundColor: c.bgElevated,
            borderColor: competitionId ? c.gold : c.borderSoft,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        {selectedFlagUrl ? (
          <Image
            source={{ uri: selectedFlagUrl }}
            style={styles.selectFlag}
            contentFit="contain"
          />
        ) : selectedComp?.iconFallback ? (
          <View
            style={[
              styles.selectIconFallback,
              { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
            ]}>
            <SymbolView
              name={selectedComp.iconFallback as never}
              size={14}
              tintColor={c.gold}
              weight="semibold"
            />
          </View>
        ) : null}
        <Text
          style={[
            styles.selectText,
            {
              color: competitionId ? c.text : c.textMuted,
              fontWeight: competitionId ? '700' : '500',
            },
          ]}
          numberOfLines={1}>
          {displayLabel}
        </Text>
        <SymbolView
          name="chevron.down"
          size={12}
          tintColor={c.textDim}
          weight="medium"
        />
      </Pressable>

      {customMode ? (
        <TextInput
          value={customLabel}
          onChangeText={(v) =>
            onChange({ id: 'custom', label: v, customLabel: v })
          }
          placeholder="Nom de la compétition (ex. Coupe de France)"
          placeholderTextColor={c.textDim}
          autoCorrect={false}
          style={[
            styles.input,
            {
              backgroundColor: c.bgElevated,
              borderColor: c.borderSoft,
              color: c.text,
              marginTop: 6,
            },
          ]}
        />
      ) : null}

      <AdminPickerSheet
        visible={open}
        title={`Choisir une compétition (${sport === 'foot' ? 'football' : 'tennis'})`}
        options={options}
        onSelect={handlePick}
        onClose={() => setOpen(false)}
        searchPlaceholder="Rechercher une compétition…"
        customLabel="Saisir manuellement"
        onCustomSelect={handleCustom}
      />
    </View>
  );
}

// =============================================================================
// TeamPicker — sélection d'une équipe (foot) ou d'un joueur (tennis)
// =============================================================================
export function TeamPicker({
  sport,
  competitionId,
  label,
  value,
  onChange,
}: {
  sport: Sport;
  /** ID compétition pour filtrer les équipes (foot). Pour tennis, on
   *  utilise une liste globale des top joueurs. */
  competitionId: string | null;
  label: string;
  /** Pour tennis custom : on stocke le nom avec suffixe pays (ex "Smith (fr)")
   *  pour que getPlayerFlag() puisse extraire le drapeau côté affichage. */
  value: string;
  onChange: (name: string) => void;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  // Pour le mode custom tennis, on sépare le nom brut du code pays.
  // ATTENTION : pas de .trim() ici sinon on bouffe les espaces pendant la
  // saisie (l'utilisateur ne peut pas taper "John Smith" car l'espace
  // entre nom/prénom est supprimé à chaque keystroke).
  const customCountryMatch = value.match(/\s*\(([a-z]{2})\)\s*$/i);
  const customCountryCode = customCountryMatch?.[1].toLowerCase() ?? null;
  const customRawName = value.replace(/\s*\([A-Za-z]{2}\)\s*$/, '');

  function updateCustomName(newName: string) {
    // Conserve le code pays s'il existait déjà. Pas de .trim() pour ne pas
    // bloquer la frappe d'espaces (le trim sera fait à la soumission finale).
    if (customCountryCode) {
      onChange(`${newName} (${customCountryCode})`);
    } else {
      onChange(newName);
    }
  }

  function updateCustomCountry(code: string) {
    // Pose / remplace le suffixe (xx) sur le nom. Trim juste pour
    // ne pas avoir d'espace traînant avant la parenthèse.
    onChange(`${customRawName.trim()} (${code})`);
  }

  // Fallback dynamique : pour les compétitions sans liste hardcodée
  // (amicaux, exotiques…), on propose toutes les équipes connues en DB.
  const { teams: dbTeams } = useFootTeamsFromDb();

  const options = useMemo<PickerOption[]>(() => {
    if (sport === 'foot') {
      if (!competitionId || competitionId === 'custom') return [];
      const hardcoded = getTeamsForCompetition(competitionId);
      if (hardcoded.length > 0) {
        return hardcoded.map((t) => ({
          id: t,
          label: t,
          imageUrl: getCompetitorLogo(t, 'foot'),
        }));
      }
      // Pas de liste hardcodée pour cette compé → on tape dans la DB.
      return dbTeams.map((t) => ({
        id: t.name,
        label: t.name,
        imageUrl: t.logo ?? getCompetitorLogo(t.name, 'foot'),
      }));
    }
    // Tennis : liste des top joueurs
    return TENNIS_PLAYERS.map((p) => ({
      id: p.name,
      label: p.name,
      imageUrl: getFlagUrl(p.countryCode),
      subtitle: p.countryCode.toUpperCase(),
    }));
  }, [sport, competitionId, dbTeams]);

  const noOptions = sport === 'foot' && !competitionId;

  function handlePick(opt: PickerOption) {
    setCustomMode(false);
    onChange(opt.label);
  }

  function handleCustom() {
    setCustomMode(true);
    onChange('');
  }

  const valueLogo = value ? getCompetitorLogo(value, sport) : undefined;

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <Pressable
        onPress={() => {
          if (noOptions) return;
          setOpen(true);
        }}
        disabled={noOptions}
        style={({ pressed }) => [
          styles.selectBtn,
          {
            backgroundColor: noOptions ? c.bgDeeper : c.bgElevated,
            borderColor: value ? c.gold : c.borderSoft,
            opacity: pressed && !noOptions ? 0.7 : noOptions ? 0.5 : 1,
          },
        ]}>
        {valueLogo ? (
          <Image
            source={{ uri: valueLogo }}
            style={styles.selectFlag}
            contentFit="contain"
          />
        ) : null}
        <Text
          style={[
            styles.selectText,
            {
              color: value ? c.text : c.textMuted,
              fontWeight: value ? '700' : '500',
            },
          ]}
          numberOfLines={1}>
          {value ||
            (noOptions
              ? 'Choisis d’abord une compétition'
              : sport === 'foot'
                ? 'Choisir une équipe'
                : 'Choisir un joueur')}
        </Text>
        {!noOptions ? (
          <SymbolView
            name="chevron.down"
            size={12}
            tintColor={c.textDim}
            weight="medium"
          />
        ) : null}
      </Pressable>

      {customMode ? (
        <View style={{ gap: 6, marginTop: 6 }}>
          <TextInput
            value={sport === 'tennis' ? customRawName : value}
            onChangeText={sport === 'tennis' ? updateCustomName : onChange}
            placeholder={
              sport === 'foot' ? 'Nom de l’équipe' : 'Nom du joueur'
            }
            placeholderTextColor={c.textDim}
            autoCorrect={false}
            style={[
              styles.input,
              {
                backgroundColor: c.bgElevated,
                borderColor: c.borderSoft,
                color: c.text,
              },
            ]}
          />
          {sport === 'tennis' ? (
            <>
              <Pressable
                onPress={() => setCountryPickerOpen(true)}
                style={({ pressed }) => [
                  styles.selectBtn,
                  {
                    marginTop: 0,
                    backgroundColor: c.bgElevated,
                    borderColor: customCountryCode ? c.gold : c.borderSoft,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                {customCountryCode ? (
                  <Image
                    source={{ uri: `https://flagcdn.com/w80/${customCountryCode}.png` }}
                    style={styles.selectFlag}
                    contentFit="contain"
                  />
                ) : null}
                <Text
                  style={[
                    styles.selectText,
                    {
                      color: customCountryCode ? c.text : c.textMuted,
                      fontWeight: customCountryCode ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}>
                  {customCountryCode
                    ? TENNIS_COUNTRIES.find((c) => c.code === customCountryCode)?.name ?? customCountryCode.toUpperCase()
                    : 'Choisir le pays du joueur (drapeau)'}
                </Text>
                <SymbolView
                  name="chevron.down"
                  size={12}
                  tintColor={c.textDim}
                  weight="medium"
                />
              </Pressable>
              <AdminPickerSheet
                visible={countryPickerOpen}
                title="Pays du joueur"
                options={TENNIS_COUNTRIES.map((country) => ({
                  id: country.code,
                  label: country.name,
                  imageUrl: `https://flagcdn.com/w80/${country.code}.png`,
                  subtitle: country.code.toUpperCase(),
                }))}
                onSelect={(opt) => updateCustomCountry(opt.id)}
                onClose={() => setCountryPickerOpen(false)}
                searchPlaceholder="Rechercher un pays…"
                allowCustom={false}
              />
            </>
          ) : null}
        </View>
      ) : null}

      <AdminPickerSheet
        visible={open}
        title={
          sport === 'foot' ? 'Choisir une équipe' : 'Choisir un joueur'
        }
        options={options}
        onSelect={handlePick}
        onClose={() => setOpen(false)}
        searchPlaceholder={
          sport === 'foot' ? 'Rechercher une équipe…' : 'Rechercher un joueur…'
        }
        customLabel={
          sport === 'foot' ? 'Saisir une équipe non listée' : 'Saisir un joueur non listé'
        }
        onCustomSelect={handleCustom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  selectFlag: {
    width: 22,
    height: 22,
    borderRadius: 3,
  },
  selectIconFallback: {
    width: 22,
    height: 22,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  selectText: {
    flex: 1,
    fontSize: 15,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 15,
  },
});
