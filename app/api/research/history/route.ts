import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(request: Request) {
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

    const reports = await db
      .collection("research_reports")
      .find({
        userId: session.userId,
      })
      .sort({
        updatedAt: -1,
        createdAt: -1,
      })
      .limit(50)
      .toArray();

    const formattedReports = reports.map((report) => ({
      id: report._id.toString(),
      title:
        report.report?.title ||
        report.report?.query ||
        "Untitled Research",
      query: report.report?.query || "",
      createdAt: report.createdAt
        ? report.createdAt.toISOString()
        : null,
      updatedAt: report.updatedAt
        ? report.updatedAt.toISOString()
        : null,
    }));

    return NextResponse.json({
      success: true,
      reports: formattedReports,
    });
  } catch (error) {
    console.error("Research history error:", error);

    return NextResponse.json(
      {
        error: "Unable to load research history",
      },
      { status: 500 }
    );
  }
}