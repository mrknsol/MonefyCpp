import { NativeModules } from 'react-native';

type CoreModule = {
  getCoreVersion(): Promise<string>;
  getLastError(): Promise<string>;
  getCardsJson(): Promise<string>;
  getTransactionsJson(): Promise<string>;
  getTransactionsForDay(day: string): Promise<string>;
  getCategoryTotalsForDay(day: string): Promise<string>;
  getCustomCategoriesJson(): Promise<string>;
  getCategoryDatesJson(categoryId: string): Promise<string>;
  getTotalBalance(): Promise<number>;
  addCardJson(json: string): Promise<boolean>;
  updateCardJson(oldNumber: string, json: string): Promise<boolean>;
  removeCard(cardNumber: string): Promise<boolean>;
  addExpenseJson(json: string): Promise<boolean>;
  addCustomCategoryJson(json: string): Promise<boolean>;
  addIncome(cardNumber: string, amount: number): Promise<boolean>;
  removeTransaction(transactionId: number): Promise<boolean>;
};

const M = NativeModules.MonefyCoreModule as CoreModule;

export function parseJson<T>(s: string): T {
  return JSON.parse(s) as T;
}

export const MonefyCore = M;
