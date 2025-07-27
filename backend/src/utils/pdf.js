const PDFDocument = require('pdfkit');

function generateHallTicket(stream, student, exam, form) {
  const doc = new PDFDocument();
  doc.pipe(stream);
  doc.fontSize(20).text('Hall Ticket', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Student: ${student.name}`);
  doc.text(`Exam: ${exam.name}`);
  doc.text(`Date: ${exam.date}`);
  doc.text(`Roll Number: ${form.submission_data.rollNumber}`);
  doc.text(`Subject: ${form.submission_data.subject}`);
  doc.end();
}

module.exports = { generateHallTicket }; 