import { prisma } from "@/lib/prisma";

type Coords = { lat: number; lng: number };

// Unsupported("geometry(...)") fields are invisible to the normal Prisma
// Client API — they must be written and read via raw SQL. Coordinates are
// passed as bound parameters (not string-interpolated) via Prisma's tagged
// template, which parameterizes them safely against SQL injection.

export async function setLoadLocation(
  loadId: string,
  origin: Coords,
  dest: Coords
) {
  await prisma.$executeRaw`
    UPDATE "Load"
    SET
      "originPoint" = ST_SetSRID(ST_MakePoint(${origin.lng}, ${origin.lat}), 4326),
      "destPoint" = ST_SetSRID(ST_MakePoint(${dest.lng}, ${dest.lat}), 4326)
    WHERE id = ${loadId}
  `;
}

export async function setJourneyLocation(
  journeyId: string,
  origin: Coords,
  dest: Coords
) {
  await prisma.$executeRaw`
    UPDATE "Journey"
    SET
      "originPoint" = ST_SetSRID(ST_MakePoint(${origin.lng}, ${origin.lat}), 4326),
      "destPoint" = ST_SetSRID(ST_MakePoint(${dest.lng}, ${dest.lat}), 4326)
    WHERE id = ${journeyId}
  `;
}

export async function getLoadWithCoords(loadId: string) {
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      l.*,
      ST_X(l."originPoint") AS "originLng",
      ST_Y(l."originPoint") AS "originLat",
      ST_X(l."destPoint") AS "destLng",
      ST_Y(l."destPoint") AS "destLat",
      u.id AS "shipperUserId",
      u.name AS "shipperName"
    FROM "Load" l
    JOIN "User" u ON u.id = l."shipperId"
    WHERE l.id = ${loadId}
  `;
  return rows[0] ?? null;
}

export async function getJourneyWithCoords(journeyId: string) {
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      j.*,
      ST_X(j."originPoint") AS "originLng",
      ST_Y(j."originPoint") AS "originLat",
      ST_X(j."destPoint") AS "destLng",
      ST_Y(j."destPoint") AS "destLat",
      u.id AS "truckerUserId",
      u.name AS "truckerName"
    FROM "Journey" j
    JOIN "User" u ON u.id = j."truckerId"
    WHERE j.id = ${journeyId}
  `;
  return rows[0] ?? null;
}
