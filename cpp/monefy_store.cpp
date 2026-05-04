#include "monefy_store.hpp"

#include <algorithm>
#include <chrono>
#include <fstream>
#include <map>
#include <sstream>

#include "cards_core.hpp"
#include "finance_core.hpp"

namespace {

bool read_json_file(const std::string &path, json &out, std::string &error)
{
  std::ifstream in(path);
  if (!in) {
    out = json::array();
    return true;
  }
  try {
    in >> out;
    return true;
  } catch (const std::exception &e) {
    error = e.what();
    return false;
  }
}

void write_json_file(const std::string &path, const json &data)
{
  std::ofstream out(path, std::ios::trunc);
  out << data.dump(2);
}

} // namespace

bool MonefyStore::init(const std::string &documents_dir, std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  if (documents_dir.empty()) {
    error = "empty documents directory";
    return false;
  }
  base_ = documents_dir;
  if (base_.back() == '/') {
    base_.pop_back();
  }
  load_or_default(error);
  return error.empty();
}

void MonefyStore::load_or_default(std::string &error)
{
  json cards_raw;
  json trans_raw;
  if (!read_json_file(cards_path(), cards_raw, error)) {
    return;
  }
  if (!read_json_file(transactions_path(), trans_raw, error)) {
    return;
  }
  json cc_raw;
  if (!read_json_file(custom_categories_path(), cc_raw, error)) {
    return;
  }
  if (!cards_raw.is_array()) {
    cards_ = json::array();
  } else {
    cards_ = std::move(cards_raw);
  }
  if (!trans_raw.is_array()) {
    transactions_ = json::array();
  } else {
    transactions_ = std::move(trans_raw);
  }
  if (!cc_raw.is_array()) {
    custom_categories_ = json::array();
  } else {
    custom_categories_ = std::move(cc_raw);
  }
  std::int64_t max_id = 0;
  for (const auto &t : transactions_) {
    if (t.contains("id") && t["id"].is_number_integer()) {
      max_id = std::max(max_id, t["id"].get<std::int64_t>());
    }
  }
  next_transaction_id_ = max_id + 1;
}

json MonefyStore::get_cards() const
{
  std::lock_guard<std::mutex> lock(mutex_);
  return cards_;
}

json MonefyStore::get_transactions() const
{
  std::lock_guard<std::mutex> lock(mutex_);
  return transactions_;
}

json MonefyStore::get_transactions_for_day(const std::string &yyyy_mm_dd) const
{
  std::lock_guard<std::mutex> lock(mutex_);
  json out = json::array();
  for (const auto &t : transactions_) {
    if (!t.contains("date"))
      continue;
    std::string d = t["date"].get<std::string>();
    if (d.size() >= 10) {
      d = d.substr(0, 10);
    }
    if (d == yyyy_mm_dd) {
      out.push_back(t);
    }
  }
  return out;
}

json MonefyStore::get_custom_categories() const
{
  std::lock_guard<std::mutex> lock(mutex_);
  return custom_categories_;
}

json MonefyStore::category_dates_activity(const std::string &category_id) const
{
  std::lock_guard<std::mutex> lock(mutex_);
  std::map<std::string, std::pair<double, int>> agg;
  for (const auto &t : transactions_) {
    if (!t.contains("category"))
      continue;
    if (t["category"].get<std::string>() != category_id)
      continue;
    std::string d = t.value("date", "");
    if (d.size() >= 10) {
      d = d.substr(0, 10);
    }
    if (d.empty())
      continue;
    double amt = t.value("amount", 0.0);
    auto &p = agg[d];
    p.first = finance_core::add_amounts(p.first, amt);
    p.second += 1;
  }
  std::vector<std::string> dates;
  dates.reserve(agg.size());
  for (const auto &kv : agg) {
    dates.push_back(kv.first);
  }
  std::sort(dates.begin(), dates.end(), std::greater<std::string>());
  json arr = json::array();
  for (const auto &d : dates) {
    json row;
    row["date"] = d;
    row["total"] = agg.at(d).first;
    row["count"] = agg.at(d).second;
    arr.push_back(row);
  }
  return arr;
}

