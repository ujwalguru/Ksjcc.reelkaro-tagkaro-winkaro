const express = require('express');
const { getDb } = require('../lib/db');

const router = express.Router();

router.get('/', (_req, res) => {
	const db = getDb();
	const settings = db.prepare('SELECT * FROM settings WHERE id=1').get();
	res.json(settings);
});

router.post('/', (req, res) => {
	const { pc_count = 0, ps5_count = 0, car_count = 0, vr_count = 0 } = req.body || {};
	const db = getDb();
	const info = db.prepare(
		`UPDATE settings SET pc_count=?, ps5_count=?, car_count=?, vr_count=? WHERE id=1`
	).run(pc_count, ps5_count, car_count, vr_count);

	// Regenerate seats per counts
	const tx = db.transaction(() => {
		// Build desired seat list
		const desired = [];
		for (let i = 1; i <= pc_count; i++) desired.push({ name: `PC-${i}`, category: 'PC' });
		for (let i = 1; i <= ps5_count; i++) desired.push({ name: `PS5-${i}`, category: 'PS5' });
		for (let i = 1; i <= car_count; i++) desired.push({ name: `CAR-${i}`, category: 'CAR' });
		for (let i = 1; i <= vr_count; i++) desired.push({ name: `VR-${i}`, category: 'VR' });

		const existing = db.prepare('SELECT id, name FROM seats').all();
		const existingNames = new Set(existing.map(s => s.name));
		const desiredNames = new Set(desired.map(s => s.name));

		// Delete seats not desired
		const del = db.prepare('DELETE FROM seats WHERE name=?');
		existing.forEach(s => { if (!desiredNames.has(s.name)) del.run(s.name); });

		// Insert missing seats
		const ins = db.prepare('INSERT OR IGNORE INTO seats (name, category, visible) VALUES (?,?,1)');
		desired.forEach(s => ins.run(s.name, s.category));
	});

	tx();
	res.json({ updated: info.changes });
});

router.get('/seats', (_req, res) => {
	const db = getDb();
	const rows = db.prepare('SELECT * FROM seats ORDER BY category, id').all();
	res.json(rows);
});

router.post('/seats/visibility', (req, res) => {
	const { name, visible } = req.body || {};
	if (!name || typeof visible !== 'boolean') return res.status(400).json({ error: 'name and visible required' });
	const db = getDb();
	const info = db.prepare('UPDATE seats SET visible=? WHERE name=?').run(visible ? 1 : 0, name);
	res.json({ updated: info.changes });
});

module.exports = router;

