import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { loadMessages } from '../services/messages';
import { cardShadow, radii, space } from '../theme/tokens';
import { formatDayForPreferences } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'MessageDetail'>;

export function MessageDetailScreen({ navigation, route }: Props) {
  const { colors, t, locale, dateDisplayMode } = useAppPreferences();
  const { user } = useAuth();
  const [body, setBody] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('messageDetailTitle') });
  }, [navigation, t]);

  React.useEffect(() => {
    if (!user?.id) {
      return;
    }
    loadMessages(user.id).then(msgs => {
      const msg = msgs.find(m => m.id === route.params.messageId);
      if (msg) {
        setTitle(t(msg.titleKey));
        setBody(t(msg.bodyKey));
        setDate(msg.date);
      }
    });
  }, [route.params.messageId, t, user?.id]);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.wrap}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          cardShadow(false),
        ]}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {date ? formatDayForPreferences(date, locale, dateDisplayMode) : ''}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.lg },
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.lg,
  },
  title: { fontSize: 20, fontWeight: '800', marginBottom: space.sm },
  date: { fontSize: 13, fontWeight: '600', marginBottom: space.lg },
  body: { fontSize: 15, lineHeight: 22 },
});
