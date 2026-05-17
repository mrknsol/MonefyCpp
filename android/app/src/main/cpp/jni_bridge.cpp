#include <jni.h>
#include <cstring>
#include <cstdlib>

#include "monefy_core.h"

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeInit(JNIEnv *env, jclass,
                                                 jstring path)
{
  const char *p = env->GetStringUTFChars(path, nullptr);
  int ok = monefy_init(p);
  env->ReleaseStringUTFChars(path, p);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetCoreVersion(JNIEnv *env, jclass)
{
  return env->NewStringUTF(monefy_core_version());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetLastError(JNIEnv *env, jclass)
{
  return env->NewStringUTF(monefy_last_error());
}

static jstring TakeJson(JNIEnv *env, char *ptr)
{
  if (!ptr) {
    return env->NewStringUTF("[]");
  }
  jstring s = env->NewStringUTF(ptr);
  monefy_free_string(ptr);
  return s;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetCardsJson(JNIEnv *env, jclass)
{
  return TakeJson(env, monefy_get_cards_json());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetTransactionsJson(JNIEnv *env,
                                                                  jclass)
{
  return TakeJson(env, monefy_get_transactions_json());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetTransactionsForDay(
    JNIEnv *env, jclass, jstring day)
{
  const char *d = env->GetStringUTFChars(day, nullptr);
  char *j = monefy_get_transactions_for_day(d);
  env->ReleaseStringUTFChars(day, d);
  return TakeJson(env, j);
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetCategoryTotalsForDay(
    JNIEnv *env, jclass, jstring day)
{
  const char *d = env->GetStringUTFChars(day, nullptr);
  char *j = monefy_get_category_totals_for_day(d);
  env->ReleaseStringUTFChars(day, d);
  return TakeJson(env, j);
}

extern "C" JNIEXPORT jdouble JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetTotalBalance(JNIEnv *, jclass)
{
  return monefy_total_balance();
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeAddCardJson(JNIEnv *env, jclass,
                                                        jstring json)
{
  const char *s = env->GetStringUTFChars(json, nullptr);
  int ok = monefy_add_card_json(s);
  env->ReleaseStringUTFChars(json, s);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeRemoveCard(JNIEnv *env, jclass,
                                                       jstring num)
{
  const char *s = env->GetStringUTFChars(num, nullptr);
  int ok = monefy_remove_card(s);
  env->ReleaseStringUTFChars(num, s);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeUpdateCardJson(
    JNIEnv *env, jclass, jstring oldNum, jstring json)
{
  const char *o = env->GetStringUTFChars(oldNum, nullptr);
  const char *j = env->GetStringUTFChars(json, nullptr);
  int ok = monefy_update_card_json(o, j);
  env->ReleaseStringUTFChars(oldNum, o);
  env->ReleaseStringUTFChars(json, j);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetCustomCategoriesJson(JNIEnv *env,
                                                                    jclass)
{
  return TakeJson(env, monefy_get_custom_categories_json());
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeGetCategoryDatesJson(
    JNIEnv *env, jclass, jstring categoryId)
{
  const char *c = env->GetStringUTFChars(categoryId, nullptr);
  char *j = monefy_get_category_dates_json(c);
  env->ReleaseStringUTFChars(categoryId, c);
  return TakeJson(env, j);
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeAddCustomCategoryJson(
    JNIEnv *env, jclass, jstring json)
{
  const char *s = env->GetStringUTFChars(json, nullptr);
  int ok = monefy_add_custom_category_json(s);
  env->ReleaseStringUTFChars(json, s);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeAddExpenseJson(JNIEnv *env, jclass,
                                                           jstring json)
{
  const char *s = env->GetStringUTFChars(json, nullptr);
  int ok = monefy_add_expense_json(s);
  env->ReleaseStringUTFChars(json, s);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeAddIncomeJson(JNIEnv *env, jclass,
                                                          jstring json)
{
  const char *s = env->GetStringUTFChars(json, nullptr);
  int ok = monefy_add_income_json(s);
  env->ReleaseStringUTFChars(json, s);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeAddIncome(JNIEnv *env, jclass,
                                                     jstring card,
                                                     jdouble amount)
{
  const char *s = env->GetStringUTFChars(card, nullptr);
  int ok = monefy_add_income(s, amount);
  env->ReleaseStringUTFChars(card, s);
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeRemoveTransaction(JNIEnv *,
                                                              jclass,
                                                              jlong id)
{
  return monefy_remove_transaction(static_cast<long long>(id)) ? JNI_TRUE
                                                                 : JNI_FALSE;
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeTransferBetweenCards(
    JNIEnv *env, jclass, jstring fromCard, jstring toCard, jdouble amount,
    jstring description)
{
  const char *from = env->GetStringUTFChars(fromCard, nullptr);
  const char *to = env->GetStringUTFChars(toCard, nullptr);
  const char *desc = description ? env->GetStringUTFChars(description, nullptr)
                                 : nullptr;
  int ok = monefy_transfer_between_cards(from, to, amount, desc);
  env->ReleaseStringUTFChars(fromCard, from);
  env->ReleaseStringUTFChars(toCard, to);
  if (desc && description) {
    env->ReleaseStringUTFChars(description, desc);
  }
  return ok ? JNI_TRUE : JNI_FALSE;
}

extern "C" JNIEXPORT void JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeSetUserId(JNIEnv *env,
                                                      jclass,
                                                      jstring userId)
{
  const char *s = env->GetStringUTFChars(userId, nullptr);
  monefy_set_user_id(s);
  env->ReleaseStringUTFChars(userId, s);
}

extern "C" JNIEXPORT void JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeClearUserData(JNIEnv *,
                                                          jclass)
{
  monefy_clear_user_data();
}
