#!/bin/bash

# Intentar obtener invitados del evento de prueba

COOKIE="luma.auth-session-key=usr-dZDAMCB9vdfjlvs.znhmpczf93qh40pkau4b"
EVENT_ID="evt-H2y5Rg51kDNxaDQ"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Intentando acceder al evento de prueba ===${NC}"
echo "Event ID: $EVENT_ID"
echo "URL: https://lu.ma/vferpy6v"
echo ""

# Primero intentar obtener info del evento
echo -e "${GREEN}1. Información del Evento${NC}"

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ Acceso al evento exitoso${NC}"
    echo "$body" | jq '{
      name: .event.name,
      start_at: .event.start_at,
      hosts: [.hosts[].name]
    }'
else
    echo -e "${RED}❌ No se puede acceder al evento${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""

# Intentar obtener invitados
echo -e "${GREEN}2. Lista de Invitados${NC}"

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get-guests?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ Lista de invitados obtenida${NC}"
    
    # Contar invitados
    total=$(echo "$body" | jq '.entries | length')
    checked_in=$(echo "$body" | jq '[.entries[] | select(.checked_in_at != null)] | length')
    
    echo ""
    echo "Total invitados: $total"
    echo "Con check-in: $checked_in"
    
    # Mostrar solo los que hicieron check-in
    echo ""
    echo -e "${BLUE}Invitados con Check-in:${NC}"
    echo "$body" | jq -r '.entries[] | select(.checked_in_at != null) | 
      "✓ \(.name) (\(.email)) - Check-in: \(.checked_in_at)"'
    
    # Si no hay check-ins, mostrar algunos invitados
    if [ "$checked_in" = "0" ]; then
        echo ""
        echo -e "${YELLOW}No hay check-ins registrados aún. Mostrando primeros 5 invitados:${NC}"
        echo "$body" | jq -r '.entries[0:5][] | 
          "- \(.name) (\(.email)) - Registrado: \(.registered_at)"'
    fi
    
    # Guardar datos completos
    echo "$body" > test-event-guests.json
    echo ""
    echo "Datos completos guardados en test-event-guests.json"
    
else
    echo -e "${RED}❌ No se puede obtener la lista de invitados${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
    echo ""
    echo -e "${YELLOW}Nota: Esto confirma que admin@poap.fr no es propietario del evento${NC}"
fi

echo ""
echo -e "${BLUE}=== Diagnóstico ===${NC}"
if [ "$http_status" = "403" ]; then
    echo "❌ Error 403: No tienes acceso a este evento"
    echo "📝 Razón: admin@poap.fr es co-host/manager, no propietario"
    echo "💡 Solución: El propietario debe transferir la propiedad del evento"
elif [ "$http_status" = "401" ]; then
    echo "❌ Error 401: Cookie expirada o inválida"
    echo "💡 Solución: Necesitas renovar la cookie de sesión"
elif [ "$http_status" = "200" ]; then
    echo "✅ Acceso exitoso al evento"
fi