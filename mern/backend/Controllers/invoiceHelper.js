const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

exports.generateInvoicePDF = async (booking) => {
  const invoicesDir = path.join(process.cwd(), 'uploads', 'invoices');
  ensureDir(invoicesDir);
  const fileName = `invoice-${booking._id}.pdf`;
  const filePath = path.join(invoicesDir, fileName);

  const doc = new PDFDocument({ margin: 56, size: 'A4' });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Branding colors
  const brandPrimary = '#1d2d47';
  const brandAccent = '#3b82f6';
  const textMuted = '#64748b';
  const textDark = '#1e293b';

  const pageWidth = doc.page.width;
  const pageMargin = doc.page.margins.left;
  const contentWidth = pageWidth - pageMargin * 2;

  // Accent line at top
  doc.save().rect(pageMargin, pageMargin - 24, contentWidth, 3).fill(brandAccent).restore();

  // Header two columns
  const headerY = pageMargin - 10;
  const colLeftX = pageMargin;
  const colRightX = pageMargin + contentWidth / 2 + 10;

  // Logo (use favicon.ico or fallback logos)
  try {
    const candidates = [
      path.join(process.cwd(), 'frontend', 'public', 'favicon.ico'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'favicon.ico'),
      path.join(process.cwd(), 'public', 'favicon.ico'),
      path.join(process.cwd(), 'frontend', 'public', 'logo192.png'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'logo192.png'),
      path.join(process.cwd(), 'frontend', 'public', 'logo512.png'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'logo512.png'),
    ];
    const logoPath = candidates.find((p) => {
      try { return fs.existsSync(p); } catch { return false; }
    });
    if (logoPath) {
      doc.image(logoPath, colLeftX, headerY, { width: 72 });
    }
  } catch (_) {}

  // Brand name
  doc.fillColor(brandPrimary).fontSize(26).font('Helvetica-Bold').text('Eventrix', colLeftX + 82, headerY + 12, { continued: false });

  // INVOICE title with accent background
  const title = 'INVOICE';
  doc.font('Helvetica-Bold').fontSize(40);
  const titleWidth = doc.widthOfString(title);
  const titleX = pageMargin + contentWidth - titleWidth - 8;
  const titleY = headerY;
  // Accent backdrop with low opacity-like fill using lighter color
  doc.save().fillColor('#e8f0fe').roundedRect(titleX - 10, titleY, titleWidth + 20, 46, 6).fill().restore();
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(40).text(title, titleX, titleY + 4);

  // Move below header
  doc.moveDown();
  doc.y = headerY + 72;

  // Company info (left)
  doc.fillColor(textMuted).font('Helvetica').fontSize(12);
  const companyLines = [
    'Eventrix',
    '123 Event Street, Colombo, Sri Lanka',
    'Phone: +94 77 123 4567',
    'Email: info@eventrix.com',
    'Website: www.eventrix.com',
  ];
  companyLines.forEach((l) => doc.text(l, colLeftX, doc.y, { align: 'left' }));

  // Invoice details (right)
  const rightStartY = headerY + 72;
  const idMono = `Invoice No: ${booking._id}`;
  const invDate = `Date: ${new Date(booking?.paidAt || Date.now()).toLocaleString()}`;
  const method = `Payment Method: ${String(booking?.paymentMethod || 'card')}`;
  const status = String(booking?.paymentStatus || 'paid').toLowerCase();

  const badgeColors = {
    paid: { bg: '#16a34a', fg: '#ffffff' },
    pending: { bg: '#f59e0b', fg: '#111827' },
    failed: { bg: '#dc2626', fg: '#ffffff' },
  };
  const bc = badgeColors[status] || badgeColors.pending;

  doc.fillColor(textDark).font('Courier-Bold').fontSize(12).text(idMono, colRightX, rightStartY, { width: contentWidth / 2 - 10, align: 'right' });
  doc.fillColor(textDark).font('Helvetica').fontSize(12).text(invDate, colRightX, doc.y + 2, { width: contentWidth / 2 - 10, align: 'right' });
  doc.text(method, colRightX, doc.y + 2, { width: contentWidth / 2 - 10, align: 'right' });
  // Status badge
  const badgeText = status.toUpperCase();
  doc.font('Helvetica-Bold').fontSize(10);
  const bw = doc.widthOfString(badgeText) + 16;
  const bh = 16;
  const bx = pageMargin + contentWidth - bw;
  const by = doc.y + 6;
  doc.save().fillColor(bc.bg).roundedRect(bx, by, bw, bh, 8).fill().restore();
  doc.fillColor(bc.fg).font('Helvetica-Bold').fontSize(10).text(badgeText, bx, by + 2, { width: bw, align: 'center' });

  // Billed To
  doc.moveDown(2);
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(13).text('Billed To:', colLeftX, doc.y + 8);
  doc.save().lineWidth(4).strokeColor(brandAccent).moveTo(colLeftX, doc.y + 18).lineTo(colLeftX + 60, doc.y + 18).stroke().restore();
  doc.moveDown(0.3);
  doc.save().fillColor('#f8fafc').rect(colLeftX, doc.y + 6, contentWidth / 2 - 16, 70).fill().restore();
  const blockY = doc.y + 10;
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(12).text(String(booking?.customerName || '-'), colLeftX + 8, blockY);
  doc.fillColor(textMuted).font('Helvetica').fontSize(12).text(String(booking?.customerEmail || ''), colLeftX + 8, doc.y + 4);
  if (booking?.deliveryAddress) {
    doc.fillColor(textMuted).font('Helvetica').fontSize(12).text(`Address: ${String(booking.deliveryAddress)}`, colLeftX + 8, doc.y + 4, { width: contentWidth / 2 - 32 });
  }
  if (booking?.bookingDate) {
    const when = new Date(booking.bookingDate).toLocaleString();
    doc.fillColor(textMuted).font('Helvetica').fontSize(12).text(`Booking Date: ${when}`, colLeftX + 8, doc.y + 4);
  }

  // Summary (right)
  const sumX = colRightX;
  let sy = blockY;
  const rows = [
    ['Subtotal', Number(booking?.subtotal || 0)],
    ['Deposit', Number(booking?.securityDeposit || 0)],
    ['Taxes', 0],
    ['Discount', 0],
  ];
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(13).text('Summary', sumX, sy, { width: contentWidth / 2 - 10, align: 'right' });
  sy = doc.y + 6;
  rows.forEach(([label, val]) => {
    const v = `LKR ${Number(val || 0).toFixed(2)}`;
    // divider
    doc.save().strokeColor('#e2e8f0').moveTo(sumX, sy).lineTo(pageMargin + contentWidth, sy).stroke().restore();
    sy += 8;
    const labelWidth = (contentWidth / 2) - 140;
    const valueBoxWidth = 120;
    const valueX = pageMargin + contentWidth - valueBoxWidth;
    doc.fillColor(textMuted).font('Helvetica').fontSize(12).text(label, sumX, sy, { width: labelWidth, align: 'left' });
    doc.fillColor(textDark).font('Helvetica-Bold').fontSize(12).text(v, valueX, sy, { width: valueBoxWidth, align: 'right' });
    sy += 18;
  });
  // Total Paid
  const totalPaid = Number(booking?.subtotal || 0) + Number(booking?.securityDeposit || 0);
  doc.save().strokeColor(textDark).lineWidth(2).moveTo(sumX, sy).lineTo(pageMargin + contentWidth, sy).stroke().restore();
  sy += 6;
  const totalBoxWidth = 140;
  const totalX = pageMargin + contentWidth - totalBoxWidth;
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(14).text('Total Paid', sumX, sy, { width: (contentWidth / 2) - 160, align: 'left' });
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(14).text(`LKR ${totalPaid.toFixed(2)}`, totalX, sy, { width: totalBoxWidth, align: 'right' });

  // Establish bottom Y for two-column section
  const billedBottomY = blockY + 70 + 14; // billed block estimated height
  const summaryBottomY = sy + 20;
  let bottomY = Math.max(billedBottomY, summaryBottomY);
  doc.y = bottomY + 24;

  // Items table (full width)
  if (Array.isArray(booking?.items) && booking.items.length > 0) {
    const tableX = pageMargin;
    const tableY = doc.y;
    // Define column widths
    const nameWidth = contentWidth - (110 + 60 + 130) - 24; // price+qty+subtotal widths plus paddings
    const priceWidth = 110;
    const qtyWidth = 60;
    const subWidth = 130;
    const nameX = tableX + 8;
    const priceX = tableX + 8 + nameWidth;
    const qtyX = priceX + priceWidth;
    const subX = qtyX + qtyWidth;

    // Header row background
    doc.save().fillColor('#f1f5f9').rect(tableX, tableY, contentWidth, 24).fill().restore();
    doc.fillColor(textDark).font('Helvetica-Bold').fontSize(12);
    doc.text('Item', nameX, tableY + 6, { width: nameWidth, align: 'left' });
    doc.text('Price/Day', priceX, tableY + 6, { width: priceWidth, align: 'right' });
    doc.text('Qty', qtyX, tableY + 6, { width: qtyWidth, align: 'right' });
    doc.text('Subtotal', subX, tableY + 6, { width: subWidth, align: 'right' });

    let rowY = tableY + 28;
    doc.font('Helvetica').fontSize(12).fillColor(textMuted);
    booking.items.forEach((it) => {
      const name = String(it?.name || 'Item');
      const price = Number(it?.pricePerDay || 0);
      const qty = Number(it?.qty || 1);
      const subtotal = price * qty;
      // Row divider
      doc.save().strokeColor('#e2e8f0').moveTo(tableX, rowY - 6).lineTo(tableX + contentWidth, rowY - 6).stroke().restore();
      doc.text(name, nameX, rowY, { width: nameWidth, align: 'left' });
      doc.text(`LKR ${price.toFixed(2)}`, priceX, rowY, { width: priceWidth, align: 'right' });
      doc.text(String(qty), qtyX, rowY, { width: qtyWidth, align: 'right' });
      doc.text(`LKR ${subtotal.toFixed(2)}`, subX, rowY, { width: subWidth, align: 'right' });
      rowY += 22;
    });
    doc.y = rowY + 8;
  }

  // Footer
  doc.moveDown(4);
  doc.fillColor(textMuted).font('Helvetica-Oblique').fontSize(13).text('Thank you for your business.', { align: 'center' });

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));
  // Return the public path
  return `/uploads/invoices/${fileName}`;
};

