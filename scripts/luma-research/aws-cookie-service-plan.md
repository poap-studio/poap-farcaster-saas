# Plan: Servicio AWS para Actualización Automática de Cookie Luma

## Arquitectura General

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   AWS EC2/Lambda    │────▶│    Vercel App    │────▶│    Luma API     │
│  Cookie Service     │     │   POAP Platform  │     │   Admin Panel   │
│   (Puppeteer)       │     │                  │     │                 │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
        │                           ▲
        │      Actualiza cookie     │
        └───────────cada 24h────────┘
```

## Proyecto 1: Servicio AWS (luma-cookie-service)

### Estructura del Proyecto
```
luma-cookie-service/
├── src/
│   ├── index.js              # Punto de entrada
│   ├── cookie-extractor.js   # Lógica de Puppeteer
│   ├── vercel-updater.js     # Actualiza cookie en Vercel
│   └── scheduler.js          # Cron job
├── config/
│   ├── default.json          # Configuración base
│   └── production.json       # Config producción
├── scripts/
│   ├── install.sh            # Instalación como servicio
│   └── deploy.sh             # Deploy a EC2
├── Dockerfile                # Para containerización
├── docker-compose.yml        
├── package.json
└── ecosystem.config.js       # PM2 config
```

### Componentes Principales

#### 1. Cookie Extractor (cookie-extractor.js)
```javascript
const puppeteer = require('puppeteer');

class LumaCookieExtractor {
  constructor(config) {
    this.email = config.LUMA_EMAIL;
    this.password = config.LUMA_PASSWORD;
    this.maxRetries = 3;
  }

  async extractCookie() {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Login flow
        await page.goto('https://lu.ma/signin');
        await page.type('input[type="email"]', this.email);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Password
        await page.type('input[type="password"]', this.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
        
        // Get cookies
        const cookies = await page.cookies();
        const sessionCookie = cookies.find(c => 
          c.name === 'luma.auth-session-key'
        );
        
        await browser.close();
        
        if (sessionCookie) {
          return `${sessionCookie.name}=${sessionCookie.value}`;
        }
        
      } catch (error) {
        retries++;
        console.error(`Attempt ${retries} failed:`, error);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    
    throw new Error('Failed to extract cookie after max retries');
  }
}
```

#### 2. Vercel Updater (vercel-updater.js)
```javascript
const axios = require('axios');

class VercelUpdater {
  constructor(config) {
    this.vercelToken = config.VERCEL_TOKEN;
    this.projectId = config.VERCEL_PROJECT_ID;
    this.apiUrl = config.VERCEL_API_URL;
  }

