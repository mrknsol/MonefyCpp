#include "cards_core.hpp"
#include "finance_core.hpp"

namespace cards_core {

double deposit_amount(double balance, double amount)
{
  if (!finance_core::is_valid_positive_amount(amount)) {
    return balance;
  }
  return finance_core::add_amounts(balance, amount);
}

double withdraw_amount(double balance, double amount)
{
  if (!finance_core::is_valid_positive_amount(amount)) {
    return balance;
  }
  return finance_core::subtract_amounts(balance, amount);
}

} 
