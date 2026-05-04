#include "finance_core.hpp"

namespace finance_core {

double sum_array(const double *values, int count)
{
  if (values == nullptr || count <= 0) {
    return 0.0;
  }
  double result = 0.0;
  for (int i = 0; i < count; ++i) {
    result += values[i];
  }
  return result;
}

double add_amounts(double left, double right) { return left + right; }

double subtract_amounts(double left, double right) { return left - right; }

bool is_valid_positive_amount(double amount) { return amount > 0.0; }

} // namespace finance_core
