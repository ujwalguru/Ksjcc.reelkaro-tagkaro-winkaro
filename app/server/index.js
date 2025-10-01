const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { getDb } = require('./lib/db');
const settingsRouter = require('./routes/settings');
const seatsRouter = require('./routes/seats');
const pricingRouter = require('./routes/pricing');
const sessionsRouter = require('./routes/sessions');
const reportsRouter = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Ensure DB is initialized
getDb();

app.use('/api/settings', settingsRouter);
app.use('/api/seats', seatsRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/reports', reportsRouter);

// Health
app.get('/api/health', (_req, res) => {
	res.json({ ok: true });
});

// Static client (will be populated after frontend build)
const clientDir = path.join(__dirname, '..', 'client', 'dist');
app.use('/admin', express.static(clientDir));
app.get('/admin/*', (_req, res) => {
	res.sendFile(path.join(clientDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
	console.log(`Server running at http://localhost:${PORT}`);
});

