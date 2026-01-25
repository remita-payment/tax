import clientPromise from "@/lib/db";
import User from "@/model/User";
import { NextResponse } from "next/server";
import { compare } from 'bcryptjs'; // Add this import

export async function POST(request) { // CHANGE: GET → POST
  try {
    await clientPromise();
    
    // 1. Get credentials from JSON body (not URL)
    const { email, password } = await request.json();
    
    // 2. Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 3. Find user with password for verification
    const user = await User.findOne({ email }).select("+password").lean();
    
    // 4. Use generic error to prevent user enumeration
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 5. Verify password hash (assuming bcrypt)
    const isPasswordValid = await compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 6. Remove password before sending response
    const { password: _, ...safeUserData } = user;
    
    // 7. Optional: Generate session token
    // const token = generateAuthToken(user._id);
    
    return NextResponse.json({
      success: true,
      user: safeUserData,
      // token: token, // Include if implementing JWT
    });
    
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// 🔴 DISABLE GET METHOD for security
export async function GET() {
  return NextResponse.json(
    { 
      error: "Method not allowed. Use POST with JSON body for authentication.",
      example: {
        method: "POST",
        body: { email: "user@example.com", password: "yourpassword" }
      }
    },
    { status: 405 }
  );
}