# Prompt Completo para Implementación de Integración Luma + Servicio AWS

## Contexto
Tengo una aplicación Next.js 15 desplegada en Vercel que actualmente permite crear drops de POAPs en Farcaster. Necesito extenderla para soportar múltiples plataformas, empezando con Luma.

## Investigación Previa Completada
He investigado la API de Luma y tengo los siguientes archivos con la información:
- `/scripts/luma-research/FINDINGS_SUMMARY.md` - Resumen de hallazgos de la API
- `/scripts/luma-research/implementation-plan.md` - Plan de implementación inicial
- `/scripts/luma-research/luma-cookie-service-plan.md` - Plan para gestión de cookies
- `/scripts/luma-research/aws-cookie-service-plan.md` - Plan para servicio AWS

### Hallazgos Clave:
1. La API de Luma requiere autenticación con cookie de sesión
2. Solo se puede acceder a eventos donde el usuario es PROPIETARIO (no co-host)
3. La cookie se obtiene con Puppeteer haciendo login con email/password
4. Endpoints confirmados funcionando:
   - GET `https://api.lu.ma/event/admin/get?event_api_id={eventId}`
   - GET `https://api.lu.ma/event/admin/get-guests?event_api_id={eventId}`
5. Estructura de datos de guests incluye: name, email, checked_in_at

## Requisitos de Implementación

### Parte 1: Aplicación Principal (Vercel)

#### 1. Modificar Base de Datos
```sql
ALTER TABLE drops ADD COLUMN platform VARCHAR(50) DEFAULT 'farcaster';
ALTER TABLE drops ADD COLUMN luma_event_id VARCHAR(255);
ALTER TABLE drops ADD COLUMN delivery_method VARCHAR(50);
ALTER TABLE drops ADD COLUMN luma_event_url VARCHAR(500);
```

#### 2. Modificar Dashboard (/dashboard)
- Añadir dropdown para seleccionar plataforma al crear drop (Farcaster/Luma)
- En las cards de drops existentes:
  - Mostrar icono de la plataforma (Farcaster o Luma)
  - Usar colores diferentes según plataforma
  - Para drops de Luma, el botón "Download Collectors" debe descargar CSV con: name, email, checked_in_at

#### 3. Crear Nueva Página para Drops de Luma
Ruta: `/dashboard/drops/luma/new`

Formulario con:
- URL del evento de Luma (validar formatos: `https://lu.ma/event/manage/evt-XXX` o `https://lu.ma/XXX`)
- Método de entrega:
  - Manual: Enviar POAPs después del evento
  - Automático: Enviar cuando hagan check-in (implementar después)
- Configuración de email:
  - Asunto del email
  - Cuerpo del email (con variables: {{name}}, {{poap_link}})

Al enviar:
1. Extraer event ID de la URL
2. Validar que podemos acceder al evento con la cookie actual
3. Verificar que el evento es propiedad de admin@poap.fr
4. Crear el drop en la BD

#### 4. Sistema de Gestión de Cookie
- Página admin: `/admin/luma-cookie`
- Mostrar estado actual de la cookie (válida/expirada)
- Recibir actualizaciones del servicio AWS
- Almacenar cookie en variable de entorno: `LUMA_SESSION_COOKIE`

#### 5. API Routes Necesarias
- `/api/luma/validate-event` - Validar acceso a evento
- `/api/luma/events/[eventId]/guests` - Obtener lista de invitados
- `/api/drops/luma/send-poaps` - Enviar POAPs por email
- `/api/admin/cookie-webhook` - Recibir actualizaciones de cookie desde AWS

### Parte 2: Servicio AWS (Proyecto Separado)

#### Estructura del Proyecto
```
luma-cookie-service/
├── src/
│   ├── index.js
│   ├── services/
│   │   ├── cookie-extractor.js    # Puppeteer login
│   │   ├── vercel-updater.js      # Actualizar Vercel
│   │   └── scheduler.js           # Cron cada 24h
│   └── config/
│       └── index.js
├── scripts/
│   ├── install-service.sh         # Instalar como servicio systemd
│   └── deploy.sh
├── package.json
└── ecosystem.config.js            # PM2 config
```

#### Requisitos del Servicio
1. Ejecutarse automáticamente al iniciar la máquina EC2
2. Reiniciarse si falla
3. Logs persistentes
4. Ejecutar cada 24 horas:
   - Login en Luma con Puppeteer
   - Extraer cookie `luma.auth-session-key`
   - Actualizar variable en Vercel via API
5. Notificar si hay errores

#### Script de Instalación como Servicio
```bash
#!/bin/bash
# install-service.sh

# Instalar dependencias
sudo apt-get update
sudo apt-get install -y chromium-browser nodejs npm

# Instalar PM2
sudo npm install -g pm2

# Configurar PM2 para iniciar al boot
pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 start ecosystem.config.js
pm2 save
```

## Credenciales Necesarias
- Luma: admin@poap.fr / !q*g%@TP7w^q
- Vercel API Token: [necesario para actualizar variables]
- ID del proyecto en Vercel: [necesario]

## Flujo de Trabajo Completo

1. **Usuario crea drop de Luma**:
   - Selecciona "Luma" en dropdown
   - Ingresa URL del evento
   - Sistema valida acceso con cookie actual
   - Se crea el drop

2. **Envío de POAPs**:
   - Manual: Admin hace click en "Send POAPs"
   - Sistema obtiene lista de guests con check-in
   - Envía emails con links de POAP usando configuración Gmail existente

3. **Actualización de Cookie (automático)**:
   - Servicio AWS ejecuta cada 24h
   - Extrae nueva cookie
   - Actualiza en Vercel
   - App usa nueva cookie automáticamente

## Archivos de Referencia para Implementación
- Lógica actual de drops: `/src/app/dashboard/page.tsx`
- Creación de drops: `/src/app/dashboard/drops/new/page.tsx`
- API de drops: `/src/app/api/drops/*`
- Configuración Gmail: Ya existe en el proyecto

## Resultado Esperado
1. Dashboard con selector de plataforma
2. Formulario específico para drops de Luma
3. Descarga de invitados con check-in en CSV
4. Envío de POAPs por email
5. Cookie actualizada automáticamente cada 24h desde AWS

---

**IMPORTANTE**: 
- El servicio AWS debe instalarse como servicio systemd para auto-inicio
- Usar PM2 para gestión del proceso y logs
- La cookie debe actualizarse sin intervención manual
- Mantener compatibilidad con drops de Farcaster existentes