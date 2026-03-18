import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportToPDF = (title: string, headers: string[], data: any[][], filename: string) => {
  const doc = new jsPDF();
  
  // Add Title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 14, 30);
  
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: [44, 90, 160], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  doc.save(`${filename}.pdf`);
};

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const printTable = (title: string, headers: string[], data: any[][]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #2C5AA0; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">
          © ${new Date().getFullYear()} Girvi Loan Management System
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const generateLoanReceipt = (loan: any) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(44, 90, 160);
  doc.text('LOAN RECEIPT', 105, 20, { align: 'center' });
  
  doc.setDrawColor(200);
  doc.line(14, 25, 196, 25);
  
  // Loan Info
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Receipt No: ${loan.loan_number}`, 14, 35);
  doc.text(`Date: ${format(new Date(loan.created_at), 'dd MMM yyyy')}`, 14, 42);
  
  // Customer Info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Name: ${loan.customer_name}`, 14, 62);
  doc.text(`Mobile: ${loan.customer_mobile}`, 14, 69);
  
  // Loan Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Loan Details', 14, 82);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const loanDetails = [
    ['Principal Amount', `INR ${loan.loan_amount || loan.amount}`],
    ['Interest Rate', `${loan.monthly_interest || loan.interest_rate}% per month`],
    ['Interest Cycle', loan.interest_cycle || 'Monthly'],
    ['Start Date', format(new Date(loan.start_date || loan.created_at), 'dd MMM yyyy')],
    ['Maturity Date', loan.maturity_date ? format(new Date(loan.maturity_date), 'dd MMM yyyy') : 'N/A'],
  ];
  
  autoTable(doc, {
    body: loanDetails,
    startY: 87,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
  });
  
  // Items
  if (loan.items && loan.items.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Pledged Items', 14, (doc as any).lastAutoTable.finalY + 15);
    
    const itemHeaders = ['Type', 'Purity', 'Weight', 'Packet', 'Valuation'];
    const itemData = loan.items.map((item: any) => [
      item.type || item.item_type,
      item.purity,
      `${item.net_weight}g`,
      item.packet_number,
      `INR ${item.valuation || item.estimated_valuation}`
    ]);
    
    autoTable(doc, {
      head: [itemHeaders],
      body: itemData,
      startY: (doc as any).lastAutoTable.finalY + 20,
      theme: 'grid',
      headStyles: { fillColor: [44, 90, 160] }
    });
  }
  
  // Footer
  const finalY = (doc as any).lastAutoTable.finalY || 150;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('This is a computer generated receipt and does not require a signature.', 105, finalY + 30, { align: 'center' });
  
  doc.save(`Receipt_${loan.loan_number}.pdf`);
};

export const generatePaymentReceipt = (payment: any, settings: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with Logo
  if (settings?.logo) {
    try {
      doc.addImage(settings.logo, 'PNG', 14, 10, 30, 30);
    } catch (e) {
      console.error('Error adding logo to PDF:', e);
    }
  }
  
  // Business Info
  doc.setFontSize(20);
  doc.setTextColor(44, 90, 160);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.branchName || 'Girvi Loan Management', 50, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.branchAddress || '', 50, 27, { maxWidth: 140 });
  doc.text(`Phone: ${settings?.contactNumber || ''}`, 50, 37);
  
  doc.setDrawColor(200);
  doc.line(14, 45, 196, 45);
  
  // Receipt Title
  doc.setFontSize(16);
  doc.setTextColor(44, 90, 160);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT RECEIPT', 105, 55, { align: 'center' });
  
  // Payment Info Grid
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  
  const leftCol = 14;
  const rightCol = 110;
  let currentY = 70;
  
  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt No:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`PAY-${payment.id}`, leftCol + 25, currentY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', rightCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(payment.payment_date || payment.created_at), 'dd MMM yyyy'), rightCol + 25, currentY);
  
  currentY += 10;
  
  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.text('Loan No:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.loan_number || 'N/A', leftCol + 25, currentY);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Customer ID:', rightCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`CUST-${payment.loans?.customer_id || payment.customer_id || 'N/A'}`, rightCol + 25, currentY);
  
  currentY += 10;
  
  // Row 3
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', leftCol, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.customer_name || 'N/A', leftCol + 25, currentY);
  
  currentY += 15;
  
  // Payment Details Table
  autoTable(doc, {
    startY: currentY,
    head: [['Description', 'Details']],
    body: [
      ['Payment Type', (payment.payment_type || 'Payment').toUpperCase()],
      ['Payment Mode', payment.payment_mode || 'N/A'],
      ['Transaction ID', payment.transaction_id || 'N/A'],
      ['Amount Paid', `INR ${Number(payment.amount).toLocaleString()}`],
      ['Remarks', payment.remarks || '-'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [44, 90, 160], textColor: 255 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 30;
  
  // Signature Section
  doc.line(20, currentY, 70, currentY);
  doc.text('Customer Signature', 25, currentY + 5);
  
  doc.line(140, currentY, 190, currentY);
  doc.text('Authorized Signatory', 145, currentY + 5);
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text('Thank you for your payment!', 105, 280, { align: 'center' });
  
  doc.save(`Payment_Receipt_${payment.loan_number}_${format(new Date(), 'ddMMyy')}.pdf`);
};
