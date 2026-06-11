import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { LoadingButtonContent } from '../components/LoadingButtonContent';
import { ScreenLoading } from '../components/ScreenLoading';
import { AppIcon } from '../components/AppIcon';
import { categoryIconName } from '../constants/categoryGlyphs';
import { TOP_UP_CATEGORY } from '../constants/banking';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useSecurity } from '../context/SecurityContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore } from '../native/monefyCore';
import type { Card, UiCategory } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';
import { loadCustomCategories, mergeUiCategories } from '../utils/categories';

type Props = NativeStackScreenProps<RootStackParamList, 'AddOperation'>;

export function AddOperationScreen({ navigation, route }: Props) {
  const { colors, t, locale } = useAppPreferences();
  const { requirePaymentAuth } = useSecurity();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [categories, setCategories] = useState<UiCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<UiCategory | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const operationType = route.params?.type || 'expense';
  const presetCategoryId = route.params?.categoryId;
  const presetDescription = route.params?.description ?? '';
  const isIncome = operationType === 'income';

  const loadCards = React.useCallback(async () => {
    try {
      const j = await MonefyCore.getCardsJson();
      const cardsData = JSON.parse(j) as Card[];
      setCards(cardsData);
      if (cardsData.length > 0 && !selectedCard) {
        setSelectedCard(cardsData[0]);
      }
    } catch (e) {
      console.error('Failed to load cards:', e);
    }
  }, [selectedCard]);

  const loadCategories = React.useCallback(async () => {
    if (isIncome) {
      return;
    }
    try {
      const customCategories = await loadCustomCategories();
      const allCategories = mergeUiCategories(customCategories, locale);
      setCategories(allCategories);
      if (allCategories.length > 0) {
        const preset = presetCategoryId
          ? allCategories.find(c => c.id === presetCategoryId)
          : null;
        setSelectedCategory(prev => preset ?? prev ?? allCategories[0]);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    }
  }, [presetCategoryId, locale, isIncome]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isIncome ? t('topUpLabel') : t('newExpense'),
    });
  }, [navigation, t, locale, isIncome]);

  React.useEffect(() => {
    let active = true;
    (async () => {
      setIsLoadingData(true);
      await Promise.all([loadCards(), loadCategories()]);
      if (active) {
        setIsLoadingData(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadCards, loadCategories]);

  React.useEffect(() => {
    if (presetDescription) {
      setDescription(presetDescription);
    }
  }, [presetDescription]);

  const performSave = async () => {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
    if (!selectedCard) {
      Alert.alert(t('error'), t('selectCard'));
      return;
    }
    if (!isIncome && !selectedCategory) {
      Alert.alert(t('error'), t('selectCategory'));
      return;
    }

    setIsSaving(true);
    try {
      const finalAmount = isIncome ? Math.abs(amt) : -Math.abs(amt);
      const category = isIncome ? TOP_UP_CATEGORY.id : selectedCategory!.id;
      const iconName = isIncome ? TOP_UP_CATEGORY.iconName : selectedCategory!.iconName;
      const iconColor = isIncome ? TOP_UP_CATEGORY.iconColor : selectedCategory!.color;

      const payload = JSON.stringify({
        amount: finalAmount,
        description: isIncome
          ? description.trim() || t('topUpLabel')
          : description.trim(),
        paymentCard: selectedCard.number,
        category,
        iconName,
        iconColor,
        date: new Date().toISOString().split('T')[0],
      });

      if (isIncome) {
        await MonefyCore.addIncomeJson(payload);
      } else {
        await MonefyCore.addExpenseJson(payload);
      }
      navigation.goBack();
    } catch (e: unknown) {
      const err = e instanceof Error ? e.message : String(e);
      Alert.alert(t('error'), err);
    } finally {
      setIsSaving(false);
    }
  };

  const save = () => {
    requirePaymentAuth(() => performSave());
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: space.xxl }}>
        {isIncome ? (
          <View style={[styles.topUpBanner, { backgroundColor: colors.brandSoft }]}>
            <AppIcon
              name="topup"
              color={colors.income}
              backgroundColor={colors.card}
              size={48}
              style={styles.topUpGlyph}
            />
            <View style={styles.topUpTextWrap}>
              <Text style={[styles.topUpTitle, { color: colors.brand }]}>
                {t('topUpLabel')}
              </Text>
              <Text style={[styles.topUpHint, { color: colors.textSecondary }]}>
                {t('topUpHint')}
              </Text>
            </View>
          </View>
        ) : isLoadingData ? (
          <ScreenLoading minHeight={100} />
        ) : (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('selectCategory')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map(category => (
                <AnimatedPressable
                  key={category.id}
                  variant="tile"
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor:
                        selectedCategory?.id === category.id ? colors.chip : colors.card,
                      borderColor:
                        selectedCategory?.id === category.id
                          ? colors.brand
                          : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCategory(category)}>
                  <AppIcon
                    name={categoryIconName(category.iconName)}
                    color={category.color}
                    backgroundColor={colors.chip}
                    size={38}
                    style={styles.categoryGlyph}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      {
                        color:
                          selectedCategory?.id === category.id
                            ? colors.brand
                            : colors.text,
                      },
                    ]}>
                    {category.label}
                  </Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>{t('selectCard')}</Text>
          {isLoadingData ? (
            <ScreenLoading minHeight={80} />
          ) : cards.length === 0 ? (
            <AnimatedPressable
              variant="tile"
              style={[
                styles.noCardsCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => navigation.navigate('AddCard')}>
              <Text style={[styles.noCardsText, { color: colors.textMuted }]}>
                {t('noCardsForTopup')}
              </Text>
            </AnimatedPressable>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {cards.map(card => (
                <AnimatedPressable
                  key={card.number}
                  variant="tile"
                  style={[
                    styles.cardOption,
                    {
                      backgroundColor:
                        selectedCard?.number === card.number ? colors.chip : colors.card,
                      borderColor:
                        selectedCard?.number === card.number ? colors.brand : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedCard(card)}>
                  <Text style={[styles.cardNumber, { color: colors.text }]}>
                    {card.name || card.number.slice(-4)}
                  </Text>
                  <Text style={[styles.cardBalance, { color: colors.textMuted }]}>
                    {card.balance.toFixed(2)} ₽
                  </Text>
                </AnimatedPressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>{t('sumLabel')}</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={amount}
            onChangeText={setAmount}
            placeholder={t('amountPlaceholder')}
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>
            {t('description')} {!isIncome ? '' : `(${t('optionalDescription')})`}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder={isIncome ? t('topUpHint') : t('optionalDescription')}
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <AnimatedPressable
          variant="primary"
          style={[
            styles.saveButton,
            {
              backgroundColor: isSaving
                ? colors.textMuted
                : isIncome
                  ? colors.income
                  : colors.expense,
            },
          ]}
          onPress={save}
          disabled={isSaving || isLoadingData}>
          {isSaving ? (
            <LoadingButtonContent label={t('saving')} textColor="#fff" />
          ) : (
            <Text style={[styles.saveButtonText, { color: 'white' }]}>{t('save')}</Text>
          )}
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: space.lg },
  label: { fontSize: 16, fontWeight: '600', marginBottom: space.sm },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    fontSize: 16,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  topUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: space.lg,
    padding: space.lg,
    borderRadius: radii.lg,
    gap: space.md,
  },
  topUpGlyph: {},
  topUpTextWrap: { flex: 1 },
  topUpTitle: { fontSize: 18, fontWeight: '800' },
  topUpHint: { fontSize: 14, marginTop: 4 },
  cardOption: {
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: space.md,
    marginRight: space.sm,
    minWidth: 120,
    ...cardShadow(false),
  },
  cardNumber: { fontSize: 14, fontWeight: '600' },
  cardBalance: { fontSize: 12, marginTop: space.xs },
  noCardsCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    alignItems: 'center',
  },
  noCardsText: { fontSize: 14, textAlign: 'center' },
  categoryOption: {
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: space.md,
    marginRight: space.sm,
    minWidth: 100,
    alignItems: 'center',
    ...cardShadow(false),
  },
  categoryGlyph: { marginBottom: space.xs },
  categoryLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  saveButton: {
    borderRadius: radii.lg,
    padding: space.md,
    alignItems: 'center',
    margin: space.lg,
  },
  saveButtonText: { fontSize: 16, fontWeight: '600' },
});
