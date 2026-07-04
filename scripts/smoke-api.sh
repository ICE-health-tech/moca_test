#!/usr/bin/env bash
# Smoke-test MoCA API — expects 200 on all listed endpoints.
# Usage: BASE_URL=https://mocatest.icestore.art ./scripts/smoke-api.sh

set -euo pipefail

BASE="${BASE_URL:-http://localhost:8080}"
PASS=0
FAIL=0

check() {
  local name="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then
    echo "OK  $name -> $actual"
    PASS=$((PASS + 1))
  else
    echo "FAIL $name -> $actual (expected $expected)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== MoCA API smoke test @ $BASE ==="

# health
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
check "GET /api/health" 200 "$code"

# patient login
PATIENT_RESP=$(curl -s -X POST "$BASE/api/auth/patient/login" \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"84337432001"}')
PTOKEN=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('accessToken',''))" <<< "$PATIENT_RESP")
PID=$(python3 -c "import json,sys; print(json.load(sys.stdin).get('user',{}).get('id',''))" <<< "$PATIENT_RESP")
code=$(python3 -c "import json,sys; d=json.load(sys.stdin); print(200 if d.get('accessToken') else 403)" <<< "$PATIENT_RESP")
check "POST /api/auth/patient/login" 200 "$code"

# staff signup (unique email)
EMAIL="smoke-$(date +%s)@test.local"
SIGNUP_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/staff/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"password123\",\"fullName\":\"Smoke Test\"}")
SIGNUP_CODE=$(echo "$SIGNUP_RESP" | tail -1)
check "POST /api/auth/staff/signup" 200 "$SIGNUP_CODE"
DTOKEN=$(python3 -c "import json,sys; lines=sys.stdin.read().strip().split('\n'); print(json.loads('\n'.join(lines[:-1])).get('accessToken',''))" <<< "$SIGNUP_RESP")
DID=$(python3 -c "import json,sys; lines=sys.stdin.read().strip().split('\n'); print(json.loads('\n'.join(lines[:-1])).get('user',{}).get('id',''))" <<< "$SIGNUP_RESP")

# staff login
LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/staff/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"password123\"}")
LOGIN_CODE=$(echo "$LOGIN_RESP" | tail -1)
check "POST /api/auth/staff/login" 200 "$LOGIN_CODE"

for path in sessions appointments clinicians; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $PTOKEN" \
    "$BASE/api/patient/$PID/$path")
  check "GET /api/patient/{id}/$path" 200 "$code"
done

for path in reviews patients; do
  code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $DTOKEN" \
    "$BASE/api/clinician/$DID/$path")
  check "GET /api/clinician/{id}/$path" 200 "$code"
done

# admin — use seeded admin if available, else skip
ADMIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/staff/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@moca.local","password":"password"}')
ADMIN_CODE=$(echo "$ADMIN_RESP" | tail -1)
if [ "$ADMIN_CODE" = 200 ]; then
  ATOKEN=$(python3 -c "import json,sys; lines=sys.stdin.read().strip().split('\n'); print(json.loads('\n'.join(lines[:-1])).get('accessToken',''))" <<< "$ADMIN_RESP")
  for path in stats clinicians; do
    code=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ATOKEN" \
      "$BASE/api/admin/$path")
    check "GET /api/admin/$path" 200 "$code"
  done
else
  echo "SKIP admin endpoints (login $ADMIN_CODE — set admin password in seed)"
fi

echo "=== $PASS passed, $FAIL failed ==="
[ "$FAIL" -eq 0 ]
