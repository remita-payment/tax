// app/api/generate-certificate-pdf/[id]/route.js
import { NextResponse } from 'next/server';
import { getRecordById } from '@/actions/tax';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const result = await getRecordById(id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    const record = result.data;
    
    // Generate HTML content
    const htmlContent = generateCertificateContent(record, id);
    
    // Create a simple HTML page with auto-download and print
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Tax Clearance Certificate</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 50px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            max-width: 600px;
            margin: 0 auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          .instructions {
            background: #e8f4fc;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
          }
          .button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            text-decoration: none;
            display: inline-block;
          }
          .button:hover {
            background: #45a049;
          }
          .button.print {
            background: #2196F3;
          }
          .button.print:hover {
            background: #0b7dda;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📄 Tax Clearance Certificate</h1>
          <p>Your certificate is ready to download and print.</p>
          
          <div class="instructions">
            <strong>How to get your PDF:</strong>
            <ol>
              <li>Click "View Certificate" below</li>
              <li>When the certificate opens, press <strong>Ctrl+P</strong> (Windows) or <strong>Cmd+P</strong> (Mac)</li>
              <li>In the print dialog, select <strong>"Save as PDF"</strong></li>
              <li>Click "Save" to download your PDF</li>
            </ol>
          </div>
          
          <div style="margin: 30px 0;">
            <a href="data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}" 
               download="TCC_${record.tin || id}.html" 
               class="button">
              📥 Download HTML File
            </a>
            
            <button onclick="openCertificate()" class="button print">
              👁️ View & Print Certificate
            </button>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> The certificate will open in a new window/tab for printing.
          </p>
        </div>
        
        <script>
          function openCertificate() {
            const htmlContent = \`${htmlContent.replace(/`/g, '\\`')}\`;
            const newWindow = window.open();
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            
            // Auto-print after 1 second
            setTimeout(() => {
              newWindow.print();
            }, 1000);
          }
          
          // Auto-open certificate after 2 seconds
          setTimeout(() => {
            openCertificate();
          }, 2000);
        </script>
      </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}

function generateCertificateContent(record, id) {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatExpiryDate = (dateStr) => {
    if (!dateStr) return 'Wednesday, December 31, 2025';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Wednesday, December 31, 2025';
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Wednesday, December 31, 2025';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₦ 0.00';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const sortedIncomeData = record?.totalIncome?.sort((a, b) => a.year - b.year) || [];
  const displayYears = sortedIncomeData.length >= 3 ? sortedIncomeData.slice(-3) : sortedIncomeData;

  const getIncomeForYear = (year) => {
    const item = sortedIncomeData.find((item) => item.year === year);
    if (!item) return '₦ 0.00';
    if (item.incomeFormatted && item.incomeFormatted !== '₦0.00') {
      return item.incomeFormatted;
    }
    if (item.income !== undefined && item.income !== null) {
      return formatCurrency(item.income);
    }
    return '₦ 0.00';
  };

  const getTaxPaidForYear = (year) => {
    const item = sortedIncomeData.find((item) => item.year === year);
    if (!item) return '₦ 0.00';
    if (item.taxPaidFormatted && item.taxPaidFormatted !== '₦0.00') {
      return item.taxPaidFormatted;
    }
    if (item.taxPaid !== undefined && item.taxPaid !== null) {
      return formatCurrency(item.taxPaid);
    }
    return '₦ 0.00';
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yirs.netlify.app';
  const qrValue = `${baseUrl}/verify-TCC/${id}`;

  // Generate table rows
  const yearHeaders = displayYears.map(item => `<th style="border: 2px solid #9ca3af; padding: 8px 16px; color: #1f2937; font-weight: 600;">${item.year}</th>`).join('');
  const emptyYearHeaders = displayYears.length < 3 
    ? Array(3 - displayYears.length).fill('<th style="border: 2px solid #9ca3af; padding: 8px 16px; color: #1f2937; font-weight: 600;">N/A</th>').join('')
    : '';

  const incomeCells = displayYears.map(item => `<td style="border: 2px solid #9ca3af; padding: 8px 16px; color: #374151; text-align: center; font-weight: 600;">${getIncomeForYear(item.year)}</td>`).join('');
  const emptyIncomeCells = displayYears.length < 3
    ? Array(3 - displayYears.length).fill('<td style="border: 2px solid #9ca3af; padding: 8px 16px; color: #374151; text-align: center; font-weight: 600;">₦ 0.00</td>').join('')
    : '';

  const taxCells = displayYears.map(item => `<td style="border: 2px solid #9ca3af; padding: 8px 16px; color: #374151; text-align: center; font-weight: 600;">${getTaxPaidForYear(item.year)}</td>`).join('');
  const emptyTaxCells = displayYears.length < 3
    ? Array(3 - displayYears.length).fill('<td style="border: 2px solid #9ca3af; padding: 8px 16px; color: #374151; text-align: center;">₦ 0.00</td>').join('')
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Tax Clearance Certificate - ${record.tin || id}</title>
      <style>
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          a { color: inherit; text-decoration: none; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif;
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 0;
        }
        .container {
          width: 100%;
          height: 100%;
          background: white;
          position: relative;
        }
        .watermark {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='12'><text x='0' y='10' font-size='10' font-weight='bold' fill='rgba(0,0,0,0.03)'>yirs</text></svg>");
          background-repeat: repeat;
          background-size: 30px 12px;
        }
        .certificate {
          border: 8px solid #7f1d1d;
          padding: 15mm;
          position: relative;
          z-index: 10;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .center-section {
          flex: 1;
          text-align: center;
          margin-top: 15px;
        }
        .title-section {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: -30px 0 -8px 0;
        }
        .title-line {
          flex: 1;
          border-top: 8px double #f87171;
        }
        .title-text {
          margin: 0 16px;
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          white-space: nowrap;
        }
        .tin-section {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 30px;
        }
        .main-content {
          text-align: center;
          margin-top: 40px;
          flex: 1;
        }
        table {
          width: 100%;
          max-width: 500px;
          border-collapse: collapse;
          margin: 0 auto 25px auto;
          border: 2px solid #9ca3af;
        }
        th, td {
          border: 2px solid #9ca3af;
          padding: 8px 12px;
          text-align: center;
        }
        .footer-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 30px;
          margin-top: auto;
          margin-bottom: 20px;
        }
        .qr-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .expiry-section {
          flex: 1;
          text-align: center;
          margin-right: 30px;
        }
        .signature-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .print-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #2196F3;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          cursor: pointer;
          z-index: 1000;
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">🖨️ Print as PDF</button>
      
      <div class="container">
        <div class="watermark"></div>
        <div class="certificate">
          <div class="header">
            <div class="logo-section">
              <p style="font-size: 14px; font-weight: 600; color: #1f2937;">REV.15A</p>
              <img src="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg" alt="YIRS Logo" style="width: 120px; height: auto;" />
            </div>
            <div class="center-section">
              <h1 style="font-size: 24px; font-weight: bold; color: #1f2937;">YOBE STATE GOVERNMENT</h1>
              <h2 style="font-size: 18px; font-weight: 600; color: #374151; margin-top: -6px;">INTERNAL REVENUE SERVICE</h2>
              <p style="font-size: 12px; color: #4b5563; margin-top: 6px;">
                Revenue House, Ahmadu Bello Way<br/>
                Damaturu Yobe State
              </p>
              <p style="font-size: 12px; color: #4b5563; margin-top: 3px;">
                Website: <a href="https://irs.yb.gov.ng" style="color: #2563eb; text-decoration: underline;">https://irs.yb.gov.ng</a>
                Email: <a href="mailto:info@irs.yb.gov.ng" style="color: #2563eb; text-decoration: underline;">info@irs.yb.gov.ng</a>
              </p>
            </div>
            <div style="text-align: right; font-size: 14px;">
              <p style="font-weight: 600; color: #1f2937;">Original</p>
            </div>
          </div>

          <div class="title-section">
            <div class="title-line"></div>
            <h3 class="title-text">e-TAX CLEARANCE CERTIFICATE</h3>
            <div class="title-line"></div>
          </div>

          <div class="tin-section">
            <div style="color: #374151;">
              <p><span>TIN:</span> ${record.tin || 'N/A'}</p>
              <p style="margin-top: 4px;"><span>Certificate No:</span> ${record.certificateNo || record.certificateNumber || record.id || 'N/A'}</p>
            </div>
            <div style="text-align: right; color: #374151;">
              <p><span>ISSUE DATE:</span></p>
              <p>${formatDate(record.issueDate || new Date().toISOString())}</p>
            </div>
          </div>

          <div class="main-content">
            <p style="color: #374151; margin-bottom: 12px;">This is to certify that:</p>
            <h2 style="font-size: 20px; font-weight: bold; color: #1f2937; text-decoration: underline; margin-bottom: 12px; font-style: italic;">
              ${record.name || 'N/A'}
            </h2>
            <p style="color: #374151; margin-bottom: 6px;">Of:</p>
            <p style="color: #374151; font-weight: 600; margin-bottom: 12px;">
              ${record.address || 'N/A'}
            </p>
            <p style="color: #374151; margin-bottom: 20px;">
              Has settled his/her income tax assessments for the past three years.
            </p>
            <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 20px;">
              Assessment Details as Follows:
            </h3>
          </div>

          <table>
            <thead>
              <tr>
                <th style="border: 2px solid #9ca3af; padding: 8px 16px; color: #1f2937; font-weight: 600;">Year</th>
                ${yearHeaders}
                ${emptyYearHeaders}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 2px solid #9ca3af; padding: 8px 16px; color: #374151; font-weight: 600; text-align: left;">Total Income:</td>
                ${incomeCells}
                ${emptyIncomeCells}
              </tr>
              <tr>
                <td style="border: 2px solid #9ca3af; padding: 8px 16px; color: #374151; font-weight: 600; text-align: left;">Tax Paid:</td>
                ${taxCells}
                ${emptyTaxCells}
              </tr>
            </tbody>
          </table>

          <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="color: #374151; font-size: 18px; margin-bottom: 6px;">Source(s) of Income</h3>
            <div style="color: #374151; font-weight: bold; font-size: 13px; text-transform: uppercase;">
              ${record.sourceOfIncome || 'N/A'}
            </div>
          </div>

          <div class="footer-section">
            <div class="qr-section">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrValue)}" alt="QR Code" style="width: 100px; height: 100px; background: white; padding: 5px; margin-bottom: 8px;" />
              <p style="font-size: 11px; color: #4b5563; text-align: center;">Please scan this QR code</p>
            </div>
            <div class="expiry-section">
              <p style="color: #374151; font-size: 16px; margin-bottom: 6px;">This Certificate expires on</p>
              <p style="color: #374151; font-weight: 600;">${formatExpiryDate(record.expiryDate)}</p>
            </div>
            <div style="width: 80px;"></div>
          </div>

          <div class="signature-section">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
              <div style="width: 80px; height: 50px; display: flex; align-items: center; justify-content: center;">
                <img src="https://res.cloudinary.com/djr7uqara/image/upload/v1768252957/gana67i87nyccquinbgj.png" alt="Signature" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <div style="text-align: center;">
                <p style="color: #1f2937; font-weight: bold; font-size: 12px;">Executive Chairman</p>
                <p style="color: #1f2937; font-weight: bold; font-size: 12px;">YOBE STATE IRS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        // Auto-print after 1 second
        setTimeout(() => {
          window.print();
        }, 1000);
        
        // Close after print if opened in a new window
        if (window.opener) {
          window.onafterprint = function() {
            setTimeout(() => {
              window.close();
            }, 500);
          };
        }
      </script>
    </body>
    </html>
  `;
}