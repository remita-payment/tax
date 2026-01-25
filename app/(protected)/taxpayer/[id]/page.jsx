"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRecordById } from "@/actions/tax";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function TaxCertificate() {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cloudinary logo URL
  const yirsLogoUrl =
    "https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg";

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const result = await getRecordById(id);

        console.log("API Result:", result);

        if (result.success) {
          setRecord(result.data);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Error fetching record:", error);
        toast.error("Failed to load certificate data");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecord();
    }
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatExpiryDate = (dateStr) => {
    if (!dateStr) return "Wednesday, December 31, 2025";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Wednesday, December 31, 2025";
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Wednesday, December 31, 2025";
    }
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₦ 0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Sort totalIncome by year in ascending order (smallest first)
  const sortedIncomeData =
    record?.totalIncome?.sort((a, b) => a.year - b.year) || [];

  // Log the income data for debugging
  useEffect(() => {
    if (record?.totalIncome) {
    }
  }, [record]);

  // Get the three most recent years if available, otherwise use whatever is available
  const displayYears =
    sortedIncomeData.length >= 3
      ? sortedIncomeData.slice(-3)
      : sortedIncomeData;

  // Function to get income for a specific year with fallback
  const getIncomeForYear = (year) => {
    const item = sortedIncomeData.find((item) => item.year === year);

    if (!item) return "₦ 0.00";

    // Try formatted value first
    if (item.incomeFormatted && item.incomeFormatted !== "₦0.00") {
      return item.incomeFormatted;
    }

    // Try raw income value
    if (item.income !== undefined && item.income !== null) {
      return formatCurrency(item.income);
    }

    return "₦ 0.00";
  };

  // Function to get tax paid for a specific year with fallback
  const getTaxPaidForYear = (year) => {
    const item = sortedIncomeData.find((item) => item.year === year);

    if (!item) return "₦ 0.00";

    // Try formatted value first
    if (item.taxPaidFormatted && item.taxPaidFormatted !== "₦0.00") {
      return item.taxPaidFormatted;
    }

    // Try raw tax paid value
    if (item.taxPaid !== undefined && item.taxPaid !== null) {
      return formatCurrency(item.taxPaid);
    }

    return "₦ 0.00";
  };

  // Get sources of income from record
  const getSourcesOfIncome = () => {
    if (record?.sourceOfIncome) return record.sourceOfIncome;
    return "N/A";
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Tax Clearance Certificate</h1>
          <p className="text-muted-foreground">Taxpayer record not found</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-lg">No certificate data available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate QR code value
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yirs.netlify.app";
  const qrValue = `${baseUrl}/verify-TCC/${id}`;

  return (
    <div className="mx-auto">
      {/* Certificate Design */}
      <div className="min-h-screen py-8 px-4 flex items-center justify-center bg-white">
        <div className="w-full max-w-4xl bg-white relative">
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='24'><text x='0' y='18' font-size='12' font-weight='bold' fill='rgba(0,0,0,0.045)'>yirs yirs</text></svg>")`,
              backgroundRepeat: "repeat",
              backgroundSize: "60px 24px",
            }}
          ></div>

          <div className="pt-6 pr-6 pl-6 pb-6 z-10 border-8 border-red-900 relative">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-semibold text-gray-800">REV.15A</p>
                <div className="w-30 h-30">
                  {/* Cloudinary Image */}
                  <img
                    src={yirsLogoUrl}
                    alt="YIRS Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Logo and Center Section */}
              <div className="flex-1 flex flex-col items-center justify-center mt-6">
                <h1 className="text-3xl font-bold text-gray-800 text-center">
                  YOBE STATE GOVERNMENT
                </h1>
                <h2 className="text-xl font-semibold text-gray-700 text-center -mt-2">
                  INTERNAL REVENUE SERVICE
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  Revenue House, Ahmadu Bello Way
                  <br className="-mt-2" />
                  Damaturu Yobe State
                </p>
                <p className="text-sm text-gray-600 text-center -mt-1">
                  Website:{" "}
                  <a
                    href="https://irs.yb.gov.ng"
                    className="text-blue-600 underline"
                  >
                    https://irs.yb.gov.ng
                  </a>{" "}
                  Email:{" "}
                  <a
                    href="mailto:info@irs.yb.gov.ng"
                    className="text-blue-600 underline"
                  >
                    info@irs.yb.gov.ng
                  </a>
                </p>
              </div>

              {/* Right Section - Original */}
              <div className="text-right text-sm">
                <p className="font-semibold text-gray-800">Original</p>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="-mb-2 flex items-center justify-center w-full -mt-10">
              {/* Left horizontal double line */}
              <div className="flex-1 border-t-8 border-double border-red-400"></div>

              {/* Title text */}
              <h3 className="mx-4 text-lg font-bold text-gray-800 whitespace-nowrap">
                e-TAX CLEARANCE CERTIFICATE
              </h3>

              {/* Right horizontal double line */}
              <div className="flex-1 border-t-8 border-double border-red-400"></div>
            </div>

            {/* TIN and Issue Date */}
            <div className="flex justify-between text-sm mb-10">
              <div>
                <p className="text-gray-700">
                  <span>TIN:</span> {record.tin || "N/A"}
                </p>
                <p className="text-gray-700 mt-1">
                  <span>Certificate No:</span>{" "}
                  {record.certificateNo ||
                    record.certificateNumber ||
                    record.id ||
                    "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-700">
                  <span>ISSUE DATE:</span>
                </p>
                <p className="text-gray-700">
                  {formatDate(record.issueDate || new Date().toISOString())}
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="text-center mt-20">
              <p className="text-gray-700 mb-4">This is to certify that:</p>

              <h2 className="text-2xl font-bold text-gray-800 underline mb-4 italic">
                {record.name || "N/A"}
              </h2>

              <p className="text-gray-700 mb-2">Of:</p>
              <p className="text-gray-700 font-semibold mb-4">
                {record.address || "N/A"}
              </p>

              <p className="text-gray-700 mb-6">
                Has settled his/her income tax assessments for the past three
                years.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mb-6">
                Assessment Details as Follows:
              </h3>
            </div>

            {/* Table */}
            <div className="mb-8 overflow-x-auto">
              <table className="w-full border-collapse border-2 border-gray-400 mx-auto max-w-2xl">
                <thead>
                  <tr className="border-2 border-gray-400">
                    <th className="border-2 border-gray-400 px-4 py-2 text-gray-800 font-semibold">
                      Year
                    </th>
                    {displayYears.map((item) => (
                      <th
                        key={item.year}
                        className="border-2 border-gray-400 px-4 py-2 text-gray-800 font-semibold"
                      >
                        {item.year}
                      </th>
                    ))}
                    {/* Fill remaining columns if less than 3 years */}
                    {displayYears.length < 3 &&
                      Array.from({ length: 3 - displayYears.length }).map(
                        (_, index) => (
                          <th
                            key={`empty-${index}`}
                            className="border-2 border-gray-400 px-4 py-2 text-gray-800 font-semibold"
                          >
                            N/A
                          </th>
                        )
                      )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-2 border-gray-400">
                    <td className="border-2 border-gray-400 px-4 py-2 text-gray-700 font-semibold text-left">
                      Total Income:
                    </td>
                    {displayYears.map((item) => (
                      <td
                        key={`income-${item.year}`}
                        className="border-2 border-gray-400 px-4 py-2 text-gray-700 text-center font-semibold"
                      >
                        {getIncomeForYear(item.year)}
                      </td>
                    ))}
                    {/* Fill remaining cells if less than 3 years */}
                    {displayYears.length < 3 &&
                      Array.from({ length: 3 - displayYears.length }).map(
                        (_, index) => (
                          <td
                            key={`income-empty-${index}`}
                            className="border-2 border-gray-400 px-4 py-2 text-gray-700 text-center font-semibold"
                          >
                            ₦ 0.00
                          </td>
                        )
                      )}
                  </tr>
                  <tr className="border-2 border-gray-400">
                    <td className="border-2 border-gray-400 px-4 py-2 text-gray-700 font-semibold text-left">
                      Tax Paid:
                    </td>
                    {displayYears.map((item) => (
                      <td
                        key={`tax-${item.year}`}
                        className="border-2 border-gray-400 px-4 py-2 text-gray-700 text-center font-semibold"
                      >
                        {getTaxPaidForYear(item.year)}
                      </td>
                    ))}
                    {/* Fill remaining cells if less than 3 years */}
                    {displayYears.length < 3 &&
                      Array.from({ length: 3 - displayYears.length }).map(
                        (_, index) => (
                          <td
                            key={`tax-empty-${index}`}
                            className="border-2 border-gray-400 px-4 py-2 text-gray-700 text-center"
                          >
                            ₦ 0.00
                          </td>
                        )
                      )}
                  </tr>
                </tbody>
              </table>

              {/* Show message if no income data */}
              {sortedIncomeData.length === 0 && (
                <div className="text-center mt-4 text-gray-600">
                  No assessment data available
                </div>
              )}
            </div>

            {/* Source of Income */}
            <div className="text-center mb-8">
              <h3 className="text-gray-700 text-xl mb-2">
                Source(s) of Income
              </h3>
              <div className="text-gray-700 font-bold text-sm uppercase">
                {getSourcesOfIncome()}
              </div>
            </div>

            {/* Footer Section */}
            {/* Top row: QR code left, expiration center */}
            <div className="flex justify-between items-start gap-8 mb-12">
              {/* QR Code - lifted up */}
              <div className="flex flex-col items-center mt-2">
                <div className="bg-white p-2 mb-2">
                  <QRCodeSVG
                    value={qrValue}
                    size={120}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs text-gray-600 text-center">
                  Please scan this QR code
                </p>
              </div>

              {/* Expiration - centered */}
              <div className="flex-1 text-center mr-10">
                <p className="text-gray-700 text-xl  mb-2">
                  This Certificate expires on
                </p>
                <p className="text-gray-700 font-semibold">
                  {formatExpiryDate(record.expiryDate)}
                </p>
              </div>

              {/* Empty space on right for alignment */}
              <div className="w-24"></div>
            </div>

            {/* Bottom row: Executive Chairman on right near border */}
            <div className="flex justify-end -mt-20">
              <div className="flex flex-col items-center gap-2">
                <div className="w-24 h-16 flex items-center justify-center">
                  {/* Signature image placeholder */}
                  {/* Cloudinary Image */}
                  <img
                    src={
                      "https://res.cloudinary.com/djr7uqara/image/upload/v1768252957/gana67i87nyccquinbgj.png"
                    }
                    alt="YIRS Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-bold text-sm">
                    Executive Chairman
                  </p>
                  <p className="text-gray-800 font-bold text-sm">
                    YOBE STATE IRS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
