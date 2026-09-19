import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

async function getSession(request: Request) {
  const cookieHeader = request.headers.get("cookie");

  const token = cookieHeader
    ?.split(";")
    .find((cookie) =>
      cookie.trim().startsWith("session_token=")
    )
    ?.split("=")[1];

  if (!token) {
    return null;
  }

  const db = await getDb();

  return db.collection("sessions").findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Please login first" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid research ID." },
        { status: 400 }
      );
    }

    const db = await getDb();

    const report = await db
      .collection("research_reports")
      .findOne({
        _id: new ObjectId(id),
        userId: session.userId,
      });

    if (!report) {
      return NextResponse.json(
        { error: "Research report not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report: report.report,
    });
  } catch (error) {
    console.error(
      "Research report loading error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load research report.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json(
        { error: "Please login first" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid research ID." },
        { status: 400 }
      );
    }

    const db = await getDb();

    const result = await db
      .collection("research_reports")
      .deleteOne({
        _id: new ObjectId(id),
        userId: session.userId,
      });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          error: "Research report not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Research report deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete research error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete research report.",
      },
      { status: 500 }
    );
  }
}