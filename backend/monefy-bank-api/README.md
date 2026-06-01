# Monefy Bank C++ API

C++ backend for the Monefy Bank mobile app.

## Stack

- Drogon REST API
- PostgreSQL
- libpqxx
- OpenSSL SHA-256 password hashing with per-user salt
- Bearer session tokens stored in PostgreSQL

## Environment

Set the database connection string before running:

```sh
export MONEFY_DB_CONNECTION="host=localhost port=5433 dbname=fastbite0_SampleDB user=admin password=YOUR_PASSWORD"
export MONEFY_API_PORT=8080
```

The database password belongs only on the backend machine. Do not put it in the
React Native app.

For local development you can start PostgreSQL with:

```sh
docker compose -f backend/monefy-bank-api/docker-compose.yml up -d
```

## Build

Install dependencies with your preferred package manager, for example Homebrew:

```sh
brew install drogon libpqxx openssl cmake
```

Then build:

```sh
cmake -S backend/monefy-bank-api -B backend/monefy-bank-api/build
cmake --build backend/monefy-bank-api/build
```

Run:

```sh
./backend/monefy-bank-api/build/monefy_bank_api
```

The API initializes tables from `sql/schema.sql` at startup.
