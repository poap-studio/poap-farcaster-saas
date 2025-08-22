const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3001;
const WEBHOOK_LOGS_DIR = path.join(__dirname, 'webhook-logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(WEBHOOK_LOGS_DIR)) {
    fs.mkdirSync(WEBHOOK_LOGS_DIR, { recursive: true });
}

// Middleware to log all requests
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(50)}`);
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    if (Object.keys(req.query).length > 0) {
        console.log('Query:', JSON.stringify(req.query, null, 2));
    }
    console.log('='.repeat(50));
    next();
});

// Luma webhook endpoint
app.all('/webhook/luma/*', (req, res) => {
    console.log('\n🎯 LUMA WEBHOOK RECEIVED!');
    
    const webhookData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
    };
    
    // Log event type if present in headers
    const eventType = req.headers['x-luma-event'] || 
                     req.headers['x-webhook-event'] || 
                     req.headers['x-event-type'] ||
                     'unknown';
    
    console.log(`Event Type: ${eventType}`);
    
    // Save to file
    const filename = `luma-webhook-${Date.now()}-${eventType}.json`;
    const filepath = path.join(WEBHOOK_LOGS_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(webhookData, null, 2));
    console.log(`✅ Saved to: ${filename}`);
    
    // Check for signature validation
    const signature = req.headers['x-luma-signature'] || 
                     req.headers['x-webhook-signature'] ||
                     req.headers['x-signature'];
    
    if (signature) {
        console.log(`📝 Signature present: ${signature.substring(0, 20)}...`);
    }
    
    // Respond with success
    res.status(200).json({ 
        status: 'received',
        timestamp: webhookData.timestamp,
        eventType: eventType
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        webhooks_received: fs.readdirSync(WEBHOOK_LOGS_DIR).length
    });
});

// List received webhooks
app.get('/webhooks', (req, res) => {
    const files = fs.readdirSync(WEBHOOK_LOGS_DIR)
        .map(file => {
            const content = JSON.parse(fs.readFileSync(path.join(WEBHOOK_LOGS_DIR, file), 'utf8'));
            return {
                file,
                timestamp: content.timestamp,
                eventType: content.headers['x-luma-event'] || 'unknown',
                method: content.method,
                path: content.path
            };
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({ webhooks: files });
});

// View specific webhook
app.get('/webhook/:filename', (req, res) => {
    const filepath = path.join(WEBHOOK_LOGS_DIR, req.params.filename);
    if (fs.existsSync(filepath)) {
        const content = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        res.json(content);
    } else {
        res.status(404).json({ error: 'Webhook not found' });
    }
});

// Catch all for any other webhook paths
app.all('/webhook/*', (req, res) => {
    console.log('📨 Generic webhook received at:', req.path);
    res.status(200).json({ status: 'received', path: req.path });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Luma Webhook Test Server`);
    console.log(`📍 Running on: http://localhost:${PORT}`);
    console.log(`\n📌 Endpoints:`);
    console.log(`   - Webhook receiver: http://localhost:${PORT}/webhook/luma`);
    console.log(`   - Health check: http://localhost:${PORT}/health`);
    console.log(`   - List webhooks: http://localhost:${PORT}/webhooks`);
    console.log(`   - View webhook: http://localhost:${PORT}/webhook/{filename}`);
    console.log(`\n💡 To expose to internet, run:`);
    console.log(`   ngrok http ${PORT}`);
    console.log(`\n📁 Logs saved to: ${WEBHOOK_LOGS_DIR}`);
    console.log('\n' + '='.repeat(50));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down webhook server...');
    process.exit(0);
});