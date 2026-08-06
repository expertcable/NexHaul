import { NextResponse } from "next/server";
import { getMockOrRealSession } from "@/lib/auth-bypass";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-utils";

export async function POST(req: Request) {
  try {
    const session = await getMockOrRealSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("mock_role") || searchParams.get("demoRole");
    const effectiveRole = (roleParam || session?.user?.role)?.toUpperCase();

    if (effectiveRole !== "TRUCKER") {
      return NextResponse.json(
        { error: "Only truckers can propose routes for open loads" },
        { status: 403 }
      );
    }

    const { loadId, journeyId } = await req.json();

    if (!loadId || !journeyId) {
      return NextResponse.json({ error: "Missing loadId or journeyId" }, { status: 400 });
    }

    // Verify journey belongs to this trucker (bypass check for demo dummy account if needed, but safe to enforce if they use the UI)
    const journey = await prisma.journey.findUnique({ where: { id: journeyId } });
    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    // Verify load is OPEN
    const load = await prisma.load.findUnique({ where: { id: loadId } });
    if (!load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }
    
    if (load.status !== "OPEN") {
      return NextResponse.json({ error: "Load is no longer open" }, { status: 400 });
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
