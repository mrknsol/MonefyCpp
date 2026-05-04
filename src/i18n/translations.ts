import type { CustomCategory } from '../types';

export type AppLocale = 'ru' | 'en';

export type ThemeMode = 'light' | 'dark' | 'system';

export type DateDisplayMode = 'long' | 'short' | 'iso';

export const BUILTIN_CATEGORY_LABELS: Record<AppLocale, Record<string, string>> = {
  ru: {
    Pets: 'Питомцы',
    Connection: 'Связь',
    Restaurant: 'Ресторан',
    Taxi: 'Такси',
    Clothes: 'Одежда',
    Beverages: 'Напитки',
    Transportation: 'Транспорт',
    Home: 'Дом',
    Hygiene: 'Гигиена',
    Sport: 'Спорт',
    Gift: 'Подарки',
    Health: 'Здоровье',
    CarRepair: 'Авто',
    Market: 'Магазин',
  },
  en: {
    Pets: 'Pets',
    Connection: 'Connectivity',
    Restaurant: 'Restaurant',
    Taxi: 'Taxi',
    Clothes: 'Clothes',
    Beverages: 'Beverages',
    Transportation: 'Transport',
    Home: 'Home',
    Hygiene: 'Hygiene',
    Sport: 'Sport',
    Gift: 'Gifts',
    Health: 'Health',
    CarRepair: 'Car',
    Market: 'Groceries',
  },
};

export function resolveCategoryLabel(
  id: string,
  locale: AppLocale,
  custom: CustomCategory[],
): string {
  const row = custom.find(c => c.id === id);
  if (row) {
    return row.label;
  }
  return BUILTIN_CATEGORY_LABELS[locale][id] ?? id;
}

const ru: Record<string, string> = {
  navHome: 'Monefy',
  navCalculator: 'Сумма',
  navCategories: 'Категория',
  navPay: 'Карта',
  navCards: 'Карты',
  navAddCard: 'Новая карта',
  navSettings: 'Настройки',
  navAllCategories: 'Категории',
  navCategoryDays: 'История',
  navAddCategory: 'Своя категория',
  navEditCard: 'Карта',

  balanceAllCards: 'Баланс всех карт',
  expensesByCategory: 'Расходы по категориям',
  noExpensesDay: 'Нет расходов в этот день',
  operationsDay: 'Операции за день',
  noOperations: 'Нет операций',
  newExpense: 'Новый расход',
  addCardHint: 'Добавьте карту, чтобы вести расходы',
  topUpCard: 'Пополнить карту',
  myCards: 'Мои карты',
  browseCategories: 'Все категории',
  coreFooter: 'C++ core {version}',
  deleteOpQ: 'Удалить операцию?',
  cancel: 'Отмена',
  remove: 'Удалить',
  error: 'Ошибка',
  today: 'Сегодня',

  settingsTitle: 'Настройки',
  language: 'Язык',
  theme: 'Тема',
  themeSystem: 'Как в системе',
  themeLight: 'Светлая',
  themeDark: 'Тёмная',
  dateFormat: 'Формат даты',
  dateLong: 'Полная (день недели)',
  dateShort: 'Краткая (дд.мм.гггг)',
  dateIso: 'ISO (ГГГГ-ММ-ДД)',
  addCategoryBtn: 'Добавить свою категорию',

  allCategoriesTitle: 'Категории',
  allCategoriesHint: 'Нажмите категорию, чтобы увидеть даты операций',
  builtin: 'Стандартные',
  customSection: 'Свои',

  categoryDaysTitle: 'Операции по датам',
  noActivity: 'Пока нет операций в этой категории',
  txCount: '{n} опер.',

  addCategoryTitle: 'Новая категория',
  categoryName: 'Название',
  pickIcon: 'Иконка',
  save: 'Сохранить',
  duplicateId: 'Такой id уже есть у стандартной категории',

  firstName: 'Имя',
  lastName: 'Фамилия',
  cardNumber: 'Номер карты',
  monthShort: 'Мес.',
  yearShort: 'Год',
  cvv: 'CVV',
  initialBalance: 'Начальный баланс',
  balance: 'Баланс',
  cardNumberRequired: 'Номер карты обязателен',

  amountTitle: 'Сумма',
  enterPositive: 'Введите положительную сумму',
  nextCategory: 'Дальше: категория',
  reset: 'Сброс',
  commentPh: 'Комментарий (необязательно)',

  pickDebitCard: 'Выберите карту списания',
  noCardsWarn: 'Нет карт',

  expensesTab: 'Расходы',
  topUpTab: 'Пополнение карты',
  sumLabel: 'Сумма',
  noCardsForTopup: 'Нет карт — добавьте в разделе «Карты»',

  addCard: '+ Добавить карту',
  edit: 'Изменить',
  deleteCardQ: 'Удалить карту?',
  noCardsYet: 'Пока нет карт',
  until: 'до',

  langRu: 'Русский',
  langEn: 'English',
};

