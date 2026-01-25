import "./globals.css";
import { Providers } from "./providers";
import { Sora } from 'next/font/google';

const sora = Sora({ 
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap'
});

export const metadata = {
  title: {
    default: "Yobe State Internal Revenue Service",
    template: "%s | YIRS"
  },
  description: "Official portal of Yobe State Internal Revenue Service. File taxes, make payments, access taxpayer services, and get information on tax laws and regulations in Yobe State.",
  metadataBase: new URL('https://yirs.yb.gov.ng'),
  keywords: [
    "Yobe State tax",
    "internal revenue service",
    "tax payment Yobe",
    "tax filing Nigeria",
    "state taxes",
    "tax clearance certificate",
    "YIRS portal",
    "taxpayer services",
    "revenue collection",
    "tax laws Yobe State",
    "Pay As You Earn",
    "withholding tax",
    "business premises tax",
    "development levy",
    "Yobe State government"
  ],
  authors: [
    {
      name: "Yobe State Internal Revenue Service",
      url: "https://yirs.yb.gov.ng",
    }
  ],
  creator: "Yobe State Government",
  publisher: "Yobe State Internal Revenue Service",
  robots: {
    index: false, // Changed to false to prevent indexing
    follow: false, // Changed to false to prevent following links
    googleBot: {
      index: false, // Changed to false for Google Bot
      follow: false, // Changed to false for Google Bot
      noimageindex: true, // Prevent image indexing
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://yirs.yb.gov.ng",
    siteName: "Yobe State Internal Revenue Service",
    title: "Yobe State Internal Revenue Service | Official Portal",
    description: "Official tax portal for Yobe State. File returns, make payments, and access taxpayer services.",
    images: [
      {
        url: "https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg",
        width: 1200,
        height: 630,
        alt: "Yobe State Internal Revenue Service - Official Portal",
        type: "image/jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yobe State Internal Revenue Service",
    description: "Official tax portal for Yobe State. File returns, make payments, and access taxpayer services.",
    creator: "@YobeStateGov",
    images: ["https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"],
  },
  alternates: {
    canonical: "https://yirs.yb.gov.ng",
    languages: {
      'en': 'https://yirs.yb.gov.ng'
    }
  },
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
  category: "government",
};

export default async function RootLayout({ children, session }) {
  return (
    <html lang="en" className={`${sora.variable} font-sans`}>
      <head>
        {/* Noindex meta tag for additional protection */}
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex" />
        <meta name="googlebot" content="noindex, nofollow, noimageindex" />
        <meta name="bingbot" content="noindex, nofollow" />
        <meta name="slurp" content="noindex, nofollow" />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#006400" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Additional Open Graph meta for better compatibility */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpg" />
        
        {/* Twitter additional meta */}
        <meta name="twitter:image:width" content="1200" />
        <meta name="twitter:image:height" content="630" />
        
        {/* Preload critical resources */}
        <link
          rel="preload"
          href="https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"
          as="image"
        />
      </head>
      <body className="min-h-screen">
          <Providers>
            {children}
          </Providers>

        {/* Structured data for Government Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://yirs.yb.gov.ng/#website",
                  "url": "https://yirs.yb.gov.ng",
                  "name": "Yobe State Internal Revenue Service",
                  "description": "Official tax portal of Yobe State Internal Revenue Service",
                  "inLanguage": "en-NG"
                },
                {
                  "@type": "GovernmentOrganization",
                  "@id": "https://yirs.yb.gov.ng/#organization",
                  "name": "Yobe State Internal Revenue Service",
                  "alternateName": "YIRS",
                  "url": "https://yirs.yb.gov.ng",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg",
                    "width": 800,
                    "height": 600
                  },
                  "image": [
                    "https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"
                  ],
                  "description": "The official revenue collection agency of Yobe State Government",
                  "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "NG",
                    "addressLocality": "Damaturu",
                    "addressRegion": "Yobe State",
                    "streetAddress": "Yobe State Secretariat Complex"
                  },
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+2347030000000",
                    "contactType": "customer service",
                    "areaServed": "NG",
                    "availableLanguage": ["en", "ha"]
                  },
                  "parentOrganization": {
                    "@type": "GovernmentOrganization",
                    "name": "Yobe State Government"
                  }
                },
                {
                  "@type": "GovernmentService",
                  "@id": "https://yirs.yb.gov.ng/#service",
                  "name": "Tax Collection Services",
                  "url": "https://yirs.yb.gov.ng",
                  "description": "Tax collection and revenue services for Yobe State",
                  "serviceType": "Tax Filing and Payment",
                  "provider": {
                    "@type": "GovernmentOrganization",
                    "name": "Yobe State Internal Revenue Service"
                  },
                  "areaServed": {
                    "@type": "State",
                    "name": "Yobe State"
                  },
                  "serviceOperator": {
                    "@type": "GovernmentOrganization",
                    "name": "Yobe State Internal Revenue Service"
                  }
                }
              ]
            })
          }}
        />
        
        {/* Local Government Office structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "GovernmentOffice",
              "name": "Yobe State Internal Revenue Service Headquarters",
              "image": [
                "https://res.cloudinary.com/djr7uqara/image/upload/v1768251368/lunppgqxrwcyfyymr0lm.jpg"
              ],
              "@id": "https://yirs.yb.gov.ng",
              "url": "https://yirs.yb.gov.ng",
              "telephone": "+2347030000000",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Yobe State Secretariat Complex",
                "addressLocality": "Damaturu",
                "addressRegion": "Yobe State",
                "postalCode": "620211",
                "addressCountry": "NG"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 11.746,
                "longitude": 11.960
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday"
                ],
                "opens": "08:00",
                "closes": "16:00"
              },
              "department": {
                "@type": "GovernmentOrganization",
                "name": "Yobe State Ministry of Finance"
              },
              "parentOrganization": {
                "@type": "GovernmentOrganization",
                "name": "Yobe State Government"
              }
            })
          }}
        />
        
        {/* Government Service Catalog */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Service",
              "serviceType": "Tax and Revenue Services",
              "provider": {
                "@type": "GovernmentOrganization",
                "name": "Yobe State Internal Revenue Service"
              },
              "name": "YIRS Tax Services",
              "description": "Comprehensive tax and revenue services for individuals and businesses in Yobe State",
              "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Tax Services",
                "itemListElement": [
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Tax Filing",
                      "description": "File your annual tax returns online"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Tax Payment",
                      "description": "Pay taxes online securely"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Tax Clearance Certificate",
                      "description": "Apply for and obtain tax clearance certificates"
                    }
                  },
                  {
                    "@type": "Offer",
                    "itemOffered": {
                      "@type": "Service",
                      "name": "Taxpayer Registration",
                      "description": "Register as a new taxpayer in Yobe State"
                    }
                  }
                ]
              }
            })
          }}
        />
      </body>
    </html>
  );
}