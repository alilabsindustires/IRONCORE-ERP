import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json());

const angularApp = new AngularNodeAppEngine();

const flagsPath = path.join(process.cwd(), 'env-flags.json');
const dbConfigPath = path.join(process.cwd(), 'db-config.json');

// Ensure flags file exists
if (!fs.existsSync(flagsPath)) {
  fs.writeFileSync(flagsPath, JSON.stringify({ setupComplete: false }));
}

let pool: Pool | undefined;

const getPool = () => {
  if (pool) return pool;

  let connectionString = process.env['DATABASE_URL'];
  
  if (fs.existsSync(dbConfigPath)) {
    const config = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
    connectionString = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
  } else if (!connectionString) {
    // Default fallback - but setup route should handle this
    connectionString = 'postgresql://postgres:alikhaled010@localhost:5432/qubix_erp';
  }

  pool = new Pool({ connectionString });
  return pool;
};

// Setup Status
app.get('/api/setup/status', (req, res) => {
  const flags = JSON.parse(fs.readFileSync(flagsPath, 'utf8'));
  return res.json({ setupComplete: flags.setupComplete });
});

// Database Setup
app.post('/api/setup/db', async (req, res) => {
  const { host, user, password, database, port } = req.body;
  const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;
  
  const testPool = new Pool({ connectionString });
  try {
    await testPool.query('SELECT 1');
    // Save config
    fs.writeFileSync(dbConfigPath, JSON.stringify({ host, user, password, database, port }));
    pool = testPool; // Switch to this pool
    await initDb(); // Initialize tables
    return res.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('DB Setup failed:', error);
    return res.status(400).json({ error: 'Could not connect to database: ' + error.message });
  }
});

// Admin Setup
app.post('/api/setup/admin', async (req, res) => {
  const flags = JSON.parse(fs.readFileSync(flagsPath, 'utf8'));
  if (flags.setupComplete) {
    return res.status(403).json({ error: 'Setup already complete' });
  }

  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const p = getPool();
    await p.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
      [name, email, hashedPassword, 'super admin']
    );
    
    // Mark as complete
    flags.setupComplete = true;
    fs.writeFileSync(flagsPath, JSON.stringify(flags));
    
    return res.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Admin Setup failed:', error);
    return res.status(500).json({ error: 'Failed to create admin: ' + error.message });
  }
});

// Attendance Scan
app.post('/api/attendance/scan', async (req, res) => {
  const { code } = req.body;
  try {
    const p = getPool();
    // Check if it's a member
    const memberResult = await p.query('SELECT * FROM members WHERE qr_code_uid = $1', [code]);
    if (memberResult.rows.length > 0) {
      const member = memberResult.rows[0];
      // Record attendance
      await p.query('INSERT INTO attendance (member_id) VALUES ($1)', [member.id]);
      return res.json({ type: 'member', name: member.name, status: 'success' });
    }

    // Check if it's a staff (by email or ID match in QR)
    const staffResult = await p.query('SELECT * FROM users WHERE email = $1 OR id::text = $2', [code, code]);
    if (staffResult.rows.length > 0) {
      const staff = staffResult.rows[0];
      // We could have a separate table or reuse attendance with a staff flag/null member_id
      // For now let's just log it or add a custom entry
      await p.query('INSERT INTO attendance (staff_name) VALUES ($1)', [staff.name]); // Need to add staff_name to attendance table
      return res.json({ type: 'staff', name: staff.name, status: 'success' });
    }

    return res.status(404).json({ error: 'Code not recognized' });
  } catch (err: unknown) {
    console.error('Scan failed:', err);
    return res.status(500).json({ error: 'Processing failed' });
  }
});

// Storage Configuration
const homeDir = os.homedir();
const appDir = path.join(homeDir, 'QubixERP_Media');
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

// Simple Migration
const initDb = async () => {
  const p = getPool();
  try {
    await p.query(`
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
        freeze_days_allowed INTEGER DEFAULT 0,
        benefits TEXT
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
        staff_name TEXT,
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
    const userCheck = await p.query('SELECT * FROM users LIMIT 1');
    if (userCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('alikhaled010', 10);
      await p.query(
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

const flags = fs.existsSync(flagsPath) ? JSON.parse(fs.readFileSync(flagsPath, 'utf8')) : { setupComplete: false };
if (flags.setupComplete || process.env['DATABASE_URL']) {
  initDb();
}

const JWT_SECRET = process.env['JWT_SECRET'] || 'qubix-secret-key-123';

/**
 * API Routes
 */

// Membership Types
app.get('/api/membership-types', async (req, res) => {
  try {
    const p = getPool();
    const result = await p.query('SELECT * FROM membership_types ORDER BY price ASC');
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/membership-types', async (req, res) => {
  const { name, price, duration_days, freeze_days_allowed, benefits } = req.body;
  try {
    const p = getPool();
    const result = await p.query(
      'INSERT INTO membership_types (name, price, duration_days, freeze_days_allowed, benefits) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, price, duration_days, freeze_days_allowed, benefits]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/membership-types/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, duration_days, freeze_days_allowed, benefits } = req.body;
  try {
    const p = getPool();
    const result = await p.query(
      'UPDATE membership_types SET name = $1, price = $2, duration_days = $3, freeze_days_allowed = $4, benefits = $5 WHERE id = $6 RETURNING *',
      [name, price, duration_days, freeze_days_allowed, benefits, id]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/membership-types/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const p = getPool();
    await p.query('DELETE FROM membership_types WHERE id = $1', [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const p = getPool();
    const result = await p.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
      return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Users management (for admins)
app.get('/api/users', async (req, res) => {
  try {
    const p = getPool();
    const result = await p.query('SELECT id, name, email, role FROM users');
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const p = getPool();
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await p.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const p = getPool();
    const income = await p.query("SELECT SUM(amount) FROM transactions WHERE type = 'income'");
    const expenses = await p.query("SELECT SUM(amount) FROM transactions WHERE type = 'expense'");
    const shiftsCount = await p.query("SELECT COUNT(*) FROM shifts");
    const activeShifts = await p.query("SELECT COUNT(*) FROM shifts WHERE status = 'active'");
    
    const savings = (parseFloat(income.rows[0].sum || '0') - parseFloat(expenses.rows[0].sum || '0')).toFixed(2);

    return res.json({
      totalSavings: savings,
      totalShifts: shiftsCount.rows[0].count,
      currentShifts: activeShifts.rows[0].count
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Shifts
app.get('/api/shifts', async (req, res) => {
  try {
    const p = getPool();
    const result = await p.query('SELECT * FROM shifts ORDER BY start_time DESC LIMIT 10');
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/shifts', async (req, res) => {
  const { staffName } = req.body;
  try {
    const p = getPool();
    const result = await p.query(
      'INSERT INTO shifts (staff_name, status) VALUES ($1, $2) RETURNING *',
      [staffName, 'active']
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Members
app.get('/api/members', async (req, res) => {
  try {
    const p = getPool();
    const result = await p.query(`
      SELECT m.*, mt.name as membership_name 
      FROM members m 
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
    `);
    return res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/members', async (req, res) => {
  const { name, phone, email, membership_type_id, expiry_date, qr_code_uid } = req.body;
  try {
    const p = getPool();
    const result = await p.query(
      'INSERT INTO members (name, phone, email, membership_type_id, expiry_date, qr_code_uid) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, phone, email, membership_type_id, expiry_date, qr_code_uid]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
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
