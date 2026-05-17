#pragma once

#ifdef __cplusplus
extern "C" {
#endif

/** Core version string (static, do not free). */
const char *monefy_core_version(void);

/** Last error from API call (static buffer in library). */
const char *monefy_last_error(void);

/**
 * Initialize persistence under `documents_dir` (UTF-8 path, no trailing slash).
 * Creates/overwrites JSON files as needed. Call once at startup.
 */
int monefy_init(const char *documents_dir);

void monefy_free_string(char *ptr);

/** JSON arrays as malloc'd UTF-8 strings (free with monefy_free_string). */
char *monefy_get_cards_json(void);
char *monefy_get_transactions_json(void);
char *monefy_get_transactions_for_day(const char *yyyy_mm_dd);
char *monefy_get_category_totals_for_day(const char *yyyy_mm_dd);
char *monefy_get_custom_categories_json(void);
char *monefy_get_category_dates_json(const char *category_id_utf8);

double monefy_total_balance(void);

/** Card JSON: name, surname, number, monthOfExpiry, yearOfExpiry, cvv, balance */
int monefy_add_card_json(const char *card_json);
int monefy_update_card_json(const char *old_number_utf8,
                            const char *card_json);
int monefy_remove_card(const char *card_number_utf8);

/** Transaction JSON: amount, description, category, iconName, iconColor,
 * date (YYYY-MM-DD), paymentCard */
int monefy_add_expense_json(const char *transaction_json);
int monefy_add_custom_category_json(const char *category_json);
int monefy_add_income_json(const char *transaction_json);

int monefy_add_income(const char *card_number_utf8, double amount);

int monefy_remove_transaction(long long transaction_id);

/** Transfer `amount` from one card to another (atomic). */
int monefy_transfer_between_cards(const char *from_card_utf8,
                                  const char *to_card_utf8, double amount,
                                  const char *description_utf8);

/** User management functions */
void monefy_set_user_id(const char *user_id);
void monefy_clear_user_data(void);

#ifdef __cplusplus
}
#endif
