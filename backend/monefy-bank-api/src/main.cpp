#include "email_sender.hpp"

#include <curl/curl.h>
#include <drogon/drogon.h>
#include <openssl/sha.h>
#include <pqxx/pqxx>

#include <chrono>
#include <cctype>
#include <cstdlib>
#include <ctime>
#include <fstream>
#include <iomanip>
#include <mutex>
#include <random>
#include <sstream>
#include <string>

using Callback = std::function<void(const drogon::HttpResponsePtr &)>;

namespace {

std::string env_or(const char *key, const std::string &fallback)
{
  const char *value = std::getenv(key);
  return value && *value ? std::string(value) : fallback;
}

std::string connection_string()
{
  return env_or("MONEFY_DB_CONNECTION",
                "host=localhost port=5432 dbname=fastbite0_SampleDB "
                "user=admin password=admin");
}

std::string random_hex(std::size_t bytes)
{
  static std::random_device rd;
  static std::mt19937_64 gen(rd());
  static std::uniform_int_distribution<int> dist(0, 255);

  std::ostringstream out;
  for (std::size_t i = 0; i < bytes; ++i) {
    out << std::hex << std::setw(2) << std::setfill('0') << dist(gen);
  }
  return out.str();
}

std::string uuid()
{
  const auto h = random_hex(16);
  return h.substr(0, 8) + "-" + h.substr(8, 4) + "-" + h.substr(12, 4) +
         "-" + h.substr(16, 4) + "-" + h.substr(20, 12);
}

std::string sha256(const std::string &value)
{
  unsigned char hash[SHA256_DIGEST_LENGTH];
  SHA256(reinterpret_cast<const unsigned char *>(value.data()), value.size(),
         hash);
  std::ostringstream out;
  for (unsigned char c : hash) {
    out << std::hex << std::setw(2) << std::setfill('0')
        << static_cast<int>(c);
  }
  return out.str();
}

std::string normalize_card(std::string value)
{
  std::string out;
  for (char c : value) {
    if (!std::isspace(static_cast<unsigned char>(c))) {
      out.push_back(c);
    }
  }
  return out;
}

std::string today_iso()
{
  const auto now = std::chrono::system_clock::now();
  const auto tt = std::chrono::system_clock::to_time_t(now);
  std::tm tm_buf{};
#ifdef _WIN32
  localtime_s(&tm_buf, &tt);
#else
  localtime_r(&tt, &tm_buf);
#endif
  char buf[11];
  std::strftime(buf, sizeof(buf), "%Y-%m-%d", &tm_buf);
  return std::string(buf);
}

drogon::HttpResponsePtr json_response(const Json::Value &json,
                                      drogon::HttpStatusCode code = drogon::k200OK)
{
  auto resp = drogon::HttpResponse::newHttpJsonResponse(json);
  resp->setStatusCode(code);
  return resp;
}

drogon::HttpResponsePtr error_response(const std::string &message,
                                       drogon::HttpStatusCode code)
{
  Json::Value json;
  json["error"] = message;
  return json_response(json, code);
}

std::string bearer_token(const drogon::HttpRequestPtr &req)
{
  const auto header = req->getHeader("authorization");
  const std::string prefix = "Bearer ";
  if (header.rfind(prefix, 0) == 0) {
    return header.substr(prefix.size());
  }
  return {};
}

class Db {
public:
  explicit Db(std::string conn) : conn_(std::move(conn)) {}

  pqxx::connection connect() const { return pqxx::connection(conn_); }

