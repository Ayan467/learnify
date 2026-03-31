const PDFDocument = require('pdfkit');

/**
 * Generate a styled PDF certificate
 * @param {Object} params
 * @param {string} params.studentName
 * @param {string} params.courseName
 * @param {Date}   params.completedAt
 * @param {string} params.courseId
 * @returns {Promise<Buffer>}
 */
const generateCertificate = ({ studentName, courseName, completedAt, courseId }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 841.89;
      const H = 595.28;

      // ── Background ────────────────────────────────────────
      doc.rect(0, 0, W, H).fill('#0f172a');

      // Gold border outer
      doc.rect(20, 20, W - 40, H - 40).lineWidth(3).strokeColor('#d4af37').stroke();
      // Gold border inner
      doc.rect(30, 30, W - 60, H - 60).lineWidth(1).strokeColor('#d4af37').stroke();

      // Decorative corner accents (top-left)
      const corner = (x, y, flipX = false, flipY = false) => {
        const sx = flipX ? -1 : 1;
        const sy = flipY ? -1 : 1;
        doc.save().translate(x, y).scale(sx, sy);
        doc.moveTo(0, 0).lineTo(40, 0).lineTo(40, 3).lineTo(3, 3).lineTo(3, 40).lineTo(0, 40).closePath().fill('#d4af37');
        doc.restore();
      };
      corner(30, 30);
      corner(W - 30, 30, true);
      corner(30, H - 30, false, true);
      corner(W - 30, H - 30, true, true);

      // ── Header ────────────────────────────────────────────
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#d4af37').text('L E A R N I F Y', 0, 60, {
        align: 'center',
        characterSpacing: 6,
      });

      doc.font('Helvetica').fontSize(9).fillColor('#94a3b8').text('ONLINE LEARNING PLATFORM', 0, 78, {
        align: 'center',
        characterSpacing: 3,
      });

      // Thin divider
      doc.moveTo(W / 2 - 80, 100).lineTo(W / 2 + 80, 100).lineWidth(0.5).strokeColor('#d4af37').stroke();

      // ── Main Title ────────────────────────────────────────
      doc.font('Helvetica').fontSize(13).fillColor('#94a3b8').text('CERTIFICATE OF COMPLETION', 0, 120, {
        align: 'center',
        characterSpacing: 4,
      });

      // ── Body ──────────────────────────────────────────────
      doc.font('Helvetica').fontSize(14).fillColor('#cbd5e1').text('This is to certify that', 0, 165, { align: 'center' });

      // Student name
      doc.font('Helvetica-Bold').fontSize(42).fillColor('#ffffff').text(studentName, 0, 195, { align: 'center' });

      // Underline name
      const nameWidth = doc.widthOfString(studentName, { fontSize: 42 });
      const nameX = (W - Math.min(nameWidth, 600)) / 2;
      doc.moveTo(nameX, 245).lineTo(W - nameX, 245).lineWidth(0.5).strokeColor('#d4af37').stroke();

      doc.font('Helvetica').fontSize(14).fillColor('#cbd5e1').text('has successfully completed the course', 0, 260, {
        align: 'center',
      });

      // Course name
      doc.font('Helvetica-Bold').fontSize(26).fillColor('#d4af37').text(courseName, 60, 290, {
        align: 'center',
        width: W - 120,
      });

      // ── Footer info ───────────────────────────────────────
      const dateStr = new Date(completedAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const footerY = H - 120;

      // Date
      doc.font('Helvetica').fontSize(10).fillColor('#94a3b8').text('Date of Completion', 120, footerY, { align: 'left' });
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff').text(dateStr, 120, footerY + 16, { align: 'left' });
      doc.moveTo(120, footerY + 36).lineTo(280, footerY + 36).lineWidth(0.5).strokeColor('#475569').stroke();

      // Certificate ID
      doc.font('Helvetica').fontSize(10).fillColor('#94a3b8').text('Certificate ID', W / 2 - 60, footerY, { align: 'center', width: 120 });
      const certId = `LRN-${courseId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff').text(certId, W / 2 - 80, footerY + 16, { align: 'center', width: 160 });
      doc.moveTo(W / 2 - 80, footerY + 36).lineTo(W / 2 + 80, footerY + 36).lineWidth(0.5).strokeColor('#475569').stroke();

      // Signature placeholder
      doc.font('Helvetica').fontSize(10).fillColor('#94a3b8').text('Authorised Signatory', W - 280, footerY, { align: 'right', width: 160 });
      doc.font('Helvetica-BoldOblique').fontSize(16).fillColor('#d4af37').text('Learnify Team', W - 280, footerY + 10, { align: 'right', width: 160 });
      doc.moveTo(W - 280, footerY + 36).lineTo(W - 120, footerY + 36).lineWidth(0.5).strokeColor('#475569').stroke();

      // Stamp circle
      doc.circle(W / 2, footerY + 18, 28).lineWidth(1).strokeColor('#d4af37').stroke();
      doc.font('Helvetica-Bold').fontSize(7).fillColor('#d4af37').text('LEARNIFY', W / 2 - 20, footerY + 10, { width: 40, align: 'center', characterSpacing: 1 });
      doc.font('Helvetica').fontSize(6).fillColor('#94a3b8').text('VERIFIED', W / 2 - 15, footerY + 22, { width: 30, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateCertificate };
