import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const { Pool } = pg;

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());

const angularApp = new AngularNodeAppEngine();

// Database Configuration
const pool = new Pool({
  connectionString: process.env['DATABASE_URL'] || 'postgresql://postgres:alikhaled010@localhost:5432/qubix_erp'
});

// Storage Configuration
const homeDir = os.homedir();
const appDir = path.join(homeDir, 'QubixERP_Media');
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

// Simple Migration
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS membership_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration_days INTEGER NOT NULL,
        freeze_days_allowed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        status TEXT DEFAULT 'active',
        membership_type_id INTEGER REFERENCES membership_types(id),
        expiry_date DATE,
        freeze_time_remaining INTEGER DEFAULT 0,
        qr_code_uid TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shifts (
        id SERIAL PRIMARY KEY,
        staff_name TEXT NOT NULL,
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP,
        total_income DECIMAL(10,2) DEFAULT 0,
        total_expenses DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL, -- 'income', 'expense'
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        category TEXT,
        shift_id INTEGER REFERENCES shifts(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        member_id INTEGER REFERENCES members(id),
        check_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        check_out TIMESTAMP,
        shift_id INTEGER REFERENCES shifts(id)
      );

      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        staff_name TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_date DATE DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'paid'
      );
    `);
    const userCheck = await pool.query('SELECT * FROM users LIMIT 1');
    if (userCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('alikhaled010', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Ali Ahmed', 'admin@company.com', hashedPassword, 'super admin']
      );
      console.log('Seed user created');
    }
    console.log('Database initialized');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
};

initDb();

const JWT_SECRET = process.env['JWT_SECRET'] || 'qubix-secret-key-123';

/**
 * API Routes
 */

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
      return;
    }
    res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Users management (for admins)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const income = await pool.query("SELECT SUM(amount) FROM transactions WHERE type = 'income'");
    const expenses = await pool.query("SELECT SUM(amount) FROM transactions WHERE type = 'expense'");
    const shiftsCount = await pool.query("SELECT COUNT(*) FROM shifts");
    const activeShifts = await pool.query("SELECT COUNT(*) FROM shifts WHERE status = 'active'");
    
    const savings = (parseFloat(income.rows[0].sum || '0') - parseFloat(expenses.rows[0].sum || '0')).toFixed(2);

    res.json({
      totalSavings: savings,
      totalShifts: shiftsCount.rows[0].count,
      currentShifts: activeShifts.rows[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Shifts
app.get('/api/shifts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shifts ORDER BY start_time DESC LIMIT 10');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/shifts', async (req, res) => {
  const { staffName } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO shifts (staff_name, status) VALUES ($1, $2) RETURNING *',
      [staffName, 'active']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Members
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, mt.name as membership_name 
      FROM members m 
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/members', async (req, res) => {
  const { name, phone, email, membership_type_id, expiry_date, qr_code_uid } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO members (name, phone, email, membership_type_id, expiry_date, qr_code_uid) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, phone, email, membership_type_id, expiry_date, qr_code_uid]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