  void init_schema() const
  {
    const auto schema_path =
        env_or("MONEFY_SCHEMA_PATH", "backend/monefy-bank-api/sql/schema.sql");
    std::ifstream in(schema_path);
    if (!in) {
      LOG_WARN << "Schema file not found: " << schema_path;
      return;
    }
    std::stringstream buffer;
    buffer << in.rdbuf();
    auto c = connect();
    pqxx::work tx(c);
    tx.exec(buffer.str());
    tx.commit();
  }

private:
  std::string conn_;
};

Db db(connection_string());

std::string require_user_id(const drogon::HttpRequestPtr &req)
{
  const auto token = bearer_token(req);
  if (token.empty()) {
    return {};
  }
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec_params(
      "select user_id from sessions where token=$1 and expires_at > now()",
      token);
  tx.commit();
  if (rows.empty()) {
    return {};
  }
  return rows[0]["user_id"].as<std::string>();
}

bool require_auth(const drogon::HttpRequestPtr &req, const Callback &cb,
                  std::string &user_id)
{
  user_id = require_user_id(req);
  if (user_id.empty()) {
    cb(error_response("Unauthorized", drogon::k401Unauthorized));
    return false;
  }
  return true;
}

std::string body_string(const Json::Value &body, const char *key,
                        const std::string &fallback = "")
{
  return body.isMember(key) && body[key].isString() ? body[key].asString()
                                                     : fallback;
}

double body_double(const Json::Value &body, const char *key,
                   double fallback = 0.0)
{
  return body.isMember(key) && body[key].isNumeric() ? body[key].asDouble()
                                                     : fallback;
}

Json::Value user_json(const pqxx::row &row)
{
  Json::Value user;
  user["id"] = row["id"].as<std::string>();
  user["email"] = row["email"].as<std::string>();
  const auto first = row["first_name"].as<std::string>();
  const auto last = row["last_name"].as<std::string>();
  user["name"] = last.empty() ? first : first + " " + last;
  user["firstName"] = first;
  user["lastName"] = last;
  user["phone"] = row["phone"].is_null() ? "" : row["phone"].as<std::string>();
  user["createdAt"] = row["created_at"].as<std::string>();
  return user;
}

Json::Value card_json(const pqxx::row &row)
{
  Json::Value card;
  card["id"] = row["id"].as<std::string>();
  card["name"] = row["holder_first_name"].as<std::string>();
  card["surname"] = row["holder_last_name"].as<std::string>();
  card["number"] = row["card_number"].as<std::string>();
  card["monthOfExpiry"] = row["month_of_expiry"].as<std::string>();
  card["yearOfExpiry"] = row["year_of_expiry"].as<std::string>();
  card["cvv"] = row["cvv"].as<std::string>();
  card["balance"] = row["balance"].as<double>();
  return card;
}

Json::Value transaction_json(const pqxx::row &row)
{
  Json::Value tx;
  tx["id"] = row["id"].as<long long>();
  tx["amount"] = row["amount"].as<double>();
  tx["description"] = row["description"].as<std::string>();
  tx["category"] = row["category_id"].is_null() ? "" : row["category_id"].as<std::string>();
  tx["iconName"] = row["icon_name"].as<std::string>();
  tx["iconColor"] = row["icon_color"].as<std::string>();
  tx["date"] = row["operation_date"].as<std::string>();
  tx["paymentCard"] = row["payment_card"].as<std::string>();
  return tx;
}

void auth_register(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }

  const auto email = body_string(*body, "email");
  const auto password = body_string(*body, "password");
  const auto full_name = body_string(*body, "name");
  if (email.empty() || password.size() < 6 || full_name.empty()) {
    cb(error_response("Invalid registration data", drogon::k400BadRequest));
    return;
  }

  auto space = full_name.find(' ');
  const auto first = space == std::string::npos ? full_name : full_name.substr(0, space);
  const auto last = space == std::string::npos ? "" : full_name.substr(space + 1);
  const auto user_id = uuid();
  const auto salt = random_hex(16);
  const auto hash = sha256(salt + password);
  const auto token = random_hex(32);

  try {
    auto c = db.connect();
    pqxx::work tx(c);
    tx.exec_params(
        "insert into users(id,email,password_hash,password_salt,first_name,last_name) "
        "values($1,$2,$3,$4,$5,$6)",
        user_id, email, hash, salt, first, last);
    tx.exec_params(
        "insert into sessions(token,user_id,expires_at) values($1,$2,now()+interval '30 days')",
        token, user_id);
    auto user_rows = tx.exec_params(
        "select id,email,first_name,last_name,phone,created_at from users where id=$1",
        user_id);
    tx.commit();

    Json::Value out;
    out["token"] = token;
    out["user"] = user_json(user_rows[0]);
    cb(json_response(out, drogon::k201Created));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k400BadRequest));
  }
}

