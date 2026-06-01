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

import { AnimatedPressable, animateNextLayout } from '../components/AnimatedPressable';
import { useAppPreferences } from '../context/AppPreferencesContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { cardShadow, radii, space } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Feedback'>;

const ISSUE_KEYS = [
  'feedbackIssueCard',
  'feedbackIssueTransfer',
  'feedbackIssueLogin',
  'feedbackIssueCrash',
  'feedbackIssueBalance',
] as const;

export function FeedbackScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('feedbackTitle') });
  }, [navigation, t]);

  const submit = () => {
    if (showCustom) {
      if (!customText.trim()) {
        Alert.alert(t('error'), t('feedbackCustomRequired'));
        return;
      }
    } else if (!selectedIssue) {
      Alert.alert(t('error'), t('feedbackSelectIssue'));
      return;
    }

    Alert.alert(t('feedbackThanksTitle'), t('feedbackThanksBody'), [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.wrap}>
      <Text style={[styles.hint, { color: colors.textMuted }]}>{t('feedbackHint')}</Text>

      {!showCustom
        ? ISSUE_KEYS.map(key => (
            <AnimatedPressable
              key={key}
              variant="tile"
              onPress={() => setSelectedIssue(key)}
              style={[
                styles.issueRow,
                {
                  backgroundColor:
                    selectedIssue === key ? colors.brandSoft : colors.card,
                  borderColor: selectedIssue === key ? colors.brand : colors.border,
                },
                cardShadow(false),
              ]}>
              <Text style={[styles.issueText, { color: colors.text }]}>{t(key)}</Text>
            </AnimatedPressable>
          ))
        : null}

      <AnimatedPressable
        variant="tile"
        onPress={() => {
          animateNextLayout();
          setShowCustom(v => !v);
          setSelectedIssue(null);
        }}
        style={[
          styles.issueRow,
          {
            backgroundColor: showCustom ? colors.brandSoft : colors.card,
            borderColor: showCustom ? colors.brand : colors.border,
          },
          cardShadow(false),
        ]}>
        <Text style={[styles.issueText, { color: colors.text }]}>{t('feedbackOther')}</Text>
      </AnimatedPressable>

      {showCustom ? (
        <TextInput
          value={customText}
          onChangeText={setCustomText}
          placeholder={t('feedbackCustomPlaceholder')}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            styles.textArea,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.chip,
            },
          ]}
        />
      ) : null}

      <AnimatedPressable
        variant="primary"
        onPress={submit}
        style={[styles.submitBtn, { backgroundColor: colors.brand }, cardShadow(true)]}>
        <Text style={[styles.submitText, { color: colors.inverseText }]}>
          {t('feedbackSubmit')}
        </Text>
      </AnimatedPressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg, paddingBottom: space.xxl },
  hint: { fontSize: 14, lineHeight: 20, marginBottom: space.lg },
  issueRow: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.lg,
    marginBottom: space.sm,
  },
  issueText: { fontSize: 16, fontWeight: '700' },
  textArea: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    minHeight: 120,
    fontSize: 15,
    marginTop: space.sm,
    marginBottom: space.lg,
  },
  submitBtn: {
    borderRadius: radii.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
    marginTop: space.md,
  },
  submitText: { fontSize: 16, fontWeight: '800' },
});
