const express = require('express');
const { getDb } = require('../lib/db');

const router = express.Router();

router.get('/', (_req, res) => {
	const db = getDb();
	const rows = db.prepare('SELECT * FROM seats ORDER BY category, id').all();
	res.json(rows);
});

module.exports = router;