void auth_login(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto email = body_string(*body, "email");
  const auto password = body_string(*body, "password");

  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto rows = tx.exec_params(
        "select id,email,password_hash,password_salt,first_name,last_name,phone,created_at "
        "from users where lower(email)=lower($1)",
        email);
    if (rows.empty()) {
      cb(error_response("Invalid email or password", drogon::k401Unauthorized));
      return;
    }
    const auto salt = rows[0]["password_salt"].as<std::string>();
    const auto expected = rows[0]["password_hash"].as<std::string>();
    if (sha256(salt + password) != expected) {
      cb(error_response("Invalid email or password", drogon::k401Unauthorized));
      return;
    }
    const auto token = random_hex(32);
    tx.exec_params(
        "insert into sessions(token,user_id,expires_at) values($1,$2,now()+interval '30 days')",
        token, rows[0]["id"].as<std::string>());
    tx.commit();

    Json::Value out;
    out["token"] = token;
    out["user"] = user_json(rows[0]);
    cb(json_response(out));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

void auth_get_profile(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto rows = tx.exec_params(
        "select id,email,first_name,last_name,phone,created_at from users where id=$1",
        user_id);
    tx.commit();
    if (rows.empty()) {
      cb(error_response("User not found", drogon::k404NotFound));
      return;
    }
    Json::Value out;
    out["user"] = user_json(rows[0]);
    cb(json_response(out));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

void auth_update_profile(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto phone = body_string(*body, "phone");
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    tx.exec_params("update users set phone=$1 where id=$2", phone, user_id);
    auto rows = tx.exec_params(
        "select id,email,first_name,last_name,phone,created_at from users where id=$1",
        user_id);
    tx.commit();
    Json::Value out;
    out["user"] = user_json(rows[0]);
    cb(json_response(out));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

void get_cards(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec_params(
      "select * from cards where user_id=$1 order by created_at desc", user_id);
  tx.commit();
  Json::Value arr(Json::arrayValue);
  for (const auto &r : rows) arr.append(card_json(r));
  cb(json_response(arr));
}

void add_card(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto number = normalize_card(body_string(*body, "number"));
  if (number.empty()) {
    cb(error_response("card.number required", drogon::k400BadRequest));
    return;
  }
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    tx.exec_params(
        "insert into cards(id,user_id,card_number,holder_first_name,holder_last_name,"
        "month_of_expiry,year_of_expiry,cvv,balance) "
        "values($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        uuid(), user_id, number, body_string(*body, "name"),
        body_string(*body, "surname"), body_string(*body, "monthOfExpiry"),
        body_string(*body, "yearOfExpiry"), body_string(*body, "cvv"),
        body_double(*body, "balance"));
    tx.commit();
    Json::Value ok;
    ok["ok"] = true;
    cb(json_response(ok, drogon::k201Created));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k400BadRequest));
  }
}

void update_card(const drogon::HttpRequestPtr &req, Callback &&cb,
                 std::string old_number)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto new_number = normalize_card(body_string(*body, "number", old_number));
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto rows = tx.exec_params(
        "update cards set card_number=$1, holder_first_name=$2, holder_last_name=$3,"
        "month_of_expiry=$4, year_of_expiry=$5, cvv=$6, balance=$7 "
        "where user_id=$8 and card_number=$9 returning id",
        new_number, body_string(*body, "name"), body_string(*body, "surname"),
        body_string(*body, "monthOfExpiry"), body_string(*body, "yearOfExpiry"),
        body_string(*body, "cvv"), body_double(*body, "balance"), user_id,
        normalize_card(old_number));
    if (rows.empty()) {
      cb(error_response("card not found", drogon::k404NotFound));
      return;
    }
    tx.exec_params("update transactions set payment_card=$1 where user_id=$2 and payment_card=$3",
                   new_number, user_id, normalize_card(old_number));
    tx.commit();
    Json::Value ok;
    ok["ok"] = true;
    cb(json_response(ok));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k400BadRequest));
  }
}

void remove_card(const drogon::HttpRequestPtr &req, Callback &&cb,
                 std::string number)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec_params("delete from cards where user_id=$1 and card_number=$2 returning id",
                             user_id, normalize_card(number));
  tx.commit();
  if (rows.empty()) {
    cb(error_response("card not found", drogon::k404NotFound));
    return;
  }
  Json::Value ok;
  ok["ok"] = true;
  cb(json_response(ok));
}

void get_transactions(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto day = req->getParameter("day");
  auto c = db.connect();
  pqxx::work tx(c);
  pqxx::result rows;
  if (day.empty()) {
    rows = tx.exec_params(
        "select * from transactions where user_id=$1 order by created_at desc",
        user_id);
  } else {
    rows = tx.exec_params(
        "select * from transactions where user_id=$1 and operation_date=$2 order by created_at desc",
        user_id, day);
  }
  tx.commit();
  Json::Value arr(Json::arrayValue);
  for (const auto &r : rows) arr.append(transaction_json(r));
  cb(json_response(arr));
}

