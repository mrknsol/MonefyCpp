#include "monefy_core.h"

#include <cstdlib>
#include <cstring>
#include <mutex>
#include <string>

#include <nlohmann/json.hpp>

#include "monefy_store.hpp"

namespace {

std::mutex g_mutex;
MonefyStore g_store;
thread_local std::string g_last_error;

char *dup_str(const std::string &s)
{
  char *p = static_cast<char *>(malloc(s.size() + 1));
  if (!p) {
    return nullptr;
  }
  memcpy(p, s.c_str(), s.size() + 1);
  return p;
}

void set_err(std::string msg)
{
  g_last_error = std::move(msg);
}

} // namespace

const char *monefy_core_version(void) { return "1.0.0-monefy-cpp"; }

const char *monefy_last_error(void) { return g_last_error.c_str(); }

int monefy_init(const char *documents_dir)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  g_last_error.clear();
  if (!documents_dir) {
    set_err("null documents_dir");
    return 0;
  }
  std::string err;
  if (!g_store.init(documents_dir, err)) {
    set_err(err);
    return 0;
  }
  return 1;
}

void monefy_free_string(char *ptr) { free(ptr); }

char *monefy_get_cards_json(void)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  try {
    return dup_str(g_store.get_cards().dump());
  } catch (const std::exception &e) {
    set_err(e.what());
    return nullptr;
  }
}

char *monefy_get_transactions_json(void)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  try {
    return dup_str(g_store.get_transactions().dump());
  } catch (const std::exception &e) {
    set_err(e.what());
    return nullptr;
  }
}

char *monefy_get_transactions_for_day(const char *yyyy_mm_dd)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  if (!yyyy_mm_dd) {
    set_err("null date");
    return nullptr;
  }
  try {
    return dup_str(
        g_store.get_transactions_for_day(yyyy_mm_dd).dump());
  } catch (const std::exception &e) {
    set_err(e.what());
    return nullptr;
  }
}

char *monefy_get_category_totals_for_day(const char *yyyy_mm_dd)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  if (!yyyy_mm_dd) {
    set_err("null date");
    return nullptr;
  }
  try {
    return dup_str(
        g_store.category_totals_for_day(yyyy_mm_dd).dump());
  } catch (const std::exception &e) {
    set_err(e.what());
    return nullptr;
  }
}

char *monefy_get_custom_categories_json(void)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  try {
    return dup_str(g_store.get_custom_categories().dump());
  } catch (const std::exception &e) {
    set_err(e.what());
    return nullptr;
  }
}

char *monefy_get_category_dates_json(const char *category_id_utf8)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  if (!category_id_utf8) {
    set_err("null category");
    return nullptr;
  }
  try {
    return dup_str(
        g_store.category_dates_activity(category_id_utf8).dump());
  } catch (const std::exception &e) {
    set_err(e.what());
    return nullptr;
  }
}

double monefy_total_balance(void)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  return g_store.total_balance();
}

int monefy_add_card_json(const char *card_json)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  g_last_error.clear();
  if (!card_json) {
    set_err("null card_json");
    return 0;
  }
  try {
    nlohmann::json j = nlohmann::json::parse(card_json);
    std::string err;
    if (!g_store.add_card(j, err)) {
      set_err(err);
      return 0;
    }
    return 1;
  } catch (const std::exception &e) {
    set_err(e.what());
    return 0;
  }
}

int monefy_update_card_json(const char *old_number_utf8,
                            const char *card_json)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  g_last_error.clear();
  if (!old_number_utf8 || !card_json) {
    set_err("null argument");
    return 0;
  }
  try {
    nlohmann::json j = nlohmann::json::parse(card_json);
    std::string err;
    if (!g_store.update_card(old_number_utf8, j, err)) {
      set_err(err);
      return 0;
    }
    return 1;
  } catch (const std::exception &e) {
    set_err(e.what());
    return 0;
  }
}

int monefy_remove_card(const char *card_number_utf8)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  g_last_error.clear();
  if (!card_number_utf8) {
    set_err("null card number");
    return 0;
  }
  std::string err;
  if (!g_store.remove_card(card_number_utf8, err)) {
    set_err(err);
    return 0;
  }
  return 1;
}

int monefy_add_expense_json(const char *transaction_json)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  g_last_error.clear();
  if (!transaction_json) {
    set_err("null transaction_json");
    return 0;
  }
  try {
    nlohmann::json j = nlohmann::json::parse(transaction_json);
    std::string err;
    if (!g_store.add_expense_transaction(j, err)) {
      set_err(err);
      return 0;
    }
    return 1;
  } catch (const std::exception &e) {
    set_err(e.what());
    return 0;
  }
}

int monefy_add_custom_category_json(const char *category_json)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  g_last_error.clear();
  if (!category_json) {
    set_err("null category_json");
    return 0;
  }
  try {
    nlohmann::json j = nlohmann::json::parse(category_json);
    std::string err;
    if (!g_store.add_custom_category(j, err)) {
      set_err(err);
      return 0;
    }
    return 1;
  } catch (const std::exception &e) {
    set_err(e.what());
    return 0;
  }
}

int monefy_add_income(const char *card_number_utf8, double amount)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  g_last_error.clear();
  if (!card_number_utf8) {
    set_err("null card number");
    return 0;
  }
  std::string err;
  if (!g_store.add_income(card_number_utf8, amount, err)) {
    set_err(err);
    return 0;
  }
  return 1;
}

int monefy_remove_transaction(long long transaction_id)
{
  std::lock_guard<std::mutex> lock(g_mutex);
  g_last_error.clear();
  std::string err;
  if (!g_store.remove_transaction(transaction_id, err)) {
    set_err(err);
    return 0;
  }
  return 1;
}
