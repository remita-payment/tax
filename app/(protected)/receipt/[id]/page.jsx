"use client"

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { getRecordById } from '@/actions/tax'
import { useParams } from 'next/navigation'

export default function PaymentReceipt() {
  const {id} = useParams()
  
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch record data
  useEffect(() => {
    async function fetchRecord() {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await getRecordById(id)
        if (result.success) {
          setRecord(result.data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [id])

  // Format date
   const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      
      // Get day, month, and year
      const day = String(date.getDate()).padStart(2, '0')
      const month = date.toLocaleString('en-US', { month: 'short' }) // Gets "Jun"
      const year = date.getFullYear()
      
      // Return in format "03-Jun-2025"
      return `${day}-${month}-${year}`
    } catch (error) {
      return 'Invalid Date'
    }
  }

  // Generate QR data
  const generateQRData = () => {
     const BASE_URL =
  process.env.NEXTAUTH_URL || "http://localhost:3000";
    if (!record) return ''  
    return `${BASE_URL}/taxpayer-doc/${record._id}`;
  }

  // Skeleton Loader
  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white p-8 border-2 border-gray-800">
            {/* Header Skeleton */}
            <div className="text-center mb-8 pb-6">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 bg-gray-300 animate-pulse rounded"></div>
              </div>
              <div className="h-7 w-48 bg-gray-300 animate-pulse rounded mx-auto mb-2"></div>
              <div className="h-5 w-64 bg-gray-300 animate-pulse rounded mx-auto mb-4"></div>
              <div className="h-4 w-80 bg-gray-300 animate-pulse rounded mx-auto"></div>
            </div>

            {/* Title Skeleton */}
            <div className="text-center mb-6">
              <div className="h-7 w-64 bg-gray-300 animate-pulse rounded mx-auto"></div>
            </div>

            {/* Content Skeleton - Simplified without table */}
            <div className="mb-8">
              <div className="border-2 border-gray-800 overflow-hidden">
                {/* Left side content skeleton */}
                <div className="grid grid-cols-3">
                  <div className="col-span-2 p-4 space-y-4">
                    {[...Array(10)].map((_, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-24 h-4 bg-gray-300 animate-pulse rounded"></div>
                        <div className="flex-1 h-4 bg-gray-300 animate-pulse rounded"></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* QR Code skeleton */}
                  <div className="border-l border-gray-800 p-4 flex items-center justify-center">
                    <div className="w-40 h-40 bg-gray-300 animate-pulse rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Skeleton */}
            <div className="flex justify-center mt-12 mb-6">
              <div className="text-center">
                <div className="h-24 flex items-end justify-center mb-2">
                  <div className="h-20 w-48 bg-gray-300 animate-pulse rounded"></div>
                </div>
                <div className="h-5 w-48 bg-gray-300 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Show error if no record found
  if (!record) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl bg-white p-8 shadow-2xl border-2 border-gray-800">
          <div className="text-center py-12">
            <div className="mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-10 h-10 bg-red-200 rounded-full"></div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Receipt Not Found</h2>
            <p className="text-gray-600">Unable to load receipt data for ID: {id}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl">
        {/* Main receipt container with rounded border */}
        <div className="bg-white p-8 shadow-2xl border-2 border-gray-800">
          {/* Header */}
          <div className="text-center mb-8 pb-6">
            <div className="flex justify-center mb-3">
              {/* Logo */}
              <div className="w-16 h-16 flex items-center justify-center">
                <img 
                  src="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg" 
                  alt="Yobe State IRS Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <h1 className="text-xl font-bold tracking-wide">YOBE STATE</h1>
            <p className="text-sm font-semibold text-gray-700">INTERNAL REVENUE SERVICE</p>
            <div className="mt-4 text-xs text-gray-700 space-y-1 border-t-2 border-b-2 p-2 border-gray-800">
              <p>Tel: 07065798000 | 08030051026 Email: info@yirs.gov.ng Website: www.yirs.gov.ng</p>
            </div>
          </div>

          {/* Receipt Title */}
          <h2 className="text-center text-lg font-bold tracking-wide mb-6">OFFICIAL E-PAYMENT RECEIPT</h2>

          {/* Combined Table with QR Code */}
          <div className="mb-8">
            <div className="border-2 border-gray-800 overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm w-30">Payer:</td>
                    <td className="p-3 text-sm">{record.name || 'N/A'}</td>
                    <td 
                      rowSpan={10} 
                      className="border-l border-gray-800 p-4 text-center w-48"
                    >
                      <div className="flex flex-col items-center justify-center h-full space-y-3">
                        {/* QR Code with Logo */}
                        <div className="relative bg-white p-2">
                          <QRCodeSVG
                            value={generateQRData()}
                            size={160}
                            level="M"
                            includeMargin={true}
                            className="w-40 h-40"
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                          />
                          {/* Logo overlay */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <img 
                              src="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg" 
                              alt="Logo"
                              className="w-5 h-5 object-contain bg-white p-1 rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">Phone:</td>
                    <td className="p-3 text-sm">{record.phoneNo || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">Email:</td>
                    <td className="p-3 text-sm">{record.email || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">Reference:</td>
                    <td className="p-3 text-sm">{record.reference || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">Revenue:</td>
                    <td className="p-3 text-sm">{record.revenue || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">Amount:</td>
                    <td className="p-3 text-sm">{record.amountFormatted || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">Platform:</td>
                    <td className="p-3 text-sm">{record.platform || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">Payment Details:</td>
                    <td className="p-3 text-sm">{record.revenue || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">ID/Batch:</td>
                    <td className="p-3 text-sm">{record.idBatch || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="border-r border-gray-800 p-3 font-semibold text-sm">Payment Date:</td>
                    <td className="p-3 text-sm">{formatDate(record.issueDate)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer with Signature */}
          <div className="flex justify-center mt-12 mb-6">
            <div className="text-center">
              <div className="h-24 flex items-end justify-center mb-2">
                {/* Signature Image */}
                <div className="h-20 w-48 flex items-center justify-center">
                  <img 
                    src="https://res.cloudinary.com/djr7uqara/image/upload/v1768252957/gana67i87nyccquinbgj.png" 
                    alt="Executive Chairman Signature"
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
              <p className="text-sm font-semibold tracking-wide text-gray-800">EXECUTIVE CHAIRMAN</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}