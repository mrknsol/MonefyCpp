#pragma once

#include <string>

namespace monefy::email {

bool smtp_configured();

/** Sends plain-text email. Returns true if SMTP is configured and send succeeded. */
bool send_plain_email(const std::string &to, const std::string &subject,
                      const std::string &body);

/** @return true if message was delivered via SMTP */
bool send_verification_code(const std::string &to, const std::string &subject_ru,
                            const std::string &code);

} // namespace monefy::email
