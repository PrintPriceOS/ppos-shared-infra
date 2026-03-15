const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.CONTROL_PLANE_PORT || 8081;

const metricsRouter = require('./src/api/metrics');
const governanceRouter = require('./src/api/governance');
const efficiencyRouter = require('./src/api/efficiency');
const federationRouter = require('./src/api/federation');
const db = require('./src/services/db');

const cookieParser = require('cookie-parser');
const { requireAuth, JWT_SECRET } = require('./src/middleware/auth');
const jwt = require('jsonwebtoken');

app.use(helmet());
app.use(cors({
    origin: process.env.UI_URL || 'http://localhost:3001',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));

// --- Authentication Routes ---

// MOCK LOGIN (For Phase 19.A.2.1 Development)
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    // In a real scenario, this would check against a DB or another IdP
    if (username === 'admin' && password === 'ppos2026') {
        const payload = {
            sub: 'dev-admin-id',
            name: 'Development Admin',
            role: 'super-admin',
            aud: 'ppos:control',
            iss: 'ppos:auth'
        };
        
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
        
        res.cookie('ppos_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours
        });

        return res.json({ 
            success: true, 
            operator: { name: payload.name, role: payload.role },
            token // Also return token for non-cookie clients
        });
    }

    res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('ppos_token');
    res.json({ success: true });
});

// --- Routes ---

app.get('/health', async (req, res) => {
    let dbStatus = 'UNKNOWN';
    try {
        await db.query('SELECT 1');
        dbStatus = 'CONNECTED';
    } catch (err) {
        dbStatus = 'DISCONNECTED';
    }
    res.json({ 
        status: dbStatus === 'CONNECTED' ? 'UP' : 'DEGRADED', 
        service: 'ppos-control-plane', 
        database: dbStatus,
        timestamp: new Date().toISOString() 
    });
});

// Register API Routes
app.use('/api/metrics', requireAuth(), metricsRouter);
app.use('/api/governance', requireAuth(), governanceRouter);
app.use('/api/efficiency', requireAuth(), efficiencyRouter);
app.use('/api/federation', requireAuth(), federationRouter);

app.listen(port, () => {
    console.log(`[CONTROL-PLANE] Running on port ${port}`);
});