void add_transaction(const drogon::HttpRequestPtr &req, Callback &&cb,
                     bool income)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto payment_card = normalize_card(body_string(*body, "paymentCard"));
  double amount = body_double(*body, "amount");
  amount = income ? std::abs(amount) : -std::abs(amount);
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto cards = tx.exec_params(
        "select id,balance from cards where user_id=$1 and card_number=$2 for update",
        user_id, payment_card);
    if (cards.empty()) {
      cb(error_response("payment card not found", drogon::k404NotFound));
      return;
    }
    const auto card_id = cards[0]["id"].as<std::string>();
    const auto new_balance = cards[0]["balance"].as<double>() + amount;
    tx.exec_params("update cards set balance=$1 where id=$2", new_balance, card_id);
    tx.exec_params(
        "insert into transactions(card_id,user_id,amount,category_id,description,"
        "icon_name,icon_color,payment_card,operation_date) values($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        card_id, user_id, amount, body_string(*body, "category"),
        body_string(*body, "description"), body_string(*body, "iconName", "Custom"),
        body_string(*body, "iconColor", "#888888"), payment_card,
        body_string(*body, "date", today_iso()));
    tx.commit();
    Json::Value ok;
    ok["ok"] = true;
    cb(json_response(ok, drogon::k201Created));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k400BadRequest));
  }
}

void remove_transaction(const drogon::HttpRequestPtr &req, Callback &&cb,
                        const std::string &id_text)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto id = std::stoll(id_text);
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec_params(
      "select card_id,amount from transactions where user_id=$1 and id=$2",
      user_id, id);
  if (rows.empty()) {
    cb(error_response("transaction not found", drogon::k404NotFound));
    return;
  }
  const auto card_id = rows[0]["card_id"].as<std::string>();
  const auto amount = rows[0]["amount"].as<double>();
  tx.exec_params("update cards set balance=balance-$1 where id=$2", amount, card_id);
  tx.exec_params("delete from transactions where user_id=$1 and id=$2", user_id, id);
  tx.commit();
  Json::Value ok;
  ok["ok"] = true;
  cb(json_response(ok));
}

void total_balance(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec_params(
      "select coalesce(sum(balance),0) as total from cards where user_id=$1",
      user_id);
  tx.commit();
  Json::Value out;
  out["total"] = rows[0]["total"].as<double>();
  cb(json_response(out));
}

void category_totals(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto day = req->getParameter("day");
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec_params(
      "select category_id, icon_name, icon_color, sum(amount) as amount "
      "from transactions where user_id=$1 and operation_date=$2 and amount < 0 "
      "group by category_id, icon_name, icon_color order by amount asc",
      user_id, day);
  tx.commit();
  Json::Value arr(Json::arrayValue);
  for (const auto &r : rows) {
    Json::Value row;
    row["category"] = r["category_id"].is_null() ? "" : r["category_id"].as<std::string>();
    row["iconName"] = r["icon_name"].as<std::string>();
    row["iconColor"] = r["icon_color"].as<std::string>();
    row["amount"] = r["amount"].as<double>();
    arr.append(row);
  }
  cb(json_response(arr));
}

void custom_categories(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec(
      "select id,label,icon_name,icon_color from categories where type='custom' order by label");
  tx.commit();
  Json::Value arr(Json::arrayValue);
  for (const auto &r : rows) {
    Json::Value row;
    row["id"] = r["id"].as<std::string>();
    row["label"] = r["label"].as<std::string>();
    row["iconName"] = r["icon_name"].as<std::string>();
    row["iconColor"] = r["icon_color"].as<std::string>();
    arr.append(row);
  }
  cb(json_response(arr));
}

void add_category(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto id = body_string(*body, "id", "custom_" + random_hex(6));
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    tx.exec_params(
        "insert into categories(id,label,icon_name,icon_color,type) values($1,$2,$3,$4,'custom')",
        id, body_string(*body, "label"), body_string(*body, "iconName", "Custom"),
        body_string(*body, "iconColor", "#888888"));
    tx.commit();
    Json::Value ok;
    ok["ok"] = true;
    cb(json_response(ok, drogon::k201Created));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k400BadRequest));
  }
}

void category_dates(const drogon::HttpRequestPtr &req, Callback &&cb,
                    std::string category_id)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec_params(
      "select operation_date, sum(amount) as total, count(*) as count "
      "from transactions where user_id=$1 and category_id=$2 "
      "group by operation_date order by operation_date desc",
      user_id, category_id);
  tx.commit();
  Json::Value arr(Json::arrayValue);
  for (const auto &r : rows) {
    Json::Value row;
    row["date"] = r["operation_date"].as<std::string>();
    row["total"] = r["total"].as<double>();
    row["count"] = r["count"].as<int>();
    arr.append(row);
  }
  cb(json_response(arr));
}

void lookup_card(const drogon::HttpRequestPtr &req, Callback &&cb,
                 std::string number)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  auto c = db.connect();
  pqxx::work tx(c);
  auto rows = tx.exec_params(
      "select c.card_number,u.first_name,u.last_name from cards c "
      "join users u on u.id=c.user_id where c.card_number=$1",
      normalize_card(number));
  tx.commit();
  Json::Value out;
  out["found"] = !rows.empty();
  if (!rows.empty()) {
    const auto card = rows[0]["card_number"].as<std::string>();
    out["firstName"] = rows[0]["first_name"].as<std::string>();
    out["lastName"] = rows[0]["last_name"].as<std::string>();
    out["cardNumber"] = card;
    out["maskedCardNumber"] = "**** " + card.substr(card.size() > 4 ? card.size() - 4 : 0);
  }
  cb(json_response(out));
}