  async updateCookie(cookieValue) {
    try {
      // Actualizar variable de entorno en Vercel
      const response = await axios.patch(
        `https://api.vercel.com/v9/projects/${this.projectId}/env/LUMA_SESSION_COOKIE`,
        {
          value: cookieValue,
          target: ['production', 'preview', 'development']
        },
        {
          headers: {
            'Authorization': `Bearer ${this.vercelToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Trigger redeploy para aplicar cambios
      await this.triggerRedeploy();
      
      return response.data;
      
    } catch (error) {
      // Si la variable no existe, crearla
      if (error.response?.status === 404) {
        return await this.createEnvVariable(cookieValue);
      }
      throw error;
    }
  }

  async createEnvVariable(cookieValue) {
    return await axios.post(
      `https://api.vercel.com/v9/projects/${this.projectId}/env`,
      {
        key: 'LUMA_SESSION_COOKIE',
        value: cookieValue,
        type: 'encrypted',
        target: ['production', 'preview', 'development']
      },
      {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`
        }
      }
    );
  }

  async triggerRedeploy() {
    // Opcional: trigger redeploy
    // O usar webhook para notificar a la app
  }
}
```

#### 3. Scheduler (scheduler.js)
```javascript
const cron = require('node-cron');
const { LumaCookieExtractor } = require('./cookie-extractor');
const { VercelUpdater } = require('./vercel-updater');

class CookieScheduler {
  constructor(config) {
    this.extractor = new LumaCookieExtractor(config);
    this.updater = new VercelUpdater(config);
    this.webhookUrl = config.WEBHOOK_URL;
  }

  async updateCookie() {
    console.log(`[${new Date().toISOString()}] Starting cookie update...`);
    
    try {
      // 1. Extraer nueva cookie
      const cookie = await this.extractor.extractCookie();
      console.log('Cookie extracted successfully');
      
      // 2. Actualizar en Vercel
      await this.updater.updateCookie(cookie);
      console.log('Vercel updated successfully');
      
      // 3. Notificar a la app via webhook (opcional)
      if (this.webhookUrl) {
        await axios.post(this.webhookUrl, {
          status: 'success',
          timestamp: new Date().toISOString(),
          message: 'Cookie updated successfully'
        });
      }
      
      // 4. Log success
      await this.logUpdate('success', cookie);
      
    } catch (error) {
      console.error('Cookie update failed:', error);
      await this.logUpdate('error', null, error.message);
      
      // Notificar error
      await this.notifyError(error);
    }
  }

  start() {
    // Ejecutar inmediatamente al iniciar
    this.updateCookie();
    
    // Programar cada 24 horas
    cron.schedule('0 0 * * *', () => {
      this.updateCookie();
    });
    
    console.log('Cookie scheduler started - will run daily at midnight');
  }
}
```

### Configuración (config/production.json)
```json
{
  "luma": {
    "email": "admin@poap.fr",
    "password": "!q*g%@TP7w^q"
  },
  "vercel": {
    "token": "VERCEL_API_TOKEN",
    "projectId": "prj_xxxxx",
    "apiUrl": "https://poap-platform.vercel.app/api/cookie-webhook"
  },
  "aws": {
    "region": "us-east-1"
  },
  "monitoring": {
    "slackWebhook": "https://hooks.slack.com/...",
    "email": "alerts@poap.fr"
  }
}
```

### PM2 Ecosystem (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'luma-cookie-service',
    script: './src/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Script de Instalación (scripts/install.sh)
```bash
#!/bin/bash

# Instalar dependencias del sistema
sudo apt-get update
sudo apt-get install -y \
  chromium-browser \
  xvfb \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxss1 \
  libxtst6

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar dependencias del proyecto
npm install

# Configurar PM2 para iniciar al boot
pm2 startup systemd
pm2 start ecosystem.config.js
pm2 save

echo "✅ Servicio instalado correctamente"
```

## Proyecto 2: Cambios en Vercel App

### 1. Variable de Entorno
```env
LUMA_SESSION_COOKIE=luma.auth-session-key=usr-xxx.yyy
```

### 2. Cookie Manager (lib/luma-cookie-manager.ts)
```typescript
export class LumaCookieManager {
  private static instance: LumaCookieManager;
  private cookie: string | null = null;
  private lastUpdate: Date | null = null;

  static getInstance() {
    if (!this.instance) {
      this.instance = new LumaCookieManager();
    }
    return this.instance;
  }

  getCookie(): string {
    // Primero intentar desde variable de entorno
    const envCookie = process.env.LUMA_SESSION_COOKIE;
    if (envCookie) {
      return envCookie;
    }

    // Fallback a base de datos
    return this.cookie || '';
  }

  async validateCookie(): Promise<boolean> {
    try {
      const response = await fetch(
        'https://api.lu.ma/user/get-self',
        {
          headers: {
            'Cookie': this.getCookie()
          }
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### 3. Webhook para Actualizaciones (app/api/cookie-webhook/route.ts)
```typescript
export async function POST(request: Request) {
  try {
    const { secret, cookie } = await request.json();
    
    // Validar secret
    if (secret !== process.env.WEBHOOK_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Actualizar cookie en memoria/cache
    const manager = LumaCookieManager.getInstance();
    await manager.updateCookie(cookie);
    
    return Response.json({ success: true });
    
  } catch (error) {
    return Response.json({ error: 'Failed to update cookie' }, { status: 500 });
  }
}
```

## Flujo de Implementación

### 1. Configuración AWS EC2
```bash
# Lanzar instancia t2.micro Ubuntu
# Configurar security group (solo SSH)
# Conectar y ejecutar:

git clone https://github.com/your-org/luma-cookie-service
cd luma-cookie-service
chmod +x scripts/install.sh
./scripts/install.sh
```

### 2. Configuración Vercel
```bash
# Agregar variables de entorno
vercel env add LUMA_SESSION_COOKIE
vercel env add WEBHOOK_SECRET
```

### 3. Monitoreo
- CloudWatch logs para el servicio AWS
- Alertas en Slack/Email si falla la actualización
- Dashboard para ver estado de la cookie

## Costos Estimados

### AWS
- EC2 t2.micro: ~$8-10/mes
- O Lambda: ~$0.20/mes (mucho más barato)

### Alternativa con Lambda
```javascript
// handler.js para AWS Lambda
exports.updateCookie = async (event) => {
  const extractor = new LumaCookieExtractor();
  const cookie = await extractor.extractCookie();
  
  // Actualizar en Vercel
  await updateVercelEnv(cookie);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
```

## Seguridad

1. **Credenciales**:
   - Usar AWS Secrets Manager
   - Rotar tokens de Vercel regularmente
   - Encriptar comunicación

2. **Acceso**:
   - IP whitelist para EC2
   - IAM roles restrictivos
   - Webhook con secret validation

3. **Logs**:
   - No loggear cookies completas
   - Rotar logs regularmente
   - Monitorear accesos sospechosos

## Timeline de Implementación

1. **Día 1**: Setup proyecto AWS y pruebas locales
2. **Día 2**: Deploy a AWS y configuración
3. **Día 3**: Integración con Vercel
4. **Día 4**: Testing end-to-end
5. **Día 5**: Monitoreo y documentación

¿Quieres que proceda con la implementación de alguna parte específica?