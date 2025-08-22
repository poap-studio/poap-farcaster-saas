# Plan: Servicio de Autenticación Luma para Vercel

## El Problema
- Luma requiere autenticación mediante cookie de sesión
- La cookie se obtiene mediante login con email/password
- Puppeteer con navegador completo no funciona en Vercel
- La cookie expira periódicamente

## Soluciones Propuestas

### Opción 1: Microservicio en AWS Lambda

```typescript
// AWS Lambda function con Puppeteer-core y chrome-aws-lambda
import chromium from 'chrome-aws-lambda';

export async function handler(event) {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  
  // Login logic...
  
  return {
    statusCode: 200,
    body: JSON.stringify({ cookie: sessionCookie })
  };
}
```

**Pros:**
- Funciona con Puppeteer en Lambda
- Puede ser invocado desde Vercel
- Escalable

**Contras:**
- Requiere mantener otro servicio
- Costos adicionales de AWS

### Opción 2: API Route con Playwright

```typescript
// src/app/api/luma/refresh-cookie/route.ts
import { chromium } from 'playwright-core';

export async function POST() {
  // Playwright puede funcionar en edge runtime
  const browser = await chromium.connectOverCDP(process.env.BROWSERLESS_URL);
  
  // Login and get cookie
  
  return Response.json({ cookie });
}
```

**Pros:**
- Puede funcionar en Vercel con servicio externo
- Un solo deployment

**Contras:**
- Requiere servicio de browser (Browserless.io)
- Costos del servicio externo

### Opción 3: Entrada Manual de Cookie

```typescript
// src/app/admin/luma-cookie/page.tsx
export default function LumaCookiePage() {
  return (
    <div>
      <h1>Actualizar Cookie de Luma</h1>
      <p>1. Abre Chrome DevTools en lu.ma</p>
      <p>2. Ve a Application > Cookies</p>
      <p>3. Copia el valor de luma.auth-session-key</p>
      <input 
        type="text" 
        placeholder="Pegar cookie aquí"
        onChange={(e) => updateCookie(e.target.value)}
      />
    </div>
  );
}
```

**Pros:**
- Más simple
- No requiere servicios externos
- Funciona inmediatamente

**Contras:**
- Proceso manual
- Requiere intervención cuando expira

### Opción 4: Cookie Storage con Redis

```typescript
// src/lib/luma-cookie-manager.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export async function getLumaCookie(): Promise<string | null> {
  const cookie = await redis.get('luma:session:cookie');
  
  if (!cookie) {
    // Send notification to admin to update cookie
    await sendAdminNotification('Luma cookie expired');
    return null;
  }
  
  return cookie as string;
}

export async function setLumaCookie(cookie: string) {
  // Store with 7 day expiration
  await redis.set('luma:session:cookie', cookie, {
    ex: 7 * 24 * 60 * 60
  });
}
```

## Implementación Recomendada

### Fase 1: Cookie Manual con Storage
1. Crear página admin para ingresar cookie
2. Almacenar en Redis/Base de datos
3. Detectar expiración y notificar

### Fase 2: Obtención Semi-Automática
```typescript
// src/app/api/luma/events/[eventId]/guests/route.ts
export async function GET(req: Request, { params }) {
  const cookie = await getLumaCookie();
  
  if (!cookie) {
    return Response.json({ 
      error: 'Cookie expired', 
      requiresUpdate: true 
    }, { status: 401 });
  }
  
  const response = await fetch(
    `https://api.lu.ma/event/admin/get-guests?event_api_id=${params.eventId}`,
    {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json'
      }
    }
  );
  
  if (response.status === 401) {
    // Cookie invalid, notify admin
    await markCookieAsExpired();
    return Response.json({ 
      error: 'Cookie invalid', 
      requiresUpdate: true 
    }, { status: 401 });
  }
  
  const guests = await response.json();
  return Response.json(guests);
}
```

### UI para Gestión de Cookie

```typescript
// src/components/luma/CookieStatus.tsx
export function LumaCookieStatus() {
  const { data: status } = useSWR('/api/luma/cookie-status');
  
  if (status?.expired) {
    return (
      <Alert>
        <AlertTitle>Luma Cookie Expired</AlertTitle>
        <AlertDescription>
          Please update the Luma session cookie to continue.
          <Link href="/admin/luma-cookie">
            <Button>Update Cookie</Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="text-green-500">
      ✓ Luma connection active
    </div>
  );
}
```

## Scripts de Ayuda

### 1. Script Local para Obtener Cookie
```bash
#!/bin/bash
# get-luma-cookie.sh
# Run locally, then copy cookie to app

node luma-login-fixed.js
echo "Cookie saved to luma-cookie.txt"
echo "Copy and paste in admin panel"
```

### 2. GitHub Action para Renovación
```yaml
# .github/workflows/refresh-luma-cookie.yml
name: Refresh Luma Cookie
on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  workflow_dispatch:

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Get Cookie
        run: |
          npm install puppeteer
          node scripts/get-cookie.js
      - name: Update Vercel Env
        run: |
          curl -X PATCH https://api.vercel.com/v9/projects/$PROJECT_ID/env/$ENV_ID \
            -H "Authorization: Bearer $VERCEL_TOKEN" \
            -d '{"value": "'$COOKIE'"}'
```

## Flujo de Implementación

1. **Crear Drop de Luma**:
   - Usuario ingresa URL del evento
   - Sistema valida que puede acceder (con cookie actual)
   - Si no, muestra alerta para actualizar cookie

2. **Envío de POAPs**:
   - Obtener guests con cookie
   - Si falla, notificar para actualizar
   - Reintentar después de actualización

3. **Monitoreo**:
   - Endpoint de health check
   - Alertas cuando la cookie está por expirar
   - Dashboard con estado de conexión

## Conclusión

Para Vercel, la mejor opción es:
1. **Cookie manual con buen UX** para actualización
2. **Storage persistente** en Redis/DB
3. **Notificaciones proactivas** cuando expira
4. **Fallback graceful** si no hay cookie válida

Esto evita la complejidad de servicios externos mientras mantiene la funcionalidad.