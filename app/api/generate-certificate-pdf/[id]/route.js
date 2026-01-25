// app/api/generate-certificate-pdf/[id]/route.js
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { getRecordById } from '@/actions/tax';

export async function GET(request, { params }) {
  let browser = null;
  let page = null;
  
  try {
    // FIX: await params
    const { id } = await params;

    // Fetch the record data
    const result = await getRecordById(id);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    const record = result.data;

    // Configure Chromium for serverless - SIMPLIFIED VERSION
    try {
      // Always use serverless configuration for Netlify
      const executablePath = await chromium.executablePath();
      
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
      });

      page = await browser.newPage();

      // Set the HTML content
      const html = generateCertificateHTML(record, id);
      
      // Use load instead of domcontentloaded
      await page.setContent(html, {
        waitUntil: 'load',
        timeout: 30000,
      });

      // Wait a bit for images to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF - A4 format with proper margins
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
        preferCSSPageSize: false, // Use PDF page size, not CSS
      });

      // Return PDF as response
      return new NextResponse(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="TCC_${record.tin || id}.pdf"`,
        },
      });
      
    } catch (browserError) {
      console.error('Browser launch error:', browserError);
      
      // IMPORTANT: Throw the error instead of returning HTML
      throw new Error(`PDF generation failed: ${browserError.message}`);
    }
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  } finally {
    // ALWAYS close page and browser, even if there's an error
    try {
      if (page) {
        await page.close();
        console.log('Page closed');
      }
    } catch (pageError) {
      console.error('Error closing page:', pageError);
    }
    
    try {
      if (browser) {
        await browser.close();
        console.log('Browser closed');
      }
    } catch (browserCloseError) {
      console.error('Error closing browser:', browserCloseError);
    }
  }
}
function generateCertificateHTML(record, id) {
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
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          font-family: Arial, sans-serif;
          background: white;
          width: 210mm; /* A4 width */
          min-height: 297mm; /* A4 height */
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
          padding: 15mm; /* Reduced padding for A4 */
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
        @media print {
          body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
          }
          .certificate {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
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
    </body>
    </html>
  `;
}