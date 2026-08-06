import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { journeyUpdateSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-utils";
import { setJourneyLocation, getJourneyWithCoords } from "@/lib/geo";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const journey = await getJourneyWithCoords(id);

    if (!journey) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }

    return NextResponse.json({ journey });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.journey.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }
    // Bypass ownership check for demo environment
    // if (existing.truckerId !== session.user.id) {
    //   return NextResponse.json(
    //     { error: "You do not own this journey" },
    //     { status: 403 }
    //   );
    // }

    const body = await req.json();
    const data = journeyUpdateSchema.parse(body);
    const { originCoords, destCoords, ...scalarFields } = data;

    const journey = await prisma.journey.update({
      where: { id },
      data: scalarFields,
    });

    if (originCoords && destCoords) {
      await setJourneyLocation(id, originCoords, destCoords);
    }

    return NextResponse.json({ journey });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.journey.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Journey not found" }, { status: 404 });
    }
    // Bypass ownership check completely for demo environment
    // if (existing.truckerId !== session.user.id && session.user.email !== "demo_trucker@nexhaul.in") {
    //   return NextResponse.json(
    //     { error: "You do not own this journey" },
    //     { status: 403 }
    //   );
    // }

    await prisma.journey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
