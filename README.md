# Monefy Bank

Cross-platform mobile banking application built with **React Native** and a **C++ REST API** backed by **PostgreSQL**. The project demonstrates card management, categorized transactions, transfers, service payments, statistics, multi-language UI, and payment security (PIN / biometrics).

> Educational / university project. Not intended for production financial use.

## Features

- **Authentication** — register, login, logout, Steam-style account switching with saved sessions
- **Cards** — add, edit, delete; visual card with flip animation, copy number, CVV toggle
- **Transactions** — expenses and top-ups by category; built-in and custom categories
- **Payments** — service shortcuts (utilities, mobile, transport, etc.) and custom payment categories
- **Transfers** — between own cards or to another user by card number
- **Statistics** — spending and income by period (week, month, quarter, year)
- **Profile** — phone binding, theme (light / dark / system), 10 languages
- **Security** — payment PIN, optional Face ID / Touch ID
- **Extras** — loan flow (demo), messages, feedback, currency rates on home

## Architecture

```
┌──────────────────────────────┐
│   React Native (TypeScript)   │  iOS & Android
│   UI · Navigation · i18n      │
└──────────────┬───────────────┘
               │ HTTPS + Bearer token
               ▼
┌──────────────────────────────┐
│   C++ API (Drogon) :8080      │
└──────────────┬───────────────┘
               │ SQL
               ▼
┌──────────────────────────────┐
│   PostgreSQL 16               │
└──────────────────────────────┘
```

The mobile app uses a `MonefyCore` facade (`src/native/monefyCore.ts`) that talks to the REST API. Native C++ modules under `cpp/` provide finance/card logic and can be linked via JNI (Android) and Objective-C++ (iOS).

## Tech stack

| Layer | Technologies |
|--------|----------------|w
| Mobile | React Native 0.85, React 19, TypeScript, React Navigation |
| Local storage | AsyncStorage (preferences, sessions, saved accounts) |
| Security | react-native-biometrics, app PIN |
| API | C++17, Drogon, libpqxx, OpenSSL |
| Database | PostgreSQL 16, Docker Compose |
| Build | Metro, CocoaPods (iOS), Gradle (Android), CMake |

## Project structure

```
MonefyCppRn/
├── App.tsx                 # Root providers & auth gate
├── src/
│   ├── api/                # HTTP client & auth/profile API
│   ├── components/         # UI (cards, tab bar, icons, animations)
│   ├── context/            # Auth, security, preferences
│   ├── navigation/         # Tabs & stack navigators
│   ├── screens/            # App screens
│   ├── services/           # Saved accounts, recent payments, rates
│   ├── i18n/               # Translations (10 locales)
│   └── native/             # MonefyCore bridge → REST
├── cpp/                    # C++ domain logic & C API header
├── backend/monefy-bank-api/
│   ├── src/main.cpp        # Drogon server
│   ├── sql/schema.sql      # Database schema
│   └── docker-compose.yml  # Local PostgreSQL
├── android/ · ios/         # Native projects & MonefyCore modules
└── docs/                   # Project documentation & final report
```

## Prerequisites

- **Node.js** ≥ 22.11
- **npm**
- **Xcode** (iOS) or **Android Studio** (Android)
- **Docker Desktop** (for PostgreSQL)
- **CMake**, **Drogon**, **libpqxx**, **OpenSSL** (for the C++ API — see [backend README](backend/monefy-bank-api/README.md))

## Getting started

### 1. Database

From the repository root:

```sh
docker compose -f backend/monefy-bank-api/docker-compose.yml up -d
```

Default connection (see `backend/monefy-bank-api/.env.example`):

- Host: `localhost:5433`
- Database: `fastbite0_SampleDB`
- User / password: `admin` / `admin`

### 2. API server

```sh
export MONEFY_DB_CONNECTION="host=localhost port=5433 dbname=fastbite0_SampleDB user=admin password=admin"
export MONEFY_API_PORT=8080

cmake -S backend/monefy-bank-api -B backend/monefy-bank-api/build
cmake --build backend/monefy-bank-api/build
./backend/monefy-bank-api/build/monefy_bank_api
```

Tables are created from `backend/monefy-bank-api/sql/schema.sql` on startup.

### 3. Mobile app

```sh
npm install

# iOS (first time / after native dep changes)
cd ios && bundle install && bundle exec pod install && cd ..

npm start
# In another terminal:
npm run ios
# or
npm run android
```

### API URL on a physical device

Emulators use `localhost` or `10.0.2.2` by default (`src/api/client.ts`). On a real phone, set `API_BASE_URL` to your computer’s LAN IP, for example:

`http://192.168.1.10:8080`

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run lint` | ESLint |
| `npm test` | Jest |

## Documentation

- [Backend API setup](backend/monefy-bank-api/README.md)
- [Final project report](docs/Monefy_Final_Project_Report.md) — architecture, features, and design decisions (~5000 words)

## Security note

Passwords are hashed on the server (salt + SHA-256). Session tokens are stored in AsyncStorage for convenience (including quick account switch). This is appropriate for a **demo / coursework** app only — production banking apps require stricter key storage, certificate pinning, and compliance controls.

## License

University coursework project. All rights reserved by the authors unless your institution specifies otherwise.
