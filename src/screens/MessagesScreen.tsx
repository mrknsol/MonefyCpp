import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { AppIcon, type AppIconName } from '../components/AppIcon';
import { useAppPreferences } from '../context/AppPreferencesContext';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { loadMessages, markMessageRead, type AppMessage } from '../services/messages';
import { cardShadow, radii, space } from '../theme/tokens';
import { formatDayForPreferences } from '../utils/date';

type Props = NativeStackScreenProps<RootStackParamList, 'Messages'>;

const TYPE_ICON: Record<AppMessage['type'], AppIconName> = {
  info: 'info',
  security: 'security',
  promo: 'promo',
};

export function MessagesScreen({ navigation }: Props) {
  const { colors, t, locale, dateDisplayMode } = useAppPreferences();
  const { user } = useAuth();
  const [messages, setMessages] = useState<AppMessage[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('messagesTitle') });
  }, [navigation, t]);

  const reload = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    setMessages(await loadMessages(user.id));
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const openMessage = async (msg: AppMessage) => {
    if (!user?.id) {
      return;
    }
    await markMessageRead(user.id, msg.id);
    await reload();
    navigation.navigate('MessageDetail', { messageId: msg.id });
  };

  return (
    <FlatList
      data={messages}
      keyExtractor={item => item.id}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <Text style={[styles.empty, { color: colors.textMuted }]}>{t('messagesEmpty')}</Text>
      }
      renderItem={({ item }) => (
        <AnimatedPressable
          variant="soft"
          onPress={() => openMessage(item)}
          style={[
            styles.row,
            {
              backgroundColor: colors.card,
              borderColor: item.read ? colors.border : colors.brand,
            },
            cardShadow(false),
          ]}>
          <AppIcon
            name={TYPE_ICON[item.type]}
            color={item.read ? colors.textMuted : colors.brand}
            backgroundColor={colors.chip}
            size={34}
            style={styles.glyph}
          />
          <View style={styles.mid}>
            <Text
              style={[
                styles.title,
                { color: colors.text, fontWeight: item.read ? '600' : '800' },
              ]}
              numberOfLines={1}>
              {t(item.titleKey)}
            </Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatDayForPreferences(item.date, locale, dateDisplayMode)}
            </Text>
          </View>
          {!item.read ? (
            <View style={[styles.dot, { backgroundColor: colors.brand }]} />
          ) : null}
        </AnimatedPressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, gap: space.sm },
  empty: { textAlign: 'center', marginTop: space.xxl, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: space.md,
    marginBottom: space.sm,
  },
  glyph: { marginRight: space.sm },
  mid: { flex: 1 },
  title: { fontSize: 15 },
  date: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
