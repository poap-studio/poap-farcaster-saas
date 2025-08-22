# Plan de Implementación: Integración Luma en POAP Platform

## Resumen de Hallazgos

### Limitaciones de la API de Luma
1. **Solo acceso a eventos propios**: La API solo permite acceso a eventos creados por el usuario autenticado
2. **Manager/Co-host no es suficiente**: Aunque admin@poap.fr sea manager, no puede acceder via API
3. **Autenticación funciona**: Podemos autenticarnos correctamente como POAP Studio (admin@poap.fr)
4. **Estructura de datos clara**: Sabemos cómo obtener guests, check-in status, emails, etc.

### Datos de la API
- **Base URL**: `https://public-api.luma.com`
- **Auth Header**: `x-luma-api-key: {API_KEY}`
- **User ID**: `usr-dZDAMCB9vdfjlvs` (POAP Studio)
- **Endpoints principales**:
  - `/v1/event/get` - Obtener detalles del evento
  - `/v1/event/get-guests` - Obtener lista de invitados
  - `/v1/event/create` - Crear nuevo evento
  - `/v1/event/update-guest-status` - Actualizar estado de invitado

## Estrategia de Implementación

### Fase 1: Modificaciones en la Base de Datos

```sql
-- Agregar campo platform a la tabla drops
ALTER TABLE drops ADD COLUMN platform VARCHAR(50) DEFAULT 'farcaster';

-- Agregar campos específicos de Luma
ALTER TABLE drops ADD COLUMN luma_event_id VARCHAR(255);
ALTER TABLE drops ADD COLUMN luma_short_code VARCHAR(50);
ALTER TABLE drops ADD COLUMN delivery_method VARCHAR(50); -- 'manual' o 'checkin'
ALTER TABLE drops ADD COLUMN event_end_at TIMESTAMP;

-- Crear tabla para tracking de entregas
CREATE TABLE poap_deliveries (
  id SERIAL PRIMARY KEY,
  drop_id INTEGER REFERENCES drops(id),
  email VARCHAR(255),
  mint_link VARCHAR(500),
  delivered_at TIMESTAMP,
  status VARCHAR(50), -- 'pending', 'sent', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Fase 2: Flujo de Creación de Drops para Luma

#### 2.1 Modificar Dashboard
```typescript
// src/app/dashboard/page.tsx
// Agregar dropdown en el botón "Create New Drop"
<DropdownMenu>
  <DropdownMenuTrigger>
    Create New Drop
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => router.push('/drops/new/farcaster')}>
      <img src="/icons/farcaster.png" className="w-4 h-4 mr-2" />
      Farcaster Drop
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => router.push('/drops/new/luma')}>
      <img src="/icons/luma.svg" className="w-4 h-4 mr-2" />
      Luma Event Drop
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

#### 2.2 Crear Formulario para Luma Drops
```typescript
// src/app/drops/new/luma/page.tsx
// Campos del formulario:
1. URL del evento Luma (extraer event ID)
2. POAP Event ID
3. POAP Secret Code
4. Método de entrega:
   - Manual (después del evento)
   - Automático (al hacer check-in)
5. Mensaje personalizado para el email
```

### Fase 3: Validación de Eventos Luma

Dado que no podemos acceder a eventos donde somos solo managers, necesitamos un enfoque diferente:

#### Opción A: Validación Manual
```typescript
// src/app/api/luma/validate-event/route.ts
export async function POST(req: Request) {
  const { eventUrl } = await req.json();
  
  // Extraer event ID de la URL
  const eventId = extractEventId(eventUrl);
  
  // Mostrar instrucciones al usuario
  return {
    success: true,
    eventId,
    instructions: [
      "1. Asegúrate de que admin@poap.fr es co-host del evento",
      "2. El evento debe ser creado por admin@poap.fr para acceso completo via API",
      "3. Si el evento ya existe, considera usar entrega manual de POAPs"
    ]
  };
}
```

#### Opción B: Web Scraping con Puppeteer
```typescript
// src/lib/luma-scraper.ts
import puppeteer from 'puppeteer';

export async function validateLumaEvent(eventUrl: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(eventUrl);
  
  // Extraer datos del evento
  const eventData = await page.evaluate(() => {
    // Buscar JSON-LD data
    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    return JSON.parse(jsonLd?.textContent || '{}');
  });
  
  // Verificar co-hosts
  const hasPoAPStudio = eventData.organizer?.some(
    org => org.name === 'POAP Studio'
  );
  
  await browser.close();
  
  return { eventData, hasPoAPStudio };
}
```

### Fase 4: Sistema de Entrega de POAPs