void internal_transfer(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto from_number = normalize_card(body_string(*body, "fromCard"));
  const auto to_number = normalize_card(body_string(*body, "toCard"));
  const auto amount = body_double(*body, "amount");
  const auto description = body_string(*body, "description", "Internal transfer");
  if (amount <= 0 || from_number == to_number) {
    cb(error_response("Invalid transfer", drogon::k400BadRequest));
    return;
  }
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto from = tx.exec_params(
        "select id,balance from cards where user_id=$1 and card_number=$2 for update",
        user_id, from_number);
    auto to = tx.exec_params(
        "select id,balance from cards where user_id=$1 and card_number=$2 for update",
        user_id, to_number);
    if (from.empty() || to.empty()) {
      cb(error_response("card not found", drogon::k404NotFound));
      return;
    }
    if (from[0]["balance"].as<double>() < amount) {
      cb(error_response("insufficient funds", drogon::k400BadRequest));
      return;
    }
    const auto from_id = from[0]["id"].as<std::string>();
    const auto to_id = to[0]["id"].as<std::string>();
    tx.exec_params("update cards set balance=balance-$1 where id=$2", amount, from_id);
    tx.exec_params("update cards set balance=balance+$1 where id=$2", amount, to_id);
    tx.exec_params(
        "insert into transactions(card_id,user_id,amount,category_id,description,icon_name,icon_color,payment_card) "
        "values($1,$2,$3,'Transfer',$4,'Transfer','#2563EB',$5)",
        from_id, user_id, -amount, description, from_number);
    tx.exec_params(
        "insert into transactions(card_id,user_id,amount,category_id,description,icon_name,icon_color,payment_card) "
        "values($1,$2,$3,'Transfer',$4,'Transfer','#2563EB',$5)",
        to_id, user_id, amount, description, to_number);
    tx.exec_params(
        "insert into transfers(from_card_id,to_card_id,from_user_id,to_user_id,amount,description) "
        "values($1,$2,$3,$3,$4,$5)",
        from_id, to_id, user_id, amount, description);
    tx.commit();
    Json::Value ok;
    ok["ok"] = true;
    cb(json_response(ok));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k400BadRequest));
  }
}

void external_transfer(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto from_number = normalize_card(body_string(*body, "fromCard"));
  const auto to_number = normalize_card(body_string(*body, "toCard"));
  const auto amount = body_double(*body, "amount");
  const auto description = body_string(*body, "description", "Card transfer");
  if (amount <= 0 || to_number.empty()) {
    cb(error_response("Invalid transfer", drogon::k400BadRequest));
    return;
  }
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto from = tx.exec_params(
        "select id,balance from cards where user_id=$1 and card_number=$2 for update",
        user_id, from_number);
    auto to = tx.exec_params(
        "select c.id,c.user_id,u.first_name,u.last_name from cards c "
        "join users u on u.id=c.user_id where c.card_number=$1 for update",
        to_number);
    if (from.empty()) {
      cb(error_response("sender card not found", drogon::k404NotFound));
      return;
    }
    if (to.empty()) {
      cb(error_response("recipient card not found", drogon::k404NotFound));
      return;
    }
    if (from[0]["balance"].as<double>() < amount) {
      cb(error_response("insufficient funds", drogon::k400BadRequest));
      return;
    }
    const auto from_id = from[0]["id"].as<std::string>();
    const auto to_id = to[0]["id"].as<std::string>();
    const auto to_user = to[0]["user_id"].as<std::string>();
    const auto recipient_name =
        to[0]["last_name"].as<std::string>().empty()
            ? to[0]["first_name"].as<std::string>()
            : to[0]["first_name"].as<std::string>() + " " +
                  to[0]["last_name"].as<std::string>();

    tx.exec_params("update cards set balance=balance-$1 where id=$2", amount, from_id);
    tx.exec_params("update cards set balance=balance+$1 where id=$2", amount, to_id);
    tx.exec_params(
        "insert into transactions(card_id,user_id,amount,category_id,description,icon_name,icon_color,payment_card) "
        "values($1,$2,$3,'Transfer',$4,'Transfer','#2563EB',$5)",
        from_id, user_id, -amount, description, from_number);
    tx.exec_params(
        "insert into transactions(card_id,user_id,amount,category_id,description,icon_name,icon_color,payment_card) "
        "values($1,$2,$3,'Transfer',$4,'Transfer','#2563EB',$5)",
        to_id, to_user, amount, description, to_number);
    tx.exec_params(
        "insert into transfers(from_card_id,to_card_id,from_user_id,to_user_id,external_card_number,external_recipient_name,amount,description) "
        "values($1,$2,$3,$4,$5,$6,$7,$8)",
        from_id, to_id, user_id, to_user, to_number, recipient_name, amount,
        description);
    tx.commit();
    Json::Value out;
    out["ok"] = true;
    out["recipientName"] = recipient_name;
    cb(json_response(out));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k400BadRequest));
  }
}