bool MonefyStore::add_custom_category(const json &c, std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  if (!c.contains("label") || !c["label"].is_string()) {
    error = "label required";
    return false;
  }
  std::string id;
  if (c.contains("id") && c["id"].is_string() && !c["id"].get<std::string>().empty()) {
    id = c["id"].get<std::string>();
  } else {
    const auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
                        std::chrono::system_clock::now().time_since_epoch())
                        .count();
    id = "custom_" + std::to_string(ms);
  }
  for (const auto &x : custom_categories_) {
    if (x.contains("id") && x["id"].get<std::string>() == id) {
      error = "duplicate category id";
      return false;
    }
  }
  json row;
  row["id"] = id;
  row["label"] = c["label"].get<std::string>();
  row["iconName"] = c.value("iconName", "Custom");
  row["iconColor"] = c.value("iconColor", "#888888");
  custom_categories_.push_back(row);
  persist_custom_categories_unsafe();
  return true;
}

json MonefyStore::category_totals_for_day(const std::string &yyyy_mm_dd) const
{
  std::lock_guard<std::mutex> lock(mutex_);
  struct Key {
    std::string category;
    std::string icon_name;
    std::string icon_color;
  };
  struct Agg {
    double amount{0};
    std::string icon_name;
    std::string icon_color;
  };

  std::vector<Key> order;
  auto key_index = [&](const Key &k) -> int {
    for (int i = 0; i < static_cast<int>(order.size()); ++i) {
      if (order[i].category == k.category &&
          order[i].icon_name == k.icon_name &&
          order[i].icon_color == k.icon_color) {
        return i;
      }
    }
    return -1;
  };
  std::vector<Agg> aggs;

  for (const auto &t : transactions_) {
    if (!t.contains("date"))
      continue;
    std::string d = t["date"].get<std::string>();
    if (d.size() >= 10)
      d = d.substr(0, 10);
    if (d != yyyy_mm_dd)
      continue;
    double amt = 0;
    if (t.contains("amount") && t["amount"].is_number()) {
      amt = t["amount"].get<double>();
    }
    Key k{t.value("category", ""), t.value("iconName", ""),
          t.value("iconColor", "")};
    int idx = key_index(k);
    if (idx < 0) {
      order.push_back(k);
      aggs.push_back({amt, k.icon_name, k.icon_color});
    } else {
      aggs[idx].amount =
          finance_core::add_amounts(aggs[idx].amount, amt);
    }
  }

  json arr = json::array();
  for (size_t i = 0; i < order.size(); ++i) {
    json row;
    row["category"] = order[i].category;
    row["amount"] = aggs[i].amount;
    row["iconName"] = aggs[i].icon_name;
    row["iconColor"] = aggs[i].icon_color;
    arr.push_back(row);
  }
  return arr;
}

double MonefyStore::total_balance() const
{
  std::lock_guard<std::mutex> lock(mutex_);
  std::vector<double> vals;
  for (const auto &c : cards_) {
    if (c.contains("balance") && c["balance"].is_number()) {
      vals.push_back(c["balance"].get<double>());
    }
  }
  return finance_core::sum_array(vals.data(),
                                   static_cast<int>(vals.size()));
}

json *MonefyStore::find_card_mut(const std::string &number)
{
  for (auto &c : cards_) {
    if (c.contains("number") && c["number"].get<std::string>() == number) {
      return &c;
    }
  }
  return nullptr;
}

bool MonefyStore::ensure_positive(double amount, std::string &error) const
{
  if (!finance_core::is_valid_positive_amount(amount)) {
    error = "amount must be positive";
    return false;
  }
  return true;
}

bool MonefyStore::add_card(const json &card, std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  if (!card.contains("number") || !card["number"].is_string()) {
    error = "card.number required";
    return false;
  }
  const std::string num = card["number"].get<std::string>();
  for (const auto &c : cards_) {
    if (c["number"].get<std::string>() == num) {
      error = "duplicate card number";
      return false;
    }
  }
  json copy = card;
  if (!copy.contains("balance")) {
    copy["balance"] = 0.0;
  }
  cards_.push_back(copy);
  persist_cards_unsafe();
  return true;
}

