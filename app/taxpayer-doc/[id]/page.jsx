"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function TaxCertificate() {
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      // Trigger PDF download
      const downloadPDF = async () => {
        try {
          // Fetch the PDF
          const response = await fetch(`/api/generate-certificate-pdf/${id}`);
          
          if (!response.ok) {
            throw new Error('Failed to generate PDF');
          }

          // Create blob from response
          const blob = await response.blob();
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `RPDF.pdf`;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          // Close the window/tab after download starts
          setTimeout(() => {
            window.close();
            
            // Fallback: If window.close() doesn't work (some browsers block it)
            // Show a message to manually close
            if (!window.closed) {
              document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white;">
                  <div style="text-align: center;">
                    <h2 style="font-size: 24px; font-weight: 600; color: #1f2937; margin-bottom: 8px;">
                      ✓ Download Complete!
                    </h2>
                    <p style="color: #6b7280; margin-bottom: 16px;">
                      You can now close this window.
                    </p>
                    <button 
                      onclick="window.close()" 
                      style="background: #1f2937; color: white; padding: 12px 24px; border-radius: 6px; border: none; cursor: pointer; font-size: 16px;"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              `;
            }
          }, 1000);
          
        } catch (error) {
          console.error('Error downloading PDF:', error);
          document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white;">
              <div style="text-align: center;">
                <h2 style="font-size: 24px; font-weight: 600; color: #dc2626; margin-bottom: 8px;">
                  Download Failed
                </h2>
                <p style="color: #6b7280; margin-bottom: 16px;">
                  There was an error generating your certificate.
                </p>
                <button 
                  onclick="window.close()" 
                  style="background: #1f2937; color: white; padding: 12px 24px; border-radius: 6px; border: none; cursor: pointer; font-size: 16px;"
                >
                  Close Window
                </button>
              </div>
            </div>
          `;
        }
      };

      downloadPDF();
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