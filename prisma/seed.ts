import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const HUBS = {
  JNPT: { city: 'Mumbai', state: 'Maharashtra', lat: 18.9496, lng: 72.9510 },
  NCR: { city: 'Delhi', state: 'NCR', lat: 28.6139, lng: 77.2090 },
  Peenya: { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  Chennai: { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  Sanand: { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  Haldia: { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  Chakan: { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  Hyderabad: { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 }
};

async function main() {
  console.log('Clearing old data...');
  await prisma.match.deleteMany({});
  await prisma.load.deleteMany({});
  await prisma.journey.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password', 10);

  const shipper = await prisma.user.create({
    data: {
      name: 'Reliance Freight',
      email: 'shipper@demo.com',
      passwordHash,
      role: Role.SHIPPER,
      phone: '+91 98765 43210'
    }
  });

  const trucker = await prisma.user.create({
    data: {
      name: 'Rajesh Transports',
      email: 'trucker@demo.com',
      passwordHash,
      role: Role.TRUCKER,
      phone: '+91 91234 56789'
    }
  });

  const corridors = [
    { origin: HUBS.JNPT, dest: HUBS.NCR, vehicle: 'Tata Signa 4825.TK', priceInr: 145000, weightTons: 32, type: 'Container' },
    { origin: HUBS.Sanand, dest: HUBS.Chakan, vehicle: 'Ashok Leyland 2820', priceInr: 45000, weightTons: 20, type: 'Auto Parts' },
    { origin: HUBS.Peenya, dest: HUBS.Chennai, vehicle: '32ft Multi-Axle', priceInr: 65000, weightTons: 24, type: 'Electronics' },
    { origin: HUBS.Haldia, dest: HUBS.Hyderabad, vehicle: 'Tata Prima 3530.K', priceInr: 120000, weightTons: 28, type: 'Machinery' },
    { origin: HUBS.NCR, dest: HUBS.JNPT, vehicle: 'Tata Signa 4825.TK', priceInr: 135000, weightTons: 30, type: 'Textiles' },
    { origin: HUBS.Chennai, dest: HUBS.Peenya, vehicle: 'Eicher Pro 6028', priceInr: 55000, weightTons: 18, type: 'FMCG' }
  ];

  console.log('Seeding 6 Indian corridors...');

  const now = new Date();
  
  for (const c of corridors) {
    const pickupDate = new Date(now.getTime() + Math.random() * 86400000 * 3);
    const deliveryDeadline = new Date(pickupDate.getTime() + Math.random() * 86400000 * 5);

    await prisma.load.create({
      data: {
        shipperId: shipper.id,
        originCity: c.origin.city,
        originState: c.origin.state,
        destCity: c.dest.city,
        destState: c.dest.state,
        originLat: c.origin.lat,
        originLng: c.origin.lng,
        destLat: c.dest.lat,
        destLng: c.dest.lng,
        vehicleType: c.vehicle,
        priceInr: c.priceInr,
        weightTons: c.weightTons,
        cargoType: c.type,
        weightKg: c.weightTons * 1000,
        budget: c.priceInr, // Fallback for schema requirement
        pickupDate,
        deliveryDeadline,
        status: 'PENDING',
        description: `${c.type} load requiring ${c.vehicle}. Contact shipper on dispatch.`
      }
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
