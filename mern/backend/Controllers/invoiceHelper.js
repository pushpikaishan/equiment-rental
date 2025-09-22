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

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  // Header
  doc.fontSize(20).text('Equipment Rental Invoice', { align: 'center' });
  doc.moveDown();

  // Customer/Booking Info
  doc.fontSize(12).text(`Invoice #: ${booking._id}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  doc.text(`Customer: ${booking.customerName}`);
  doc.text(`Email: ${booking.customerEmail}`);
  doc.text(`Phone: ${booking.customerPhone}`);
  doc.text(`Delivery Address: ${booking.deliveryAddress}`);
  doc.text(`Booking Date: ${new Date(booking.bookingDate).toLocaleDateString()}`);
  doc.moveDown();

  // Items Table
  doc.fontSize(14).text('Items');
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text('Item', 50, doc.y, { continued: true });
  doc.text('Price/Day', 250, doc.y, { continued: true });
  doc.text('Qty', 350, doc.y, { continued: true });
  doc.text('Subtotal', 420);
  doc.moveDown(0.5);

  booking.items.forEach((it) => {
    doc.text(it.name, 50, doc.y, { continued: true });
    doc.text(it.pricePerDay.toFixed(2), 250, doc.y, { continued: true });
    doc.text(String(it.qty), 350, doc.y, { continued: true });
    doc.text((it.pricePerDay * it.qty).toFixed(2), 420);
  });

  doc.moveDown();
  doc.text(`Security Deposit: ${booking.securityDeposit.toFixed(2)}`, { align: 'right' });
  doc.text(`Total Per Day: ${booking.subtotal.toFixed(2)}`, { align: 'right' });
  doc.fontSize(14).text(`Total Charged: ${(booking.securityDeposit + booking.subtotal).toFixed(2)}`, { align: 'right' });

  doc.end();

  await new Promise((resolve) => stream.on('finish', resolve));
  // Return the public path
  return `/uploads/invoices/${fileName}`;
};
