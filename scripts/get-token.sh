#!/bin/bash

# Script to get JWT token from API
# Usage: ./scripts/get-token.sh username password

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: ./scripts/get-token.sh <username> <password>"
  exit 1
fi

USERNAME="$1"
PASSWORD="$2"

echo "🔐 Logging in as $USERNAME..."

RESPONSE=$(curl -s -X POST https://api.beercut.tech/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Token obtained successfully"
echo ""
echo "To seed patients, run:"
echo "node scripts/seed-patients.js $TOKEN"
echo ""
echo "Or export it:"
echo "export JWT_TOKEN=$TOKEN"
