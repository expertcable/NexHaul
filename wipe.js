const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.load.deleteMany({
    where: {
      status: "OPEN"
    }
  });
  console.log(`Deleted ${result.count} OPEN loads.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
