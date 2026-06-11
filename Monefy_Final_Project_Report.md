# Monefy — Final Project Report

**Course:** Advanced Language Program Design (C++)  
**Instructor:** Xuemiao Xu  
**Project:** Cross-platform mobile banking application (React Native + C++ backend)  
**Document type:** Full final report (~4,000 words)  
**Date:** June 4, 2026  

---

## Team Members

| Name | Student ID |
|------|------------|
| Mammadli Kanan | 202569990819 |
| Udnikova Ekaterina | 202569990178 |
| Baltabay Iliyas | 202569991165 |
| Sagaidak Denis | 202569990966 |
| Zhazylbekova Mariyam | 202569990969 |

---

## Abstract

Personal finance and mobile banking applications must balance **security**, **clarity**, and **speed**. Many educational projects stop at a UI mockup; commercial apps often depend on third-party cloud infrastructure, which raises privacy concerns. **Monefy** (repository: *MonefyCppRn*) addresses both gaps: it is a working end-to-end system with authentication, multi-card management, categorized transactions, transfers, service payments, statistics, localization, account-security flows (forgot password, change password, change email with verification code), app unlock, and payment protection via PIN and biometrics.

The solution uses a **three-tier architecture**: a React Native (TypeScript) presentation layer, a **C++ REST API** (Drogon framework) as the application server, and **PostgreSQL** for durable financial data. A distinctive academic requirement is **C++ in the business-logic path**. The mobile UI calls a stable **`MonefyCore` facade** whose method names match an earlier desktop/WPF design; the current TypeScript implementation delegates to REST endpoints while preserving JSON contracts. In parallel, the repository retains a **shared native C++ engine** (`cpp/`) with JNI (Android) and Objective-C++ (iOS) bridges for offline or hybrid deployment—JSON file persistence under per-user directories, mutex-protected `MonefyStore`, and domain modules `finance_core` and `cards_core`.

