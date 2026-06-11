import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { apiSubmitFeedback, type FeedbackIssueType } from '../api/feedback.ts';
import { AnimatedPressable, animateNextLayout } from '../components/AnimatedPressable';
import { LoadingButtonContent } from '../components/LoadingButtonContent';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useScreenTitle } from '../hooks/useScreenTitle';
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

const ISSUE_TYPE_BY_KEY: Record<(typeof ISSUE_KEYS)[number], FeedbackIssueType> = {
  feedbackIssueCard: 'card',
  feedbackIssueTransfer: 'transfer',
  feedbackIssueLogin: 'login',
  feedbackIssueCrash: 'crash',
  feedbackIssueBalance: 'balance',
};

export function FeedbackScreen({ navigation }: Props) {
  const { colors, t } = useAppPreferences();
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useScreenTitle('feedbackTitle');

  const submit = async () => {
    if (showCustom) {
      if (!customText.trim()) {
        Alert.alert(t('error'), t('feedbackCustomRequired'));
        return;
      }
    } else if (!selectedIssue) {
      Alert.alert(t('error'), t('feedbackSelectIssue'));
      return;
    }

    const issueType: FeedbackIssueType = showCustom
      ? 'other'
      : ISSUE_TYPE_BY_KEY[selectedIssue as (typeof ISSUE_KEYS)[number]];
    const message = showCustom
      ? customText.trim()
      : t(selectedIssue as (typeof ISSUE_KEYS)[number]);

    setIsSubmitting(true);
    try {
      await apiSubmitFeedback(issueType, message);
      Alert.alert(t('feedbackThanksTitle'), t('feedbackThanksBody'), [
        { text: t('ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (e: unknown) {
      Alert.alert(t('error'), e instanceof Error ? e.message : String(e));
    } finally {
      setIsSubmitting(false);
    }
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
        disabled={isSubmitting}
        style={[
          styles.submitBtn,
          { backgroundColor: colors.brand, opacity: isSubmitting ? 0.7 : 1 },
          cardShadow(true),
        ]}>
        {isSubmitting ? (
          <LoadingButtonContent label={t('saving')} textColor={colors.inverseText} />
        ) : (
          <Text style={[styles.submitText, { color: colors.inverseText }]}>
            {t('feedbackSubmit')}
          </Text>
        )}
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
