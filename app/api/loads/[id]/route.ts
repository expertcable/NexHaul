import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loadUpdateSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-utils";
import { setLoadLocation, getLoadWithCoords } from "@/lib/geo";

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
    const load = await getLoadWithCoords(id);

    if (!load) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }

    return NextResponse.json({ load });
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
    const existing = await prisma.load.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }
    if (existing.shipperId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not own this load" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = loadUpdateSchema.parse(body);
    const { originCoords, destCoords, ...scalarFields } = data;

    const load = await prisma.load.update({
      where: { id },
      data: scalarFields as any,
    });

    if (originCoords && destCoords) {
      await setLoadLocation(id, originCoords, destCoords);
    }

    return NextResponse.json({ load });
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
    const existing = await prisma.load.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Load not found" }, { status: 404 });
    }
    if (existing.shipperId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not own this load" },
        { status: 403 }
      );
    }

    await prisma.load.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
