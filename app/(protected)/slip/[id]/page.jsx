"use client";

import { QRCodeSVG } from "qrcode.react";
import { useRef, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRecordById } from "@/actions/tax";

export default function PayYobePage() {
  const qrRef = useRef(null);
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch record data
  useEffect(() => {
    async function fetchRecord() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getRecordById(id);
        if (result.success) {
          setRecord(result.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecord();
  }, [id]);

  // Format date function for printing with line breaks
  const formatDateForPrint = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();

      // Return an object with separated parts for printing
      return {
        day: day,
        month: month,
        year: year.toString(),
        full: `${day}-${month}-${year}`,
      };
    } catch (error) {
      return { day: "N/A", month: "N/A", year: "N/A", full: "N/A" };
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Split name into parts for printing
  const splitNameForPrint = (name) => {
    if (!name) return ["N/A"];
    // Split by space or common separators
    return name.split(/[\s,]+/).filter((part) => part.trim() !== "");
  };

  // Get formatted date
  const formattedDate = formatDateForPrint(
    record?.issueDate || record?.paymentDate || record?.createdAt,
  );
  const nameParts = splitNameForPrint(record?.name);

  // Skeleton Loader
  if (loading) {
    return (
      <main className="py-0 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="w-full mx-auto bg-grey-300 p-4 sm:p-5 md:p-6 print:p-10 print:scale-110 print:max-w-none print:-px-2 print:-mx-4">
          {/* Loading skeleton similar to invoice structure */}
          <div className="animate-pulse">
            <header className="mb-5 md:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-5">
                <div className="w-full sm:w-2/5 flex flex-col items-center mb-4 sm:mb-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-300 mb-2"></div>
                  <div className="h-4 bg-gray-300 w-48 mb-2"></div>
                  <div className="h-3 bg-gray-300 w-64 mb-1"></div>
                </div>
              </div>
            </header>
            <div className="h-8 bg-gray-300 mb-4"></div>
            <div className="h-64 bg-gray-300 mb-4"></div>
          </div>
        </div>
      </main>
    );
  }

  // Show error if no record found
  if (!record) {
    return (
      <main className="py-0 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="w-full mx-auto bg-grey-300 p-4 sm:p-5 md:p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Invoice Not Found
            </h2>
            <p className="text-gray-600">
              Unable to load invoice data for ID: {id}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-0 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="w-full mx-auto bg-grey-300 p-4 sm:p-5 md:p-6 print:p-10 print:scale-110 print:max-w-none print:-px-2 print:-mx-4">
        {/* HEADER SECTION */}
        <header className="mb-5 md:mb-6">
          {/* Invoice Title at Top on Mobile */}
          <div className="text-center mb-4 sm:hidden">
            <h1 className="text-lg font-bold text-[#d97c58]">INVOICE</h1>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 md:mb-5">
            {/* Left side - Logo and Organization Info */}
            <div className="w-full sm:w-2/5 flex flex-col items-center mb-4 sm:mb-0 print:w-2/5 print:flex print:flex-col print:items-center print:mx-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center mb-2 print:w-20 print:h-20 print:mb-3">
                <img
                  src="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"
                  alt="Yobe State Internal Revenue Service Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-center print:text-center print:w-full">
                <h2 className="text-sm sm:text-base font-bold text-black mb-1 print:text-lg print:mb-2">
                  YOBE STATE INTERNAL REVENUE SERVICE
                </h2>
                <p className="text-xs text-black mb-1 leading-tight print:text-sm print:mb-2">
                  <span className="font-semibold print:font-bold">
                    Address:
                  </span>{" "}
                  Revenue House, Ahmadu Bello Way, Damaturu. Yobe State, Zip
                  Code: 620251.
                </p>
                <p className="text-xs text-black print:text-sm">
                  <span className="font-semibold print:font-bold">Email:</span>{" "}
                  contact@irs.yb.gov.ng
                </p>
              </div>
            </div>

            {/* Invoice Title - Hidden on mobile, shown on larger screens */}
            <div className="hidden sm:block text-center sm:text-right w-full sm:w-auto">
              <h1 className="text-lg font-bold text-[#d97c58] print:text-xl">
                INVOICE
              </h1>
            </div>
          </div>

          {/* Invoice Details - Dynamic Data */}
          <div className="flex flex-col sm:flex-row justify-between items-start text-sm mb-4 md:mb-5 print:flex-row print:justify-between print:text-base print:mb-6">
            {/* Name - Left aligned, allow multiple lines */}
            <div className="w-full sm:w-auto mb-3 sm:mb-0 text-left print:text-left print:w-1/3">
              <p className="text-[#d97c58] font-semibold break-words whitespace-normal print:text-lg">
                NAME :
                {/* Regular display (shown on screen, hidden when printing) */}
                <span className="inline print:hidden">
                  {" "}
                  {record.name || "N/A"}
                </span>
                {/* Print display with line breaks (hidden on screen, shown when printing) */}
                <span className="hidden print:inline">
                  {nameParts.map((part, index) => (
                    <span key={index} className="block">
                      {part}
                    </span>
                  ))}
                </span>
              </p>
            </div>

            {/* Invoice Number - Center aligned on medium+ screens, left on small */}
            <div className="w-full sm:w-auto mb-3 sm:mb-0 sm:text-center print:text-center print:w-1/3">
              <p className="text-[#d97c58] font-semibold print:text-lg">
                INVOICE NO :
              </p>
              <p className="text-[#d97c58] font-bold break-words print:text-lg">
                {record.idBatch || "N/A"}
              </p>
            </div>

            {/* Date - Right aligned on medium+ screens, left on small, allow multiple lines */}
            <div className="w-full sm:w-auto text-left sm:text-right print:text-right print:w-1/3">
              <p className="text-black font-semibold print:text-md">
                DATE :
                {/* Regular display (shown on screen, hidden when printing) */}
                <span className="inline print:hidden">
                  {" "}
                  {formattedDate.full}
                </span>
                {/* Print display with line breaks (hidden on screen, shown when printing) */}
                <span className="hidden print:inline">
                  <span className="">{formattedDate.day}-</span>
                  <span className="block">
                    {formattedDate.month}-{formattedDate.year}
                  </span>
                </span>
              </p>
            </div>
          </div>
        </header>

        {/* ITEMS TABLE */}
        <section className="mb-4 md:mb-5 print:mb-6">
          <table className="w-full border-collapse mb-3 print:mb-4">
            <thead>
              <tr className="bg-[#d97c58] text-black">
                <th className="px-3 py-2 text-left font-semibold text-sm print:px-4 print:py-3 print:text-lg">
                  ITEM
                </th>
                <th className="px-3 py-2 text-left font-semibold text-sm print:px-4 print:py-3 print:text-lg">
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="px-3 py-2 text-black text-sm print:px-4 print:py-3 print:text-lg w-[70%]">
                  {record.revenue || record.paymentType || "Presumptive Tax"}
                </td>
                <td className="px-3 py-2 text-left font-semibold text-black text-sm print:px-4 print:py-3 print:text-lg w-[30%]">
                  {formatCurrency(record.amount)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* PAYMENT METHOD */}
        <section className="bg-yellow-50 px-3 py-2 mb-4 md:mb-5 print:px-4 print:py-3 print:mb-6">
          <h3 className="font-bold text-black text-sm print:text-lg">
            PAYMENT METHOD
          </h3>
        </section>

        {/* PAYMENT DETAILS & SUMMARY */}
        <section className="flex flex-col sm:flex-row gap-4 mb-5 md:mb-6 print:flex-row print:gap-8 print:mb-8">
          {/* Payment Details - Left */}
          <div className="flex-1 mb-3 sm:mb-0 print:mb-0">
            <p className="text-black mb-1 text-sm print:text-base print:mb-2">
              <span className="font-semibold print:font-bold">Remita</span>
            </p>
            <p className="text-black text-sm print:text-base">
              <span className="font-semibold print:font-bold">RRR :</span>{" "}
              {record.reference || "N/A"}
            </p>
          </div>

          {/* Summary - Right */}
          <div className="flex-1">
            <table className="w-full border-collapse">
              <tbody>
                <tr className="">
                  <td className="px-2 py-1 text-right text-black font-semibold text-sm print:px-4 print:py-1 print:text-lg w-[70%]">
                    SUBTOTAL
                  </td>
                  <td className="px-2 py-1 text-right text-black font-semibold text-sm print:px-4 print:py-1 print:text-lg w-[30%]">
                    {formatCurrency(record.amount)}
                  </td>
                </tr>
                <tr className="">
                  <td className="px-2 py-1 text-right text-black font-semibold text-sm print:px-4 print:py-1 print:text-lg w-[70%]">
                    DISCOUNT
                  </td>
                  <td className="px-2 py-1 text-right text-black text-sm print:px-4 print:py-1 print:text-lg w-[30%]">
                    0.00
                  </td>
                </tr>
                <tr className="">
                  <td className="px-2 py-1 text-right text-black font-semibold text-sm print:px-4 print:py-1 print:text-lg w-[70%]">
                    Tax
                  </td>
                  <td className="px-2 py-1 text-right text-black text-sm print:px-4 print:py-1 print:text-lg w-[30%]">
                    0.00
                  </td>
                </tr>
                {/* TOTAL row with gradient background starting at 40% */}
                <tr className="text-black bg-gradient-to-r from-transparent from-[60%] to-[#d97c58] to-[60%]">
                  <td className="px-2 py-1.5 text-right font-bold text-base print:px-4 print:py-2 print:text-xl w-[70%]">
                    TOTAL
                  </td>
                  <td className="px-2 py-1.5 text-right font-bold text-base print:px-4 print:py-2 print:text-xl w-[30%]">
                    {formatCurrency(record.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="flex flex-col sm:flex-row justify-between items-start pt-5 md:pt-6 print:flex-row print:justify-between print:pt-8">
          {/* Left Side - Thank You */}
          <div className="flex items-start mb-4 sm:mb-0 print:mb-0">
            <p className="text-black text-base mt-0 print:text-xl">
              Thank you!
            </p>
          </div>

          {/* Right Side - Signature and QR Code */}
          <div className="flex flex-col sm:flex-row items-start gap-4 print:flex-row print:items-start print:gap-8">
            {/* Signature */}
            <div className="flex flex-col items-end sm:items-end print:items-end">
              <div className="w-32 sm:w-40 border-t-1 border-black mb-1 print:w-48 print:border-t-1 print:mb-2"></div>
              <p className="text-black font-semibold text-sm print:text-lg">
                Authorized Signed
              </p>
            </div>

            {/* QR Code */}
            <div
              ref={qrRef}
              className="relative inline-block self-center sm:self-start print:self-start"
            >
              <QRCodeSVG
                value={`${process.env.NEXTAUTH_URL || "https://yirs.netlify.app"}/payyobe/${record.id}`}
                size={120}
                level="H"
                includeMargin={true}
                fgColor="#000000"
                bgColor="#ffffff"
                className="print:scale-160"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center shadow-sm print:w-8 print:h-8">
                  <img
                    src="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"
                    alt="YIRS Logo"
                    className="w-4 h-4 object-contain rounded-sm print:w-4 print:h-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
