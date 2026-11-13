import { Router, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { parsePdfBuffer } from '../services/parser/pdfParser.js';
import { parseCsvBuffer, parseXlsxBuffer } from '../services/parser/tabularParser.js';
import { ParseResult, ParsedCompany } from '../services/parser/types.js';

const router = Router();

// Multer storage configuration
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.csv', '.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Allowed formats: PDF, CSV, XLSX.'));
    }
  },
});

// POST /api/files/upload
router.post('/upload', requireAuth, upload.single('file'), async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, error: 'No file uploaded' });
    return;
  }

  const db = getDatabase();
  const filePath = req.file.path;
  const originalName = req.file.originalname;
  const ext = path.extname(originalName).toLowerCase().replace('.', '');
  const fileSize = req.file.size;

  try {
    let parseResult: ParseResult;

    if (ext === 'pdf') {
      const buffer = fs.readFileSync(filePath);
      parseResult = await parsePdfBuffer(buffer, originalName);
    } else if (ext === 'csv') {
      const buffer = fs.readFileSync(filePath);
      parseResult = parseCsvBuffer(buffer, originalName);
    } else if (['xlsx', 'xls'].includes(ext)) {
      const buffer = fs.readFileSync(filePath);
      parseResult = parseXlsxBuffer(buffer, originalName);
    } else {
      res.status(400).json({ success: false, error: 'Unsupported file format. Please upload PDF, CSV, or XLSX.' });
      return;
    }

    // Insert into uploaded_files table
    const insertStmt = db.prepare(`
      INSERT INTO uploaded_files (filename, original_name, file_type, file_size, status, parsed_count, raw_data_json)
      VALUES (?, ?, ?, ?, 'parsed', ?, ?)
    `);

    const result = insertStmt.run(
      req.file.filename,
      originalName,
      ext,
      fileSize,
      parseResult.totalCompanies,
      JSON.stringify(parseResult)
    );

    const fileId = Number(result.lastInsertRowid);

    res.json({
      success: true,
      fileId,
      originalName,
      parseResult,
    });
  } catch (err: any) {
    console.error('File parsing failed:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to parse file: ' + (err.message || 'Unknown error'),
    });
  }
});

// GET /api/files
router.get('/', requireAuth, (_req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const files = db.prepare(`
    SELECT id, filename, original_name, file_type, file_size, uploaded_at, status, parsed_count
    FROM uploaded_files
    ORDER BY uploaded_at DESC
  `).all();

  res.json({ success: true, files });
});

// GET /api/files/:id
router.get('/:id', requireAuth, (req: AuthRequest, res: Response): void => {
  const db = getDatabase();
  const file = db.prepare(`
    SELECT id, filename, original_name, file_type, file_size, uploaded_at, status, parsed_count, raw_data_json, error_message
    FROM uploaded_files
    WHERE id = ?
  `).get(req.params.id) as any;

  if (!file) {
    res.status(404).json({ success: false, error: 'File not found' });
    return;
  }

  let parseResult = null;
  if (file.raw_data_json) {
    try {
      parseResult = JSON.parse(file.raw_data_json);
    } catch {
      parseResult = null;
    }
  }

  res.json({
    success: true,
    file: {
      ...file,
      raw_data_json: undefined,
      parseResult,
    },
  });
});

