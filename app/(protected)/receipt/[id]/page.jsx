"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { getRecordById } from "@/actions/tax";
import { useParams } from "next/navigation";

export default function PaymentReceipt() {
  const { id } = useParams();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload background images
  useEffect(() => {
    const images = [
      'https://res.cloudinary.com/djr7uqara/image/upload/v1770838388/f03c2kckuwohpl7jukvy.png',
      'https://res.cloudinary.com/djr7uqara/image/upload/v1770842428/u3k07v93mlhzdtfoyjjy.png',
      'https://res.cloudinary.com/djr7uqara/image/upload/v1770844290/vn2vjx00urhqc4bamo5o.png',
      'https://res.cloudinary.com/djr7uqara/image/upload/v1770845279/fd6e1qilut0ctvbpqrhd.png',
      'https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg'
    ];
    
    let loadedCount = 0;
    
    images.forEach(src => {
      const img = new window.Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === images.length) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount++;
        console.error(`Failed to load image: ${src}`);
        if (loadedCount === images.length) {
          setImagesLoaded(true);
        }
      };
      img.src = src;
    });
  }, []);

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);

      // Get day, month, and year
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();

      // Return in format "03-Jun-2025"
      return `${day}-${month}-${year}`;
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Generate QR data
  const generateQRData = () => {
    const BASE_URL = process.env.NEXTAUTH_URL || "https://yirs.netlify.app";
    if (!record) return "";
    return `${BASE_URL}/taxpayer-doc/${record._id}`;
  };

  // Skeleton Loader
  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white p-6 border-2 border-gray-800 rounded-xl">
            <div className="text-center mb-4 pb-4">
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 bg-gray-300 animate-pulse rounded"></div>
              </div>
              <div className="h-8 w-56 bg-gray-300 animate-pulse rounded mx-auto mb-1"></div>
              <div className="h-6 w-72 bg-gray-300 animate-pulse rounded mx-auto"></div>
            </div>
            <div className="text-center mb-4">
              <div className="h-6 w-64 bg-gray-300 animate-pulse rounded mx-auto"></div>
            </div>
            <div className="mb-6">
              <div className="border-2 border-gray-800 overflow-hidden">
                <div className="grid grid-cols-3">
                  <div className="col-span-2 p-3 space-y-2">
                    {[...Array(10)].map((_, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-24 h-3.5 bg-gray-300 animate-pulse rounded"></div>
                        <div className="flex-1 h-3.5 bg-gray-300 animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>
                  <div className="border-l border-gray-800 p-3 flex items-center justify-center">
                    <div className="w-44 h-44 bg-gray-300 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center mt-6 mb-4">
              <div className="text-center">
                <div className="h-20 flex items-end justify-center mb-1">
                  <div className="h-16 w-40 bg-gray-300 animate-pulse rounded"></div>
                </div>
                <div className="h-4 w-48 bg-gray-300 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show error if no record found
  if (!record) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl bg-white p-6 border-2 border-gray-800">
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-10 h-10 bg-red-200 rounded-full"></div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Receipt Not Found
            </h2>
            <p className="text-gray-600">
              Unable to load receipt data for ID: {id}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-2xl">
        {/* Main receipt container with border and background image */}
        <div
          className="relative overflow-hidden bg-white"
          style={{
            border: "2px solid #1f2937",
          }}
        >
          {/* Background Image using CSS */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url('https://res.cloudinary.com/djr7uqara/image/upload/v1770838388/f03c2kckuwohpl7jukvy.png')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* Content - positioned above the background */}
          <div className="relative z-10 p-6">
            {/* Header */}
            <div className="text-center mb-4 pb-3">
              <div className="flex justify-center mb-2">
                <div className="w-20 h-20 flex items-center justify-center p-1.5 relative">
                  <img
                    src="https://res.cloudinary.com/djr7uqara/image/upload/v1770845279/fd6e1qilut0ctvbpqrhd.png"
                    alt="Yobe State IRS Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-extrabold tracking-wide text-blue-900">
                YOBE STATE
              </h1>
              <p className="text-base font-bold text-blue-900">
                INTERNAL REVENUE SERVICE
              </p>
              <div className="mt-3 text-xs text-gray-700 space-y-1 border-t-2 border-b-2 py-1.5 px-2 border-gray-800">
                <p>
                  Tel: 07065798000 | 08030051026 Email: info@yirs.gov.ng
                  Website: www.yirs.gov.ng
                </p>
              </div>
            </div>

            {/* Receipt Title */}
            <h2 className="text-center text-base font-extrabold tracking-wide mb-4 uppercase text-gray-900">
              OFFICIAL E-PAYMENT RECEIPT
            </h2>

            {/* Combined Table with QR Code */}
            <div className="mb-6">
              <div className="border-2 border-gray-800 overflow-hidden relative bg-white">
                {/* Table background image */}
                <div 
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundImage: `url('https://res.cloudinary.com/djr7uqara/image/upload/v1770842428/u3k07v93mlhzdtfoyjjy.png')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />

                <table className="w-full relative z-10">
                  <tbody>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs w-28 bg-white/40">
                        Payer:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs bg-white/40">
                        {record.name || "N/A"}
                      </td>
                      <td
                        rowSpan={10}
                        className="border-l border-gray-800 p-2 text-center w-56 align-middle bg-white/30"
                      >
                        <div className="flex flex-col items-center justify-center h-full space-y-1">
                          <div className="relative p-1.5 bg-white/90 rounded">
                            <QRCodeSVG
                              value={generateQRData()}
                              size={200}
                              level="M"
                              includeMargin={true}
                              className="w-44 h-44"
                            />
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <img
                                src="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"
                                alt="Logo"
                                className="w-7 h-7 object-contain p-1 bg-white rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        Phone:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs bg-white/40">
                        {record.phoneNo || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        Email:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs break-all bg-white/40">
                        {record.email || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        Reference:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs bg-white/40">
                        {record.reference || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        Revenue:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs bg-white/40">
                        {record.revenue || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        Amount:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs font-medium bg-white/40">
                        {record.amountFormatted || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        Platform:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs bg-white/40">
                        {record.platform || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        Payment Details:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs bg-white/40">
                        {record.revenue || "N/A"}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-800">
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        ID/Batch:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs bg-white/40">
                        {record.idBatch || "N/A"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border-r border-gray-800 px-2.5 py-1.5 font-semibold text-xs bg-white/40">
                        Payment Date:
                      </td>
                      <td className="px-2.5 py-1.5 text-xs bg-white/40">
                        {formatDate(record.issueDate)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with Signature */}
            <div className="flex justify-center mt-4 mb-2">
              <div className="text-center">
                <div 
                  className="h-16 w-40 flex items-end justify-center mb-1 relative overflow-hidden"
                  style={{
                    backgroundImage: `url('https://res.cloudinary.com/djr7uqara/image/upload/v1770844290/vn2vjx00urhqc4bamo5o.png')`,
                    backgroundSize: "contain",
                    backgroundPosition: "center bottom",
                    backgroundRepeat: "no-repeat",
                  }}
                />
                <p className="text-xs font-bold tracking-wide text-gray-800">
                  EXECUTIVE CHAIRMAN
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}