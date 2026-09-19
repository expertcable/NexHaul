import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres.hwcajejhhidnaacneupp:ke%5Crne%5Cl%404333@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Clearing existing test data...');
  await prisma.rating.deleteMany({});
  await prisma.match.deleteMany({});
  await prisma.load.deleteMany({});
  await prisma.journey.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password', 10);

  console.log('Seeding Shippers...');
  const shipper1 = await prisma.user.create({
    data: {
      name: 'Kerala Seafoods & Cold Chain Corp',
      email: 'shipper@demo.com',
      passwordHash,
      role: Role.SHIPPER,
      phone: '+91 98470 12345',
      averageRating: 4.9,
    },
  });

  const shipper2 = await prisma.user.create({
    data: {
      name: 'Tata & Mahindra Logistics Hub',
      email: 'tata.shipper@demo.com',
      passwordHash,
      role: Role.SHIPPER,
      phone: '+91 98200 54321',
      averageRating: 4.8,
    },
  });

  console.log('Seeding Truckers...');
  const trucker1 = await prisma.user.create({
    data: {
      name: 'Kerala Cold Express (Reefer)',
      email: 'trucker@demo.com',
      passwordHash,
      role: Role.TRUCKER,
      phone: '+91 94471 88990',
      truckType: 'Ice Truck / Refrigerated',
      totalCapacity: 15000,
      averageRating: 4.95,
    },
  });

  const trucker2 = await prisma.user.create({
    data: {
      name: 'Western India Dry Freight Lines',
      email: 'pune.trucker@demo.com',
      passwordHash,
      role: Role.TRUCKER,
      phone: '+91 98901 22334',
      truckType: 'Dry Van',
      totalCapacity: 20000,
      averageRating: 4.85,
    },
  });

  const trucker3 = await prisma.user.create({
    data: {
      name: 'National Heavy Flatbed Haulers',
      email: 'heavy.trucker@demo.com',
      passwordHash,
      role: Role.TRUCKER,
      phone: '+91 97654 33221',
      truckType: 'Flatbed',
      totalCapacity: 32000,
      averageRating: 4.9,
    },
  });

  const truckerFull = await prisma.user.create({
    data: {
      name: 'SpeedMax Container Carrier (At Capacity)',
      email: 'full.trucker@demo.com',
      passwordHash,
      role: Role.TRUCKER,
      phone: '+91 91234 56780',
      truckType: 'Container',
      totalCapacity: 25000,
      averageRating: 4.7,
    },
  });

  console.log('Seeding Trucker Routes (Journeys)...');
  const now = new Date();

  // 1. Ice Truck from Kochi to Trivandrum with drop point Kollam & Alappuzha
  await prisma.journey.create({
    data: {
      truckerId: trucker1.id,
      originCity: 'Kochi',
      originState: 'KL',
      destCity: 'Trivandrum',
      destState: 'KL',
      dropPoints: ['Alappuzha', 'Kollam'],
      originLat: 9.9312,
      originLng: 76.2673,
      destLat: 8.5241,
      destLng: 76.9366,
      truckType: 'Ice Truck / Refrigerated',
      availableCapacityKg: 12000,
      price: 18000,
      priceInr: 18000,
      askingPricePerKg: 1.5,
      departureDate: new Date(now.getTime() + 86400000), // tomorrow
      status: 'AVAILABLE',
    },
  });

  // 2. Dry Van from Pune to Kochi with drop points Bengaluru & Coimbatore
  await prisma.journey.create({
    data: {
      truckerId: trucker2.id,
      originCity: 'Pune',
      originState: 'MH',
      destCity: 'Kochi',
      destState: 'KL',
      dropPoints: ['Bengaluru', 'Coimbatore'],
      originLat: 18.5204,
      originLng: 73.8567,
      destLat: 9.9312,
      destLng: 76.2673,
      truckType: 'Dry Van',
      availableCapacityKg: 18000,
      price: 42000,
      priceInr: 42000,
      askingPricePerKg: 2.33,
      departureDate: new Date(now.getTime() + 86400000 * 2),
      status: 'AVAILABLE',
    },
  });

  // 3. Flatbed from Pune to Bengaluru with drop points Satara & Kolhapur
  await prisma.journey.create({
    data: {
      truckerId: trucker3.id,
      originCity: 'Pune',
      originState: 'MH',
      destCity: 'Bengaluru',
      destState: 'KA',
      dropPoints: ['Satara', 'Kolhapur', 'Belagavi'],
      originLat: 18.5204,
      originLng: 73.8567,
      destLat: 12.9716,
      destLng: 77.5946,
      truckType: 'Flatbed',
      availableCapacityKg: 28000,
      price: 55000,
      priceInr: 55000,
      askingPricePerKg: 1.96,
      departureDate: new Date(now.getTime() + 86400000 * 3),
      status: 'AVAILABLE',
    },
  });

  // 4. Fully booked trucker (capacity reached)
  await prisma.journey.create({
    data: {
      truckerId: truckerFull.id,
      originCity: 'Mumbai',
      originState: 'MH',
      destCity: 'Delhi',
      destState: 'DL',
      dropPoints: ['Surat', 'Vadodara', 'Jaipur'],
      originLat: 19.0760,
      originLng: 72.8777,
      destLat: 28.7041,
      destLng: 77.1025,
      truckType: 'Container',
      availableCapacityKg: 0, // FULL
      price: 75000,
      priceInr: 75000,
      askingPricePerKg: 3.0,
      departureDate: new Date(now.getTime() + 86400000),
      status: 'MATCHED',
    },
  });

  console.log('Seeding Shipper Loads...');

  // Load 1: 10,000 kg Ice from Kochi to Trivandrum requiring an Ice Truck
  await prisma.load.create({
    data: {
      shipperId: shipper1.id,
      originCity: 'Kochi',
      originState: 'KL',
      destCity: 'Trivandrum',
      destState: 'KL',
      originLat: 9.9312,
      originLng: 76.2673,
      destLat: 8.5241,
      destLng: 76.9366,
      cargoType: 'Ice & Fresh Perishable Seafood',
      truckType: 'Ice Truck / Refrigerated',
      weightKg: 10000,
      budget: 22000,
      priceInr: 22000,
      pickupDate: new Date(now.getTime() + 86400000),
      deliveryDeadline: new Date(now.getTime() + 86400000 * 2),
      status: 'PENDING',
      description: 'Urgent deep-frozen seafood consignment requiring continuous temperature control.',
    },
  });

  // Load 2: 15,000 kg Dry Goods from Pune to Kochi requiring Dry Van
  await prisma.load.create({
    data: {
      shipperId: shipper1.id,
      originCity: 'Pune',
      originState: 'MH',
      destCity: 'Kochi',
      destState: 'KL',
      originLat: 18.5204,
      originLng: 73.8567,
      destLat: 9.9312,
      destLng: 76.2673,
      cargoType: 'FMCG Packaged Goods & Electronics',
      truckType: 'Dry Van',
      weightKg: 15000,
      budget: 45000,
      priceInr: 45000,
      pickupDate: new Date(now.getTime() + 86400000 * 2),
      deliveryDeadline: new Date(now.getTime() + 86400000 * 4),
      status: 'PENDING',
      description: 'Palletized carton freight for retail distribution across Kerala.',
    },
  });

  // Load 3: 20,000 kg Steel & Industrial Machining from Pune to Bengaluru
  await prisma.load.create({
    data: {
      shipperId: shipper2.id,
      originCity: 'Pune',
      originState: 'MH',
      destCity: 'Bengaluru',
      destState: 'KA',
      originLat: 18.5204,
      originLng: 73.8567,
      destLat: 12.9716,
      destLng: 77.5946,
      cargoType: 'Industrial Steel Coils & Auto Castings',
      truckType: 'Flatbed',
      weightKg: 20000,
      budget: 60000,
      priceInr: 60000,
      pickupDate: new Date(now.getTime() + 86400000 * 3),
      deliveryDeadline: new Date(now.getTime() + 86400000 * 5),
      status: 'PENDING',
      description: 'Heavy machinery parts requiring side-loading flatbed trailer.',
    },
  });

  // Load 4: Waypoint load from Kollam to Trivandrum (tests dropPoint matching!)
  await prisma.load.create({
    data: {
      shipperId: shipper2.id,
      originCity: 'Kollam',
      originState: 'KL',
      destCity: 'Trivandrum',
      destState: 'KL',
      originLat: 8.8932,
      originLng: 76.6141,
      destLat: 8.5241,
      destLng: 76.9366,
      cargoType: 'Processed Cashew Export Cartons',
      truckType: 'Ice Truck / Refrigerated',
      weightKg: 5000,
      budget: 12000,
      priceInr: 12000,
      pickupDate: new Date(now.getTime() + 86400000),
      deliveryDeadline: new Date(now.getTime() + 86400000 * 2),
      status: 'PENDING',
      description: 'Intermediate waypoint pickup at Kollam port corridor.',
    },
  });

  console.log('✅ Realistic test seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
