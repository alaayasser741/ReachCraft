import { Router, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { getDatabase } from '../db/connection.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';
import { parsePdfBuffer } from '../services/parser/pdfParser.js';
import { parseCsvBuffer, parseXlsxBuffer } from '../services/parser/tabularParser.js';
import { ParseResult, ParsedCompany } from '../services/parser/types.js';
import { logActivity } from '../services/activityLogger.js';

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

    logActivity({
      category: 'file',
      action: 'upload',
      title: `رفع ملف وتحليله: "${originalName}"`,
      details: { fileId, fileSize, format: ext, totalCompanies: parseResult.totalCompanies },
    });

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

  const file = db.prepare('SELECT id, status, original_name FROM uploaded_files WHERE id = ?').get(fileId) as
    | { id: number; status: string; original_name: string }
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
    const findCompanyStmt = db.prepare(`
      SELECT id, name, website, description, address, has_direct_contact
      FROM companies
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))
      LIMIT 1
    `);

    const updateCompanyStmt = db.prepare(`
      UPDATE companies SET
        website = COALESCE(NULLIF(website, ''), ?),
        description = COALESCE(NULLIF(description, ''), ?),
        address = COALESCE(NULLIF(address, ''), ?),
        has_direct_contact = CASE WHEN ? = 1 THEN 1 ELSE has_direct_contact END,
        source_file_id = COALESCE(source_file_id, ?),
        updated_at = datetime('now')
      WHERE id = ?
    `);

    const insertCompanyStmt = db.prepare(`
      INSERT INTO companies (name, website, description, address, source_file_id, has_direct_contact)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const findContactStmt = db.prepare(`
      SELECT id, person_name, job_title, phone_mobile, phone_landline, whatsapp_number, address, notes
      FROM contacts 
      WHERE (email IS NOT NULL AND email != '' AND LOWER(TRIM(email)) = LOWER(TRIM(?)))
         OR (phone_mobile IS NOT NULL AND phone_mobile != '' AND phone_mobile = ?)
         OR (whatsapp_number IS NOT NULL AND whatsapp_number != '' AND whatsapp_number = ?)
         OR (company_id = ? AND person_name IS NOT NULL AND person_name != '' AND LOWER(TRIM(person_name)) = LOWER(TRIM(?)))
         OR (company_id = ? AND (email IS NULL OR email = '') AND (phone_mobile IS NULL OR phone_mobile = '') AND (whatsapp_number IS NULL OR whatsapp_number = ''))
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

    const findLinkStmt = db.prepare(`
      SELECT id FROM company_links WHERE company_id = ? AND url = ? LIMIT 1
    `);

    const insertLinkStmt = db.prepare(`
      INSERT INTO company_links (company_id, type, url)
      VALUES (?, ?, ?)
    `);

    for (const company of companies) {
      if (company.isExcluded) continue;
      const cleanCompName = company.name ? String(company.name).trim() : '';
      if (!cleanCompName) continue;

      const existingCompany = findCompanyStmt.get(cleanCompName) as { id: number } | undefined;
      let companyDbId: number;

      if (existingCompany) {
        companyDbId = existingCompany.id;
        updateCompanyStmt.run(
          company.website || null,
          company.description || null,
          company.address || null,
          company.hasDirectContact ? 1 : 0,
          fileId,
          companyDbId
        );
      } else {
        const compResult = insertCompanyStmt.run(
          cleanCompName,
          company.website || null,
          company.description || null,
          company.address || null,
          fileId,
          company.hasDirectContact ? 1 : 0
        );
        companyDbId = Number(compResult.lastInsertRowid);
      }
      savedCompaniesCount++;

      // Insert Links (Strict Deduplication)
      if (company.links && Array.isArray(company.links)) {
        for (const link of company.links) {
          if (link.url) {
            const cleanUrl = String(link.url).trim();
            const existingLink = findLinkStmt.get(companyDbId, cleanUrl);
            if (!existingLink) {
              insertLinkStmt.run(companyDbId, link.type, cleanUrl);
            }
          }
        }
      }

      // Insert or Merge Contacts (Strict Deduplication by Email / Phone / WhatsApp)
      if (company.contacts && Array.isArray(company.contacts)) {
        for (const contact of company.contacts) {
          const cleanEmail = contact.email ? String(contact.email).trim().toLowerCase() : null;
          const cleanPhone = contact.phoneMobile ? String(contact.phoneMobile).trim() : null;
          const cleanWa = contact.whatsappNumber ? String(contact.whatsappNumber).trim() : null;
          const cleanName = contact.personName ? String(contact.personName).trim() : null;

          const existing = findContactStmt.get(
            cleanEmail || '',
            cleanPhone || '',
            cleanWa || '',
            companyDbId,
            cleanName || '',
            companyDbId
          ) as any;

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

    logActivity({
      category: 'file',
      action: 'confirm',
      title: `تأكيد واستيراد ملف: "${file.original_name}"`,
      details: { fileId, savedCompaniesCount, savedContactsCount },
    });

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
