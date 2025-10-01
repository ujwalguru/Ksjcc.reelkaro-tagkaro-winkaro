const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'pos.db');

let dbSingleton;

function ensureDirExists(filePath) {
	const dir = path.dirname(filePath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function initializeSchema(db) {
	db.exec(`
		PRAGMA journal_mode = WAL;
		CREATE TABLE IF NOT EXISTS settings (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			pc_count INTEGER NOT NULL DEFAULT 0,
			ps5_count INTEGER NOT NULL DEFAULT 0,
			car_count INTEGER NOT NULL DEFAULT 0,
			vr_count INTEGER NOT NULL DEFAULT 0
		);

		CREATE TABLE IF NOT EXISTS seats (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			category TEXT NOT NULL CHECK (category IN ('PC','PS5','CAR','VR')),
			visible INTEGER NOT NULL DEFAULT 1
		);

		CREATE TABLE IF NOT EXISTS pricing (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			category TEXT NOT NULL CHECK (category IN ('PC','PS5','CAR','VR')),
			duration_minutes INTEGER NOT NULL,
			price INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			seat_id INTEGER NOT NULL,
			customer_name TEXT,
			start_time INTEGER NOT NULL,
			end_time INTEGER NOT NULL,
			status TEXT NOT NULL CHECK (status IN ('UPCOMING','RUNNING','EXPIRED','ENDED')),
			price_paid INTEGER NOT NULL DEFAULT 0,
			is_walk_in INTEGER NOT NULL DEFAULT 1,
			FOREIGN KEY (seat_id) REFERENCES seats(id)
		);
	`);

	// Seed single settings row
	const row = db.prepare('SELECT id FROM settings WHERE id=1').get();
	if (!row) {
		db.prepare('INSERT INTO settings (id, pc_count, ps5_count, car_count, vr_count) VALUES (1,0,0,0,0)').run();
	}
}

function getDb() {
	if (!dbSingleton) {
		ensureDirExists(DB_PATH);
		dbSingleton = new Database(DB_PATH);
		initializeSchema(dbSingleton);
	}
	return dbSingleton;
}

module.exports = { getDb };

