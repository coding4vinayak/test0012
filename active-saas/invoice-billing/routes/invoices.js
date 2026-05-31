const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../db/database');

const router = express.Router();

// List invoices
router.get('/', (req, res) => {
  const invoices = db.prepare(
    `SELECT invoices.*, clients.name as client_name
     FROM invoices
     JOIN clients ON invoices.client_id = clients.id
     WHERE invoices.user_id = ?
     ORDER BY invoices.created_at DESC`
  ).all(req.session.user.id);
  res.render('invoices/index', { invoices });
});

// New invoice form
router.get('/new', (req, res) => {
  const clients = db.prepare(
    'SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC'
  ).all(req.session.user.id);
  res.render('invoices/create', { clients, error: null });
});

// Create invoice
router.post('/', (req, res) => {
  const { client_id, due_date, notes, items } = req.body;
  const userId = req.session.user.id;

  if (!client_id || !due_date) {
    const clients = db.prepare(
      'SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC'
    ).all(userId);
    return res.render('invoices/create', { clients, error: 'Client and due date are required' });
  }

  // Generate invoice number
  const count = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE user_id = ?').get(userId).count;
  const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;

  // Parse items
  let lineItems = [];
  if (items && Array.isArray(items.description)) {
    for (let i = 0; i < items.description.length; i++) {
      if (items.description[i]) {
        const quantity = parseFloat(items.quantity[i]) || 0;
        const rate = parseFloat(items.rate[i]) || 0;
        lineItems.push({
          description: items.description[i],
          quantity,
          rate,
          amount: quantity * rate
        });
      }
    }
  } else if (items && items.description) {
    const quantity = parseFloat(items.quantity) || 0;
    const rate = parseFloat(items.rate) || 0;
    lineItems.push({
      description: items.description,
      quantity,
      rate,
      amount: quantity * rate
    });
  }

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);

  // Insert invoice
  const result = db.prepare(
    'INSERT INTO invoices (user_id, client_id, invoice_number, status, due_date, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(userId, client_id, invoiceNumber, 'draft', due_date, total, notes || '');

  const invoiceId = result.lastInsertRowid;

  // Insert line items
  const insertItem = db.prepare(
    'INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount) VALUES (?, ?, ?, ?, ?)'
  );

  for (const item of lineItems) {
    insertItem.run(invoiceId, item.description, item.quantity, item.rate, item.amount);
  }

  res.redirect(`/invoices/${invoiceId}`);
});

// View invoice
router.get('/:id', (req, res) => {
  const invoice = db.prepare(
    `SELECT invoices.*, clients.name as client_name, clients.email as client_email, clients.address as client_address
     FROM invoices
     JOIN clients ON invoices.client_id = clients.id
     WHERE invoices.id = ? AND invoices.user_id = ?`
  ).get(req.params.id, req.session.user.id);

  if (!invoice) {
    return res.redirect('/invoices');
  }

  const items = db.prepare(
    'SELECT * FROM invoice_items WHERE invoice_id = ?'
  ).all(invoice.id);

  res.render('invoices/view', { invoice, items });
});

// Update invoice status
router.post('/:id/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['draft', 'sent', 'paid', 'overdue'];

  if (!validStatuses.includes(status)) {
    return res.redirect(`/invoices/${req.params.id}`);
  }

  db.prepare(
    'UPDATE invoices SET status = ? WHERE id = ? AND user_id = ?'
  ).run(status, req.params.id, req.session.user.id);

  res.redirect(`/invoices/${req.params.id}`);
});

// Generate PDF
router.get('/:id/pdf', (req, res) => {
  const invoice = db.prepare(
    `SELECT invoices.*, clients.name as client_name, clients.email as client_email, clients.address as client_address
     FROM invoices
     JOIN clients ON invoices.client_id = clients.id
     WHERE invoices.id = ? AND invoices.user_id = ?`
  ).get(req.params.id, req.session.user.id);

  if (!invoice) {
    return res.redirect('/invoices');
  }

  const items = db.prepare(
    'SELECT * FROM invoice_items WHERE invoice_id = ?'
  ).all(invoice.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);

  // Generate PDF
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoice_number}.pdf`);

  doc.pipe(res);

  // Header
  doc.fontSize(24).text(user.business_name || 'Invoice', { align: 'left' });
  doc.moveDown();
  doc.fontSize(12).text(`Invoice: ${invoice.invoice_number}`);
  doc.text(`Date: ${invoice.created_at}`);
  doc.text(`Due Date: ${invoice.due_date}`);
  doc.text(`Status: ${invoice.status.toUpperCase()}`);
  doc.moveDown();

  // Client info
  doc.fontSize(14).text('Bill To:');
  doc.fontSize(12).text(invoice.client_name);
  doc.text(invoice.client_email);
  if (invoice.client_address) {
    doc.text(invoice.client_address);
  }
  doc.moveDown();

  // Items table header
  doc.fontSize(10);
  const tableTop = doc.y;
  doc.text('Description', 50, tableTop);
  doc.text('Qty', 300, tableTop);
  doc.text('Rate', 370, tableTop);
  doc.text('Amount', 450, tableTop);
  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // Items
  let y = tableTop + 25;
  for (const item of items) {
    doc.text(item.description, 50, y);
    doc.text(String(item.quantity), 300, y);
    doc.text(`$${item.rate.toFixed(2)}`, 370, y);
    doc.text(`$${item.amount.toFixed(2)}`, 450, y);
    y += 20;
  }

  // Total
  doc.moveTo(50, y).lineTo(550, y).stroke();
  y += 10;
  doc.fontSize(14).text(`Total: $${invoice.total.toFixed(2)}`, 350, y);

  // Notes
  if (invoice.notes) {
    doc.moveDown(2);
    doc.fontSize(10).text('Notes:', 50);
    doc.text(invoice.notes, 50);
  }

  doc.end();
});

// Delete invoice
router.post('/:id/delete', (req, res) => {
  db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
  db.prepare('DELETE FROM invoices WHERE id = ? AND user_id = ?').run(req.params.id, req.session.user.id);
  res.redirect('/invoices');
});

module.exports = router;