This report describes motivation, architecture (client–server and native paths), technologies, data storage, major features with user flows, security, testing, team process, challenges, deployment, limitations, and conclusions suitable for university submission in English (section titles in Russian are listed in Appendix B for translation if required).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)  
2. [Introduction and Motivation](#2-introduction-and-motivation)  
3. [System Architecture](#3-system-architecture)  
4. [Technology Stack and Rationale](#4-technology-stack-and-rationale)  
5. [Data Storage](#5-data-storage)  
6. [Core Application Features and User Flows](#6-core-application-features-and-user-flows)  
7. [C++ Native Engine and Bridge](#7-c-native-engine-and-bridge)  
8. [User Interface, UX, and Internationalization](#8-user-interface-ux-and-internationalization)  
9. [Security Model](#9-security-model)  
10. [Testing and Quality Assurance](#10-testing-and-quality-assurance)  
11. [Team Roles and Development Process](#11-team-roles-and-development-process)  
12. [Challenges and Team Reflection](#12-challenges-and-team-reflection)  
13. [Deployment and Development Setup](#13-deployment-and-development-setup)  
14. [Limitations and Future Work](#14-limitations-and-future-work)  
15. [Conclusion](#15-conclusion)  
Appendix A — Source code listings (from repository)  

---

## 1. Executive Summary

**Monefy** is a cross-platform mobile banking prototype developed as a university software engineering project. The product simulates core retail-banking workflows: user registration and login, account recovery, verified email changes, password changes, management of multiple bank cards, recording income and expenses by category, transfers between the user’s own cards and to other users’ cards, utility and custom service payments, loan simulation, spending statistics, multi-language interface, and confirmation of sensitive operations with a payment PIN and optional Face ID / Touch ID.

Architecturally, the live deployment path is:

1. **Presentation** — React Native 0.85 with TypeScript, React Navigation 7, context-based state (auth, preferences, security).  
2. **API** — C++17 HTTP server using Drogon, OpenSSL password hashing, libpqxx for PostgreSQL.  
3. **Data** — PostgreSQL 16 (users, sessions, cards, transactions, transfers, seeded categories).

The **`MonefyCore` TypeScript module** (`src/native/monefyCore.ts`) exposes methods such as `getCardsJson()`, `addExpenseJson()`, and `transferBetweenCards()` and implements them via authenticated REST calls. Screens therefore stay decoupled from transport details. The **native C++ stack** remains first-class: `monefy_core.h` defines a C API; `monefy_store.cpp` coordinates cards, transactions, and JSON persistence; Android and iOS native modules can call the same logic without duplicating rules in JavaScript.

Key outcomes for the course: demonstrated **cross-platform mobile development**, **server-side C++**, **relational schema design**, **secure authentication**, **fintech UX patterns**, and **optional native integration**—all documented and runnable from the repository with Dockerized PostgreSQL and standard React Native CLI builds.

---

## 2. Introduction and Motivation

### 2.1 Problem statement

Managing personal finances has become more difficult as digital payments and subscriptions multiply. Users expect to see balances instantly, pay bills with few taps, categorize spending, and transfer money safely. Developers face a second problem: maintaining **two platform codebases** (Android and iOS) often leads to inconsistent business rules and slower delivery.

Educational projects frequently implement only static screens. **Monefy** was built to show a **working system**: persisted accounts, session tokens, atomic transfers, and a polished mobile UI—not merely a design comp.

### 2.2 Product vision

Monefy positions itself as a **digital bank for everyday users**. The home dashboard foregrounds cards and quick actions (pay, transfer, top-up, recent service payments). The payments hub groups utilities, mobile, transport, and user-defined payment categories. Profile holds settings, phone binding, security, messages, and **account switching** (multiple saved logins, similar to game launchers). Visual design follows modern fintech: card-centric layout, light/dark themes, calm animations, and vector-style category icons instead of emoji.

### 2.3 Evolution: offline engine and online banking

The project began with an **offline-first** narrative (see team draft): all core logic in one C++ module, data in encrypted local JSON under `user_<id>/`, no cloud dependency—maximizing privacy pedagogy. As requirements grew toward **multi-user banking** (registration, cross-user transfers, shared category catalog), the team added a **C++ REST API** and PostgreSQL. The mobile app’s public surface (`MonefyCore`) did not change radically: screens still call the same method names; only the implementation behind the facade switched from JNI/Obj-C++ to HTTP for the primary demo path. Native modules remain buildable for courses that grade JNI/Objective-C++ integration separately.

### 2.4 Learning objectives

- Apply **React Native** and TypeScript for iOS and Android from one codebase.  
- Implement **C++** domain logic (native store and/or Drogon handlers).  
- Design **REST endpoints** and a **normalized SQL schema** for money operations.  
- Practice **authentication** (salted password hashes, bearer session tokens).  
- Deliver **internationalization** (10 locales) and accessible financial flows.  
- Integrate **biometrics**, PIN gating, and app-unlock flows for payments and account access.  
- Document architecture, testing, and team process for academic review.

---

## 3. System Architecture

### 3.1 High-level logical view

```
┌──────────────────────────────────────────────────────────────────┐
│              React Native App (TypeScript / TSX)                    │
│  Screens · Contexts · Navigation · i18n · AsyncStorage            │
│  MonefyCore facade ──────────────────────────────┐                │
└───────────────────────────┬──────────────────────┼────────────────┘
                            │ HTTPS JSON            │ (optional)
                            │ Bearer token          │ JNI / Obj-C++
                            ▼                       ▼
┌───────────────────────────────────┐   ┌────────────────────────────┐
│   C++ API Server (Drogon) :8080    │   │  cpp/ native engine         │
│   Auth · Cards · Tx · Transfers    │   │  finance_core · cards_core  │
└───────────────────┬───────────────┘   │  monefy_store (JSON files)  │
                    │ SQL                 └────────────────────────────┘
                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                     PostgreSQL 16                                   │
│  users · sessions · cards · transactions · transfers · categories │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Application bootstrap

`App.tsx` wraps the tree in:

- **`SafeAreaProvider`** — correct insets on notched devices.  
- **`AppPreferencesProvider`** — theme (light/dark/system), locale, date format; persisted locally.  
- **`AuthProvider`** — current user, login/register/logout, **switch account** flow.  

`NavigationContainer` wraps both authenticated and unauthenticated navigation. When `user` is non-null, **`SecurityProvider`** mounts **`RootNavigator`** (main app). Otherwise **`AuthNavigator`** shows login, register, forgot-password, or account picker after “Switch account.”

```tsx
// App.tsx — auth gate and provider tree
function AppContent() {
  const { ready, colors } = useAppPreferences();
  const { user, isLoading } = useAuth();

  if (!ready || isLoading) {
    return (
      <View style={[styles.boot, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="large" color={colors.brand} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        <SecurityProvider>
          <RootNavigator />
        </SecurityProvider>
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
```

### 3.3 Navigation structure

| Layer | Component | Role |
|--------|-----------|------|
| Auth | `AuthNavigator` | Login, Register, Forgot Password, `SwitchAccountScreen` |
| Tabs | `MainTabNavigator` | Home, Payments, Statistics, Profile |
| Stack | `RootNavigator` | Cards, add/edit card, operations, transfer, loan, messages, settings, PIN setup, change email/password, etc. |

**React Navigation** (native stack + bottom tabs) drives transitions. Stack screens often use `fade_from_bottom` (~260 ms). **`PremiumTabBar`** adds an animated indicator for the active tab.

### 3.4 Request path example (add expense)

1. User completes **`AddOperationScreen`** (amount, category, card, date).  
2. Screen builds a JSON payload and calls **`MonefyCore.addExpenseJson(payload)`**.  
3. Facade sends **`POST /api/transactions`** (or equivalent) with **`Authorization: Bearer <token>`**.  
4. Drogon handler validates session, parses body, runs SQL in a transaction: insert transaction row, update card balance.  
5. On success, screen reloads data via **`getTransactionsJson()`** or focus hook; UI reflects server state.

The **native path** is analogous: `MonefyCoreModule` forwards to `monefy_add_expense_json`; `MonefyStore` validates amount, withdraws from card, assigns transaction id, writes `transactions.json` under mutex.

### 3.5 Design principles

- **Single source of truth** for balances in the deployed configuration: PostgreSQL via API.  
- **Stable facade** so UI code does not fork between platforms.  
- **JSON as interchange** across JNI and HTTP boundaries—avoid passing C++ object graphs into GC heaps.  
- **Fail closed on auth**: invalid or expired tokens reject requests; quick-login removes stale saved accounts.

---

## 4. Technology Stack and Rationale

### 4.1 Mobile frontend

| Technology | Version (approx.) | Role |
|------------|-------------------|------|
| React Native | 0.85.2 | Cross-platform UI |
| React | 19.2 | Components, hooks, context |
| TypeScript | 5.8 | Type safety across screens |
| React Navigation | 7.x | Stack + tab routing |
| AsyncStorage | 1.24 | Tokens, preferences, saved accounts, recent payments |
| react-native-biometrics | 3.x | Face ID / Touch ID |
| @react-native-clipboard/clipboard | 1.16 | Copy card PAN |
| react-native-safe-area-context | 5.x | Safe areas |
| react-native-gesture-handler | 2.x | Touch + navigation |

**Why React Native CLI, not Expo managed?** The project links **native modules** (biometrics, optional `libmonefycpprn`, custom iOS/Android builds). This matches industry banking apps that need native SDKs.

### 4.2 Backend

| Technology | Role |
|------------|------|
| C++17 | API server and domain modules |
| Drogon | Async HTTP, routing, JSON |
| PostgreSQL 16 | ACID persistence |
| libpqxx | Database access from C++ |
| OpenSSL SHA-256 | Password hashing with per-user salt |
| Docker Compose | Local DB on port 5433 (dev) |
| CMake | Build `monefy_bank_api` |

**Why PostgreSQL?** Transfers must debit and credit atomically; foreign keys tie transactions to cards and users; numeric types suit money.

**Why Drogon?** Satisfies the course C++ server requirement with performant I/O without embedding an interpreted runtime.

### 4.3 C++ domain modules (`cpp/`)

| Module | Responsibility |
|--------|----------------|
| `finance_core` | Amount validation, signs, aggregates |
| `cards_core` | Card CRUD, deposit/withdraw |
| `monefy_store` | Orchestration, JSON persistence, user scoping |
| `monefy_api.cpp` | `extern "C"` surface for native bridge |
| nlohmann/json | Parse/serialize at boundaries |

### 4.4 Tooling

Metro (bundler), CocoaPods (iOS), Gradle (Android), ESLint/Prettier, Jest (smoke test on `App.tsx`).

---

## 5. Data Storage

### 5.1 Server-side (PostgreSQL)

Schema file: `backend/monefy-bank-api/sql/schema.sql`.

```sql
-- schema.sql (excerpt) — core tables
create table if not exists users (
  id uuid primary key,
  email text not null unique,
  password_hash text not null,
  password_salt text not null,
  first_name text not null,
  last_name text not null default '',
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token text primary key,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists cards (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  card_number text not null unique,
  holder_first_name text not null,
  balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id bigserial primary key,
  card_id uuid not null references cards(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(14,2) not null,
  category_id text references categories(id),
  payment_card text not null,
  operation_date date not null default current_date
);

create table if not exists email_verification_codes (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  email text not null,
  purpose text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
```

- **`users`** — UUID primary key, unique email, `password_hash` + `password_salt`, names, optional phone, `created_at`.  
- **`sessions`** — opaque token PK, `user_id`, `expires_at`; bearer authentication.  
- **`cards`** — per user: PAN, holder names, expiry, CVV, `balance` (numeric 14,2).  
- **`categories`** — seeded expense/income types (Pets, Restaurant, Transport, TopUp, Transfer, …) with icon metadata.  
- **`transactions`** — amount (negative = expense), category, description, icons, `payment_card`, `operation_date`.  
- **`transfers`** — internal card-to-card and external (another user’s card) with status and timestamps.  
- **`email_verification_codes`** — short-lived hashed confirmation codes for forgot-password and change-email flows; records are purpose-scoped, expire automatically by validation logic, and are marked consumed after successful use.

Passwords are **never stored in plain text**. Registration hashes password + salt; login recomputes and compares.

### 5.2 Client-side (AsyncStorage)

| Key / service | Content |
|---------------|---------|
| `@monefy/apiToken` | Session token for API |
| `user` | Serialized profile |
| `@monefy/savedAccounts` | Up to 8 accounts for quick switch (id, email, name, token, lastUsedAt) |
| `recent_payments` | Last service payment targets per user |
| `@monefy/locale`, theme, dateFormat | UI preferences |
| `@monefy/security/<userId>` | PIN settings, Face ID flag, local app-unlock state source |

Saved tokens enable fast account switching until expiry; logout removes the current account from the saved list.

### 5.3 Native offline layout (when enabled)

Under `documents_dir/user_<id>/`: `cards.json`, `transactions.json`, `custom_categories.json`. Thread-safe read/write with `std::mutex` prevents torn files.

### 5.4 API client

`src/api/client.ts` sets the API base URL from the platform and development network. Android emulator uses `10.0.2.2:8080`; iOS and physical devices use the configured LAN host in `src/config/devApiHost.ts` (for example `172.20.10.2:8080` when running through an iPhone hotspot). Authenticated calls attach `Authorization: Bearer <token>`.

```typescript
// src/api/client.ts — bearer token on each request
export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8080'
    : `http://${DEV_MACHINE_HOST}:${DEV_API_PORT}`;

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth !== false) {
    const token = await getApiToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  // ...
}
```

---

## 6. Core Application Features and User Flows

### 6.1 Authentication and multi-account

**User story — Register:** New user enters email, password, and display name. App calls `apiRegister`, receives token, stores user and token, adds entry to `savedAccounts`, navigates to main tabs.

**User story — Switch account:** From profile, user chooses “Switch account.” Current session is persisted in saved list; token cleared; `SwitchAccountScreen` lists accounts with last-used order. Tap restores token and validates via `GET /api/auth/profile`. Invalid token removes that saved row.

**User story — Logout:** Clears token and user; removes current account from saved list; returns to login.

**User story — Forgot password:** From the login screen, the user enters an email address and receives a six-digit verification code. After entering the code and a new password, the backend validates the code purpose (`forgot_password`), checks expiry/consumption, hashes the new password with a fresh salt, and allows the user to sign in again.

**User story — Change password:** From profile, an authenticated user can change the password by entering the current password and a new one. If the user does not remember the current password, the same verified forgot-password flow can be opened from settings with the current email prefilled.

**User story — Change email:** From profile, the user enters a new email, receives a verification code on that new address, and confirms the change in a second step. The app then updates the in-memory user, persisted profile, and saved-account entry so account switching remains correct.

```typescript
// src/context/AuthContext.tsx — restore session from saved account
const loginWithSavedAccount = async (accountId: string) => {
  const saved = await getSavedAccount(accountId);
  if (!saved?.token) {
    await removeSavedAccount(accountId);
    throw new Error('Сессия устарела, войдите с паролем');
  }
  await setApiToken(saved.token);
  const userData = await apiGetProfile();
  setUser(userData);
  await AsyncStorage.setItem(STORAGE_USER, JSON.stringify(userData));
  await upsertSavedAccount({ ...userData, token: saved.token });
};
```

### 6.2 Cards

Add/edit/remove cards with holder name, PAN, expiry, CVV, initial balance. **`BankCardVisual`** provides flip animation, spaced PAN, copy number, toggle CVV. **`CompactCardChip`** on home supports expand/collapse via `LayoutAnimation`. **`cardThemes.ts`** allows per-card color themes.

### 6.3 Transactions and categories

- **Expense** — negative amount, category required.  
- **Income / top-up** — positive amount, default TopUp category.  
- **14 built-in expense categories** aligned with legacy Monefy (`EXPENSE_CATEGORIES`).  
- **Custom categories** — user label + icon preset; synced via API.  
- **Payments screen** — service tiles (utilities, mobile, internet, …) open add-operation with preset category; custom payment categories can be created and reused.  
- **Recent payments** — `recentPayments.ts` surfaces chips on home.

### 6.4 Transfers

`TransferScreen` supports:

1. **Own cards** — `transferBetweenCards`; validates sufficient balance and distinct cards.  
2. **To another person** — `lookupCard` then `transferToCard`.

Both invoke **`requirePaymentAuth`** (PIN modal or biometrics if enabled).

```tsx
// src/screens/TransferScreen.tsx — transfer + PIN gate
await MonefyCore.transferBetweenCards(
  fromCard.number,
  toCard.number,
  amt,
  description.trim() || t('transferDefaultDesc'),
);

const onTransfer = () => {
  if (mode === 'own') {
    requirePaymentAuth(() => executeOwnTransfer());
  } else {
    requirePaymentAuth(() => executePersonTransfer());
  }
};
```

### 6.5 Statistics

`StatisticsScreen` filters by week, month, quarter, year, or all; lists expenses and income with **`AppIcon`** (vector-style shapes in React Native `View`, not emoji).

### 6.6 Loan, messages, profile

- **Loan** — simulated application: amount, term, rate, credit to selected card.  
- **Messages** — inbox (welcome, PIN reminder, rates).  
- **Profile** — phone binding with **`PhoneCountryPicker`** (`phoneCountries.ts`, locale-aware default), account security (change email, change password, PIN/Face ID), theme, language, feedback form, support messages, saved-account switching, and currency rates panel on home.

### 6.6.1 App unlock and PIN management

The security settings are user-scoped and stored under `@monefy/security/<userId>`. If a PIN exists, the app requires unlock when the authenticated app opens or returns from background. When Face ID / Touch ID is enabled and available, biometric authentication is attempted first; if it fails or is cancelled, the user can unlock with the PIN pad.

Changing an existing PIN is also protected: the user must either pass Face ID or enter the current PIN before choosing the new PIN length and confirming the new code. This mirrors common mobile banking patterns where changing an authentication factor requires proving the current one first.

### 6.7 Facade pattern (why it matters)

Course materials referenced a desktop **MonefyCore** API. Mobile screens were written against that contract. When the backend moved to Drogon + PostgreSQL, only `monefyCore.ts` changed—dozens of screens stayed stable. This is a practical lesson in **API stability** and **adapter layers**.

### 6.8 REST API surface (server responsibilities)

The Drogon server in `backend/monefy-bank-api/src/main.cpp` groups handlers by domain. Typical groups (exact paths may vary by build; consult source for authoritative routes):

- **Authentication** — register, login, logout, profile; session token issuance and validation middleware on protected routes.  
- **Account security** — forgot-password code sending/reset, authenticated password change, change-email code sending/confirmation; verification codes are stored hashed and purpose-scoped.  
- **Cards** — list/create/update/delete for the authenticated `user_id`; balance returned as numeric JSON.  
- **Transactions** — list with optional day filter, create expense/income, delete by id; category and icon fields stored for statistics UI.  
- **Categories** — built-in seed data plus user-defined custom categories.  
- **Transfers** — internal (two cards same user) and external (lookup by PAN, transfer to another user); implemented with SQL transactions so partial updates cannot leave inconsistent balances.  
- **Aggregations** — category totals and activity dates feeding `StatisticsScreen` and category drill-downs.

Handlers share utilities: UUID generation, SHA-256 password hashing, card number normalization (strip whitespace), ISO date for `operation_date`. Errors return JSON messages consumed by `apiRequest` and shown in alerts. This concentration of rules in C++ satisfies the academic requirement that **business logic not be reimplemented in TypeScript** for the production demo path.

### 6.9 Comparison with the original offline design (from draft report)

The team’s earlier Word draft emphasized **100% offline** operation and **no cloud servers**. That design remains valid for privacy-focused personal finance and is still present in `cpp/` and native bridges. The **banking extension** adds networked identity and peer transfers, which inherently require a server of record. The report therefore presents **two complementary stories**: (1) shared C++ engine + JSON files for local-first pedagogy; (2) Drogon + PostgreSQL for multi-user banking. Examiners should note which configuration was demonstrated at defense time—both share the same UI and `MonefyCore` method names.

---

## 7. C++ Native Engine and Bridge

### 7.1 Layered responsibilities

The React Native layer handles presentation, navigation, auth context, and biometrics UI. **Financial rules** in the native deployment live in C++: balance updates, transfer validation, monotonic transaction ids, persistence.

### 7.2 Bridge mechanics

- **Android:** `MonefyCoreModule.kt` loads `libmonefycpprn`; `jni_bridge.cpp` converts `jstring` with `GetStringUTFChars` / `ReleaseStringUTFChars`, calls `monefy_*`, returns JSON strings.  
- **iOS:** `MonefyCoreModule.mm` resolves documents directory, `monefy_init`, `RCT_EXPORT_METHOD` wrappers, `NSString` results.

### 7.3 JSON and memory ownership

Complex structures are not passed as parallel JNI arrays. The engine returns **one UTF-8 JSON string** per query (`getTransactionsJson`). Allocation uses `malloc`; native side copies into `jstring`/`NSString` then **`monefy_free_string`**. Pair every JNI string acquire with release. **`std::lock_guard<std::mutex>`** guards `MonefyStore` for thread-safe sessions.

### 7.4 Domain encapsulation

`MonefyStore` is the coordinator: private `cards_`, `transactions_`, `custom_categories_`; public `add_card`, `add_expense_transaction`, `transfer_between_cards`. Persistence helpers are private and only called under the store mutex. **`finance_core`** and **`cards_core`** keep arithmetic and validation testable without UI.

```cpp
// cpp/monefy_store.cpp — expense under mutex (offline/native path)
bool MonefyStore::add_expense_transaction(const json &t, std::string &error)
{
  std::lock_guard<std::mutex> lock(mutex_);
  const double amount = t["amount"].get<double>();
  if (!ensure_negative(amount, error)) {
    return false;
  }
  const std::string pay_card = t["paymentCard"].get<std::string>();
  json *card = find_card_mut(pay_card);
  if (!card) {
    error = "payment card not found";
    return false;
  }
  double bal = (*card)["balance"].get<double>();
  bal = cards_core::withdraw_amount(bal, std::abs(amount));
  (*card)["balance"] = bal;
  json row = t;
  row["id"] = next_transaction_id_++;
  transactions_.push_back(row);
  persist_cards_unsafe();
  persist_transactions_unsafe();
  return true;
}
```

---

## 8. User Interface, UX, and Internationalization

### 8.1 Design system (`src/theme/`)

- **`colors.ts`** — light/dark palettes, brand blue, income green, expense red, card gradients.  
- **`tokens.ts`** — spacing, radii, typography, shadows.

### 8.2 Motion and feedback

- **`AnimatedPressable`** — scale/opacity on taps.  
- **`PremiumTabBar`** — sliding active indicator.  
- **`BankCardVisual`** — 3D flip.  
- **Loading states** — `LoadingSpinner`, `LoadingButtonContent`, and `ScreenLoading` standardize waiting states for boot, data loading, form submission, transfer recipient lookup, and row-level actions.  
- **PIN pad animation** — `PinPadModal` uses animated dots, a shake response for wrong PINs, and step badges during setup/confirmation.  
- Animations are intentionally calm; no distracting full-screen effects.

### 8.3 Icons

**`AppIcon`** maps WPF-style names from **`categoryGlyphs.ts`** to minimalist line icons—consistent fintech appearance.

### 8.4 Internationalization

- **`AppLocale`** — 10 languages: `ru`, `en`, `uk`, `kk`, `de`, `fr`, `es`, `tr`, `zh`, `id`.  
- **`DICT`** in `translations.ts` with English fallback in `t()`.  
- **`BUILTIN_CATEGORY_LABELS`** localize category names.  
- **`formatDayForPreferences`** maps locale to BCP 47 for `Intl` date formatting.
- **Account-security localization** — `accountSecurityLocales.ts` extends non-English locales for recently added profile, change-email, change-password, PIN, and app-unlock copy.  
- **Navigation text refresh** — `useScreenTitle` and `PremiumTabBar` resolve labels from translation keys, so stack titles and bottom-tab labels update after changing language without restarting the app.

---

## 9. Security Model

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS recommended in production; dev uses HTTP on LAN |
| Passwords | SHA-256 + per-user salt on server |
| Sessions | Random bearer tokens with expiry in `sessions` table |
| Device | AsyncStorage for token (demo); production should use Keychain/Keystore |
| Payments | 4–6 digit PIN in `SecurityContext`; optional biometrics after setup |
| Transfers | `requirePaymentAuth` before executing transfer APIs |
| App entry | If PIN exists, app unlock is required after login/open and when returning from background |
| Account changes | Password reset and email change require short-lived email verification codes |

The app **fails closed** for sensitive actions: wrong PIN clears the modal input and blocks the action; failed biometrics falls back to PIN; expired saved-account tokens are purged on failed profile fetch. For account recovery, verification codes are not stored as plain text; the backend stores hashes and checks purpose, expiry, and consumption.

```tsx
// src/context/SecurityContext.tsx — biometrics or PIN before payment/unlock
const requirePaymentAuth = useCallback(
  (onSuccess: () => void | Promise<void>) => {
    if (!settings?.pin) {
      void Promise.resolve(onSuccess());
      return;
    }
    if (settings.faceIdEnabled && biometricKind !== 'none') {
      void authenticateWithBiometrics(t('biometricPrompt')).then(ok => {
        if (ok) {
          void onSuccess();
        } else {
          setPendingAction(() => onSuccess);
          setModalVisible(true);
        }
      });
      return;
    }
    setPendingAction(() => onSuccess);
    setModalVisible(true);
  },
  [settings, biometricKind, t],
);
```

The same provider also owns app-unlock state. On `AppState` background/inactive transitions, the app marks itself locked; on return to active it prompts Face ID / Touch ID or PIN before showing the authenticated UI again.

---

## 10. Testing and Quality Assurance

### 10.1 Automated

- **Jest** — `__tests__/App.test.tsx` smoke-renders `App` under `ReactTestRenderer.act` to catch provider/navigation regressions at boot.  
- **ESLint** — static style and common mistakes via `@react-native/eslint-config`.

### 10.2 Manual test matrix (recommended for report appendix)

| ID | Scenario | Expected result |
|----|----------|-----------------|
| T1 | Register new user | Token stored; home loads |
| T2 | Login wrong password | Error message; no token |
| T3 | Add expense | Balance decreases; appears in statistics |
| T4 | Transfer own cards insufficient funds | Rejected with message |
| T5 | Transfer with PIN | Blocked until correct PIN |
| T6 | Switch account | Prior user in list; restore works |
| T7 | Change locale | UI strings and category labels update |
| T8 | Dark theme | Colors from dark palette |
| T9 | Logout | Token cleared; login screen |
| T10 | API down | Graceful error from `apiRequest` |
| T11 | Forgot password | Email code accepted once; password changes; old password rejected |
| T12 | Change email | Code sent to new email; profile and saved account update after confirmation |
| T13 | App unlock | Returning from background requires Face ID or PIN when PIN is configured |
| T14 | Change PIN | Existing PIN or Face ID required before saving a new PIN |
| T15 | Physical iPhone API | `DEV_MACHINE_HOST` points to Mac LAN IP; login reaches C++ API on port 8080 |

### 10.3 Debugging practices

Team used React Native debugger, Drogon request logs, PostgreSQL inspection via `psql`, and readable JSON files in native mode. JNI leaks were traced by monitoring repeated transfer/list calls and verifying `monefy_free_string` on every JSON return path.

---

## 11. Team Roles and Development Process

### 11.1 Project timeline (indicative phases)

| Phase | Focus | Deliverables |
|-------|--------|--------------|
| 1 — Foundation | Repository setup, `cpp/` modules, JSON store, JNI smoke test | `finance_core`, `cards_core`, `monefy_store`, Android bridge |
| 2 — Mobile shell | Navigation, theme, login UI, `MonefyCore` TS wrapper calling native | Tab + stack navigators, `AuthContext` prototype |
| 3 — Banking API | Drogon server, PostgreSQL schema, auth endpoints | `schema.sql`, register/login/session, cards CRUD |
| 4 — Feature parity | Wire screens to REST via facade; transfers, categories, payments | `monefyCore.ts` HTTP implementation, transfer endpoints |
| 5 — Polish | i18n expansion, biometrics, saved accounts, `AppIcon`, statistics | 10 locales, `SwitchAccountScreen`, security flows |
| 6 — Account security | Forgot password, verified email change, password change, app unlock | SMTP sender, verification-code table, `AppLockOverlay`, account-security screens |
| 7 — Documentation | Report, manual tests, demo credentials | This document, examiner walkthrough |

This phased plan let the course assess **C++ early** (modules and bridge) while the **full banking demo** matured in later sprints without rewriting every screen.

### 11.2 Roles

Work split into **portable C++** (cards, transactions, store, API) and **React Native frontend** (screens, theme, auth, security). An **integration sub-effort** owned:

- JSON field naming contracts between UI and C++/API.  
- TypeScript **`MonefyCore`** facade.  
- Parity of Android and iOS native module method lists.  

Feature teams aligned so **Home, Payments, Transfer, Statistics** never duplicated balance math in JavaScript—reads/writes go through the facade. **`useFocusEffect`** reloads on screen focus so UI matches backend after navigation.

Short **pre-merge syncs** froze API shapes before large UI merges. Version control (Git) tracked `backend/`, `cpp/`, `src/`, and platform folders.

---

## 12. Challenges and Team Reflection

The hardest problems were **cross-platform native builds** and **memory ownership** at the JNI/Obj-C++ boundary. Android builds `libmonefycpprn.so` via CMake/NDK; iOS compiles the same sources in Xcode with different header paths—no unified build graph, so C++20 flags and include paths must be kept aligned manually.

**Concurrency:** a global mutex guards `MonefyStore` while React Native invokes native modules from multiple threads. **`thread_local`** last-error strings help diagnostics only if every entry point respects locking.

**Architectural pivot:** moving to PostgreSQL required transactional SQL for transfers but preserved the facade—good for schedule, demanding for documentation (this report clarifies both paths).

**UX vs security:** saved account tokens improve convenience; academic disclaimer: production apps need hardware-backed storage and certificate pinning.

---

## 13. Deployment and Development Setup

1. **Database:** `docker compose -f backend/monefy-bank-api/docker-compose.yml up -d`  
2. **API:** CMake build, run `monefy_bank_api` with `MONEFY_DB_CONNECTION` set.  
3. **Mobile:** `npm install`, `cd ios && pod install`, `npm run ios` or `npm run android`.  
4. **Networking:** Set `DEV_MACHINE_HOST` in `src/config/devApiHost.ts` to the Mac LAN IP for physical devices; Android emulator uses `10.0.2.2`, while iOS devices use the configured host.

For email verification features, run the API with SMTP environment variables loaded (for example Gmail app password in `.env`). In development, `MONEFY_EXPOSE_VERIFICATION_CODES=1` can expose codes in API responses/logs for testing without relying on external email delivery.

Demo credentials may appear on `LoginScreen` (e.g. demo@monefy.com) for examiners.

---

## 14. Limitations and Future Work

- **Not production-hardened** — no PCI-DSS, certificate pinning, or fraud analytics.  
- **Token storage** — AsyncStorage is convenient for demos; use encrypted Keychain/Keystore in production.  
- **Dual persistence story** — document clearly which path is active in a given build (API vs native JSON).  
- **Loan and FX rates** — simulated/educational, not live banking networks.

**Extensions:** push notifications, PDF statements, budgeting goals, admin web panel, API unit tests, Detox E2E, full offline sync when API returns.

---

## 15. Conclusion

**Monefy** demonstrates a complete mobile banking prototype combining **React Native**, a **C++ REST backend**, and **PostgreSQL**, while retaining a **shared C++ core** suitable for JNI/Objective-C++ integration and offline use. The architecture separates UI, API, and data; the **MonefyCore facade** insulates screens from transport changes.

Delivered capabilities—multi-card management, categorized transactions, service payments, transfers, statistics, ten-locale i18n, multi-account switching, account recovery, verified email change, password change, app unlock, PIN, and biometrics—map to real user expectations and course goals in advanced C++ and mobile engineering. The project shows how fintech UX (animations, themes, quick actions, loading feedback) can sit on a maintainable TypeScript codebase with **financial invariants enforced in C++ on the server** (and optionally on device).

For defense, we recommend a **ten-minute live demo**: register or use demo login, add a card, record an expense, show statistics update, perform a PIN-gated transfer, switch language in settings, demonstrate app unlock / Face ID, and optionally show PostgreSQL row counts or API logs (including verification-code rows) to prove persistence. **Appendix A** contains the corresponding source listings from the repository (replacing UI screenshots for this document version).

---

## Appendix A — Source Code Listings

The following excerpts are taken directly from the MonefyCppRn repository. Line numbers may shift between commits; paths are authoritative.

### A.1 Application entry and authentication gate

See Section 3.2 (`App.tsx`).

### A.2 MonefyCore facade (UI → REST)

```typescript
// src/native/monefyCore.ts
export const MonefyCore: CoreModule = {
  async getCardsJson() {
    const cards = await apiRequest<unknown[]>('/api/cards');
    return JSON.stringify(cards);
  },
  async addExpenseJson(json: string) {
    await apiRequest('/api/transactions/expense', {
      method: 'POST',
      body: JSON.parse(json),
    });
    return true;
  },
  async transferBetweenCards(
    fromCard: string,
    toCard: string,
    amount: number,
    description: string,
  ) {
    await apiRequest('/api/transfers/internal', {
      method: 'POST',
      body: { fromCard, toCard, amount, description },
    });
    return true;
  },
  async transferToCard(
    fromCard: string,
    toCard: string,
    amount: number,
    description: string,
  ) {
    await apiRequest('/api/transfers/external', {
      method: 'POST',
      body: { fromCard, toCard, amount, description },
    });
    return true;
  },
};
```

### A.3 Add expense / income from UI

```tsx
// src/screens/AddOperationScreen.tsx
const payload = JSON.stringify({
  amount: finalAmount,
  description: description.trim(),
  paymentCard: selectedCard.number,
  category,
  iconName,
  iconColor,
  date: new Date().toISOString().split('T')[0],
});

if (isIncome) {
  await MonefyCore.addIncomeJson(payload);
} else {
  await MonefyCore.addExpenseJson(payload);
}

const save = () => {
  requirePaymentAuth(() => performSave());
};
```

### A.4 Saved accounts (multi-account switch)

```typescript
// src/services/savedAccounts.ts
export async function upsertSavedAccount(
  account: Omit<SavedAccount, 'lastUsedAt'> & { lastUsedAt?: string },
): Promise<void> {
  const list = await loadSavedAccounts();
  const next: SavedAccount = {
    ...account,
    lastUsedAt: account.lastUsedAt ?? new Date().toISOString(),
  };
  const filtered = list.filter(item => item.id !== account.id);
  filtered.unshift(next);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 8)));
}
```

### A.5 C++ API — user registration

```cpp
// backend/monefy-bank-api/src/main.cpp
void auth_register(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  const auto email = body_string(*body, "email");
  const auto password = body_string(*body, "password");
  const auto user_id = uuid();
  const auto salt = random_hex(16);
  const auto hash = sha256(salt + password);
  const auto token = random_hex(32);

  auto c = db.connect();
  pqxx::work tx(c);
  tx.exec_params(
      "insert into users(id,email,password_hash,password_salt,first_name,last_name) "
      "values($1,$2,$3,$4,$5,$6)",
      user_id, email, hash, salt, first, last);
  tx.exec_params(
      "insert into sessions(token,user_id,expires_at) values($1,$2,now()+interval '30 days')",
      token, user_id);
  tx.commit();
  // returns { token, user }
}
```

### A.6 C++ API — internal transfer (atomic SQL)

```cpp
// backend/monefy-bank-api/src/main.cpp
void internal_transfer(const drogon::HttpRequestPtr &req, Callback &&cb)
{
  std::string user_id;
  if (!require_auth(req, cb, user_id)) return;
  const auto from_number = normalize_card(body_string(*body, "fromCard"));
  const auto to_number = normalize_card(body_string(*body, "toCard"));
  const auto amount = body_double(*body, "amount");

  pqxx::work tx(c);
  auto from = tx.exec_params(
      "select id,balance from cards where user_id=$1 and card_number=$2 for update",
      user_id, from_number);
  if (from[0]["balance"].as<double>() < amount) {
    cb(error_response("insufficient funds", drogon::k400BadRequest));
    return;
  }
  tx.exec_params("update cards set balance=balance-$1 where id=$2", amount, from_id);
  tx.exec_params("update cards set balance=balance+$1 where id=$2", amount, to_id);
  tx.exec_params(
      "insert into transfers(from_card_id,to_card_id,from_user_id,to_user_id,amount,description) "
      "values($1,$2,$3,$3,$4,$5)",
      from_id, to_id, user_id, amount, description);
  tx.commit();
}
```

### A.7 Native C API surface

```cpp
// cpp/include/monefy_core.h
int monefy_init(const char *documents_dir);
char *monefy_get_cards_json(void);
char *monefy_get_transactions_json(void);
int monefy_add_expense_json(const char *transaction_json);
int monefy_transfer_between_cards(const char *from_card_utf8,
                                  const char *to_card_utf8, double amount,
                                  const char *description_utf8);
void monefy_free_string(char *ptr);
```

### A.8 Android JNI bridge

```cpp
// android/app/src/main/cpp/jni_bridge.cpp
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

extern "C" JNIEXPORT jboolean JNICALL
Java_com_monefycpprn_MonefyCoreModule_nativeAddExpenseJson(JNIEnv *env, jclass,
                                                            jstring json)
{
  const char *j = env->GetStringUTFChars(json, nullptr);
  int ok = monefy_add_expense_json(j);
  env->ReleaseStringUTFChars(json, j);
  return ok ? JNI_TRUE : JNI_FALSE;
}
```

### A.9 Internationalization

```typescript
// src/context/AppPreferencesContext.tsx — translation lookup
const t = useCallback(
  (key: string, vars?: Record<string, string | number>) => {
    let s = DICT[locale][key] ?? DICT.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        s = s.split(`{${k}}`).join(String(v));
      }
    }
    return s;
  },
  [locale],
);
```

```typescript
// src/i18n/translations.ts — supported locales
export type AppLocale = 'ru' | 'en' | 'uk' | 'kk' | 'de' | 'fr' | 'es' | 'tr' | 'zh' | 'id';
```

### A.10 Automated smoke test

```tsx
// __tests__/App.test.tsx
test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
```

---


