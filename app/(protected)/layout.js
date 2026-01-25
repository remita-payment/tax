"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

// Simple Skeleton Component
const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Main Content Skeleton */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        {/* Page Header Skeleton */}
        <div className="mb-8 space-y-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Content Cards Skeleton */}
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-5">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-7 w-24 mb-2" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-lg border p-6">
            <div className="space-y-4">
              {/* Form Input Skeletons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              
              {/* More Form Fields */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              
              {/* Textarea Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-full" />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Layout Component
export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session && status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/auth/login?callbackUrl=${callbackUrl}`);
    }
  }, [session, status, pathname, router]);

  // Show skeleton while loading
  if (status === "loading") {
    return <LoadingSkeleton />;
  }

  // Don't render if not authenticated
  if (!session || status === "unauthenticated") {
    return null;
  }

  // Once authenticated, just render the children (your page content)
  return <>{children}</>;
}