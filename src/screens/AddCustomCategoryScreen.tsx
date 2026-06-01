import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { AppIcon } from '../components/AppIcon';
import { EXPENSE_CATEGORIES } from '../constants/categories';
import { categoryIconName } from '../constants/categoryGlyphs';
import { useAppPreferences } from '../context/AppPreferencesContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore } from '../native/monefyCore';

type Props = NativeStackScreenProps<RootStackParamList, 'AddCustomCategory'>;

const ICON_PRESETS = Array.from(
  new Map(EXPENSE_CATEGORIES.map(c => [c.iconName, c])).values(),
).map(c => ({ iconName: c.iconName, color: c.color }));

export function AddCustomCategoryScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const [label, setLabel] = useState('');
  const [picked, setPicked] = useState(ICON_PRESETS[0]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('addCategoryTitle') });
  }, [navigation, t]);

  const save = async () => {
    const name = label.trim();
    if (!name) {
      Alert.alert(t('error'), t('categoryName'));
      return;
    }
    const slugBase = name
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24);
    const id = (slugBase || 'cat') + '_' + String(Date.now()).slice(-6);
    const builtinIds = new Set(EXPENSE_CATEGORIES.map(c => c.id));
    if (builtinIds.has(id)) {
      Alert.alert(t('error'), t('duplicateId'));
      return;
    }
    const payload = JSON.stringify({
      id,
      label: name,
      iconName: picked.iconName,
      iconColor: picked.color,
    });
    try {
      await MonefyCore.addCustomCategoryJson(payload);
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert(t('error'), String(e));
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.wrap, { backgroundColor: colors.background }]}>
      <Text style={[styles.lab, { color: colors.textSecondary }]}>
        {t('categoryName')}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
        value={label}
        onChangeText={setLabel}
        placeholder="Coffee"
        placeholderTextColor={colors.textSecondary}
      />

      <Text style={[styles.lab, styles.labAfter, { color: colors.textSecondary }]}>
        {t('pickIcon')}
      </Text>
      <View style={styles.grid}>
        {ICON_PRESETS.map(p => (
          <AnimatedPressable
            key={p.iconName}
            variant="icon"
            style={[
              styles.tile,
              {
                borderColor: p.color,
                backgroundColor:
                  picked.iconName === p.iconName ? colors.chipActive : colors.card,
              },
            ]}
            onPress={() => setPicked(p)}>
            <AppIcon
              name={categoryIconName(p.iconName)}
              color={p.color}
              backgroundColor={colors.chip}
              size={34}
              style={styles.tileGlyph}
            />
          </AnimatedPressable>
        ))}
      </View>

      <AnimatedPressable
        variant="primary"
        style={[styles.save, { backgroundColor: colors.accentMuted }]}
        onPress={save}>
        <Text style={styles.saveTxt}>{t('save')}</Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 40 },
  lab: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  labAfter: { marginTop: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileGlyph: {},
  save: {
    marginTop: 28,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontWeight: '700', fontSize: 17 },
});
