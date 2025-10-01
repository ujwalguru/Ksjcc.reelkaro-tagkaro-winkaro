const express = require('express');
const { getDb } = require('../lib/db');

const router = express.Router();

router.get('/', (_req, res) => {
	const db = getDb();
	const rows = db.prepare('SELECT * FROM pricing ORDER BY category, duration_minutes').all();
	res.json(rows);
});

router.post('/', (req, res) => {
	const { category, duration_minutes, price } = req.body || {};
	if (!category || !duration_minutes || !price) return res.status(400).json({ error: 'category, duration_minutes, price required' });
	const db = getDb();
	const info = db.prepare('INSERT INTO pricing (category, duration_minutes, price) VALUES (?,?,?)')
		.run(category, duration_minutes, price);
	res.json({ id: info.lastInsertRowid });
});

router.put('/:id', (req, res) => {
	const { id } = req.params;
	const { category, duration_minutes, price } = req.body || {};
	const db = getDb();
	const info = db.prepare('UPDATE pricing SET category=?, duration_minutes=?, price=? WHERE id=?')
		.run(category, duration_minutes, price, id);
	res.json({ updated: info.changes });
});

router.delete('/:id', (req, res) => {
	const { id } = req.params;
	const db = getDb();
	const info = db.prepare('DELETE FROM pricing WHERE id=?').run(id);
	res.json({ deleted: info.changes });
});

module.exports = router;

