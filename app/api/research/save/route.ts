import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");

    const token = cookieHeader
      ?.split(";")
      .find((cookie) =>
        cookie.trim().startsWith("session_token=")
      )
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { error: "Please login first" },
        { status: 401 }
      );
    }

    const db = await getDb();

    const session = await db.collection("sessions").findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session expired. Please login again." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const report = body?.report;

    if (!report) {
      return NextResponse.json(
        {
          error: "Research report is required.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const document = {
      userId: session.userId,
      query: report.query || "",
      title: report.title || "Untitled Research",
      report,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db
      .collection("research_reports")
      .insertOne(document);

    return NextResponse.json({
      success: true,
      researchId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Save research error:", error);

    return NextResponse.json(
      {
        error: "Failed to save research report.",
      },
      { status: 500 }
    );
  }
}