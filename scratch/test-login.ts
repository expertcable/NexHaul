import { PrismaClient } from '../generated/prisma/client/index.js';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.hwcajejhhidnaacneupp:ke%5Crne%5Cl%404333@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";
// Wait, using Pool from pg is the correct way, but let's test if findUnique works.
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'trucker@demo.com';
  const password = 'password';
  
  console.log('Finding user by email:', email);
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    console.log('User not found');
    return;
  }
  
  console.log('User found:', user.email, 'hash:', user.passwordHash);
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log('Is password valid?', isValid);
}

main().catch(console.error).finally(() => process.exit(0));
