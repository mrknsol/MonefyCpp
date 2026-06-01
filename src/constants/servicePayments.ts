import type { AppIconName } from '../components/AppIcon';

export type ServicePaymentId =
  | 'utilities'
  | 'mobile'
  | 'internet'
  | 'education'
  | 'fines'
  | 'health'
  | 'games'
  | 'transport'
  | 'restaurant'
  | 'market'
  | 'subscriptions'
  | 'travel'
  | 'charity'
  | 'beauty';

export type ServicePayment = {
  id: ServicePaymentId;
  iconName: AppIconName;
  labelKey: string;
  categoryId: string;
  descriptionKey: string;
};

export const SERVICE_PAYMENTS: ServicePayment[] = [
  {
    id: 'utilities',
    iconName: 'utilities',
    labelKey: 'payUtilities',
    categoryId: 'Home',
    descriptionKey: 'payUtilitiesDesc',
  },
  {
    id: 'mobile',
    iconName: 'phone',
    labelKey: 'payMobile',
    categoryId: 'Connection',
    descriptionKey: 'payMobileDesc',
  },
  {
    id: 'internet',
    iconName: 'internet',
    labelKey: 'payInternet',
    categoryId: 'Connection',
    descriptionKey: 'payInternetDesc',
  },
  {
    id: 'education',
    iconName: 'education',
    labelKey: 'payEducation',
    categoryId: 'Gift',
    descriptionKey: 'payEducationDesc',
  },
  {
    id: 'fines',
    iconName: 'fines',
    labelKey: 'payFines',
    categoryId: 'Transportation',
    descriptionKey: 'payFinesDesc',
  },
  {
    id: 'health',
    iconName: 'health',
    labelKey: 'payHealth',
    categoryId: 'Health',
    descriptionKey: 'payHealthDesc',
  },
  {
    id: 'games',
    iconName: 'games',
    labelKey: 'payGames',
    categoryId: 'Sport',
    descriptionKey: 'payGamesDesc',
  },
  {
    id: 'transport',
    iconName: 'transport',
    labelKey: 'payTransport',
    categoryId: 'Transportation',
    descriptionKey: 'payTransportDesc',
  },
  {
    id: 'restaurant',
    iconName: 'restaurant',
    labelKey: 'payRestaurant',
    categoryId: 'Restaurant',
    descriptionKey: 'payRestaurantDesc',
  },
  {
    id: 'market',
    iconName: 'market',
    labelKey: 'payMarket',
    categoryId: 'Market',
    descriptionKey: 'payMarketDesc',
  },
  {
    id: 'subscriptions',
    iconName: 'subscriptions',
    labelKey: 'paySubscriptions',
    categoryId: 'Market',
    descriptionKey: 'paySubscriptionsDesc',
  },
  {
    id: 'travel',
    iconName: 'travel',
    labelKey: 'payTravel',
    categoryId: 'Transportation',
    descriptionKey: 'payTravelDesc',
  },
  {
    id: 'charity',
    iconName: 'charity',
    labelKey: 'payCharity',
    categoryId: 'Gift',
    descriptionKey: 'payCharityDesc',
  },
  {
    id: 'beauty',
    iconName: 'beauty',
    labelKey: 'payBeauty',
    categoryId: 'Hygiene',
    descriptionKey: 'payBeautyDesc',
  },
];

const SERVICE_PAYMENT_IDS = new Set(SERVICE_PAYMENTS.map(item => item.id));

export function isServicePaymentId(value: string): value is ServicePaymentId {
  return SERVICE_PAYMENT_IDS.has(value as ServicePaymentId);
}

export function getServicePayment(id: ServicePaymentId) {
  return SERVICE_PAYMENTS.find(item => item.id === id);
}
