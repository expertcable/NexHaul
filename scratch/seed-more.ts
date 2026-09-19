import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.hwcajejhhidnaacneupp:ke%5Crne%5Cl%404333@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Fetching users to associate dummy data...');
  const shippers = await prisma.user.findMany({ where: { role: 'SHIPPER' } });
  const truckers = await prisma.user.findMany({ where: { role: 'TRUCKER' } });

  if (shippers.length === 0 || truckers.length === 0) {
    console.error('No shippers or truckers found in the database. Run the main seed first.');
    return;
  }

  const now = new Date();
  
  // 10 dummy Journeys for truckers
  const indianCities = [
    { city: 'Mumbai', state: 'MH', lat: 19.0760, lng: 72.8777 },
    { city: 'Delhi', state: 'DL', lat: 28.7041, lng: 77.1025 },
    { city: 'Bangalore', state: 'KA', lat: 12.9716, lng: 77.5946 },
    { city: 'Hyderabad', state: 'TS', lat: 17.3850, lng: 78.4867 },
    { city: 'Ahmedabad', state: 'GJ', lat: 23.0225, lng: 72.5714 },
    { city: 'Chennai', state: 'TN', lat: 13.0827, lng: 80.2707 },
    { city: 'Kolkata', state: 'WB', lat: 22.5726, lng: 88.3639 },
    { city: 'Surat', state: 'GJ', lat: 21.1702, lng: 72.8311 },
    { city: 'Pune', state: 'MH', lat: 18.5204, lng: 73.8567 },
    { city: 'Jaipur', state: 'RJ', lat: 26.9124, lng: 75.7873 },
    { city: 'Lucknow', state: 'UP', lat: 26.8467, lng: 80.9462 },
    { city: 'Kanpur', state: 'UP', lat: 26.4499, lng: 80.3319 },
    { city: 'Nagpur', state: 'MH', lat: 21.1458, lng: 79.0882 },
    { city: 'Indore', state: 'MP', lat: 22.7196, lng: 75.8577 },
  ];

  const cargoTypes = ['FMCG', 'Electronics', 'Textiles', 'Automobile Parts', 'Pharmaceuticals', 'Agricultural Produce', 'Furniture', 'Machinery'];
  const truckTypes = ['Ice Truck / Refrigerated', 'Dry Van', 'Flatbed', 'Container', '16-Wheel Heavy Trailer (32 MT)', 'Liquid Tanker'];

  console.log('Seeding 10 dummy Journeys...');
  for (let i = 0; i < 10; i++) {
    const origin = indianCities[Math.floor(Math.random() * indianCities.length)];
    let dest = indianCities[Math.floor(Math.random() * indianCities.length)];
    while (origin.city === dest.city) {
      dest = indianCities[Math.floor(Math.random() * indianCities.length)];
    }

    const trucker = truckers[i % truckers.length];
    const capacity = Math.floor(Math.random() * 20000) + 10000;
    const price = Math.floor(Math.random() * 40000) + 15000;
    const daysOffset = Math.floor(Math.random() * 5) + 1;
    const truckType = truckTypes[Math.floor(Math.random() * truckTypes.length)];

    await prisma.journey.create({
      data: {
        truckerId: trucker.id,
        originCity: origin.city,
        originState: origin.state,
        destCity: dest.city,
        destState: dest.state,
        dropPoints: [],
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: dest.lat,
        destLng: dest.lng,
        truckType,
        availableCapacityKg: capacity,
        price,
        priceInr: price,
        askingPricePerKg: parseFloat((price / capacity).toFixed(2)),
        departureDate: new Date(now.getTime() + 86400000 * daysOffset),
        status: 'AVAILABLE',
      }
    });
  }

  console.log('Seeding 10 dummy Loads...');
  for (let i = 0; i < 10; i++) {
    const origin = indianCities[Math.floor(Math.random() * indianCities.length)];
    let dest = indianCities[Math.floor(Math.random() * indianCities.length)];
    while (origin.city === dest.city) {
      dest = indianCities[Math.floor(Math.random() * indianCities.length)];
    }

    const shipper = shippers[i % shippers.length];
    const weight = Math.floor(Math.random() * 15000) + 2000;
    const budget = Math.floor(Math.random() * 30000) + 10000;
    const daysOffset = Math.floor(Math.random() * 5) + 1;
    const cargoType = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
    const truckType = truckTypes[Math.floor(Math.random() * truckTypes.length)];

    await prisma.load.create({
      data: {
        shipperId: shipper.id,
        originCity: origin.city,
        originState: origin.state,
        destCity: dest.city,
        destState: dest.state,
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: dest.lat,
        destLng: dest.lng,
        cargoType,
        truckType,
        weightKg: weight,
        budget,
        priceInr: budget,
        pickupDate: new Date(now.getTime() + 86400000 * daysOffset),
        deliveryDeadline: new Date(now.getTime() + 86400000 * (daysOffset + 3)),
        status: 'PENDING',
        description: `Dummy load generated for testing ${cargoType}`,
      }
    });
  }

  console.log('✅ Added 10 dummy journeys and 10 dummy loads.');
}

main().catch(console.error).finally(() => process.exit(0));