bool MonefyStore::update_card(const std::string &old_number, const json &patch,
                              std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  size_t idx = static_cast<size_t>(-1);
  for (size_t i = 0; i < cards_.size(); ++i) {
    if (cards_[i].contains("number") &&
        cards_[i]["number"].get<std::string>() == old_number) {
      idx = i;
      break;
    }
  }
  if (idx == static_cast<size_t>(-1)) {
    error = "card not found";
    return false;
  }
  json merged = cards_[idx];
  for (auto it = patch.begin(); it != patch.end(); ++it) {
    merged[it.key()] = it.value();
  }
  if (!merged.contains("number") || !merged["number"].is_string()) {
    error = "number required";
    return false;
  }
  const std::string new_number = merged["number"].get<std::string>();
  for (size_t i = 0; i < cards_.size(); ++i) {
    if (i == idx) {
      continue;
    }
    if (cards_[i]["number"].get<std::string>() == new_number) {
      error = "duplicate card number";
      return false;
    }
  }
  if (new_number != old_number) {
    for (auto &t : transactions_) {
      if (t.contains("paymentCard") &&
          t["paymentCard"].get<std::string>() == old_number) {
        t["paymentCard"] = new_number;
      }
    }
  }
  cards_[idx] = std::move(merged);
  persist_cards_unsafe();
  persist_transactions_unsafe();
  return true;
}

bool MonefyStore::remove_card(const std::string &card_number,
                              std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  for (size_t i = 0; i < cards_.size(); ++i) {
    if (cards_[i]["number"].get<std::string>() == card_number) {
      cards_.erase(cards_.begin() + static_cast<std::ptrdiff_t>(i));
      persist_cards_unsafe();
      return true;
    }
  }
  error = "card not found";
  return false;
}

bool MonefyStore::add_expense_transaction(const json &t, std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  if (!t.contains("amount") || !t["amount"].is_number()) {
    error = "amount required";
    return false;
  }
  const double amount = t["amount"].get<double>();
  if (!ensure_positive(amount, error)) {
    return false;
  }
  if (!t.contains("paymentCard") || !t["paymentCard"].is_string()) {
    error = "paymentCard required";
    return false;
  }
  const std::string pay_card = t["paymentCard"].get<std::string>();
  json *card = find_card_mut(pay_card);
  if (!card) {
    error = "payment card not found";
    return false;
  }
  double bal = (*card)["balance"].get<double>();
  bal = cards_core::withdraw_amount(bal, amount);
  (*card)["balance"] = bal;

  json row = t;
  row["id"] = next_transaction_id_++;
  if (row.contains("date") && row["date"].is_string()) {
    std::string d = row["date"].get<std::string>();
    if (d.size() >= 10) {
      row["date"] = d.substr(0, 10);
    }
  }
  transactions_.push_back(row);
  persist_cards_unsafe();
  persist_transactions_unsafe();
  return true;
}

bool MonefyStore::add_income(const std::string &card_number, double amount,
                             std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  if (!ensure_positive(amount, error)) {
    return false;
  }
  json *card = find_card_mut(card_number);
  if (!card) {
    error = "card not found";
    return false;
  }
  double bal = (*card)["balance"].get<double>();
  bal = cards_core::deposit_amount(bal, amount);
  (*card)["balance"] = bal;
  persist_cards_unsafe();
  return true;
}

bool MonefyStore::remove_transaction(std::int64_t id, std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  for (size_t i = 0; i < transactions_.size(); ++i) {
    if (!transactions_[i].contains("id"))
      continue;
    if (transactions_[i]["id"].get<std::int64_t>() != id)
      continue;
    const auto &t = transactions_[i];
    double amount = t.value("amount", 0.0);
    std::string pay = t.value("paymentCard", "");
    if (!pay.empty() && finance_core::is_valid_positive_amount(amount)) {
      json *card = find_card_mut(pay);
      if (card) {
        double bal = (*card)["balance"].get<double>();
        bal = cards_core::deposit_amount(bal, amount);
        (*card)["balance"] = bal;
      }
    }
    transactions_.erase(transactions_.begin() +
                        static_cast<std::ptrdiff_t>(i));
    persist_cards_unsafe();
    persist_transactions_unsafe();
    return true;
  }
  error = "transaction not found";
  return false;
}

void MonefyStore::persist_cards_unsafe() { write_json_file(cards_path(), cards_); }

void MonefyStore::persist_transactions_unsafe()
{
  write_json_file(transactions_path(), transactions_);
}

void MonefyStore::persist_custom_categories_unsafe()
{
  write_json_file(custom_categories_path(), custom_categories_);
}
