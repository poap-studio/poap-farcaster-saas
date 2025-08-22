#!/bin/bash

# Probar la nueva cookie

COOKIE="luma.auth-session-key=usr-dZDAMCB9vdfjlvs.oef4cc7j5z56gsatekat"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Probando Nueva Cookie de Sesión ===${NC}"
echo ""

# Verificar autenticación
echo -e "${GREEN}1. Verificando autenticación${NC}"

response=$(curl -s -X GET "https://api.lu.ma/user/get-self" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ Cookie válida y funcionando${NC}"
    echo "$body" | jq '{
      name: .name,
      email: .email,
      api_id: .api_id
    }'
else
    echo -e "${RED}❌ Cookie inválida${NC}"
    echo "$body"
fi

echo ""

# Probar con evento de POAP Studio
echo -e "${GREEN}2. Probando acceso a evento de POAP Studio${NC}"
EVENT_ID="evt-dFABGoCDVLecXHG"

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ Acceso exitoso al evento${NC}"
    echo "$body" | jq '{
      name: .event.name,
      api_id: .event.api_id
    }'
else
    echo -e "${RED}❌ No se puede acceder${NC}"
fi

echo ""
echo -e "${BLUE}Cookie nueva guardada en:${NC}"
echo "- luma-cookie.txt"
echo "- luma-session-cookie.json"
echo ""
echo "Cookie: ${YELLOW}$COOKIE${NC}"