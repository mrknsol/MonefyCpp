cmake_minimum_required(VERSION 3.20)

project(MonefyBankApi LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(Drogon CONFIG REQUIRED)
find_package(OpenSSL REQUIRED)

find_path(PQXX_INCLUDE_DIR pqxx/pqxx)
find_library(PQXX_LIBRARY pqxx)

if(NOT PQXX_INCLUDE_DIR OR NOT PQXX_LIBRARY)
  message(FATAL_ERROR "libpqxx headers/library not found")
endif()

add_executable(monefy_bank_api
  src/main.cpp
)

target_link_libraries(monefy_bank_api
  PRIVATE
    Drogon::Drogon
    ${PQXX_LIBRARY}
    OpenSSL::Crypto
)

target_include_directories(monefy_bank_api PRIVATE ${PQXX_INCLUDE_DIR})
