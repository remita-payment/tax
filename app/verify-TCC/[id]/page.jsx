'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getRecordById } from '@/actions/tax';
import { useParams } from 'next/navigation';

export default function Home() {
  const testimonials = [
    "Introducing GovTaxPro: Simplifying Government Tax Collection - Our software revolutionizes tax collection for government agencies, providing a streamlined and user-friendly solution that automates processes, enhances compliance, and boosts revenue generation!",
    "Empower Your Tax Administration with GovTaxPro: Designed specifically for government agencies, our cutting-edge software offers comprehensive features to manage tax collection efficiently, ensuring accuracy, transparency, and improved taxpayer engagement.",
    "Enhance Revenue Streams with GovTaxPro: Maximize your tax collection potential and reduce revenue leakage with our advanced software. From seamless data integration to intelligent analytics, GovTaxPro empowers agencies to optimize tax assessment, streamline payments, and improve overall financial performance."
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [daysDifference, setDaysDifference] = useState(0);
  
 const {id} = useParams()

  // Fetch certificate data
  useEffect(() => {
    async function fetchCertificate() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getRecordById(id);
        if (result.success) {
          setCertificateData(result.data);
          
          // Check if certificate is expired
          if (result.data.expiryDate) {
            const expiryDate = new Date(result.data.expiryDate);
            const today = new Date();
            
            // Reset time to compare only dates
            expiryDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            
            const diffTime = expiryDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            setDaysDifference(diffDays);
            setIsExpired(diffDays < 0);
          }
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificate();
  }, [id]);

  const goToTestimonial = (index) => {
    setCurrentTestimonial(index);
  };

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' });
      const year = date.getFullYear();
      return `${day} ${month}, ${year}`;
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format expiry status message
  const getExpiryStatus = () => {
    if (!certificateData?.expiryDate) return '';
    
    if (isExpired) {
      return `Expired ${Math.abs(daysDifference)} ${Math.abs(daysDifference) === 1 ? 'Day' : 'Days'} Ago`;
    } else {
      return '';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-teal-500 via-blue-500 to-blue-600 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="flex flex-col md:flex-row w-full max-w-5xl gap-0 bg-white shadow-2xl overflow-hidden">
            {/* Left Section Skeleton */}
            <div className="w-full md:w-1/2 p-8 flex-col justify-between relative overflow-hidden flex bg-blue-500">
              <div className="relative z-10 flex flex-col h-full justify-between w-full">
                <div className="w-20 h-20 rounded-full bg-blue-400 animate-pulse"></div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="h-12 w-12 bg-blue-400 animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-blue-400 animate-pulse rounded w-full"></div>
                    <div className="h-4 bg-blue-400 animate-pulse rounded w-full"></div>
                    <div className="h-4 bg-blue-400 animate-pulse rounded w-3/4"></div>
                  </div>
                  <div className="flex justify-center items-center gap-3 mt-8">
                    <div className="h-1 w-4 bg-blue-400 animate-pulse rounded-full"></div>
                    <div className="h-1 w-4 bg-blue-400 animate-pulse rounded-full"></div>
                    <div className="h-1 w-4 bg-blue-400 animate-pulse rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Section Skeleton */}
            <div className="w-full md:w-1/2 bg-white p-12 flex flex-col justify-center items-center">
              <div className="w-full max-w-sm text-center space-y-6">
                <div className="h-10 w-48 bg-gray-300 animate-pulse rounded mx-auto"></div>
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-3 w-32 bg-gray-300 animate-pulse rounded mx-auto"></div>
                      <div className="h-6 w-48 bg-gray-300 animate-pulse rounded mx-auto"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <footer className="bg-blue-600 bg-opacity-40 px-4 py-4">
          <div className="h-4 w-48 bg-blue-400 animate-pulse rounded mx-auto"></div>
        </footer>
      </div>
    );
  }

  // If no ID provided
  if (!id) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-teal-500 via-blue-500 to-blue-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">No Certificate ID Provided</h1>
          <p className="text-gray-600 mb-6">Please provide a certificate ID to verify.</p>
          <p className="text-sm text-gray-500">Add ?id=YOUR_CERTIFICATE_ID to the URL</p>
        </div>
      </div>
    );
  }

  // If no certificate data found
  if (!certificateData) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-teal-500 via-blue-500 to-blue-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Certificate Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to find certificate with ID: {id}</p>
          <p className="text-sm text-gray-500">Please check the certificate ID and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-teal-500 via-blue-500 to-blue-600 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="flex flex-col md:flex-row w-full max-w-5xl gap-0 bg-white shadow-2xl overflow-hidden">
          {/* Left Section - Testimonial */}
          <div
            className="w-full md:w-1/2 p-8 flex-col justify-between relative overflow-hidden flex"
            style={{
              backgroundImage: 'url(https://res.cloudinary.com/djr7uqara/image/upload/v1768768664/lv9towhxzuvwjj8yxxjn.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Blue Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-90"></div>

            {/* Content wrapper */}
            <div className="relative z-10 flex flex-col h-full justify-between">
              {/* Logo Section */}
              <div className="w-20 h-20 relative">
                <Image
                  src="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"
                  alt="YIRS Logo"
                  width={80}
                  height={80}
                  className="rounded-full"
                />
              </div>

              {/* Quote Section */}
              <div className="flex-1 flex flex-col justify-center">
                {/* Quote Mark */}
                <div className="text-6xl text-green-400 font-bold mb-2">"</div>
                
                {/* Testimonial Text */}
                <p className="text-white text-base leading-relaxed italic font-light mb-4">
                  {testimonials[currentTestimonial]}
                </p>
                
                {/* Carousel Indicators */}
                <div className="flex justify-center items-center gap-2 mt-4">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToTestimonial(index)}
                      className={`h-1 transition-all duration-300 cursor-pointer rounded-full ${
                        index === currentTestimonial 
                          ? 'w-4 bg-white' 
                          : 'w-4 bg-white opacity-50 hover:opacity-100'
                      }`}
                      aria-label={`Go to testimonial ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Section - Certificate */}
          <div className="w-full md:w-1/2 bg-white p-4 md:p-8 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm text-center bg-red-50 p-6">
              {/* Certificate Status - Reduced margin */}
              <div>
                <h1 className={`text-3xl font-semibold ${isExpired ? 'text-red-600' : 'text-green-600'}`}>
                  {isExpired ? 'Certificate is Expired' : ''}
                </h1>
              </div>

              {/* Certificate Details - Minimal spacing */}
              <div className="mt-2">
                {/* Tax ID - Reduced spacing */}
                <div className="mb-1">
                  <p className="text-red-500 font-medium mb-0">Tax Identification Number:</p>
                  <p className="text-red-600 text-lg font-semibold">
                    {certificateData.tin || certificateData.taxId || 'N/A'}
                  </p>
                </div>

                {/* Tax Payer Name - Reduced spacing */}
                <div className="mb-1">
                  <p className="text-red-500 font-medium mb-0">Tax Payer Name:</p>
                  <p className="text-red-600 text-lg font-semibold">
                    {certificateData.name || certificateData.taxpayerName || 'N/A'}
                  </p>
                </div>

                {/* Certificate Number - Reduced spacing */}
                <div className="mb-1">
                  <p className="text-red-500 font-medium mb-0">Certificate Number:</p>
                  <p className="text-red-600 text-lg font-semibold">
                    {certificateData.certificateNo || certificateData.certificateNumber || 'N/A'}
                  </p>
                </div>

                {/* Issue Date - Reduced spacing */}
                <div className="mb-1">
                  <p className="text-red-500 font-medium mb-0">Issue Date:</p>
                  <p className="text-red-600 text-lg font-semibold">
                    {formatDate(certificateData.issueDate || certificateData.createdAt)}
                  </p>
                </div>

                {/* Expiry Date - Reduced spacing */}
                {certificateData.expiryDate && (
                  <div className="mb-1">
                    <p className="text-red-500 font-medium mb-0">Expiry Date:</p>
                    <p className="text-red-600 text-lg font-semibold">
                      {formatDate(certificateData.expiryDate)}
                    </p>
                  </div>
                )}

                {/* Expired Status - Reduced spacing */}
                {isExpired && (
                  <div className="mt-2">
                    <p className="text-red-600 text-xl font-semibold">
                      {getExpiryStatus()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-blue-600 bg-opacity-40 px-4 py-4 flex flex-col items-center justify-center text-center text-sm text-blue-100">
        <div className="flex items-center gap-1 justify-center">
          <span>© 2026 Verzon. Crafted with</span>
          <span className="text-red-400">❤️</span>
          <span>by Themesbrand</span>
        </div>
      </footer>
    </div>
  );
}