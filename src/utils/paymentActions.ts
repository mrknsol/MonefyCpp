import type { AppIconName } from '../components/AppIcon';

export type PaymentActionId = 'transfer' | 'topup' | 'expense';

export const PAYMENT_ACTION_META: Record<
  PaymentActionId,
  { iconName: AppIconName; labelKey: 'transfer' | 'topUpLabel' | 'expense' }
> = {
  transfer: { iconName: 'transfer', labelKey: 'transfer' },
  topup: { iconName: 'topup', labelKey: 'topUpLabel' },
  expense: { iconName: 'expense', labelKey: 'expense' },
};

export function navigatePayment(
  navigation: { navigate: (name: string, params?: object) => void },
  actionId: PaymentActionId,
  params?: { fromCardNumber?: string },
) {
  switch (actionId) {
    case 'transfer':
      navigation.navigate('Transfer', {
        fromCardNumber: params?.fromCardNumber,
      });
      break;
    case 'topup':
      navigation.navigate('AddOperation', { type: 'income' });
      break;
    case 'expense':
      navigation.navigate('AddOperation', { type: 'expense' });
      break;
  }
}