const en: Record<string, string> = {
  navHome: 'Monefy',
  navCalculator: 'Amount',
  navCategories: 'Category',
  navPay: 'Card',
  navCards: 'Cards',
  navAddCard: 'New card',
  navSettings: 'Settings',
  navAllCategories: 'Categories',
  navCategoryDays: 'History',
  navAddCategory: 'Custom category',
  navEditCard: 'Card',

  balanceAllCards: 'Total card balance',
  expensesByCategory: 'Spending by category',
  noExpensesDay: 'No spending on this day',
  operationsDay: 'Transactions',
  noOperations: 'No transactions',
  newExpense: 'New expense',
  addCardHint: 'Add a card to record expenses',
  topUpCard: 'Top up card',
  myCards: 'My cards',
  browseCategories: 'All categories',
  coreFooter: 'C++ core {version}',
  deleteOpQ: 'Delete transaction?',
  cancel: 'Cancel',
  remove: 'Delete',
  error: 'Error',
  today: 'Today',

  settingsTitle: 'Settings',
  language: 'Language',
  theme: 'Theme',
  themeSystem: 'Match system',
  themeLight: 'Light',
  themeDark: 'Dark',
  dateFormat: 'Date format',
  dateLong: 'Long (weekday)',
  dateShort: 'Short (DD/MM/YYYY)',
  dateIso: 'ISO (YYYY-MM-DD)',
  addCategoryBtn: 'Add custom category',

  allCategoriesTitle: 'Categories',
  allCategoriesHint: 'Tap a category to see transaction dates',
  builtin: 'Built-in',
  customSection: 'Custom',

  categoryDaysTitle: 'Activity by date',
  noActivity: 'No transactions in this category yet',
  txCount: '{n} tx',

  addCategoryTitle: 'New category',
  categoryName: 'Name',
  pickIcon: 'Icon',
  save: 'Save',
  duplicateId: 'This id is already used by a built-in category',

  firstName: 'First name',
  lastName: 'Last name',
  cardNumber: 'Card number',
  monthShort: 'Mo.',
  yearShort: 'Yr.',
  cvv: 'CVV',
  initialBalance: 'Initial balance',
  balance: 'Balance',
  cardNumberRequired: 'Card number is required',

  amountTitle: 'Amount',
  enterPositive: 'Enter a positive amount',
  nextCategory: 'Next: category',
  reset: 'Clear',
  commentPh: 'Note (optional)',

  pickDebitCard: 'Choose payment card',
  noCardsWarn: 'No cards',

  expensesTab: 'Expenses',
  topUpTab: 'Top up',
  sumLabel: 'Amount',
  noCardsForTopup: 'No cards — add some under Cards',

  addCard: '+ Add card',
  edit: 'Edit',
  deleteCardQ: 'Remove card?',
  noCardsYet: 'No cards yet',
  until: 'exp.',

  langRu: 'Русский',
  langEn: 'English',
};

export const DICT: Record<AppLocale, Record<string, string>> = { ru, en };
