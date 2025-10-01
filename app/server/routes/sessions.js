const express = require('express');
const { getDb } = require('../lib/db');

const router = express.Router();

function getNowEpochMs() {
	return Date.now();
}

router.get('/', (_req, res) => {
	const db = getDb();
	const rows = db.prepare(`
		SELECT s.*, seats.name AS seat_name, seats.category
		FROM sessions s
		JOIN seats ON seats.id = s.seat_id
		ORDER BY s.start_time DESC
	`).all();
	res.json(rows);
});

router.get('/active', (_req, res) => {
	const db = getDb();
	const now = getNowEpochMs();
	const rows = db.prepare(`
		SELECT s.*, seats.name AS seat_name, seats.category
		FROM sessions s
		JOIN seats ON seats.id = s.seat_id
		WHERE s.status IN ('UPCOMING','RUNNING') AND s.end_time >= ?
		ORDER BY s.start_time ASC
	`).all(now);
	res.json(rows);
});

router.post('/start', (req, res) => {
	const { seat_name, customer_name = '', duration_minutes, price, is_walk_in = true, start_time_ms } = req.body || {};
	if (!seat_name || !duration_minutes || !price) return res.status(400).json({ error: 'seat_name, duration_minutes, price required' });
	const db = getDb();
	const seat = db.prepare('SELECT * FROM seats WHERE name=?').get(seat_name);
	if (!seat) return res.status(404).json({ error: 'Seat not found' });
	const start = start_time_ms || getNowEpochMs();
	const end = start + duration_minutes * 60 * 1000;
	const status = start <= getNowEpochMs() ? 'RUNNING' : 'UPCOMING';
	const info = db.prepare(`
		INSERT INTO sessions (seat_id, customer_name, start_time, end_time, status, price_paid, is_walk_in)
		VALUES (?,?,?,?,?,?,?)
	`).run(seat.id, customer_name, start, end, status, price, is_walk_in ? 1 : 0);
	res.json({ id: info.lastInsertRowid });
});

router.post('/extend', (req, res) => {
	const { session_id, add_minutes, add_price } = req.body || {};
	if (!session_id || !add_minutes) return res.status(400).json({ error: 'session_id, add_minutes required' });
	const db = getDb();
	const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(session_id);
	if (!session) return res.status(404).json({ error: 'Session not found' });
	const newEnd = session.end_time + add_minutes * 60 * 1000;
	const newPrice = session.price_paid + (add_price || 0);
	const info = db.prepare('UPDATE sessions SET end_time=?, price_paid=? WHERE id=?').run(newEnd, newPrice, session_id);
	res.json({ updated: info.changes, end_time: newEnd, price_paid: newPrice });
});

router.post('/end', (req, res) => {
	const { session_id } = req.body || {};
	if (!session_id) return res.status(400).json({ error: 'session_id required' });
	const db = getDb();
	const info = db.prepare('UPDATE sessions SET status="ENDED" WHERE id=?').run(session_id);
	res.json({ updated: info.changes });
});

router.post('/expire', (req, res) => {
	const { session_id } = req.body || {};
	if (!session_id) return res.status(400).json({ error: 'session_id required' });
	const db = getDb();
	const info = db.prepare('UPDATE sessions SET status="EXPIRED" WHERE id=?').run(session_id);
	res.json({ updated: info.changes });
});

module.exports = router;

