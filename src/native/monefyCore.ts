import { apiRequest } from '../api/client';

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
  addIncomeJson(json: string): Promise<boolean>;
  addCustomCategoryJson(json: string): Promise<boolean>;
  addIncome(cardNumber: string, amount: number): Promise<boolean>;
  removeTransaction(transactionId: number): Promise<boolean>;
  transferBetweenCards(
    fromCard: string,
    toCard: string,
    amount: number,
    description: string,
  ): Promise<boolean>;
  lookupCard(cardNumber: string): Promise<string>;
  transferToCard(
    fromCard: string,
    toCard: string,
    amount: number,
    description: string,
  ): Promise<boolean>;
  setUserId(userId: string): Promise<boolean>;
  clearUserData(): Promise<boolean>;
};

export function parseJson<T>(s: string): T {
  return JSON.parse(s) as T;
}

function ok(): boolean {
  return true;
}

export const MonefyCore: CoreModule = {
  async getCoreVersion() {
    return 'monefy-bank-cpp-api';
  },
  async getLastError() {
    return '';
  },
  async getCardsJson() {
    const cards = await apiRequest<unknown[]>('/api/cards');
    return JSON.stringify(cards);
  },
  async getTransactionsJson() {
    const tx = await apiRequest<unknown[]>('/api/transactions');
    return JSON.stringify(tx);
  },
  async getTransactionsForDay(day: string) {
    const tx = await apiRequest<unknown[]>(
      `/api/transactions?day=${encodeURIComponent(day)}`,
    );
    return JSON.stringify(tx);
  },
  async getCategoryTotalsForDay(day: string) {
    const totals = await apiRequest<unknown[]>(
      `/api/category-totals?day=${encodeURIComponent(day)}`,
    );
    return JSON.stringify(totals);
  },
  async getCustomCategoriesJson() {
    const categories = await apiRequest<unknown[]>('/api/categories');
    return JSON.stringify(categories);
  },
  async getCategoryDatesJson(categoryId: string) {
    const rows = await apiRequest<unknown[]>(
      `/api/category-dates/${encodeURIComponent(categoryId)}`,
    );
    return JSON.stringify(rows);
  },
  async getTotalBalance() {
    const response = await apiRequest<{ total: number }>('/api/balance');
    return response.total;
  },
  async addCardJson(json: string) {
    await apiRequest('/api/cards', { method: 'POST', body: JSON.parse(json) });
    return ok();
  },
  async updateCardJson(oldNumber: string, json: string) {
    await apiRequest(`/api/cards/${encodeURIComponent(oldNumber)}`, {
      method: 'PUT',
      body: JSON.parse(json),
    });
    return ok();
  },
  async removeCard(cardNumber: string) {
    await apiRequest(`/api/cards/${encodeURIComponent(cardNumber)}`, {
      method: 'DELETE',
    });
    return ok();
  },
  async addExpenseJson(json: string) {
    await apiRequest('/api/transactions/expense', {
      method: 'POST',
      body: JSON.parse(json),
    });
    return ok();
  },
  async addIncomeJson(json: string) {
    await apiRequest('/api/transactions/income', {
      method: 'POST',
      body: JSON.parse(json),
    });
    return ok();
  },
  async addCustomCategoryJson(json: string) {
    await apiRequest('/api/categories', { method: 'POST', body: JSON.parse(json) });
    return ok();
  },
  async addIncome(cardNumber: string, amount: number) {
    await apiRequest('/api/transactions/income', {
      method: 'POST',
      body: {
        amount,
        paymentCard: cardNumber,
        category: 'TopUp',
        iconName: 'TopUp',
        iconColor: '#059669',
        date: new Date().toISOString().split('T')[0],
      },
    });
    return ok();
  },
  async removeTransaction(transactionId: number) {
    await apiRequest(`/api/transactions/${transactionId}`, { method: 'DELETE' });
    return ok();
  },
  async transferBetweenCards(
    fromCard: string,
    toCard: string,
    amount: number,
    description: string,
  ) {
    await apiRequest('/api/transfers/internal', {
      method: 'POST',
      body: { fromCard, toCard, amount, description },
    });
    return ok();
  },
  async lookupCard(cardNumber: string) {
    const result = await apiRequest(
      `/api/cards/lookup/${encodeURIComponent(cardNumber)}`,
    );
    return JSON.stringify(result);
  },
  async transferToCard(
    fromCard: string,
    toCard: string,
    amount: number,
    description: string,
  ) {
    await apiRequest('/api/transfers/external', {
      method: 'POST',
      body: { fromCard, toCard, amount, description },
    });
    return ok();
  },
  async setUserId() {
    return ok();
  },
  async clearUserData() {
    return ok();
  },
};
