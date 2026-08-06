import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMockOrRealSession } from "@/lib/auth-bypass";
import { prisma } from "@/lib/prisma";
import { journeyCreateSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-utils";
import { setJourneyLocation } from "@/lib/geo";
import { Prisma } from "@/generated/prisma/client";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10))
    );

    const where: Prisma.JourneyWhereInput = {};
    if (status) {
      where.status = status as Prisma.EnumJourneyStatusFilter["equals"];
    }
    if (search) {
      where.OR = [
        { originCity: { contains: search, mode: "insensitive" } },
        { destCity: { contains: search, mode: "insensitive" } },
        { truckType: { contains: search, mode: "insensitive" } },
      ];
    }

    const [journeys, total] = await Promise.all([
      prisma.journey.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { trucker: { select: { id: true, name: true } } },
      }),
      prisma.journey.count({ where }),
    ]);

    return NextResponse.json({
      journeys,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getMockOrRealSession(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("mock_role") || searchParams.get("demoRole");
    const effectiveRole = (roleParam || session?.user?.role)?.toUpperCase();

    if (effectiveRole !== "TRUCKER") {
      return NextResponse.json(
        { error: "Only truckers can post journeys" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = journeyCreateSchema.parse(body);

    const journey = await prisma.journey.create({
      data: {
        truckerId: roleParam ? "demo-trucker-id" : session.user.id,
        originCity: data.originCity,
        originState: data.originState,
        destCity: data.destCity,
        destState: data.destState,
        departureDate: data.departureDate,
        availableCapacityKg: data.availableCapacityKg,
        truckType: data.truckType,
        askingPricePerKg: data.askingPricePerKg,
      },
    });

    await setJourneyLocation(journey.id, data.originCoords, data.destCoords);

    return NextResponse.json({ journey }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
