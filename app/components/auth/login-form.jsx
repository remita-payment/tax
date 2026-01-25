// app/components/auth/login-form.jsx - FIXED CALLBACK URL DECODING
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { loginSchema } from "@/schemas/authSchema";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/dashboard/products");

  // 🎯 FIX: Decode callback URL on component mount
  useEffect(() => {
    const encodedCallbackUrl = searchParams.get("callbackUrl");
    
    if (encodedCallbackUrl) {
      try {
        // Decode the callback URL (it's encoded by proxy)
        const decodedUrl = decodeURIComponent(encodedCallbackUrl);
        
        // Validate it's a safe URL
        if (decodedUrl.startsWith('/') && 
            !decodedUrl.includes('//') && 
            !decodedUrl.includes('/auth/login') ) {
          setCallbackUrl(decodedUrl);
          console.log("✅ Decoded callback URL:", decodedUrl);
        } else {
          console.log("⚠️ Invalid callback URL, using default:", decodedUrl);
        }
      } catch (error) {
        console.error("❌ Failed to decode callback URL:", error);
        setCallbackUrl("/dashboard");
      }
    }
  }, [searchParams]);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setAuthError(""); // Clear previous errors

    try {
      console.log("🚀 Login attempt:", data.email);
      console.log("🔗 Callback URL:", callbackUrl);
      
      // Use signIn from next-auth/react
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false, // Handle redirect manually
      });

      console.log("📋 SignIn result:", result);

      if (result?.error) {
        // 🎯 SHOW ERROR AS ALERT - NO REDIRECT
        console.log("🔴 Auth error detected:", result.error);
        
        // Determine error message
        let errorMessage = "An error occurred during sign in.";
        if (result.error.includes("CredentialsSignin")) {
          errorMessage = "Invalid email or password.";
          toast.error("Login Failed", {
            description: "Please check your credentials and try again.",
          });
        } else {
          errorMessage = result.error;
          toast.error("Login Failed", {
            description: result.error,
          });
        }
        
        // Set the error to show in alert
        setAuthError(errorMessage);
        
        // Clear password field
        form.setValue("password", "");
        form.setFocus("password");
        return;
      }

      if (result?.ok) {
        console.log("✅ Auth.js login successful");
        
        // CRITICAL: Set the user-role cookie for proxy
        try {
          console.log("🔐 Setting role cookie...");
          const roleResponse = await fetch("/api/auth/set-role-cookie", {
            method: "GET",
            credentials: "include", // Important for cookies
          });

          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            console.log("✅ Role cookie set:", roleData.role);
          } else {
            console.warn("⚠️ Role cookie not set, but login succeeded");
          }
        } catch (roleError) {
          console.error("Role cookie error:", roleError);
          // Continue anyway - main auth succeeded
        }

        toast.success("Login Successful", {
          description: "Redirecting...",
        });

        // 🎯 FIX: Ensure callback URL is clean
        let cleanCallbackUrl = callbackUrl;
        if (cleanCallbackUrl.includes("/auth/login") || cleanCallbackUrl.includes("/auth/register")) {
          cleanCallbackUrl = "/dashboard/products";
        }

        // 🎯 FIX: Debug the redirect URL
        console.log("🔄 Final redirect URL:", cleanCallbackUrl);
        console.log("📋 URL components:", {
          hasDoubleSlashes: cleanCallbackUrl.includes('//'),
          hasEncodedSlashes: cleanCallbackUrl.includes('%2F'),
          startsWithSlash: cleanCallbackUrl.startsWith('/'),
          fullPath: cleanCallbackUrl
        });

        // Redirect to intended page
        // Add a small delay to ensure cookies are set
        setTimeout(() => {
          router.push(cleanCallbackUrl);
          router.refresh(); // Important: refresh server components
        }, 100);
      }
      
    } catch (error) {
      console.error("Unexpected error:", error);
      setAuthError("An unexpected error occurred. Please try again.");
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
      
      form.setValue("password", "");
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg mx-auto my-4">
      <CardHeader className="flex flex-col items-center px-6 pt-6 pb-4 space-y-2">
        <div className="text-center space-y-1">
          <CardTitle className="text-2xl font-bold">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-sm">
            Sign in to your account to continue
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-2">
        {/* Show auth error alert */}
        {authError && (
          <Alert variant="destructive" className="mb-4 animate-in fade-in duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {authError}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your.email@example.com"
                      type="email"
                      autoComplete="email"
                      {...field}
                      disabled={isLoading}
                      className="disabled:opacity-50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        {...field}
                        disabled={isLoading}
                        className="disabled:opacity-50 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full h-11 mt-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}