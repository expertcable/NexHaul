import { prisma } from "./lib/prisma"; async function run(){ await prisma.load.deleteMany({where: {status: "OPEN"}}); console.log("done"); } run();
