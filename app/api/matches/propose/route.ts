import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { loadId, journeyId, proposedBy, agreedPrice } = await req.json();
    const effectiveRole = session.user.role?.toUpperCase();

    if (effectiveRole !== "TRUCKER") {
      return NextResponse.json(
        { error: "Only truckers can propose routes for open loads" },
        { status: 403 }
      );
    }


    if (!loadId || !journeyId) {
      return NextResponse.json({ error: "Missing loadId or journeyId" }, { status: 400 });
    }

    // Verify journey belongs to this trucker
    const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // Verify load is OPEN
    const load = await prisma.load.findUnique({ where: { id: loadId } });
    if (!load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }
    
    if (load.status !== "PENDING") {
      return NextResponse.json({ error: "Load is no longer pending" }, { status: 400 });
    }

    // Create the Match
    const match = await prisma.match.create({
      data: {
        loadId,
        journeyId,
        status: "PENDING",
        proposedBy: "TRUCKER",
      },
    });

    return NextResponse.json({ success: true, match }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
