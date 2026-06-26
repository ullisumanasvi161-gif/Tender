import express from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import Checklist from '../models/Checklist.js';
import AuditLog from '../models/AuditLog.js';
import { localDb } from '../config/localDb.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to format date
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// @desc    Export checklist to PDF
// @route   GET /api/export/:id/pdf
// @access  Private
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const targetId = req.params.id;

    let checklist;
    if (isConnected) {
      checklist = await Checklist.findById(targetId);
    } else {
      checklist = await localDb.getChecklistById(targetId);
    }

    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    let userId = (req.user._id || req.user.id).toString();
    const createdByStr = isConnected ? checklist.createdBy.toString() : checklist.createdBy.toString();

    if (req.user.role !== 'admin' && createdByStr !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create PDF Document
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // Set Response Headers
    const filename = `Tender_Checklist_${checklist.projectName.replace(/\s+/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Styling constants
    const primaryGold = '#D4AF37';
    const darkCharcoal = '#0F0F0F';
    const bodyColor = '#2D2D2D';

    // --- Header ---
    doc.rect(0, 0, doc.page.width, 100).fill(darkCharcoal);
    doc.fillColor(primaryGold).fontSize(16).text('AVINASH KANAPARTHI INFRA PRIVATE LIMITED', 50, 30, { align: 'left', bold: true });
    doc.fillColor('#FFFFFF').fontSize(10).text('AI-Powered Tender Preparation Checklist Generator', 50, 50, { align: 'left' });
    doc.fillColor('#CCCCCC').fontSize(8).text('Building Smarter Infrastructure with AI-Powered Tender Management', 50, 65, { align: 'left', italic: true });
    
    // Header Logo Mock Accent
    doc.rect(doc.page.width - 90, 25, 40, 40).fill(primaryGold);
    doc.fillColor('#000000').fontSize(14).text('AK', doc.page.width - 83, 38, { bold: true });

    // --- Project Info Card ---
    doc.fillColor(darkCharcoal).fontSize(14).text('Tender Information Summary', 50, 120, { bold: true });
    doc.moveTo(50, 138).lineTo(doc.page.width - 50, 138).stroke(primaryGold);

    // Stack elements dynamically in a single-column layout to prevent overlapping of long project names or client names
    let y = 150;
    doc.fontSize(10);

    const drawRow = (label, value) => {
      if (y > doc.page.height - 80) {
        doc.addPage();
        y = 50;
      }
      doc.fillColor(darkCharcoal).text(label, 50, y, { bold: true, width: 100 });
      doc.fillColor(bodyColor).text(value || 'N/A', 160, y, { width: 385 });
      
      const textHeight = doc.heightOfString(value || 'N/A', { width: 385 });
      y += Math.max(textHeight, 15) + 6;
    };

    drawRow('Project Name:', checklist.projectName);
    drawRow('Client Name:', checklist.clientName);
    drawRow('Project Type:', checklist.projectType);
    drawRow('Location:', checklist.location);
    drawRow('Tender Value:', `INR ${checklist.tenderValue} Crores`);
    drawRow('Category:', checklist.tenderCategory);
    drawRow('Deadline:', formatDate(checklist.submissionDeadline));

    // Render Readiness Status right after the list as a clean highlighted banner
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 50;
    }
    
    doc.rect(50, y, doc.page.width - 100, 32).fill('#F5F5F5').stroke(primaryGold);
    doc.fillColor(darkCharcoal).text('Submission Readiness:', 65, y + 11, { bold: true });
    
    const readinessColor = checklist.readinessLevel === 'High' ? '#2E7D32' : (checklist.readinessLevel === 'Medium' ? '#EF6C00' : '#C62828');
    doc.fillColor(readinessColor).text(`${checklist.readinessLevel} Readiness`, 195, y + 11, { bold: true });
    
    doc.fillColor(darkCharcoal).text(`Compliance Score: ${checklist.complianceScore}%`, 330, y + 11, { bold: true });

    y += 55;

    // --- Section Item Render Helper ---
    const renderSection = (title, items) => {
      if (!items || items.length === 0) return;
      if (y > doc.page.height - 150) {
        doc.addPage();
        y = 50;
      }

      doc.fillColor(darkCharcoal).fontSize(12).text(title, 50, y, { bold: true });
      doc.moveTo(50, y + 15).lineTo(doc.page.width - 50, y + 15).stroke('#CCCCCC');
      y += 25;

      items.forEach(item => {
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 50;
        }

        doc.fillColor(item.mandatory ? '#D32F2F' : '#666666');
        doc.fontSize(10).text(item.mandatory ? '[MANDATORY] ' : '[OPTIONAL] ', 50, y, { bold: true, width: 90 });
        
        let statusStr = '[ ]';
        let statusCol = '#D32F2F';
        if (item.status === 'completed') {
          statusStr = '[x]';
          statusCol = '#2E7D32';
        } else if (item.status === 'na') {
          statusStr = '[N/A]';
          statusCol = '#9E9E9E';
        }

        doc.fillColor(statusCol).text(statusStr, 145, y, { bold: true });

        doc.fillColor(darkCharcoal).text(item.title, 180, y, { bold: true });
        
        if (item.uploadedDocName) {
          doc.fontSize(8).fillColor('#1976D2').text(`Doc: ${item.uploadedDocName}`, 180, y + 12);
          y += 10;
        }
        
        doc.fontSize(9).fillColor('#555555').text(item.description || 'No description provided', 180, y + 12, { width: 360 });
        
        y += 35;
      });

      y += 15;
    };

    renderSection('1. Technical Requirements', checklist.technicalSection);
    renderSection('2. Commercial Requirements', checklist.commercialSection);
    renderSection('3. Financial Requirements', checklist.financialSection);
    renderSection('4. Compliance Requirements', checklist.complianceSection);

    // AI Alerts and Recommendations
    if (y > doc.page.height - 180) {
      doc.addPage();
      y = 50;
    }

    doc.fillColor(darkCharcoal).fontSize(12).text('5. Risk Assessment & Alerts', 50, y, { bold: true });
    doc.moveTo(50, y + 15).lineTo(doc.page.width - 50, y + 15).stroke(primaryGold);
    y += 25;

    doc.fontSize(9).fillColor('#C62828');
    checklist.missingDocumentsAlerts.forEach(alert => {
      doc.text(`* ${alert}`, 50, y, { width: 490 });
      y += 18;
    });

    if (checklist.aiRecommendations && checklist.aiRecommendations.length > 0) {
      y += 10;
      doc.fillColor(darkCharcoal).fontSize(11).text('AI Strategic Recommendations:', 50, y, { bold: true });
      y += 18;
      doc.fontSize(9).fillColor(bodyColor);
      checklist.aiRecommendations.forEach(rec => {
        doc.text(`* ${rec}`, 50, y, { width: 490 });
        y += 18;
      });
    }

    // Footer signature
    doc.fontSize(8).fillColor('#888888').text(`Generated on ${formatDate(new Date())} - AVINASH KANAPARTHI INFRA PRIVATE LIMITED`, 50, doc.page.height - 35, { align: 'center' });

    doc.end();

    // Log Action
    if (isConnected) {
      await AuditLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'CHECKLIST_EXPORT',
        details: `Exported checklist for "${checklist.projectName}" to PDF (MongoDB)`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      });
    } else {
      await localDb.createAuditLog({
        userId: userId,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'CHECKLIST_EXPORT',
        details: `Exported checklist for "${checklist.projectName}" to PDF (LocalDB Fallback)`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      });
    }

  } catch (error) {
    console.error('Error generating PDF export:', error.message);
    res.status(500).json({ message: 'Failed to export checklist to PDF' });
  }
});

// @desc    Export checklist to Excel
// @route   GET /api/export/:id/excel
// @access  Private
router.get('/:id/excel', protect, async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1;
    const targetId = req.params.id;

    let checklist;
    if (isConnected) {
      checklist = await Checklist.findById(targetId);
    } else {
      checklist = await localDb.getChecklistById(targetId);
    }

    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    let userId = (req.user._id || req.user.id).toString();
    const createdByStr = isConnected ? checklist.createdBy.toString() : checklist.createdBy.toString();

    if (req.user.role !== 'admin' && createdByStr !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create workbook & worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tender Checklist');

    const primaryGold = 'FFD4AF37';
    const darkCharcoal = 'FF0F0F0F';

    // Corporate Title Block
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'AVINASH KANAPARTHI INFRA PRIVATE LIMITED';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkCharcoal } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.mergeCells('A2:F2');
    const subtitleCell = worksheet.getCell('A2');
    subtitleCell.value = `AI Tender Checklist: ${checklist.projectName}`;
    subtitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: primaryGold } };
    subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkCharcoal } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.getRow(1).height = 30;
    worksheet.getRow(2).height = 20;

    worksheet.addRow([]);

    // Project Info Block
    worksheet.addRow(['Project Name:', checklist.projectName, '', 'Tender Value:', `${checklist.tenderValue} Crores`]);
    worksheet.addRow(['Client Name:', checklist.clientName, '', 'Category:', checklist.tenderCategory]);
    worksheet.addRow(['Project Type:', checklist.projectType, '', 'Deadline:', formatDate(checklist.submissionDeadline)]);
    worksheet.addRow(['Location:', checklist.location, '', 'Compliance Score:', `${checklist.complianceScore}%`]);
    worksheet.addRow(['Readiness Level:', checklist.readinessLevel, '', 'Generated Date:', formatDate(new Date())]);

    for (let r = 4; r <= 8; r++) {
      worksheet.getCell(`A${r}`).font = { bold: true };
      worksheet.getCell(`D${r}`).font = { bold: true };
    }

    worksheet.addRow([]);

    // Table Headers
    const headers = ['Section', 'Title', 'Description', 'Mandatory', 'Status', 'Uploaded Document'];
    worksheet.addRow(headers);
    const headerRow = worksheet.getRow(10);
    headerRow.height = 25;

    headerRow.eachCell(cell => {
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF333333' } };
      cell.alignment = { vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' }
      };
    });

    const sections = [
      { name: 'Technical', items: checklist.technicalSection },
      { name: 'Commercial', items: checklist.commercialSection },
      { name: 'Financial', items: checklist.financialSection },
      { name: 'Compliance', items: checklist.complianceSection }
    ];

    sections.forEach(sec => {
      if (!sec.items) return;
      sec.items.forEach(item => {
        const row = [
          sec.name,
          item.title,
          item.description,
          item.mandatory ? 'YES' : 'NO',
          item.status.toUpperCase(),
          item.uploadedDocName || ''
        ];
        worksheet.addRow(row);
      });
    });

    // Format data rows
    const lastRowIndex = worksheet.lastRow.number;
    for (let r = 11; r <= lastRowIndex; r++) {
      const row = worksheet.getRow(r);
      row.height = 20;
      
      const isMandatory = row.getCell(4).value === 'YES';
      const status = row.getCell(5).value;

      row.eachCell((cell, colIndex) => {
        cell.alignment = { vertical: 'middle', wrapText: colIndex === 3 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };

        if (colIndex === 5) {
          if (status === 'COMPLETED') {
            cell.font = { color: { argb: 'FF1B5E20' }, bold: true };
          } else if (status === 'PENDING') {
            cell.font = { color: { argb: 'FFB71C1C' }, bold: true };
          } else {
            cell.font = { color: { argb: 'FF616161' }, italic: true };
          }
        }

        if (colIndex === 4 && isMandatory) {
          cell.font = { color: { argb: 'FFB71C1C' }, bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEBEE' } };
        }
      });
    }

    // Set Column Widths
    worksheet.getColumn(1).width = 12;
    worksheet.getColumn(2).width = 35;
    worksheet.getColumn(3).width = 50;
    worksheet.getColumn(4).width = 12;
    worksheet.getColumn(5).width = 15;
    worksheet.getColumn(6).width = 25;

    // Response Headers
    const filename = `Tender_Checklist_${checklist.projectName.replace(/\s+/g, '_')}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();

    // Log Action
    if (isConnected) {
      await AuditLog.create({
        userId: req.user._id,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'CHECKLIST_EXPORT',
        details: `Exported checklist for "${checklist.projectName}" to Excel (MongoDB)`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      });
    } else {
      await localDb.createAuditLog({
        userId: userId,
        userName: req.user.name,
        userEmail: req.user.email,
        action: 'CHECKLIST_EXPORT',
        details: `Exported checklist for "${checklist.projectName}" to Excel (LocalDB Fallback)`,
        ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
      });
    }

  } catch (error) {
    console.error('Error generating Excel export:', error.message);
    res.status(500).json({ message: 'Failed to export checklist to Excel' });
  }
});

export default router;
