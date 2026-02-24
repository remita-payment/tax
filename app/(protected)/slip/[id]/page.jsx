"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { getRecordById } from "@/actions/tax";
import { useParams } from "next/navigation";

export default function PayYobeInvoice() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₦0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const generateQRData = () => {
    const BASE_URL = process.env.NEXTAUTH_URL || "https://yirs.netlify.app";
    if (!record) return "";
    return `${BASE_URL}/payyobe/${record.id}`;
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen" style={{ backgroundColor: "rgba(245, 222, 179, 0.13)" }}>
        <div className="w-full sm:w-[98%] mx-auto bg-white p-8 animate-pulse">
          <div className="h-20 bg-gray-200 mb-4"></div>
          <div className="h-40 bg-gray-200"></div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="w-full min-h-screen" style={{ backgroundColor: "rgba(245, 222, 179, 0.13)" }}>
        <div className="w-full sm:w-[98%] mx-auto bg-white p-8">
          <div className="text-center py-8">
            <h2 className="text-xl font-bold mb-2">Invoice Not Found</h2>
            <p>Unable to load invoice data for ID: {id}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen" style={{ backgroundColor: "rgba(245, 222, 179, 0.13)" }}>
      <div className="w-full sm:w-[98%] mx-auto bg-white p-4 sm:p-6">
        
        {/* Header: Logo on left, INVOICE on right */}
        <div className="flex justify-between items-start mb-6">
          {/* Left side - Logo and Organization */}
          <div className="flex-1">
            <img
              src="https://payyobe.com/New/assets/img/favicons/favicon.png"
              alt="YIRS Logo"
              className="w-24 h-24 sm:w-32 sm:h-32 mb-2"
            />
            <h2 className="font-bold text-base sm:text-lg mb-1">
              YOBE STATE INTERNAL REVENUE SERVICE
            </h2>
            <p className="text-xs sm:text-sm mb-1">
              <strong>Address:</strong> Revenue House, Ahmadu Bello Way, Damaturu. Yobe State, Zip Code: 620251.
            </p>
            <p className="text-xs sm:text-sm">
              <strong>Email:</strong> contact@irs.yb.gov.ng
            </p>
          </div>

          {/* Right side - INVOICE title */}
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ color: "#D14917" }}>
              INVOICE
            </h1>
          </div>
        </div>

        {/* Three columns: NAME, INVOICE NO, DATE */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" style={{ color: "#D14917" }}>
          <div>
            <h3 className="font-bold text-sm sm:text-base">
              NAME : {record.name || "NGURU MEDICAL CLINIC"}
            </h3>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">
              INVOICE NO :<br />
              {record.idBatch || record.reference || "639046670149112820"}
            </h3>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">
              DATE : {formatDate(record.issueDate || record.paymentDate || record.createdAt)}
            </h3>
          </div>
        </div>

        {/* Table */}
        <table className="w-full mb-6">
          <thead>
            <tr style={{ backgroundColor: "#C85733" }}>
              <th className="text-left py-2 px-4 text-white font-bold">ITEM</th>
              <th className="text-left py-2 px-4 text-white font-bold">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 px-4 text-sm sm:text-base">
                {record.revenue || record.paymentType || "Presumptive Tax"}
              </td>
              <td className="py-3 px-4 font-bold text-sm sm:text-base">
                {formatCurrency(record.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment Method */}
        <div className="mb-6">
          <h5 
            className="py-2 px-4 font-bold text-base sm:text-lg mb-4"
            style={{ backgroundColor: "rgba(245, 222, 179, 0.43)" }}
          >
            PAYMENT METHOD
          </h5>

          <div className="flex flex-col lg:flex-row justify-between gap-6">
            {/* Left - Payment details */}
            <div className="px-4">
              <p className="text-sm sm:text-base mb-1">
                {record.platform || "Remita"}
              </p>
              <p className="text-sm sm:text-base">
                RRR : {record.reference || "221419872279"}
              </p>
            </div>

            {/* Right - Summary table */}
            <div className="lg:w-[450px]">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="text-right py-2 px-4 font-bold">SUBTOTAL</td>
                    <td className="text-right py-2 px-4 font-bold">{formatCurrency(record.amount)}</td>
                  </tr>
                  <tr>
                    <td className="text-right py-2 px-4 font-bold">DISCOUNT</td>
                    <td className="text-right py-2 px-4">0.00</td>
                  </tr>
                  <tr>
                    <td className="text-right py-2 px-4 font-bold">Tax</td>
                    <td className="text-right py-2 px-4">0.00</td>
                  </tr>
                  <tr style={{ backgroundColor: "#C85733" }}>
                    <td className="text-right py-2 px-4 font-bold text-white text-lg">TOTAL</td>
                    <td className="text-right py-2 px-4 font-bold text-white text-lg">
                      {formatCurrency(record.amount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer: Thank you, QR Code, Signature */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-8">
          <div>
            <p className="text-base font-semibold">Thank you!</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Signature line */}
            <div className="text-center">
              <div className="w-48 border-t-2 mb-2" style={{ borderColor: "#D14917" }}></div>
              <p className="text-sm">Authorized Signed</p>
            </div>

            {/* QR Code */}
            <div className="relative">
              <QRCodeSVG
                value={generateQRData()}
                size={120}
                level="H"
                includeMargin={true}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <img
                    src="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"
                    alt="Logo"
                    className="w-5 h-5 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}