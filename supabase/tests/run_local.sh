#!/usr/bin/env bash
# Chạy kiểm thử hàm SQL trên PostgreSQL 16 thường (không cần Supabase):
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres bash supabase/tests/run_local.sh
# Script tạo CSDL tạm "nailcare_test", giả lập schema auth/storage của Supabase,
# chạy toàn bộ migrations + seed rồi chạy 10_business_rules.sql.
set -euo pipefail
cd "$(dirname "$0")/.."
P="psql -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists nailcare_test" -c "create database nailcare_test"
$P -d nailcare_test -c "do \$\$ begin create role anon nologin; exception when duplicate_object then null; end \$\$;" \
                    -c "do \$\$ begin create role authenticated nologin; exception when duplicate_object then null; end \$\$;" \
                    -c "do \$\$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end \$\$;"
$P -d nailcare_test -f tests/00_supabase_stub.sql
for f in migrations/*.sql seed.sql; do $P -d nailcare_test -f "$f"; done
psql -d nailcare_test -f tests/10_business_rules.sql
