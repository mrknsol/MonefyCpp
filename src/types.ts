export type Card = {
  name: string;
  surname: string;
  number: string;
  monthOfExpiry: string;
  yearOfExpiry: string;
  cvv: string;
  balance: number;
};

export type Transaction = {
  id: number;
  amount: number;
  description: string;
  category: string;
  iconName: string;
  iconColor: string;
  date: string;
  paymentCard: string;
};

export type CategoryTotal = {
  category: string;
  amount: number;
  iconName: string;
  iconColor: string;
};

export type CustomCategory = {
  id: string;
  label: string;
  iconName: string;
  iconColor: string;
};

export type CategoryDayActivity = {
  date: string;
  total: number;
  count: number;
};

/** Row used when merging built-in + custom categories in the UI */
export type UiCategory = {
  id: string;
  label: string;
  iconName: string;
  color: string;
  isCustom: boolean;
};
