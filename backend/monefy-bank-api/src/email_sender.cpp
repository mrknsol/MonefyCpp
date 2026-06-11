#include "email_sender.hpp"

#include <drogon/drogon.h>

#include <curl/curl.h>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <iomanip>
#include <sstream>

namespace monefy::email {
namespace {

std::string env_or(const char *key, const std::string &fallback = "")
{
  const char *value = std::getenv(key);
  return value && *value ? std::string(value) : fallback;
}

std::string email_addr(const std::string &value)
{
  if (!value.empty() && value.front() == '<') {
    return value;
  }
  return "<" + value + ">";
}

std::string rfc2822_date()
{
  std::time_t now = std::time(nullptr);
  std::tm tm_buf{};
#ifdef _WIN32
  gmtime_s(&tm_buf, &now);
#else
  gmtime_r(&now, &tm_buf);
#endif
  char buf[64];
  std::strftime(buf, sizeof(buf), "%a, %d %b %Y %H:%M:%S +0000", &tm_buf);
  return std::string(buf);
}

struct UploadPayload {
  const char *data = nullptr;
  size_t offset = 0;
};

size_t read_payload(char *ptr, size_t size, size_t nmemb, void *userp)
{
  auto *upload = static_cast<UploadPayload *>(userp);
  if (!upload->data) {
    return 0;
  }
  const size_t total = std::strlen(upload->data);
  if (upload->offset >= total) {
    return 0;
  }
  const size_t room = size * nmemb;
  size_t left = total - upload->offset;
  const size_t copylen = left < room ? left : room;
  std::memcpy(ptr, upload->data + upload->offset, copylen);
  upload->offset += copylen;
  return copylen;
}

} // namespace

bool smtp_configured()
{
  return !env_or("MONEFY_SMTP_PASSWORD").empty();
}

bool send_plain_email(const std::string &to, const std::string &subject,
                      const std::string &body)
{
  if (!smtp_configured()) {
    LOG_WARN << "[Monefy Email] SMTP not configured (set MONEFY_SMTP_PASSWORD)";
    return false;
  }

  const auto host = env_or("MONEFY_SMTP_HOST", "smtp.gmail.com");
  const auto port = env_or("MONEFY_SMTP_PORT", "587");
  const auto user = env_or("MONEFY_SMTP_USER", "kenanmemmedli055@gmail.com");
  const auto from = env_or("MONEFY_SMTP_FROM", user);
  const auto pass = env_or("MONEFY_SMTP_PASSWORD");

  std::ostringstream message;
  message << "Date: " << rfc2822_date() << "\r\n"
          << "From: Monefy <" << from << ">\r\n"
          << "To: " << to << "\r\n"
          << "Subject: " << subject << "\r\n"
          << "MIME-Version: 1.0\r\n"
          << "Content-Type: text/plain; charset=UTF-8\r\n"
          << "\r\n"
          << body << "\r\n";

  const std::string payload = message.str();
  UploadPayload upload{payload.c_str(), 0};

  CURL *curl = curl_easy_init();
  if (!curl) {
    LOG_ERROR << "[Monefy Email] curl_easy_init failed";
    return false;
  }
  char error_buffer[CURL_ERROR_SIZE] = {};

  const bool use_ssl_port = port == "465";
  const std::string url =
      (use_ssl_port ? "smtps://" : "smtp://") + host + ":" + port;
  const auto mail_from = email_addr(from);
  const auto mail_to = email_addr(to);
  struct curl_slist *recipients = curl_slist_append(nullptr, mail_to.c_str());

  curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
  curl_easy_setopt(curl, CURLOPT_USERNAME, user.c_str());
  curl_easy_setopt(curl, CURLOPT_PASSWORD, pass.c_str());
  curl_easy_setopt(curl, CURLOPT_MAIL_FROM, mail_from.c_str());
  curl_easy_setopt(curl, CURLOPT_MAIL_RCPT, recipients);
  curl_easy_setopt(curl, CURLOPT_USE_SSL, static_cast<long>(CURLUSESSL_ALL));
  curl_easy_setopt(curl, CURLOPT_UPLOAD, 1L);
  curl_easy_setopt(curl, CURLOPT_READFUNCTION, read_payload);
  curl_easy_setopt(curl, CURLOPT_READDATA, &upload);
  curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);
  curl_easy_setopt(curl, CURLOPT_ERRORBUFFER, error_buffer);

  const CURLcode res = curl_easy_perform(curl);
  long response_code = 0;
  curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &response_code);
  curl_slist_free_all(recipients);
  curl_easy_cleanup(curl);

  if (res != CURLE_OK) {
    LOG_ERROR << "[Monefy Email] SMTP failed (" << url << ") to " << to << ": "
              << curl_easy_strerror(res) << " response=" << response_code
              << " detail=" << (error_buffer[0] ? error_buffer : "n/a");
    return false;
  }

  LOG_INFO << "[Monefy Email] Sent to " << to << " subject=" << subject;
  return true;
}

bool send_verification_code(const std::string &to, const std::string &subject_ru,
                            const std::string &code)
{
  (void)subject_ru;
  std::ostringstream body;
  body << "Hello!\n\n"
       << "Your Monefy verification code: " << code << "\n\n"
       << "The code is valid for 15 minutes. Do not share it with anyone.\n\n"
       << "If you did not request this email, you can ignore it.\n\n"
       << "Monefy";

  if (send_plain_email(to, "Monefy verification code", body.str())) {
    return true;
  }
  LOG_INFO << "[Monefy Email] Fallback log to=" << to << " code=" << code;
  return false;
}

} // namespace monefy::email
