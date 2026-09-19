import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { theme } = await request.json();

    if (theme !== "light" && theme !== "dark") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid theme",
        },
        {
          status: 400,
        }
      );
    }

    const response = NextResponse.json({
      success: true,
      theme,
    });

    response.cookies.set({
      name: "theme",
      value: theme,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error("Theme API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save theme.",
      },
      {
        status: 500,
      }
    );
  }
}