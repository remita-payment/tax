// app/actions/auth.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { loginSchema } from "@/schemas/authSchema";

export async function login(values) {
  // Validate with Zod
  const validatedFields = loginSchema.safeParse(values);
  
  if (!validatedFields.success) {
    // Return early with validation errors - these can be shown in form
    return { 
      success: false, 
      error: "validation_error",
      fieldErrors: validatedFields.error.flatten().fieldErrors 
    };
  }


  console.log(email, password)

  try {
    // IMPORTANT: We use redirect: false to handle the response manually
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false, // Don't let NextAuth handle redirect
    });

    // Check if signIn was successful
    if (result?.error) {
      // Auth.js returns an error - redirect to error page with specific error code
      let errorType = "CredentialsSignin"; // Default
      
      // You can customize the error based on your logic
      // This is where you'd add custom error handling if needed
      
      return {
        success: false,
        redirectToError: `/auth/error?error=${encodeURIComponent(errorType)}`
      };
    }

    // Successful login - redirect to dashboard
    return {
      success: true,
      redirectTo: DEFAULT_LOGIN_REDIRECT
    };

  } catch (error) {
    console.error("Login error:", error);
    
    if (error instanceof AuthError) {
      // Handle specific Auth.js errors
      let errorType = "Default";
      
      switch (error.type) {
        case "CredentialsSignin":
          errorType = "CredentialsSignin";
          break;
        case "CallbackRouteError":
          errorType = "Callback";
          break;
        default:
          errorType = error.type;
      }
      
      return {
        success: false,
        redirectToError: `/auth/error?error=${encodeURIComponent(errorType)}`
      };
    }
    
    // Unknown error
    return {
      success: false,
      redirectToError: `/auth/error?error=Default`
    };
  }
}