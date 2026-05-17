import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { TRANSFER_CATEGORY } from '../constants/banking';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useSecurity } from '../context/SecurityContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { MonefyCore, parseJson } from '../native/monefyCore';
import type { Card } from '../types';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Transfer'>;
type TransferMode = 'own' | 'person';

export function TransferScreen({ navigation, route }: Props) {
  const { colors, t } = useAppPreferences();
  const { requirePaymentAuth } = useSecurity();
  const [mode, setMode] = useState<TransferMode>('own');
  const [cards, setCards] = useState<Card[]>([]);
  const [fromCard, setFromCard] = useState<Card | null>(null);
  const [toCard, setToCard] = useState<Card | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const preselected = route.params?.fromCardNumber;

  useEffect(() => {
    navigation.setOptions({ title: t('transferTitle') });
  }, [navigation, t]);

  useEffect(() => {
    (async () => {
      try {
        const j = await MonefyCore.getCardsJson();
        const data = parseJson<Card[]>(j);
        setCards(data);
        if (data.length > 0) {
          const from = data.find(c => c.number === preselected) ?? data[0];
          setFromCard(from);
          setToCard(data.find(c => c.number !== from.number) ?? null);
        }
      } catch {
        setCards([]);
      }
    })();
  }, [preselected]);

  const executeOwnTransfer = async () => {
    const amt = parseFloat(amount.replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
    if (!fromCard || !toCard) {
      Alert.alert(t('error'), t('selectBothCards'));
      return;
    }
    if (fromCard.number === toCard.number) {
      Alert.alert(t('error'), t('sameCardTransfer'));
      return;
    }
    if (fromCard.balance < amt) {
      Alert.alert(t('error'), t('insufficientFunds'));
      return;
    }

    setLoading(true);
    try {
      await MonefyCore.transferBetweenCards(
        fromCard.number,
        toCard.number,
        amt,
        description.trim() || t('transferDefaultDesc'),
      );
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const executePersonTransfer = async () => {
    const amt = parseFloat(amount.replace(',', '.'));
    const name = recipientName.trim();
    const account = recipientAccount.trim().replace(/\s/g, '');

    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert(t('error'), t('enterValidAmount'));
      return;
    }
    if (!fromCard) {
      Alert.alert(t('error'), t('selectCard'));
      return;
    }
    if (!name) {
      Alert.alert(t('error'), t('recipientNameRequired'));
      return;
    }
    if (account.length < 4) {
      Alert.alert(t('error'), t('recipientAccountRequired'));
      return;
    }
    if (fromCard.balance < amt) {
      Alert.alert(t('error'), t('insufficientFunds'));
      return;
    }

    setLoading(true);
    try {
      await MonefyCore.addExpenseJson(
        JSON.stringify({
          amount: -Math.abs(amt),
          description: `${name} · ${account}`,
          paymentCard: fromCard.number,
          category: TRANSFER_CATEGORY.id,
          iconName: TRANSFER_CATEGORY.iconName,
          iconColor: TRANSFER_CATEGORY.iconColor,
          date: new Date().toISOString().split('T')[0],
        }),
      );
      Alert.alert(t('transferSuccess'), t('transferSuccessPerson', { name }), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const onTransfer = () => {
    if (mode === 'own') {
      requirePaymentAuth(() => executeOwnTransfer());
    } else {
      requirePaymentAuth(() => executePersonTransfer());
    }
  };

  const renderFromCardPicker = () => (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.text }]}>{t('fromCard')}</Text>
      {cards.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>{t('noCards')}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cards.map(card => (
            <Pressable
              key={card.number}
              style={[
                styles.cardChip,
                {
                  backgroundColor:
                    fromCard?.number === card.number ? colors.brandSoft : colors.card,
                  borderColor:
                    fromCard?.number === card.number ? colors.brand : colors.border,
                },
                cardShadow(false),
              ]}
              onPress={() => setFromCard(card)}>
              <Text
                style={[
                  styles.cardChipTitle,
                  { color: fromCard?.number === card.number ? colors.brand : colors.text },
                ]}>
                {card.name || card.number.slice(-4)}
              </Text>
              <Text style={[styles.cardChipBal, { color: colors.textMuted }]}>
                {card.balance.toFixed(2)} ₽
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const canSubmitOwn = cards.length >= 2;
  const canSubmitPerson = cards.length >= 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: space.xxl }}>
        <View style={[styles.modeRow, { paddingHorizontal: space.lg, paddingTop: space.md }]}>
          <Pressable
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === 'own' ? colors.brand : colors.card,
                borderColor: mode === 'own' ? colors.brand : colors.border,
              },
            ]}
            onPress={() => setMode('own')}>
            <Text
              style={[
                styles.modeTxt,
                { color: mode === 'own' ? colors.inverseText : colors.text },
              ]}>
              {t('transferOwnCards')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === 'person' ? colors.brand : colors.card,
                borderColor: mode === 'person' ? colors.brand : colors.border,
              },
            ]}
            onPress={() => setMode('person')}>
            <Text
              style={[
                styles.modeTxt,
                { color: mode === 'person' ? colors.inverseText : colors.text },
              ]}>
              {t('transferToPerson')}
            </Text>
          </Pressable>
        </View>

        {mode === 'own' && !canSubmitOwn ? (
          <View style={[styles.warn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
              {t('needTwoCards')}
            </Text>
          </View>
        ) : mode === 'person' && !canSubmitPerson ? (
          <View style={[styles.warn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{t('noCards')}</Text>
          </View>
        ) : (
          <>
            {renderFromCardPicker()}

            {mode === 'own' ? (
              <>
                <View style={styles.arrowWrap}>
                  <Text style={[styles.arrow, { color: colors.brand }]}>↓</Text>
                </View>
                <View style={styles.section}>
                  <Text style={[styles.label, { color: colors.text }]}>{t('toCard')}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {cards
                      .filter(c => c.number !== fromCard?.number)
                      .map(card => (
                        <Pressable
                          key={card.number}
                          style={[
                            styles.cardChip,
                            {
                              backgroundColor:
                                toCard?.number === card.number
                                  ? colors.brandSoft
                                  : colors.card,
                              borderColor:
                                toCard?.number === card.number ? colors.brand : colors.border,
                            },
                            cardShadow(false),
                          ]}
                          onPress={() => setToCard(card)}>
                          <Text
                            style={[
                              styles.cardChipTitle,
                              {
                                color:
                                  toCard?.number === card.number
                                    ? colors.brand
                                    : colors.text,
                              },
                            ]}>
                            {card.name || card.number.slice(-4)}
                          </Text>
                          <Text style={[styles.cardChipBal, { color: colors.textMuted }]}>
                            {card.balance.toFixed(2)} ₽
                          </Text>
                        </Pressable>
                      ))}
                  </ScrollView>
                </View>
              </>
            ) : (
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.text }]}>
                  {t('recipientDetails')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.inputMargin,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={recipientName}
                  onChangeText={setRecipientName}
                  placeholder={t('recipientName')}
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={recipientAccount}
                  onChangeText={setRecipientAccount}
                  placeholder={t('recipientAccount')}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  autoCapitalize="characters"
                />
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  {t('recipientAccountHint')}
                </Text>
              </View>
            )}

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
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>{t('description')}</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder={
                  mode === 'own' ? t('transferDescPh') : t('transferPersonDescPh')
                }
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <Pressable
              style={[
                styles.submit,
                { backgroundColor: loading ? colors.textMuted : colors.brand },
              ]}
              onPress={onTransfer}
              disabled={loading}>
              <Text style={[styles.submitTxt, { color: colors.inverseText }]}>
                {loading
                  ? t('saving')
                  : mode === 'own'
                    ? t('transferSubmit')
                    : t('transferSubmitPerson')}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modeRow: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  modeBtn: {
    flex: 1,
    paddingVertical: space.md,
    borderRadius: radii.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  modeTxt: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  section: { padding: space.lg, paddingBottom: 0 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: space.sm },
  cardChip: {
    borderWidth: 2,
    borderRadius: radii.lg,
    padding: space.md,
    marginRight: space.sm,
    minWidth: 130,
  },
  cardChipTitle: { fontSize: 15, fontWeight: '700' },
  cardChipBal: { fontSize: 12, marginTop: 4 },
  arrowWrap: { alignItems: 'center', paddingVertical: space.sm },
  arrow: { fontSize: 28, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    fontSize: 16,
    fontWeight: '600',
  },
  inputMargin: { marginBottom: space.sm },
  hint: { fontSize: 12, marginTop: space.sm, lineHeight: 18 },
  submit: {
    margin: space.lg,
    borderRadius: radii.lg,
    padding: space.lg,
    alignItems: 'center',
  },
  submitTxt: { fontSize: 17, fontWeight: '800' },
  warn: {
    margin: space.lg,
    padding: space.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
});
