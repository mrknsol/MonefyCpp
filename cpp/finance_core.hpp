#pragma once

namespace finance_core {

double sum_array(const double *values, int count);
double add_amounts(double left, double right);
double subtract_amounts(double left, double right);
bool is_valid_positive_amount(double amount);

} // namespace finance_core
