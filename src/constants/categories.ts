/** Expense categories aligned with the original WPF app (id = XAML x:Name). */
export type ExpenseCategory = {
  id: string;
  iconName: string;
  color: string;
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'Pets', iconName: 'Dog', color: '#FFA500' },
  { id: 'Connection', iconName: 'Phone', color: '#7CFC00' },
  { id: 'Restaurant', iconName: 'Restaurant', color: '#800080' },
  { id: 'Taxi', iconName: 'Car', color: '#E6C200' },
  { id: 'Clothes', iconName: 'ClothesHanger', color: '#FFC0CB' },
  { id: 'Beverages', iconName: 'Beverages', color: '#FF0000' },
  { id: 'Transportation', iconName: 'Transportation', color: '#EE82EE' },
  { id: 'Home', iconName: 'Home', color: '#00CED1' },
  { id: 'Hygiene', iconName: 'OralHygiene', color: '#008000' },
  { id: 'Sport', iconName: 'YoutubeSports', color: '#F4A460' },
  { id: 'Gift', iconName: 'Gift', color: '#00BFFF' },
  { id: 'Health', iconName: 'HealthPotion', color: '#00FA9A' },
  { id: 'CarRepair', iconName: 'CarRepair', color: '#D2B48C' },
  { id: 'Market', iconName: 'Marketplace', color: '#FF69B4' },
];
