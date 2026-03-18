import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Password strength validation
function isStrongPassword(password: string): boolean {
  // At least 12 characters
  if (password.length < 12) return false;
  
  // Contains uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Contains lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Contains number
  if (!/\d/.test(password)) return false;
  
  // Contains special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const appPassword = process.env.APP_PASSWORD;

    if (!appPassword) {
      console.error("APP_PASSWORD environment variable is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Validate password strength for the configured password
    if (!isStrongPassword(appPassword)) {
      console.error("Configured APP_PASSWORD does not meet strength requirements");
      return NextResponse.json(
        { error: "Server configuration error - password does not meet security requirements" },
        { status: 500 }
      );
    }

    // Check if provided password matches
    if (password !== appPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Set authentication cookie (expires in 24 hours)
    const cookieStore = cookies();
    cookieStore.set("aisdr-auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during authentication" },
      { status: 500 }
    );
  }
}