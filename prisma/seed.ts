import { PrismaClient, UserRole, BookingStatus, EventStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o seeding do banco de dados...");

  // Limpar dados existentes (cuidado com a ordem devido a chaves estrangeiras)
  await prisma.feedComment.deleteMany();
  await prisma.feedLike.deleteMany();
  await prisma.feedPost.deleteMany();
  await prisma.eventAttendance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.sessionBooking.deleteMany();
  await prisma.userGroupMembership.deleteMany();
  await prisma.accessGroup.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("senha123", 10);

  // 1. Criar Usuário Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@bemestar.com" },
    update: {},
    create: {
      email: "admin@bemestar.com",
      name: "Admin Bem Estar",
      passwordHash,
      role: UserRole.ADMIN,
      score: 500,
      avatarUrl: "https://i.pravatar.cc/150?u=admin",
    },
  });
  console.log(`Admin criado: ${admin.email}`);

  // 2. Criar Profissionais
  const prof1 = await prisma.user.upsert({
    where: { email: "silvia.nutri@bemestar.com" },
    update: {},
    create: {
      email: "silvia.nutri@bemestar.com",
      name: "Dra. Sílvia (Nutricionista)",
      passwordHash,
      role: UserRole.PROFESSIONAL,
      avatarUrl: "https://i.pravatar.cc/150?u=silvia",
      professionalProfile: {
        create: {
          specialty: "Nutrição Esportiva",
          licenseCode: "CRN-123456",
          attendanceRate: 98,
          completedSessions: 145,
        },
      },
    },
  });

  const prof2 = await prisma.user.upsert({
    where: { email: "marcos.fisio@bemestar.com" },
    update: {},
    create: {
      email: "marcos.fisio@bemestar.com",
      name: "Dr. Marcos (Fisioterapeuta)",
      passwordHash,
      role: UserRole.PROFESSIONAL,
      avatarUrl: "https://i.pravatar.cc/150?u=marcos",
      professionalProfile: {
        create: {
          specialty: "Fisioterapia Desportiva",
          licenseCode: "CREFITO-987654",
          attendanceRate: 100,
          completedSessions: 89,
        },
      },
    },
  });
  console.log(`Profissionais criados`);

  // 3. Criar Usuários Normais (Pacientes)
  const user1 = await prisma.user.upsert({
    where: { email: "joao.paciente@teste.com" },
    update: {},
    create: {
      email: "joao.paciente@teste.com",
      name: "João Silva",
      passwordHash,
      role: UserRole.USER,
      score: 1250,
      goal: "WEIGHT_LOSS",
      avatarUrl: "https://i.pravatar.cc/150?u=joao",
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "maria.paciente@teste.com" },
    update: {},
    create: {
      email: "maria.paciente@teste.com",
      name: "Maria Oliveira",
      passwordHash,
      role: UserRole.USER,
      score: 840,
      goal: "MENTAL_HEALTH",
      avatarUrl: "https://i.pravatar.cc/150?u=maria",
    },
  });
  console.log(`Usuários criados`);

  await prisma.accessGroup.createMany({
    data: [
      {
        name: "Turma de inglês",
        slug: "turma-de-ingles",
        description: "Grupo fechado para alunos da turma de inglês.",
        kind: "CLASS",
        isRestricted: true,
      },
      {
        name: "Turma da Maísa",
        slug: "turma-da-maisa",
        description: "Participantes selecionados para as ações da Maísa.",
        kind: "COHORT",
        isRestricted: true,
      },
      {
        name: "Clube do livro",
        slug: "clube-do-livro",
        description: "Grupo do clube do livro.",
        kind: "CLASS",
        isRestricted: true,
      },
    ],
  });
  console.log(`Grupos iniciais criados`);

  // 4. Criar Agendamentos de Sessão (Bookings)
  const amanhã = new Date();
  amanhã.setDate(amanhã.getDate() + 1);
  amanhã.setHours(10, 0, 0, 0);

  const horaFim = new Date(amanhã);
  horaFim.setHours(11, 0, 0, 0);

  await prisma.sessionBooking.create({
    data: {
      userId: user1.id,
      professionalId: (await prisma.professionalProfile.findUnique({ where: { userId: prof1.id } }))!.id,
      startsAt: amanhã,
      endsAt: horaFim,
      specialty: "Consulta Nutricional Inicial",
      status: BookingStatus.SCHEDULED,
      notes: "Paciente com foco em perda de peso.",
    },
  });
  console.log(`Agendamentos criados`);

  // 5. Criar Posts no Feed (Feed Social)
  const post1 = await prisma.feedPost.create({
    data: {
      authorId: prof1.id,
      professionalRole: "Nutricionista",
      activity: "Dica de Alimentação",
      caption: "Beba água e lembre-se de balancear suas refeições com proteínas magras. #Saude",
      location: "São Paulo, SP",
    },
  });

  await prisma.feedLike.create({
    data: { postId: post1.id, userId: user1.id },
  });

  await prisma.feedComment.create({
    data: {
      postId: post1.id,
      authorId: user1.id,
      text: "Ótima dica, Dra. Silvia!",
    },
  });
  console.log(`Feed populado`);

  // 6. Criar Eventos (Agenda Dr)
  const hojeMaisDois = new Date();
  hojeMaisDois.setDate(hojeMaisDois.getDate() + 2);

  const hojeMaisDoisFim = new Date(hojeMaisDois);
  hojeMaisDoisFim.setHours(hojeMaisDoisFim.getHours() + 2);

  await prisma.event.create({
    data: {
      title: "Workshop de Postura em Casa",
      description: "Aprenda a melhorar sua postura trabalhando em regime home office.",
      category: "Saúde Física",
      location: "Google Meet",
      startsAt: hojeMaisDois,
      endsAt: hojeMaisDoisFim,
      points: 50,
      publishedBy: admin.id,
      status: EventStatus.PUBLISHED,
    },
  });
  console.log(`Eventos criados`);

  console.log("Seeding concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro durante o seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
