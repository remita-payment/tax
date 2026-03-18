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

  const yirsLogoUrl =
    "https://res.cloudinary.com/djr7uqara/image/upload/v1770845279/fd6e1qilut0ctvbpqrhd.png";

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        setLoading(true);
        const result = await getRecordById(id);

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

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₦ 0.00";
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const sortedIncomeData =
    record?.totalIncome?.sort((a, b) => a.year - b.year) || [];

  const displayYears =
    sortedIncomeData.length >= 3
      ? sortedIncomeData.slice(-3)
      : sortedIncomeData;

  const getIncomeForYear = (year) => {
    const item = sortedIncomeData.find((item) => item.year === year);
    if (!item) return "₦ 0.00";
    if (item.incomeFormatted && item.incomeFormatted !== "₦0.00") {
      return item.incomeFormatted;
    }
    if (item.income !== undefined && item.income !== null) {
      return formatCurrency(item.income);
    }
    return "₦ 0.00";
  };

  const getTaxPaidForYear = (year) => {
    const item = sortedIncomeData.find((item) => item.year === year);
    if (!item) return "₦ 0.00";
    if (item.taxPaidFormatted && item.taxPaidFormatted !== "₦0.00") {
      return item.taxPaidFormatted;
    }
    if (item.taxPaid !== undefined && item.taxPaid !== null) {
      return formatCurrency(item.taxPaid);
    }
    return "₦ 0.00";
  };

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
          <h1 className="text-[35px] font-bold">Tax Clearance Certificate</h1>
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://yirs.netlify.app";
  const qrValue = `${baseUrl}/verify-TCC/${id}`;

  return (
    <div className="mx-auto">
      <div className="min-h-screen py-8 px-4 flex items-center justify-center bg-white">
        <div className="w-full max-w-5xl bg-white relative">
          {/* Background Image - Now covers entire container including padding areas */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src='https://res.cloudinary.com/djr7uqara/image/upload/v1/lvz2hkotpazmh5m54bkv.png'
              alt="YIRS Background Image"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content - sits on top of background */}
          <div className="relative pt-8 pr-8 pl-8 pb-8 border-6 border-red-900">
            <div className="flex items-start justify-between mb-8">
              <div className="flex flex-col items-center gap-3">
                <p className="text-lg font-semibold text-gray-800">REV.15A</p>
                <div className="w-36 h-36">
                  <img
                    src={yirsLogoUrl}
                    alt="YIRS Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center mt-6">
                <h1 className="text-5xl font-bold text-gray-800 text-center">
                  YOBE STATE GOVERNMENT
                </h1>
                <h2 className="text-3xl font-semibold text-gray-700 text-center -mt-2">
                  INTERNAL REVENUE SERVICE
                </h2>
                <p className="text-lg font-bold text-gray-600 text-center">
                  Revenue House, Ahmadu Bello Way
                  <br className="mt-0" />
                  Damaturu Yobe State
                </p>
                <p className="text-base font-bold text-gray-600 text-center -mt-1">
                  Website:{" "}
                  <a
                    href="https://irs.yb.gov.ng"
                    className="text-blue-600 text-base "
                  >
                    https://irs.yb.gov.ng
                  </a>{" "}
                  Email:{" "}
                  <a
                    href="mailto:info@irs.yb.gov.ng"
                    className="text-blue-600 text-base"
                  >
                    info@irs.yb.gov.ng
                  </a>
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-gray-800 italic">Original</p>
              </div>
            </div>

            <div className="-mb-2 flex items-center justify-center w-full -mt-12">
              <div className="flex-1 border-t-8 border-double border-red-400"></div>
              <h3 className="mx-6 text-[24px] font-bold text-gray-800 whitespace-nowrap">
                e-TAX CLEARANCE CERTIFICATE
              </h3>
              <div className="flex-1 border-t-8 border-double border-red-400"></div>
            </div>

            <div className="flex justify-between text-base mb-12">
              <div>
                <p className="text-gray-700">
                  <span className="text-lg">TIN:</span> {record.tin || "N/A"}
                </p>
                <p className="text-gray-700 mt-2">
                  <span className="text-lg">Certificate No:</span>{" "}
                  {record.certificateNo ||
                    record.certificateNumber ||
                    record.id ||
                    "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-700 text-lg">
                  ISSUE DATE:
                </p>
                <p className="text-gray-700">
                  {formatDate(record.issueDate || new Date().toISOString())}
                </p>
              </div>
            </div>

            <div className="text-center mt-18">
              <p className="text-gray-700 mb-6 text-[35px]">This is to certify that:</p>
              <h2 className="text-[35px] font-bold text-gray-800 underline mb-6 italic">
                {record.name || "N/A"}
              </h2>
              <p className="text-gray-700 mb-3 text-[35px]">Of:</p>
              <p className="text-gray-700  mb-6 text-[35px]">
                {record.address || "N/A"}
              </p>
              <p className="text-gray-700 mb-8 text-[35px]">
                Has settled his/her income tax assessments for the past three years.
              </p>
              <h3 className="text-4xl text-gray-800 mb-8">
                Assessment Details as Follows:
              </h3>
            </div>

            <div className="mb-10 overflow-x-auto">
              <table className="w-full border-collapse border-2 border-gray-700 mx-auto max-w-4xl py-0">
                <thead>
                  <tr className="border-2 border-gray-700">
                    <th className="border-2 border-gray-700 px-6 py-1 text-gray-800 font-semibold text-lg">
                    </th>
                    {displayYears.map((item) => (
                      <th
                        key={item.year}
                        className="border-2 border-gray-700 px-6 py-1 text-gray-800 font-semibold text-lg"
                      >
                        {item.year}
                      </th>
                    ))}
                    {displayYears.length < 3 &&
                      Array.from({ length: 3 - displayYears.length }).map(
                        (_, index) => (
                          <th
                            key={`empty-${index}`}
                            className="border-2 border-gray-700 px-6 py-1 text-gray-800 font-semibold text-lg"
                          >
                            N/A
                          </th>
                        )
                      )}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-2 border-gray-700">
                    <td className="border-2 border-gray-700 px-6 py-1 text-gray-700 font-semibold text-left text-lg">
                      Total Income:
                    </td>
                    {displayYears.map((item) => (
                      <td
                        key={`income-${item.year}`}
                        className="border-2 border-gray-700 px-6 py-0 text-gray-700 text-center font-semibold text-lg"
                      >
                        {getIncomeForYear(item.year)}
                      </td>
                    ))}
                    {displayYears.length < 3 &&
                      Array.from({ length: 3 - displayYears.length }).map(
                        (_, index) => (
                          <td
                            key={`income-empty-${index}`}
                            className="border-2 border-gray-700 px-6 py-1 text-gray-700 text-center font-semibold text-lg"
                          >
                            ₦ 0.00
                          </td>
                        )
                      )}
                  </tr>
                  <tr className="border-2 border-gray-700">
                    <td className="border-2 border-gray-700 px-6 py-1 text-gray-700 font-semibold text-left text-lg">
                      Tax Paid:
                    </td>
                    {displayYears.map((item) => (
                      <td
                        key={`tax-${item.year}`}
                        className="border-2 border-gray-700 px-6 py-1 text-gray-700 text-center font-semibold text-lg"
                      >
                        {getTaxPaidForYear(item.year)}
                      </td>
                    ))}
                    {displayYears.length < 3 &&
                      Array.from({ length: 3 - displayYears.length }).map(
                        (_, index) => (
                          <td
                            key={`tax-empty-${index}`}
                            className="border-2 border-gray-400 px-6 py-3 text-gray-700 text-center text-lg"
                          >
                            ₦ 0.00
                          </td>
                        )
                      )}
                  </tr>
                </tbody>
              </table>

              {sortedIncomeData.length === 0 && (
                <div className="text-center mt-6 text-gray-600 text-lg">
                  No assessment data available
                </div>
              )}
            </div>

            <div className="text-center mb-10">
              <h3 className="text-gray-700 text-[35px] mb-3">Source(s) of Income</h3>
              <div className="text-gray-700 font-bold text-xl uppercase">
                {getSourcesOfIncome()}
              </div>
            </div>

            <div className="flex justify-between items-start gap-8 mb-16">
              <div className="flex flex-col items-center mt-2">
                <div className="bg-white p-1 mb-3">
                  <QRCodeSVG
                    value={qrValue}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Please scan this QR code
                </p>
              </div>

              <div className="flex-1 text-center mr-10">
                <p className="text-gray-700 text-[35px] mb-3">
                  This Certificate expires on
                </p>
                <p className="text-gray-700 font-semibold text-xl">
                  {formatExpiryDate(record.expiryDate)}
                </p>
              </div>

              <div className="w-24"></div>
            </div>

            <div className="flex justify-end -mt-70">
              <div className="flex flex-col items-center gap-2">
                <div className="w-70 h-40 flex items-center justify-center">
                  <img
                    src="https://res.cloudinary.com/djr7uqara/image/upload/v1773169822/qldqg5houhpjnixkmpmy.png"
                    alt="Signature"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-gray-800 font-extrabold">
                    Executive Chairman
                  </p>
                  <p className="text-gray-800 font-extrabold">
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