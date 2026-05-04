#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

#import "monefy_core.h"

static void MonefyEnsureInit(void)
{
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    NSArray *paths =
        NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *doc = paths.firstObject;
    if (doc) {
      monefy_init(doc.UTF8String);
    }
  });
}

static NSString *TakeJson(char *ptr)
{
  if (!ptr) {
    return @"[]";
  }
  NSString *s = [NSString stringWithUTF8String:ptr];
  monefy_free_string(ptr);
  return s;
}

@interface MonefyCoreModule : NSObject <RCTBridgeModule>
@end

@implementation MonefyCoreModule

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(getCoreVersion:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  resolve([NSString stringWithUTF8String:monefy_core_version()]);
}

RCT_EXPORT_METHOD(getLastError:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  NSString *e = [NSString stringWithUTF8String:monefy_last_error()];
  resolve(e ?: @"");
}

RCT_EXPORT_METHOD(getCardsJson:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  resolve(TakeJson(monefy_get_cards_json()));
}

RCT_EXPORT_METHOD(getTransactionsJson:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  resolve(TakeJson(monefy_get_transactions_json()));
}

RCT_EXPORT_METHOD(getTransactionsForDay:(NSString *)day
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  resolve(TakeJson(monefy_get_transactions_for_day(day.UTF8String)));
}

RCT_EXPORT_METHOD(getCategoryTotalsForDay:(NSString *)day
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  resolve(
      TakeJson(monefy_get_category_totals_for_day(day.UTF8String)));
}

RCT_EXPORT_METHOD(getTotalBalance:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  resolve(@(monefy_total_balance()));
}

RCT_EXPORT_METHOD(addCardJson:(NSString *)json
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  if (!monefy_add_card_json(json.UTF8String)) {
    reject(@"monefy", [NSString stringWithUTF8String:monefy_last_error()],
           nil);
    return;
  }
  resolve(@YES);
}

RCT_EXPORT_METHOD(removeCard:(NSString *)cardNumber
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  if (!monefy_remove_card(cardNumber.UTF8String)) {
    reject(@"monefy", [NSString stringWithUTF8String:monefy_last_error()],
           nil);
    return;
  }
  resolve(@YES);
}

RCT_EXPORT_METHOD(updateCardJson:(NSString *)oldNumber
                  json:(NSString *)json
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  if (!monefy_update_card_json(oldNumber.UTF8String, json.UTF8String)) {
    reject(@"monefy", [NSString stringWithUTF8String:monefy_last_error()],
           nil);
    return;
  }
  resolve(@YES);
}

RCT_EXPORT_METHOD(getCustomCategoriesJson:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  resolve(TakeJson(monefy_get_custom_categories_json()));
}

RCT_EXPORT_METHOD(getCategoryDatesJson:(NSString *)categoryId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  resolve(TakeJson(monefy_get_category_dates_json(categoryId.UTF8String)));
}

RCT_EXPORT_METHOD(addCustomCategoryJson:(NSString *)json
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  if (!monefy_add_custom_category_json(json.UTF8String)) {
    reject(@"monefy", [NSString stringWithUTF8String:monefy_last_error()],
           nil);
    return;
  }
  resolve(@YES);
}

RCT_EXPORT_METHOD(addExpenseJson:(NSString *)json
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  if (!monefy_add_expense_json(json.UTF8String)) {
    reject(@"monefy", [NSString stringWithUTF8String:monefy_last_error()],
           nil);
    return;
  }
  resolve(@YES);
}

RCT_EXPORT_METHOD(addIncome:(NSString *)cardNumber
                  amount:(double)amount
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  if (!monefy_add_income(cardNumber.UTF8String, amount)) {
    reject(@"monefy", [NSString stringWithUTF8String:monefy_last_error()],
           nil);
    return;
  }
  resolve(@YES);
}

RCT_EXPORT_METHOD(removeTransaction:(nonnull NSNumber *)transactionId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  MonefyEnsureInit();
  long long tid = [transactionId longLongValue];
  if (!monefy_remove_transaction(tid)) {
    reject(@"monefy", [NSString stringWithUTF8String:monefy_last_error()],
           nil);
    return;
  }
  resolve(@YES);
}

@end
