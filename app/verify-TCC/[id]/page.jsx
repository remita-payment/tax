"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function TaxCertificate() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id) {
      // Redirect to API route which will trigger PDF download
      window.location.href = `/api/generate-certificate-pdf/${id}`;
      
      // Optional: Redirect back to a success page after a delay
      // setTimeout(() => {
      //   router.push('/certificates');
      // }, 2000);
    }
  }, [id]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gray-900 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Generating Your Certificate
        </h2>
        <p className="text-gray-600">
          Your PDF download will start automatically...
        </p>
      </div>
    </div>
  );
}