#### 4.1 Entrega Manual (Post-evento)
```typescript
// src/app/api/luma/send-poaps/route.ts
export async function POST(req: Request) {
  const { dropId } = await req.json();
  
  // Obtener drop y verificar que el evento haya terminado
  const drop = await prisma.drop.findUnique({ where: { id: dropId } });
  
  if (new Date() < new Date(drop.event_end_at)) {
    return { error: "El evento aún no ha terminado" };
  }
  
  // Obtener lista de asistentes (via scraping o manual)
  const attendees = await getLumaAttendees(drop.luma_event_id);
  
  // Filtrar solo los que hicieron check-in
  const checkedInAttendees = attendees.filter(a => a.checked_in_at);
  
  // Enviar POAPs
  for (const attendee of checkedInAttendees) {
    await sendPOAPEmail(attendee.email, drop);
  }
}
```

#### 4.2 Entrega Automática (Webhooks)
```typescript
// src/app/api/webhooks/luma/route.ts
export async function POST(req: Request) {
  const payload = await req.json();
  const signature = req.headers.get('x-luma-signature');
  
  // Verificar webhook signature
  if (!verifyWebhookSignature(payload, signature)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Procesar check-in event
  if (payload.event_type === 'guest.checked_in') {
    const { event_id, guest_email } = payload;
    
    // Buscar drop asociado
    const drop = await prisma.drop.findFirst({
      where: { luma_event_id: event_id }
    });
    
    if (drop && drop.delivery_method === 'checkin') {
      await sendPOAPEmail(guest_email, drop);
    }
  }
}
```

### Fase 5: Envío de Emails

```typescript
// src/lib/email-sender.ts
export async function sendPOAPEmail(
  email: string, 
  drop: Drop,
  mintLink: string
) {
  const transporter = nodemailer.createTransport({
    // Usar configuración existente de Gmail
  });
  
  const poapImage = await getPOAPImage(drop.poapEventId);
  
  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: email,
    subject: `Your POAP from ${drop.eventName}`,
    html: `
      <h1>Congratulations!</h1>
      <p>Thank you for attending. Here's your POAP:</p>
      <img src="${poapImage}" width="300" />
      <a href="${mintLink}" style="...">Claim your POAP</a>
    `
  });
}
```

### Fase 6: Interfaz de Usuario

#### 6.1 Dashboard Cards para Luma
```typescript
// Mostrar información específica de Luma
<div className="drop-card">
  <div className="flex items-center gap-2">
    <img src="/icons/luma.svg" className="w-6 h-6" />
    <span className="text-xs">Luma Event</span>
  </div>
  
  {drop.platform === 'luma' && (
    <>
      <p>Attendees: {drop.attendeeCount}</p>
      <p>Checked In: {drop.checkedInCount}</p>
      
      {drop.delivery_method === 'manual' && 
       new Date() > new Date(drop.event_end_at) && (
        <button onClick={() => sendPOAPs(drop.id)}>
          Send POAPs to Attendees
        </button>
      )}
    </>
  )}
</div>
```

## Variables de Entorno Necesarias

```bash
# Luma API
LUMA_API_KEY=secret-7273PN691wI808x3xG27EsR7u
LUMA_USER_EMAIL=admin@poap.fr
LUMA_WEBHOOK_SECRET=<generated_secret>

# Opcional para scraping
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

## Consideraciones Importantes

1. **Eventos Nuevos vs Existentes**:
   - Para eventos nuevos: Crearlos con admin@poap.fr desde el inicio
   - Para eventos existentes: Usar scraping o entrada manual de asistentes

2. **Límites de la API**:
   - Solo eventos propios son accesibles
   - Manager/co-host no es suficiente
   - Considerar límites de rate limiting

3. **Fallbacks**:
   - Si la API falla, permitir carga manual de CSV con asistentes
   - Opción de copiar/pegar lista de emails

4. **Seguridad**:
   - Verificar siempre que admin@poap.fr es co-host
   - Validar webhooks signatures
   - No exponer API keys en el frontend

## Próximos Pasos

1. Implementar cambios en la base de datos
2. Crear UI para selección de plataforma
3. Implementar formulario de Luma drops
4. Configurar sistema de emails
5. Implementar webhooks (si es posible)
6. Testing con eventos reales

## Alternativa Recomendada

Dado las limitaciones de la API, recomiendo:
1. **Para eventos futuros**: Crearlos siempre con admin@poap.fr
2. **Para eventos existentes**: Implementar carga manual de asistentes
3. **Webhook como bonus**: Si funciona, genial. Si no, entrega manual post-evento