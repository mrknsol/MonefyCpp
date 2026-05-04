cmake_minimum_required(VERSION 3.13)
project(monefycpprn)

set(CPP_ROOT ${CMAKE_SOURCE_DIR}/../../../../../cpp)

include_directories(
  ${CPP_ROOT}/include
  ${CPP_ROOT}/third_party
)

add_library(monefycpprn SHARED
  jni_bridge.cpp
  ${CPP_ROOT}/monefy_api.cpp
  ${CPP_ROOT}/finance_core.cpp
  ${CPP_ROOT}/cards_core.cpp
  ${CPP_ROOT}/monefy_store.cpp
)

find_library(log-lib log)

target_link_libraries(monefycpprn ${log-lib})