// Branded Refund Receipt generator (for refunds)
exports.generateReceiptPDF = async (payment, lastRefund) => {
  const receiptsDir = path.join(process.cwd(), 'uploads', 'receipts');
  ensureDir(receiptsDir);
  const fileName = `receipt-${payment._id}.pdf`;
  const filePath = path.join(receiptsDir, fileName);

  const doc = new PDFDocument({ margin: 56 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Branding colors
  const brandPrimary = '#1d2d47';
  const brandAccent = '#3b82f6';
  const textMuted = '#64748b';
  const textDark = '#1e293b';

  const pageWidth = doc.page.width;
  const pageMargin = doc.page.margins.left;
  const contentWidth = pageWidth - pageMargin * 2;

  // Accent line at top
  doc.save().rect(pageMargin, pageMargin - 24, contentWidth, 3).fill(brandAccent).restore();

  // Header two columns
  const headerY = pageMargin - 10;
  const colLeftX = pageMargin;
  const colRightX = pageMargin + contentWidth / 2 + 10;

  // Logo
  try {
    const candidates = [
      path.join(process.cwd(), 'frontend', 'public', 'favicon.ico'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'favicon.ico'),
      path.join(process.cwd(), 'public', 'favicon.ico'),
      path.join(process.cwd(), 'frontend', 'public', 'logo192.png'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'logo192.png'),
      path.join(process.cwd(), 'frontend', 'public', 'logo512.png'),
      path.join(process.cwd(), '..', 'frontend', 'public', 'logo512.png'),
    ];
    const logoPath = candidates.find((p) => {
      try { return fs.existsSync(p); } catch { return false; }
    });
    if (logoPath) {
      doc.image(logoPath, colLeftX, headerY, { width: 72 });
    }
  } catch (_) {}

  // Brand name
  doc.fillColor(brandPrimary).fontSize(26).font('Helvetica-Bold').text('Eventrix', colLeftX + 82, headerY + 12, { continued: false });

  // Title with accent background
  const title = 'REFUND RECEIPT';
  doc.font('Helvetica-Bold').fontSize(34);
  const titleWidth = doc.widthOfString(title);
  const titleX = pageMargin + contentWidth - titleWidth - 8;
  const titleY = headerY + 6;
  doc.save().fillColor('#e8f0fe').roundedRect(titleX - 10, titleY - 6, titleWidth + 20, 42, 6).fill().restore();
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(34).text(title, titleX, titleY);

  // Move below header
  doc.moveDown();
  doc.y = headerY + 72;

  // Company info (left)
  doc.fillColor(textMuted).font('Helvetica').fontSize(12);
  const companyLines = [
    'Eventrix',
    '123 Event Street, Colombo, Sri Lanka',
    'Phone: +94 77 123 4567',
    'Email: info@eventrix.com',
    'Website: www.eventrix.com',
  ];
  companyLines.forEach((l) => doc.text(l, colLeftX, doc.y, { align: 'left' }));

  // Receipt details (right)
  const rightStartY = headerY + 72;
  const idMono = `Receipt No: ${payment.orderId || payment._id}`;
  const when = new Date((lastRefund?.createdAt) || payment.updatedAt || Date.now()).toLocaleString();
  const recDate = `Date: ${when}`;
  const method = `Original Payment Method: ${payment.method || payment.gateway || 'N/A'}`;
  const status = String(payment?.status || 'refunded').toLowerCase();
  const badgeColors = {
    refunded: { bg: '#16a34a', fg: '#ffffff' },
    'partial_refunded': { bg: '#f59e0b', fg: '#111827' },
  };
  const bc = badgeColors[status] || badgeColors.refunded;

  doc.fillColor(textDark).font('Courier-Bold').fontSize(12).text(idMono, colRightX, rightStartY, { width: contentWidth / 2 - 10, align: 'right' });
  doc.fillColor(textDark).font('Helvetica').fontSize(12).text(recDate, colRightX, doc.y + 2, { width: contentWidth / 2 - 10, align: 'right' });
  doc.text(method, colRightX, doc.y + 2, { width: contentWidth / 2 - 10, align: 'right' });

  const badgeText = status.replace(/_/g, ' ').toUpperCase();
  doc.font('Helvetica-Bold').fontSize(10);
  const bw = doc.widthOfString(badgeText) + 16;
  const bh = 16;
  const bx = pageMargin + contentWidth - bw;
  const by = doc.y + 6;
  doc.save().fillColor(bc.bg).roundedRect(bx, by, bw, bh, 8).fill().restore();
  doc.fillColor(bc.fg).font('Helvetica-Bold').fontSize(10).text(badgeText, bx, by + 2, { width: bw, align: 'center' });

  // Customer block
  doc.moveDown(2);
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(13).text('Customer:', colLeftX, doc.y + 8);
  doc.save().lineWidth(4).strokeColor(brandAccent).moveTo(colLeftX, doc.y + 18).lineTo(colLeftX + 80, doc.y + 18).stroke().restore();
  doc.moveDown(0.3);
  doc.save().fillColor('#f8fafc').rect(colLeftX, doc.y + 6, contentWidth / 2 - 16, 58).fill().restore();
  const blockY = doc.y + 10;
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(12).text(String(payment?.customerName || '-'), colLeftX + 8, blockY);
  doc.fillColor(textMuted).font('Helvetica').fontSize(12).text(String(payment?.customerEmail || ''), colLeftX + 8, doc.y + 4);

  // Summary (right)
  const sumX = colRightX;
  let sy = blockY;
  const currency = payment.currency || 'LKR';
  const refunded = Number(lastRefund?.amount || (payment.status === 'refunded' ? payment.amount : 0) || 0);
  const lines = [
    [payment.status === 'partial_refunded' ? 'Partial Refund' : 'Refund Amount', `${currency} ${refunded.toFixed(2)}`],
    ['Original Payment', `${currency} ${(Number(payment.amount || 0)).toFixed(2)}`],
    ['Status', (payment.status || '').replace(/_/g, ' ')],
    ['Note', String(lastRefund?.note || '')],
  ];
  doc.fillColor(textDark).font('Helvetica-Bold').fontSize(13).text('Summary', sumX, sy, { width: contentWidth / 2 - 10, align: 'right' });
  sy = doc.y + 6;
  lines.forEach(([label, val]) => {
    doc.save().strokeColor('#e2e8f0').moveTo(sumX, sy).lineTo(pageMargin + contentWidth, sy).stroke().restore();
    sy += 8;
    doc.fillColor(textMuted).font('Helvetica').fontSize(12).text(label, sumX, sy, { continued: true });
    doc.text(String(val), pageMargin + contentWidth - 220, sy, { width: 210, align: 'right' });
    sy += 16;
  });

  // Footer
  doc.moveDown(4);
  doc.fillColor(textMuted).font('Helvetica-Oblique').fontSize(13).text('This receipt acknowledges the refund to your original payment method.', { align: 'center' });

  doc.end();
  await new Promise((resolve) => stream.on('finish', resolve));
  return `/uploads/receipts/${fileName}`;
};