bool expose_dev_codes()
{
  if (monefy::email::smtp_configured()) {
    return env_or("MONEFY_EXPOSE_VERIFICATION_CODES", "0") == "1";
  }
  return env_or("MONEFY_EXPOSE_VERIFICATION_CODES", "1") == "1";
}

std::string verification_code()
{
  static std::random_device rd;
  static std::mt19937 gen(rd());
  std::uniform_int_distribution<int> dist(100000, 999999);
  return std::to_string(dist(gen));
}

bool send_verification_email(const std::string &email,
                             const std::string &purpose_ru,
                             const std::string &code)
{
  return monefy::email::send_verification_code(email, purpose_ru, code);
}

bool should_expose_dev_code(const std::string &code, bool email_sent)
{
  if (code.empty()) {
    return false;
  }
  if (expose_dev_codes()) {
    return true;
  }
  return !email_sent;
}

void store_verification_code(pqxx::work &tx, const std::string &email,
                             const std::string &purpose, const std::string &code,
                             const std::string &user_id = "")
{
  tx.exec_params(
      "delete from email_verification_codes where lower(email)=lower($1) and purpose=$2",
      email, purpose);
  if (user_id.empty()) {
    tx.exec_params(
        "insert into email_verification_codes(email,purpose,code,expires_at) "
        "values(lower($1),$2,$3,now()+interval '15 minutes')",
        email, purpose, code);
  } else {
    tx.exec_params(
        "insert into email_verification_codes(email,purpose,code,user_id,expires_at) "
        "values(lower($1),$2,$3,$4::uuid,now()+interval '15 minutes')",
        email, purpose, code, user_id);
  }
}

bool consume_verification_code(pqxx::work &tx, const std::string &email,
                               const std::string &purpose,
                               const std::string &code,
                               const std::string &user_id = "")
{
  if (user_id.empty()) {
    auto rows = tx.exec_params(
        "delete from email_verification_codes "
        "where lower(email)=lower($1) and purpose=$2 and code=$3 and expires_at > now() "
        "returning id",
        email, purpose, code);
    return !rows.empty();
  }
  auto rows = tx.exec_params(
      "delete from email_verification_codes "
      "where lower(email)=lower($1) and purpose=$2 and code=$3 and user_id=$4::uuid "
      "and expires_at > now() returning id",
      email, purpose, code, user_id);
  return !rows.empty();
}

void set_user_password(pqxx::work &tx, const std::string &user_id,
                       const std::string &password)
{
  const auto salt = random_hex(16);
  const auto hash = sha256(salt + password);
  tx.exec_params("update users set password_hash=$1, password_salt=$2 where id=$3",
                 hash, salt, user_id);
}

Json::Value ok_message(const std::string &message, const std::string &dev_code = "",
                     bool email_sent = true)
{
  Json::Value out;
  out["ok"] = true;
  out["message"] = message;
  if (should_expose_dev_code(dev_code, email_sent)) {
    out["devCode"] = dev_code;
  }
  return out;
}

