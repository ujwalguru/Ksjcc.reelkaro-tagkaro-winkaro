const express = require('express');
const { getDb } = require('../lib/db');

const router = express.Router();

function rangeFor(period) {
	const now = new Date();
	const end = now.setHours(23,59,59,999);
	const startDate = new Date();
	if (period === 'daily') {
		startDate.setHours(0,0,0,0);
	} else if (period === 'weekly') {
		const day = startDate.getDay(); // 0 Sun
		const diff = (day + 6) % 7; // make Monday start
		startDate.setDate(startDate.getDate() - diff);
		startDate.setHours(0,0,0,0);
	} else if (period === 'monthly') {
		startDate.setDate(1);
		startDate.setHours(0,0,0,0);
	} else {
		startDate.setHours(0,0,0,0);
	}
	return { startMs: startDate.getTime(), endMs: end };
}

router.get('/', (req, res) => {
	const { period = 'daily' } = req.query;
	const { startMs, endMs } = rangeFor(period);
	const db = getDb();
	const rows = db.prepare(`
		SELECT date(start_time/1000, 'unixepoch', 'localtime') AS day,
			SUM(price_paid) AS revenue,
			COUNT(*) AS sessions
		FROM sessions
		WHERE status IN ('ENDED','EXPIRED') AND start_time BETWEEN ? AND ?
		GROUP BY day
		ORDER BY day ASC
	`).all(startMs, endMs);
	res.json({ period, startMs, endMs, rows });
});

module.exports = router;

