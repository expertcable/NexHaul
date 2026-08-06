import "dotenv/config";
import { prisma } from "./lib/prisma";
import { setLoadLocation } from "./lib/geo";

async function verifyPostgis() {
  console.log("Starting PostGIS verification...");

  // Ensure a dummy shipper exists
  const shipper = await prisma.user.upsert({
    where: { email: "shipper.postgis.test@test.local" },
    update: {},
    create: {
      name: "Test Shipper",
      email: "shipper.postgis.test@test.local",
      passwordHash: "dummy-hash",
      role: "SHIPPER",
    },
  });

  // Create a dummy Load record from Chicago to Indianapolis
  const dummyLoad = await prisma.load.create({
    data: {
      shipperId: shipper.id,
      originCity: "Chicago",
      originState: "IL",
      destCity: "Indianapolis",
      destState: "IN",
      cargoType: "Electronics",
      weightKg: 15000,
      budget: 1200.00,
      pickupDate: new Date("2026-08-10"),
      deliveryDeadline: new Date("2026-08-11"),
      description: "PostGIS validation dummy load",
    },
  });

  // Update geometry using our PostGIS helper
  // Chicago coordinates: lng = -87.6298, lat = 41.8781
  // Indianapolis coordinates: lng = -86.1581, lat = 39.7684
  await setLoadLocation(
    dummyLoad.id,
    { lat: 41.8781, lng: -87.6298 }, // Chicago
    { lat: 39.7684, lng: -86.1581 }  // Indianapolis
  );

  // Execute a raw SQL query using ST_AsText("originPoint") to fetch the data back
  const result = await prisma.$queryRaw<Array<{ id: string; originText: string; destText: string }>>`
    SELECT id, ST_AsText("originPoint") as "originText", ST_AsText("destPoint") as "destText"
    FROM "Load"
    WHERE id = ${dummyLoad.id}
  `;

  console.log("Raw SQL Result:", result);
  if (result[0]?.originText) {
    console.log(result[0].originText);
  }

  // Clean up test load
  await prisma.load.delete({ where: { id: dummyLoad.id } });
  await prisma.$disconnect();
}

verifyPostgis().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
