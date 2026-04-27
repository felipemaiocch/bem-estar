import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.event.deleteMany({
    where: { title: "Workshop de Postura em Casa" }
  });
  console.log(`Deleted ${deleted.count} events.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
