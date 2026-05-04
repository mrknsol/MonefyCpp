package com.monefycpprn

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MonefyCoreModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    init {
      System.loadLibrary("monefycpprn")
    }

    @JvmStatic external fun nativeInit(path: String): Boolean

    @JvmStatic external fun nativeGetCoreVersion(): String

    @JvmStatic external fun nativeGetLastError(): String

    @JvmStatic external fun nativeGetCardsJson(): String

    @JvmStatic external fun nativeGetTransactionsJson(): String

    @JvmStatic external fun nativeGetTransactionsForDay(day: String): String

    @JvmStatic external fun nativeGetCategoryTotalsForDay(day: String): String

    @JvmStatic external fun nativeGetTotalBalance(): Double

    @JvmStatic external fun nativeAddCardJson(json: String): Boolean

    @JvmStatic external fun nativeRemoveCard(cardNumber: String): Boolean

    @JvmStatic external fun nativeUpdateCardJson(oldNumber: String, json: String): Boolean

    @JvmStatic external fun nativeGetCustomCategoriesJson(): String

    @JvmStatic external fun nativeGetCategoryDatesJson(categoryId: String): String

    @JvmStatic external fun nativeAddCustomCategoryJson(json: String): Boolean

    @JvmStatic external fun nativeAddExpenseJson(json: String): Boolean

    @JvmStatic external fun nativeAddIncome(cardNumber: String, amount: Double): Boolean

    @JvmStatic external fun nativeRemoveTransaction(id: Long): Boolean
  }

  init {
    nativeInit(reactApplicationContext.filesDir.absolutePath)
  }

  override fun getName(): String = "MonefyCoreModule"

  @ReactMethod
  fun getCoreVersion(promise: Promise) {
    promise.resolve(nativeGetCoreVersion())
  }

  @ReactMethod
  fun getLastError(promise: Promise) {
    promise.resolve(nativeGetLastError())
  }

  @ReactMethod
  fun getCardsJson(promise: Promise) {
    promise.resolve(nativeGetCardsJson())
  }

  @ReactMethod
  fun getTransactionsJson(promise: Promise) {
    promise.resolve(nativeGetTransactionsJson())
  }

  @ReactMethod
  fun getTransactionsForDay(day: String, promise: Promise) {
    promise.resolve(nativeGetTransactionsForDay(day))
  }

  @ReactMethod
  fun getCategoryTotalsForDay(day: String, promise: Promise) {
    promise.resolve(nativeGetCategoryTotalsForDay(day))
  }

  @ReactMethod
  fun getTotalBalance(promise: Promise) {
    promise.resolve(nativeGetTotalBalance())
  }

  @ReactMethod
  fun addCardJson(json: String, promise: Promise) {
    if (nativeAddCardJson(json)) promise.resolve(true)
    else promise.reject("monefy", nativeGetLastError(), null)
  }

  @ReactMethod
  fun removeCard(cardNumber: String, promise: Promise) {
    if (nativeRemoveCard(cardNumber)) promise.resolve(true)
    else promise.reject("monefy", nativeGetLastError(), null)
  }

  @ReactMethod
  fun updateCardJson(oldNumber: String, json: String, promise: Promise) {
    if (nativeUpdateCardJson(oldNumber, json)) promise.resolve(true)
    else promise.reject("monefy", nativeGetLastError(), null)
  }

  @ReactMethod
  fun getCustomCategoriesJson(promise: Promise) {
    promise.resolve(nativeGetCustomCategoriesJson())
  }

  @ReactMethod
  fun getCategoryDatesJson(categoryId: String, promise: Promise) {
    promise.resolve(nativeGetCategoryDatesJson(categoryId))
  }

  @ReactMethod
  fun addCustomCategoryJson(json: String, promise: Promise) {
    if (nativeAddCustomCategoryJson(json)) promise.resolve(true)
    else promise.reject("monefy", nativeGetLastError(), null)
  }

  @ReactMethod
  fun addExpenseJson(json: String, promise: Promise) {
    if (nativeAddExpenseJson(json)) promise.resolve(true)
    else promise.reject("monefy", nativeGetLastError(), null)
  }

  @ReactMethod
  fun addIncome(cardNumber: String, amount: Double, promise: Promise) {
    if (nativeAddIncome(cardNumber, amount)) promise.resolve(true)
    else promise.reject("monefy", nativeGetLastError(), null)
  }

  @ReactMethod
  fun removeTransaction(transactionId: Double, promise: Promise) {
    val id = transactionId.toLong()
    if (nativeRemoveTransaction(id)) promise.resolve(true)
    else promise.reject("monefy", nativeGetLastError(), null)
  }
}
