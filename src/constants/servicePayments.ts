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
  | 'market';

export type ServicePayment = {
  id: ServicePaymentId;
  icon: string;
  labelKey: string;
  categoryId: string;
  descriptionKey: string;
};

export const SERVICE_PAYMENTS: ServicePayment[] = [
  {
    id: 'utilities',
    icon: '💡',
    labelKey: 'payUtilities',
    categoryId: 'Home',
    descriptionKey: 'payUtilitiesDesc',
  },
  {
    id: 'mobile',
    icon: '📱',
    labelKey: 'payMobile',
    categoryId: 'Connection',
    descriptionKey: 'payMobileDesc',
  },
  {
    id: 'internet',
    icon: '🌐',
    labelKey: 'payInternet',
    categoryId: 'Connection',
    descriptionKey: 'payInternetDesc',
  },
  {
    id: 'education',
    icon: '🎓',
    labelKey: 'payEducation',
    categoryId: 'Gift',
    descriptionKey: 'payEducationDesc',
  },
  {
    id: 'fines',
    icon: '⚖️',
    labelKey: 'payFines',
    categoryId: 'Transportation',
    descriptionKey: 'payFinesDesc',
  },
  {
    id: 'health',
    icon: '🏥',
    labelKey: 'payHealth',
    categoryId: 'Health',
    descriptionKey: 'payHealthDesc',
  },
  {
    id: 'games',
    icon: '🎮',
    labelKey: 'payGames',
    categoryId: 'Sport',
    descriptionKey: 'payGamesDesc',
  },
  {
    id: 'transport',
    icon: '🚌',
    labelKey: 'payTransport',
    categoryId: 'Transportation',
    descriptionKey: 'payTransportDesc',
  },
  {
    id: 'restaurant',
    icon: '🍽️',
    labelKey: 'payRestaurant',
    categoryId: 'Restaurant',
    descriptionKey: 'payRestaurantDesc',
  },
  {
    id: 'market',
    icon: '🛒',
    labelKey: 'payMarket',
    categoryId: 'Market',
    descriptionKey: 'payMarketDesc',
  },
];
