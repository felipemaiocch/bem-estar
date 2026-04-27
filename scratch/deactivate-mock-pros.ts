import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const namesToDeactivate = [
        "Dra. Sílvia (Nutricionista)",
        "Dr. Marcos (Fisioterapeuta)",
        "Camila Rocha",
        "Dra. Paula Mendes",
        "Diego Prado"
    ];

    const result = await prisma.user.updateMany({
        where: {
            name: { in: namesToDeactivate },
            role: "PROFESSIONAL"
        },
        data: {
            isActive: false
        }
    });

    console.log(`Deactivated ${result.count} professionals.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