void auth_forgot_send_code(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto email = body_string(*body, "email");
  if (email.empty()) {
    cb(error_response("Email required", drogon::k400BadRequest));
    return;
  }

  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto rows = tx.exec_params(
        "select id from users where lower(email)=lower($1)", email);
    std::string code;
    bool email_sent = true;
    if (!rows.empty()) {
      code = verification_code();
      store_verification_code(tx, email, "reset_password", code);
      email_sent = send_verification_email(email, "Сброс пароля Monefy", code);
    }
    tx.commit();
    cb(json_response(ok_message(
        "If this email is registered, a verification code has been sent", code,
        email_sent)));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

void auth_forgot_reset(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto email = body_string(*body, "email");
  const auto code = body_string(*body, "code");
  const auto new_password = body_string(*body, "newPassword");
  if (email.empty() || code.empty() || new_password.size() < 6) {
    cb(error_response("Invalid reset data", drogon::k400BadRequest));
    return;
  }

  try {
    auto c = db.connect();
    pqxx::work tx(c);
    if (!consume_verification_code(tx, email, "reset_password", code)) {
      cb(error_response("Invalid or expired code", drogon::k400BadRequest));
      return;
    }
    auto rows = tx.exec_params(
        "select id from users where lower(email)=lower($1)", email);
    if (rows.empty()) {
      cb(error_response("User not found", drogon::k404NotFound));
      return;
    }
    const auto user_id = rows[0]["id"].as<std::string>();
    set_user_password(tx, user_id, new_password);
    tx.exec_params("delete from sessions where user_id=$1", user_id);
    tx.commit();
    cb(json_response(ok_message("Password updated")));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

void auth_change_password(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto old_password = body_string(*body, "oldPassword");
  const auto new_password = body_string(*body, "newPassword");
  if (old_password.empty() || new_password.size() < 6) {
    cb(error_response("Invalid password data", drogon::k400BadRequest));
    return;
  }

  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto rows = tx.exec_params(
        "select password_hash,password_salt from users where id=$1", user_id);
    if (rows.empty()) {
      cb(error_response("User not found", drogon::k404NotFound));
      return;
    }
    const auto salt = rows[0]["password_salt"].as<std::string>();
    const auto expected = rows[0]["password_hash"].as<std::string>();
    if (sha256(salt + old_password) != expected) {
      cb(error_response("Current password is incorrect", drogon::k401Unauthorized));
      return;
    }
    set_user_password(tx, user_id, new_password);
    tx.commit();
    cb(json_response(ok_message("Password changed")));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

void auth_change_email_send(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto new_email = body_string(*body, "newEmail");
  if (new_email.empty()) {
    cb(error_response("Email required", drogon::k400BadRequest));
    return;
  }

  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto existing = tx.exec_params(
        "select id from users where lower(email)=lower($1)", new_email);
    if (!existing.empty()) {
      cb(error_response("Email already in use", drogon::k400BadRequest));
      return;
    }
    const auto code = verification_code();
    store_verification_code(tx, new_email, "change_email", code, user_id);
    const bool email_sent =
        send_verification_email(new_email, "Смена email Monefy", code);
    tx.commit();
    cb(json_response(ok_message("Verification code sent to the new email", code,
                                email_sent)));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

void auth_change_email_confirm(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto new_email = body_string(*body, "newEmail");
  const auto code = body_string(*body, "code");
  if (new_email.empty() || code.empty()) {
    cb(error_response("Invalid confirmation data", drogon::k400BadRequest));
    return;
  }

  try {
    auto c = db.connect();
    pqxx::work tx(c);
    if (!consume_verification_code(tx, new_email, "change_email", code, user_id)) {
      cb(error_response("Invalid or expired code", drogon::k400BadRequest));
      return;
    }
    auto clash = tx.exec_params(
        "select id from users where lower(email)=lower($1) and id<>$2::uuid",
        new_email, user_id);
    if (!clash.empty()) {
      cb(error_response("Email already in use", drogon::k400BadRequest));
      return;
    }
    tx.exec_params("update users set email=$1 where id=$2", new_email, user_id);
    auto rows = tx.exec_params(
        "select id,email,first_name,last_name,phone,created_at from users where id=$1",
        user_id);
    tx.commit();
    Json::Value out;
    out["ok"] = true;
    out["user"] = user_json(rows[0]);
    cb(json_response(out));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

bool valid_feedback_issue(const std::string &issue_type)
{
  return issue_type == "card" || issue_type == "transfer" ||
         issue_type == "login" || issue_type == "crash" ||
         issue_type == "balance" || issue_type == "other";
}

void submit_feedback(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto body = req->getJsonObject();
  if (!body) {
    cb(error_response("Invalid JSON", drogon::k400BadRequest));
    return;
  }
  const auto issue_type = body_string(*body, "issueType");
  const auto message = body_string(*body, "message");
  if (!valid_feedback_issue(issue_type)) {
    cb(error_response("Invalid issue type", drogon::k400BadRequest));
    return;
  }
  if (issue_type == "other" && message.empty()) {
    cb(error_response("Message required", drogon::k400BadRequest));
    return;
  }
  try {
    auto c = db.connect();
    pqxx::work tx(c);
    auto user_rows = tx.exec_params(
        "select email, first_name, last_name from users where id=$1", user_id);
    if (user_rows.empty()) {
      cb(error_response("User not found", drogon::k404NotFound));
      return;
    }
    const auto email = user_rows[0]["email"].as<std::string>();
    const auto first = user_rows[0]["first_name"].as<std::string>();
    const auto last = user_rows[0]["last_name"].as<std::string>();
    const auto name = last.empty() ? first : first + " " + last;
    auto rows = tx.exec_params(
        "insert into feedback_reports(user_id, user_email, user_name, issue_type, "
        "message) values($1, $2, $3, $4, $5) returning id",
        user_id, email, name, issue_type, message);
    tx.commit();
    Json::Value out;
    out["ok"] = true;
    out["id"] = static_cast<Json::Int64>(rows[0]["id"].as<long long>());
    cb(json_response(out));
  } catch (const std::exception &e) {
    cb(error_response(e.what(), drogon::k500InternalServerError));
  }
}

} // namespace

int main()
{
  curl_global_init(CURL_GLOBAL_DEFAULT);
  try {
    db.init_schema();
  } catch (const std::exception &e) {
    LOG_WARN << "Schema initialization failed: " << e.what();
  }

  using namespace drogon;
  app().registerHandler(
      "/api/auth/register",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_register(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/auth/login",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_login(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/auth/profile",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_get_profile(req, std::move(cb));
      },
      {Get});
  app().registerHandler(
      "/api/auth/profile",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_update_profile(req, std::move(cb));
      },
      {Patch});
  app().registerHandler(
      "/api/auth/forgot-password/send-code",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_forgot_send_code(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/auth/forgot-password/reset",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_forgot_reset(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/auth/change-password",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_change_password(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/auth/change-email/send-code",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_change_email_send(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/auth/change-email/confirm",
      [](const HttpRequestPtr &req, Callback &&cb) {
        auth_change_email_confirm(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/cards",
      [](const HttpRequestPtr &req, Callback &&cb) {
        get_cards(req, std::move(cb));
      },
      {Get});
  app().registerHandler(
      "/api/cards",
      [](const HttpRequestPtr &req, Callback &&cb) {
        add_card(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/cards/{1}",
      [](const HttpRequestPtr &req, Callback &&cb, std::string old_number) {
        update_card(req, std::move(cb), std::move(old_number));
      },
      {Put});
  app().registerHandler(
      "/api/cards/{1}",
      [](const HttpRequestPtr &req, Callback &&cb, std::string number) {
        remove_card(req, std::move(cb), std::move(number));
      },
      {Delete});
  app().registerHandler(
      "/api/cards/lookup/{1}",
      [](const HttpRequestPtr &req, Callback &&cb, std::string number) {
        lookup_card(req, std::move(cb), std::move(number));
      },
      {Get});
  app().registerHandler(
      "/api/transactions",
      [](const HttpRequestPtr &req, Callback &&cb) {
        get_transactions(req, std::move(cb));
      },
      {Get});
  app().registerHandler("/api/transactions/expense",
                        [](const HttpRequestPtr &req, Callback &&cb) {
                          add_transaction(req, std::move(cb), false);
                        },
                        {Post});
  app().registerHandler("/api/transactions/income",
                        [](const HttpRequestPtr &req, Callback &&cb) {
                          add_transaction(req, std::move(cb), true);
                        },
                        {Post});
  app().registerHandler(
      "/api/transactions/{1}",
      [](const HttpRequestPtr &req, Callback &&cb, std::string id) {
        remove_transaction(req, std::move(cb), std::move(id));
      },
      {Delete});
  app().registerHandler(
      "/api/balance",
      [](const HttpRequestPtr &req, Callback &&cb) {
        total_balance(req, std::move(cb));
      },
      {Get});
  app().registerHandler(
      "/api/category-totals",
      [](const HttpRequestPtr &req, Callback &&cb) {
        category_totals(req, std::move(cb));
      },
      {Get});
  app().registerHandler(
      "/api/categories",
      [](const HttpRequestPtr &req, Callback &&cb) {
        custom_categories(req, std::move(cb));
      },
      {Get});
  app().registerHandler(
      "/api/categories",
      [](const HttpRequestPtr &req, Callback &&cb) {
        add_category(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/category-dates/{1}",
      [](const HttpRequestPtr &req, Callback &&cb, std::string category_id) {
        category_dates(req, std::move(cb), std::move(category_id));
      },
      {Get});
  app().registerHandler(
      "/api/transfers/internal",
      [](const HttpRequestPtr &req, Callback &&cb) {
        internal_transfer(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/transfers/external",
      [](const HttpRequestPtr &req, Callback &&cb) {
        external_transfer(req, std::move(cb));
      },
      {Post});
  app().registerHandler(
      "/api/feedback",
      [](const HttpRequestPtr &req, Callback &&cb) {
        submit_feedback(req, std::move(cb));
      },
      {Post});

  app().addListener("0.0.0.0", std::stoi(env_or("MONEFY_API_PORT", "8080")));
  app().run();
  curl_global_cleanup();
}
