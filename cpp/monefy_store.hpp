#pragma once

#include <cstdint>
#include <mutex>
#include <string>

#include <nlohmann/json.hpp>

using json = nlohmann::json;

class MonefyStore {
public:
  bool init(const std::string &documents_dir, std::string &error);

  json get_cards() const;
  json get_transactions() const;
  json get_transactions_for_day(const std::string &yyyy_mm_dd) const;
  json category_totals_for_day(const std::string &yyyy_mm_dd) const;
  json get_custom_categories() const;
  json category_dates_activity(const std::string &category_id) const;
  bool add_custom_category(const json &c, std::string &error);
  double total_balance() const;

  bool add_card(const json &card, std::string &error);
  bool update_card(const std::string &old_number, const json &patch,
                   std::string &error);
  bool remove_card(const std::string &card_number, std::string &error);
  bool add_expense_transaction(const json &t, std::string &error);
  bool add_income(const std::string &card_number, double amount,
                  std::string &error);
  bool remove_transaction(std::int64_t id, std::string &error);

private:
  mutable std::mutex mutex_;
  std::string base_;
  json cards_{json::array()};
  json transactions_{json::array()};
  json custom_categories_{json::array()};
  std::int64_t next_transaction_id_{1};

  std::string cards_path() const { return base_ + "/cards.json"; }
  std::string transactions_path() const { return base_ + "/transactions.json"; }
  std::string custom_categories_path() const
  {
    return base_ + "/custom_categories.json";
  }

  void load_or_default(std::string &error);
  void persist_cards_unsafe();
  void persist_transactions_unsafe();
  void persist_custom_categories_unsafe();

  json *find_card_mut(const std::string &number);
  bool ensure_positive(double amount, std::string &error) const;
};
