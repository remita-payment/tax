// app/auth/error/page.jsx
import { Suspense } from 'react';
import AuthErrorContent from './AuthErrorContent';

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-pulse">
          <div className="w-full max-w-md bg-gray-100 rounded-lg p-8">
            <div className="h-8 w-8 mx-auto mb-4 bg-gray-300 rounded-full"></div>
            <div className="h-6 bg-gray-300 rounded mb-2 w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}

// app/auth/error/AuthErrorContent.jsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Simple error messages object
const errorMessages = {
  "CredentialsSignin": "Invalid email or password. Please check your credentials.",
  "user_not_found": "No account found with this email address.",
  "Default": "An error occurred during sign in.",
};

export default function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("Default");
  const [description, setDescription] = useState("An error occurred during sign in.");

  useEffect(() => {
    const errorParam = searchParams.get("error") || "Default";
    setError(errorParam);
    setDescription(errorMessages[errorParam] || errorMessages["Default"]);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 rounded-full bg-red-100 p-3 dark:bg-red-900/20">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Error: <code className="bg-gray-100 px-2 py-1 rounded">{error}</code>
          </p>
        </CardContent>
        
        <CardFooter className="">
          <Button 
            className="w-full cursor-pointer" 
            onClick={() => router.push("/auth/login")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}