import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadCreateSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-utils";
import { setLoadLocation } from "@/lib/geo";


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

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { originCity: { contains: search, mode: "insensitive" } },
        { destCity: { contains: search, mode: "insensitive" } },
        { cargoType: { contains: search, mode: "insensitive" } },
      ];
    }

    const [loads, total] = await Promise.all([
      prisma.load.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { shipper: { select: { id: true, name: true } } },
      }),
      prisma.load.count({ where }),
    ]);

    return NextResponse.json({
      loads,
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
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const effectiveRole = session.user.role?.toUpperCase();

    if (effectiveRole !== "SHIPPER") {
      return NextResponse.json(
        { error: "Only shippers can post loads" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = loadCreateSchema.parse(body);

    const load = await prisma.load.create({
      data: {
        shipperId: session.user.id,
        originCity: data.originCity,
        originState: data.originState,
        destCity: data.destCity,
        destState: data.destState,
        cargoType: data.cargoType,
        weightKg: data.weightKg,
        budget: data.budget,
        pickupDate: data.pickupDate,
        deliveryDeadline: data.deliveryDeadline,
        description: data.description,
      },
    });

    await setLoadLocation(load.id, data.originCoords, data.destCoords);

    if (body.journeyId) {
      await prisma.match.create({
        data: {
          loadId: load.id,
          journeyId: String(body.journeyId),
          status: "PENDING",
          proposedBy: "SHIPPER",
        },
      });
    }

    return NextResponse.json({ load }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