// POST /api/files/:id/confirm - Milestone 4: Saves reviewed and edited data into DB
router.post('/:id/confirm', requireAuth, (req: AuthRequest, res: Response): void => {
  const fileId = parseInt(req.params.id, 10);
  const { companies }: { companies: ParsedCompany[] } = req.body;

  if (!companies || !Array.isArray(companies)) {
    res.status(400).json({ success: false, error: 'Invalid payload: companies array is required' });
    return;
  }

  const db = getDatabase();

  const file = db.prepare('SELECT id, status FROM uploaded_files WHERE id = ?').get(fileId) as
    | { id: number; status: string }
    | undefined;

  if (!file) {
    res.status(404).json({ success: false, error: 'File not found' });
    return;
  }

  let savedCompaniesCount = 0;
  let savedContactsCount = 0;

  // Use a transaction
  db.exec('BEGIN TRANSACTION;');

  try {
    const insertCompanyStmt = db.prepare(`
      INSERT INTO companies (name, website, description, address, source_file_id, has_direct_contact)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const findContactStmt = db.prepare(`
      SELECT id, person_name, job_title, phone_mobile, phone_landline, whatsapp_number, address, notes
      FROM contacts 
      WHERE (email IS NOT NULL AND email != '' AND LOWER(email) = LOWER(?))
         OR (phone_mobile IS NOT NULL AND phone_mobile != '' AND phone_mobile = ?)
         OR (whatsapp_number IS NOT NULL AND whatsapp_number != '' AND whatsapp_number = ?)
      LIMIT 1
    `);

    const updateContactStmt = db.prepare(`
      UPDATE contacts SET
        person_name = COALESCE(NULLIF(person_name, ''), ?),
        job_title = COALESCE(NULLIF(job_title, ''), ?),
        phone_mobile = COALESCE(NULLIF(phone_mobile, ''), ?),
        phone_landline = COALESCE(NULLIF(phone_landline, ''), ?),
        whatsapp_number = COALESCE(NULLIF(whatsapp_number, ''), ?),
        address = COALESCE(NULLIF(address, ''), ?),
        notes = COALESCE(NULLIF(notes, ''), ?),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    const insertContactStmt = db.prepare(`
      INSERT INTO contacts (
        company_id, person_name, job_title, email, phone_mobile, phone_landline,
        whatsapp_number, address, is_valid_email, is_valid_whatsapp, opted_out, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    const insertLinkStmt = db.prepare(`
      INSERT INTO company_links (company_id, type, url)
      VALUES (?, ?, ?)
    `);

    for (const company of companies) {
      if (company.isExcluded) continue;

      const compResult = insertCompanyStmt.run(
        company.name,
        company.website || null,
        company.description || null,
        company.address || null,
        fileId,
        company.hasDirectContact ? 1 : 0
      );

      const companyDbId = Number(compResult.lastInsertRowid);
      savedCompaniesCount++;

      // Insert Links
      if (company.links && Array.isArray(company.links)) {
        for (const link of company.links) {
          if (link.url) {
            insertLinkStmt.run(companyDbId, link.type, link.url);
          }
        }
      }

      // Insert or Merge Contacts (Strict Deduplication by Email / Phone / WhatsApp)
      if (company.contacts && Array.isArray(company.contacts)) {
        for (const contact of company.contacts) {
          const cleanEmail = contact.email ? String(contact.email).trim().toLowerCase() : null;
          const cleanPhone = contact.phoneMobile ? String(contact.phoneMobile).trim() : null;
          const cleanWa = contact.whatsappNumber ? String(contact.whatsappNumber).trim() : null;

          const existing = (cleanEmail || cleanPhone || cleanWa)
            ? (findContactStmt.get(cleanEmail || '', cleanPhone || '', cleanWa || '') as any)
            : null;

          if (existing) {
            // Merge & enrich existing contact with any non-empty fields
            updateContactStmt.run(
              contact.personName || null,
              contact.jobTitle || null,
              cleanPhone || null,
              contact.phoneLandline || null,
              cleanWa || null,
              contact.address || company.address || null,
              contact.notes || null,
              existing.id
            );
          } else {
            insertContactStmt.run(
              companyDbId,
              contact.personName || null,
              contact.jobTitle || null,
              cleanEmail,
              cleanPhone,
              contact.phoneLandline || null,
              cleanWa,
              contact.address || company.address || null,
              contact.isValidEmail ? 1 : 0,
              contact.isValidWhatsApp ? 1 : 0,
              contact.notes || null
            );
          }
          savedContactsCount++;
        }
      }
    }

    // Update file status
    db.prepare(`
      UPDATE uploaded_files
      SET status = 'confirmed', parsed_count = ?
      WHERE id = ?
    `).run(savedCompaniesCount, fileId);

    db.exec('COMMIT;');

    res.json({
      success: true,
      message: `Successfully saved ${savedCompaniesCount} companies and ${savedContactsCount} contacts into database.`,
      savedCompaniesCount,
      savedContactsCount,
    });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    console.error('Error confirming data:', err);
    res.status(500).json({ success: false, error: 'Database transaction failed: ' + err.message });
  }
});

export default router;
