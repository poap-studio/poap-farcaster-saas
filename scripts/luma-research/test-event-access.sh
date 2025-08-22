#!/bin/bash

# Probar acceso al evento evt-BSpg8pw5X1FHClE

COOKIE="luma.auth-session-key=usr-dZDAMCB9vdfjlvs.oef4cc7j5z56gsatekat"
EVENT_ID="evt-BSpg8pw5X1FHClE"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Probando Acceso al Evento ${EVENT_ID} ===${NC}"
echo ""

# Test 1: Obtener datos del evento
echo -e "${GREEN}1. Obteniendo Datos del Evento${NC}"
echo "GET https://api.lu.ma/event/admin/get?event_api_id=$EVENT_ID"
echo ""

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ ÉXITO! Datos del evento obtenidos${NC}"
    echo "$body" | jq '.' > event-$EVENT_ID.json
    
    # Mostrar información clave
    echo ""
    echo -e "${BLUE}Información del Evento:${NC}"
    echo "$body" | jq '{
      name: .event.name,
      start_at: .event.start_at,
      end_at: .event.end_at,
      url: .event.url,
      location: .event.location_display_name,
      hosts: [.hosts[] | {name: .name, email: .email}],
      total_guests: .guests_count
    }'
    
    # Verificar si admin@poap.fr es host
    echo ""
    echo -e "${BLUE}Verificando hosts:${NC}"
    is_host=$(echo "$body" | jq '.hosts[] | select(.email == "admin@poap.fr")')
    if [ -n "$is_host" ]; then
        echo -e "${GREEN}✅ admin@poap.fr es host de este evento${NC}"
        echo "$is_host" | jq '{name, email, role}'
    else
        echo -e "${YELLOW}⚠️ admin@poap.fr NO aparece como host${NC}"
    fi
else
    echo -e "${RED}❌ Error al obtener datos del evento${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""
echo -e "${YELLOW}─────────────────────────────────────────${NC}"
echo ""

# Test 2: Obtener lista de guests
echo -e "${GREEN}2. Obteniendo Lista de Guests${NC}"
echo "GET https://api.lu.ma/event/admin/get-guests?event_api_id=$EVENT_ID"
echo ""

response=$(curl -s -X GET "https://api.lu.ma/event/admin/get-guests?event_api_id=$EVENT_ID" \
  -H "Cookie: $COOKIE" \
  -H "Accept: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -w "\nHTTP_STATUS:%{http_code}")

http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo -e "Status: ${YELLOW}$http_status${NC}"

if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ ÉXITO! Lista de guests obtenida${NC}"
    echo "$body" | jq '.' > guests-$EVENT_ID.json
    
    # Analizar guests
    echo ""
    echo -e "${BLUE}Resumen de Guests:${NC}"
    
    total=$(echo "$body" | jq '.entries | length')
    checked_in=$(echo "$body" | jq '[.entries[] | select(.checked_in_at != null)] | length')
    with_email=$(echo "$body" | jq '[.entries[] | select(.email != null and .email != "")] | length')
    
    echo "Total guests: $total"
    echo "Con check-in: $checked_in"
    echo "Con email: $with_email"
    
    # Verificar paginación
    has_more=$(echo "$body" | jq '.has_more')
    if [ "$has_more" = "true" ]; then
        next_cursor=$(echo "$body" | jq -r '.next_cursor // empty')
        echo -e "${YELLOW}Nota: Hay más guests (paginación disponible)${NC}"
        echo "Next cursor: $next_cursor"
    fi
    
    # Mostrar primeros guests
    echo ""
    echo -e "${BLUE}Primeros 10 Guests:${NC}"
    echo "$body" | jq -r '.entries[0:10][] | 
      "- \(.name // "Sin nombre") (\(.email // "sin email")) - " + 
      if .checked_in_at then 
        "✓ Check-in: \(.checked_in_at)" 
      else 
        "✗ No check-in" 
      end'
    
    # Mostrar solo los con check-in
    echo ""
    echo -e "${BLUE}Guests con Check-in:${NC}"
    checked_guests=$(echo "$body" | jq -r '.entries[] | select(.checked_in_at != null) | 
      "✓ \(.name) (\(.email)) - Check-in: \(.checked_in_at)"')
    
    if [ -z "$checked_guests" ]; then
        echo -e "${YELLOW}No hay guests con check-in registrado${NC}"
    else
        echo "$checked_guests"
    fi
    
else
    echo -e "${RED}❌ Error al obtener lista de guests${NC}"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
fi

echo ""
echo -e "${BLUE}=== Resumen Final ===${NC}"
if [ "$http_status" = "200" ]; then
    echo -e "${GREEN}✅ Acceso completo al evento evt-BSpg8pw5X1FHClE${NC}"
    echo "✅ Datos del evento obtenidos"
    echo "✅ Lista de guests accesible"
    echo "✅ La cookie y el método funcionan correctamente"
    echo ""
    echo "Archivos guardados:"
    echo "- event-$EVENT_ID.json"
    echo "- guests-$EVENT_ID.json"
else
    echo -e "${RED}❌ No se pudo acceder al evento${NC}"
    echo "Posibles razones:"
    echo "- admin@poap.fr no es propietario del evento"
    echo "- La cookie expiró"
    echo "- El evento no existe"
fi