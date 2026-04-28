import {
  Activity,
  BadgeCheck,
  BarChart3,
  Bell,
  Brain,
  Building2,
  CalendarDays,
  Clock3,
  Dumbbell,
  Flame,
  HeartPulse,
  House,
  Leaf,
  Medal,
  NotebookPen,
  Send,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

import type {
  ActivityFeedPost,
  AppNavItem,
  CareRecordCategoryOption,
  EngagementCard,
  EngagementCategoryPage,
  EngagementCategorySlug,
  MonitoredUser,
  NotificationPreference,
  Slot,
  Testimonial,
  UserCareRecord,
} from "@/types";

export const userMainNav: AppNavItem[] = [
  { label: "Home", href: "/usuario", icon: House },
  { label: "Agenda", href: "/usuario/agenda", icon: CalendarDays },
  { label: "Ranking", href: "/usuario/ranking", icon: Trophy },
  { label: "Progresso", href: "/usuario/progresso", icon: BarChart3 },
  { label: "Perfil", href: "/usuario/perfil", icon: UserRound },
];

export const userSecondaryNav: AppNavItem[] = [
  { label: "Acompanhamento", href: "/usuario/acompanhamento", icon: NotebookPen },
  { label: "Agenda dr", href: "/usuario/agenda-dr", icon: Sparkles },
];

export const workspaceNav: AppNavItem[] = [
  { label: "Prestador", href: "/usuario", icon: HeartPulse },
  { label: "Profissional", href: "/profissional", icon: Stethoscope },
  { label: "Admin", href: "/admin", icon: Building2 },
];

export const engagementCards: EngagementCard[] = [
  {
    title: "Saúde e bem-estar",
    description: "Psicologia, fisioterapia, nutrição e enfermagem em uma trilha única de cuidado.",
    metric: "4 frentes ativas",
    cta: "Descobrir cuidados",
    href: "/usuario/saude-bem-estar",
    icon: Leaf,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    title: "Cultura",
    description: "Filosofia, música e inglês em ações contínuas de desenvolvimento e repertório.",
    metric: "3 frentes culturais",
    cta: "Explorar cultura",
    href: "/usuario/cultura",
    icon: Sparkles,
    gradient: "from-blue-600 via-blue-500 to-cyan-400",
  },
  {
    title: "Agenda dr",
    description: "Agenda da dr.monitora com festas, encontros, eventos especiais e ações ao longo do mês.",
    metric: "3 ações nesta semana",
    cta: "Ver agenda",
    href: "/usuario/agenda-dr",
    icon: CalendarDays,
    gradient: "from-[#0264af] via-[#0b75c7] to-[#fd3a83]",
  },
];

export const engagementCategoryPages: Record<
  EngagementCategorySlug,
  EngagementCategoryPage
> = {
  "saude-bem-estar": {
    slug: "saude-bem-estar",
    icon: Leaf,
    eyebrow: "Saúde e bem-estar",
    heroTitle: "Cuidado contínuo com foco em saúde física, emocional e prevenção.",
    heroDescription:
      "Psicologia, fisioterapia, nutrição e enfermagem organizadas em uma frente clara de acompanhamento e bem-estar.",
    heroGradient: "from-emerald-500 via-teal-500 to-cyan-500",
    featureList: [
      "Psicologia para apoio emocional e rotina mental saudável.",
      "Fisioterapia para postura, dor e recuperação funcional.",
      "Nutrição e enfermagem como suporte contínuo de saúde.",
    ],
    sectionEyebrow: "Bem-estar ativo",
    sectionTitle: "Frentes de atendimento",
    sectionDescription: "Áreas principais de saúde e bem-estar disponíveis na plataforma.",
    cards: [
      {
        title: "Psicologia",
        date: "Atendimento contínuo · agenda semanal",
        location: "Gabriel e Giovanna · online e presencial",
        status: "Agenda aberta",
        points: 90,
        gradient: "from-blue-600 via-cyan-500 to-slate-900",
      },
      {
        title: "Fisioterapia",
        date: "Sessões durante a semana",
        location: "Espaço saúde e bem-estar",
        status: "Agenda aberta",
        points: 85,
        gradient: "from-cyan-500 via-sky-500 to-blue-600",
      },
      {
        title: "Nutrição",
        date: "Consultas e oficinas de alimentação",
        location: "Vitória · online e presencial",
        status: "Agenda aberta",
        points: 80,
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      },
      {
        title: "Enfermagem",
        date: "Plantão diário · acompanhamento básico",
        location: "Camila · ambulatório interno",
        status: "Sempre disponível",
        points: 55,
        gradient: "from-teal-500 via-cyan-500 to-sky-500",
      },
    ],
    feedTitle: "Frentes de cuidado",
    feedDescription: "As quatro bases de cuidado presentes na operação atual.",
    feedItems: [
      {
        title: "Psicologia",
        description: "Apoio emocional, escuta qualificada e fortalecimento da rotina mental.",
      },
      {
        title: "Fisioterapia",
        description: "Postura, recuperação funcional e prevenção de dores recorrentes.",
      },
      {
        title: "Nutrição e enfermagem",
        description: "Orientação alimentar, apoio preventivo e acompanhamento básico de saúde.",
      },
    ],
    interactionTitle: "Ações rápidas",
    interactionDescription: "Ative rotinas com poucos cliques e acompanhe o impacto em pontos.",
    comments: [
      "84 prestadores concluíram o check-in diário de humor hoje.",
      "Nova leva de vouchers para terapia online foi liberada para o time.",
      "O desafio de sono já elevou a consistência semanal em 12%.",
    ],
    primaryAction: "Agendar cuidado",
    secondaryAction: "Ativar benefício",
  },
  cultura: {
    slug: "cultura",
    icon: Sparkles,
    eyebrow: "Cultura organizacional",
    heroTitle: "Cultura viva com repertório, expressão e desenvolvimento contínuo.",
    heroDescription:
      "Filosofia, música e inglês organizados como frentes culturais que fortalecem repertório, expressão e convivência.",
    heroGradient: "from-indigo-600 via-blue-600 to-cyan-500",
    featureList: [
      "Filosofia para reflexão, senso crítico e repertório humano.",
      "Música como experiência cultural e conexão entre pessoas.",
      "Inglês como desenvolvimento prático e ampliação de acesso.",
    ],
    sectionEyebrow: "Conteúdo interno",
    sectionTitle: "Frentes culturais da operação",
    sectionDescription: "Áreas principais que entram dentro da categoria cultura.",
    cards: [
      {
        title: "Filosofia",
        date: "Encontros e rodas de reflexão",
        location: "Edson Pinheiros · Espaço cultural",
        status: "Ativo",
        points: 80,
        gradient: "from-indigo-500 via-blue-500 to-cyan-400",
      },
      {
        title: "Música",
        date: "Vivências e atividades em grupo",
        location: "Junior Gigante · Sala multiuso",
        status: "Publicado",
        points: 40,
        gradient: "from-slate-900 via-slate-800 to-slate-700",
      },
      {
        title: "Inglês",
        date: "Aulas e prática contínua",
        location: "Maira Necho · Plataforma + encontros guiados",
        status: "Sempre disponível",
        points: 70,
        gradient: "from-cyan-500 via-sky-500 to-blue-600",
      },
    ],
    feedTitle: "Pilares em destaque",
    feedDescription: "As três bases culturais que estruturam essa categoria.",
    feedItems: [
      {
        title: "Filosofia",
        description: "Reflexão, pensamento crítico e conversas que ampliam repertório.",
      },
      {
        title: "Música",
        description: "Vivências, expressão e integração por meio de atividades musicais.",
      },
      {
        title: "Inglês",
        description: "Desenvolvimento de idioma aplicado ao cotidiano e à autonomia.",
      },
    ],
    interactionTitle: "Engajamento cultural",
    interactionDescription: "Mantenha feedbacks rápidos e ações simples para ampliar adesão.",
    comments: [
      "A campanha de reconhecimento dobrou a participação do time de produto.",
      "O vídeo da liderança teve 92% de conclusão no mobile.",
      "A nova trilha de onboarding reduziu dúvidas nas duas primeiras semanas.",
    ],
    primaryAction: "Ver campanha",
    secondaryAction: "Compartilhar com time",
  },
  "agenda-dr": {
    slug: "agenda-dr",
    icon: CalendarDays,
    eyebrow: "Agenda dr",
    heroTitle: "Agenda da dr.monitora com encontros, festas e ações especiais.",
    heroDescription:
      "Tudo o que envolve encontros, comemorações e eventos especiais fica concentrado aqui, inclusive quando houver festas.",
    heroGradient: "from-[#0264af] via-[#0b75c7] to-[#fd3a83]",
    featureList: [
      "Eventos, encontros e festas da operação em uma única agenda.",
      "Confirmação de presença e comunicação centralizada.",
      "Espaço para programações especiais ao longo do mês.",
    ],
    sectionEyebrow: "Programação da agenda",
    sectionTitle: "Próximas ações da agenda dr",
    sectionDescription: "Eventos, encontros e festas concentrados em uma única frente.",
    cards: [
      {
        title: "Sunset com liderança",
        date: "12 abr · 18:30",
        location: "Espaço dr.monitora",
        status: "Confirmado",
        points: 120,
        gradient: "from-blue-600 via-cyan-500 to-slate-900",
      },
      {
        title: "Palestra: sono e foco",
        date: "15 abr · 10:00",
        location: "Auditório 02",
        status: "Pendente",
        points: 90,
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
      },
      {
        title: "Happy hour da operação",
        date: "18 abr · 18:00",
        location: "Espaço de convivência",
        status: "Confirmado",
        points: 140,
        gradient: "from-amber-400 via-orange-400 to-rose-400",
      },
    ],
    feedTitle: "Como a agenda dr funciona",
    feedDescription: "Uma única categoria para concentrar encontros e ativações especiais.",
    feedItems: [
      {
        title: "Eventos",
        description: "Palestras, talks e encontros especiais entram direto na agenda dr.",
      },
      {
        title: "Festas",
        description: "Quando houver comemorações, elas aparecem dentro dessa mesma agenda.",
      },
      {
        title: "Confirmação simples",
        description: "O prestador visualiza, confirma presença e acompanha a programação.",
      },
    ],
    interactionTitle: "Engajamento da agenda",
    interactionDescription: "Eventos e festas concentrados no mesmo fluxo de acompanhamento.",
    comments: [
      "As festas passam a entrar dentro da agenda dr quando forem abertas.",
      "Os eventos especiais ficam agrupados em uma frente única.",
      "A comunicação da programação fica mais simples para todo mundo.",
    ],
    primaryAction: "Confirmar presença",
    secondaryAction: "Adicionar ao calendário",
  },
};

export const dashboardHighlights = [
  {
    title: "Próxima sessão",
    value: "Hoje, 16:30",
    detail: "Psicologia com Dra. Paula Mendes",
    icon: CalendarDays,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Progresso da semana",
    value: "82%",
    detail: "3 de 4 hábitos concluídos",
    icon: Activity,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Ranking atual",
    value: "#8",
    detail: "Você subiu 2 posições",
    icon: Medal,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Meta atual",
    value: "Sono 7h+",
    detail: "Faltam 5 check-ins",
    icon: Target,
    tone: "bg-rose-50 text-rose-700",
  },
];

export const weeklyProgress = [
  { day: "Seg", score: 64 },
  { day: "Ter", score: 72 },
  { day: "Qua", score: 81 },
  { day: "Qui", score: 74 },
  { day: "Sex", score: 92 },
  { day: "Sáb", score: 60 },
  { day: "Dom", score: 76 },
];

export const goalEvolution = [
  { week: "Sem 1", target: 58, actual: 50 },
  { week: "Sem 2", target: 64, actual: 61 },
  { week: "Sem 3", target: 71, actual: 68 },
  { week: "Sem 4", target: 78, actual: 75 },
  { week: "Sem 5", target: 84, actual: 82 },
  { week: "Sem 6", target: 90, actual: 88 },
];

export const streakSummary = [
  { label: "Dias ativos", value: "18" },
  { label: "Sessões no mês", value: "06" },
  { label: "Eventos concluídos", value: "09" },
];

export const agendaFilters = [
  { label: "Todos", icon: Users },
  { label: "Nutricionista", icon: HeartPulse },
  { label: "Psicólogo", icon: Brain },
  { label: "Educador físico", icon: Dumbbell },
];

export const agendaSlots: Slot[] = [
  { time: "08:30", specialist: "Camila Rocha", specialty: "Nutricionista", status: "available" },
  { time: "10:00", specialist: "Dra. Paula Mendes", specialty: "Psicólogo", status: "occupied" },
  { time: "11:30", specialist: "Diego Prado", specialty: "Educador físico", status: "available" },
  { time: "14:00", specialist: "Dra. Paula Mendes", specialty: "Psicólogo", status: "waitlist" },
  { time: "16:30", specialist: "Camila Rocha", specialty: "Nutricionista", status: "available" },
];

export const rankingCategories = [
  "Geral",
  "Bem-estar",
  "Eventos",
  "Participação",
];

export const leaderboard = [
  { name: "Amanda Costa", area: "Produto", points: 2430, delta: "+4%", badge: "🥇" },
  { name: "Bruno Lima", area: "Financeiro", points: 2310, delta: "+1%", badge: "🥈" },
  { name: "Carla Nunes", area: "Marketing", points: 2260, delta: "+3%", badge: "🥉" },
  { name: "Felipe Santos", area: "Operações", points: 1990, delta: "+8%", badge: "08" },
  { name: "Larissa Melo", area: "RH", points: 1890, delta: "-1%", badge: "09" },
];

export const moodOptions = [
  { label: "Energizado", accent: "bg-emerald-100 text-emerald-700" },
  { label: "Equilibrado", accent: "bg-blue-100 text-blue-700" },
  { label: "Cansado", accent: "bg-amber-100 text-amber-700" },
  { label: "Sob pressão", accent: "bg-rose-100 text-rose-700" },
];

export const progressTimeline = [
  {
    title: "Meta de sono ajustada",
    detail: "Novo alvo: dormir 7h30 em pelo menos 5 dias da semana.",
    when: "Hoje, 08:00",
  },
  {
    title: "Check-in de humor concluído",
    detail: "Humor registrado como equilibrado após a sessão de mindfulness.",
    when: "Ontem, 19:20",
  },
  {
    title: "Peso atualizado",
    detail: "79,4 kg, mantendo a tendência estável nas últimas 3 semanas.",
    when: "Segunda, 07:15",
  },
];

export const trackingCards = [
  {
    title: "Plano alimentar",
    description: "Lanches com proteína às 16h e reforço de hidratação ao longo do dia.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    title: "Mindset",
    description: "Pausas de 5 minutos entre reuniões longas para recuperar foco.",
    accent: "from-blue-600 to-cyan-500",
  },
  {
    title: "Performance",
    description: "Treino funcional 3x por semana com acompanhamento de energia.",
    accent: "from-slate-900 to-slate-700",
  },
];

export const professionalAgenda = [
  {
    time: "09:00",
    patient: "Felipe Santos",
    focus: "Gestão de estresse e rotina de sono",
    status: "Confirmado",
  },
  {
    time: "11:00",
    patient: "Larissa Melo",
    focus: "Planejamento alimentar e consistência",
    status: "Aguardando check-in",
  },
  {
    time: "15:30",
    patient: "Amanda Costa",
    focus: "Revisão de evolução mensal",
    status: "Confirmado",
  },
];

export const monitoredUsers: MonitoredUser[] = [
  {
    id: "user-felipe",
    name: "Felipe Santos",
    email: "felipe@empresa.com",
    area: "Operações",
    objective: "Saúde mental e performance",
  },
  {
    id: "user-larissa",
    name: "Larissa Melo",
    email: "larissa@empresa.com",
    area: "RH",
    objective: "Consistência alimentar e energia diária",
  },
  {
    id: "user-amanda",
    name: "Amanda Costa",
    email: "amanda@empresa.com",
    area: "Produto",
    objective: "Rotina de bem-estar e prevenção",
  },
];

export const careRecordCategoryOptions: CareRecordCategoryOption[] = [
  {
    value: "psicologia",
    label: "Psicologia",
    professionalRole: "Psicólogo(a)",
    professionals: ["Gabriel", "Giovanna"],
    accent: "bg-blue-50 text-blue-700",
    defaultTitle: "Sessão de psicologia",
    defaultSummary: "Atendimento focado em rotina emocional, sono e organização mental.",
    defaultDelivery: "Exercício breve de respiração e orientação de rotina.",
    defaultNextStep: "Retornar em 7 dias com percepção das pausas e gatilhos.",
    metricSuggestions: ["Humor na chegada", "Escala de estresse"],
  },
  {
    value: "fisioterapia",
    label: "Fisioterapia",
    professionalRole: "Fisioterapeuta",
    professionals: ["Mirna"],
    accent: "bg-cyan-50 text-cyan-700",
    defaultTitle: "Avaliação fisioterapêutica",
    defaultSummary: "Acompanhamento de postura, mobilidade e desconfortos recorrentes.",
    defaultDelivery: "Série de alongamentos curtos para aplicar no expediente.",
    defaultNextStep: "Revisar postura e dor após 10 dias.",
    metricSuggestions: ["Dor referida", "Mobilidade"],
  },
  {
    value: "nutricao",
    label: "Nutrição",
    professionalRole: "Nutricionista",
    professionals: ["Vitória"],
    accent: "bg-emerald-50 text-emerald-700",
    defaultTitle: "Plano nutricional semanal",
    defaultSummary: "Consulta com foco em energia, hidratação e equilíbrio alimentar.",
    defaultDelivery: "Receita e plano alimentar personalizados para a semana.",
    defaultNextStep: "Registrar adesão e ajustar rotina na próxima consulta.",
    metricSuggestions: ["Peso", "Hidratação diária"],
  },
  {
    value: "enfermagem",
    label: "Enfermagem",
    professionalRole: "Enfermeira",
    professionals: ["Camila"],
    accent: "bg-rose-50 text-rose-700",
    defaultTitle: "Acompanhamento de enfermagem",
    defaultSummary: "Coleta de medidas, sinais gerais e orientação preventiva.",
    defaultDelivery: "Relatório com bioimpedância, peso e orientação de monitoramento.",
    defaultNextStep: "Repetir medição em 15 dias para comparação.",
    metricSuggestions: ["Peso", "Bioimpedância"],
  },
];

export const seedCareRecords: UserCareRecord[] = [
  {
    id: "record-001",
    userId: "user-felipe",
    userName: "Felipe Santos",
    userArea: "Operações",
    category: "nutricao",
    professional: "Vitória",
    professionalRole: "Nutricionista",
    title: "Plano alimentar com receita de lanche proteico",
    summary:
      "Vitória ajustou a rotina alimentar para reduzir longos períodos em jejum durante o expediente.",
    delivery:
      "Receita de wrap integral com frango desfiado e iogurte natural enviada para seguir nos lanches da tarde.",
    nextStep: "Aplicar o plano por 7 dias e registrar energia após o almoço.",
    metrics: [
      { label: "Peso", value: "79,4 kg" },
      { label: "Hidratação diária", value: "2,1 L" },
    ],
    recordedAtIso: "2026-04-11T15:00:00.000Z",
    recordedAtLabel: "11 abr · 12:00",
  },
  {
    id: "record-002",
    userId: "user-felipe",
    userName: "Felipe Santos",
    userArea: "Operações",
    category: "enfermagem",
    professional: "Camila",
    professionalRole: "Enfermeira",
    title: "Bioimpedância e medidas de acompanhamento",
    summary:
      "Camila atualizou as medidas corporais e reforçou acompanhamento preventivo quinzenal.",
    delivery:
      "Relatório com peso, percentual estimado e recomendação de monitoramento de hidratação.",
    nextStep: "Repetir aferição em duas semanas para comparar evolução.",
    metrics: [
      { label: "Peso", value: "79,1 kg" },
      { label: "Bioimpedância", value: "21,8%" },
    ],
    recordedAtIso: "2026-04-10T13:30:00.000Z",
    recordedAtLabel: "10 abr · 10:30",
  },
  {
    id: "record-003",
    userId: "user-felipe",
    userName: "Felipe Santos",
    userArea: "Operações",
    category: "psicologia",
    professional: "Gabriel",
    professionalRole: "Psicólogo",
    title: "Sessão sobre rotina de sono e ansiedade",
    summary:
      "Gabriel trabalhou gatilhos de ansiedade ligados a picos operacionais e excesso de tela à noite.",
    delivery:
      "Checklist noturno com pausa digital de 30 minutos e técnica curta de respiração.",
    nextStep: "Revisar aderência ao checklist no próximo encontro.",
    metrics: [
      { label: "Humor na chegada", value: "6/10" },
      { label: "Escala de estresse", value: "7/10" },
    ],
    recordedAtIso: "2026-04-09T18:00:00.000Z",
    recordedAtLabel: "09 abr · 15:00",
  },
  {
    id: "record-004",
    userId: "user-felipe",
    userName: "Felipe Santos",
    userArea: "Operações",
    category: "fisioterapia",
    professional: "Mirna",
    professionalRole: "Fisioterapeuta",
    title: "Avaliação postural e mobilidade cervical",
    summary:
      "Mirna observou tensão em cervical e ombros associada a longos períodos sentado.",
    delivery:
      "Sequência de alongamentos para início e fim do expediente compartilhada com o usuário.",
    nextStep: "Reavaliar tensão cervical após uma semana de execução diária.",
    metrics: [
      { label: "Dor referida", value: "4/10" },
      { label: "Mobilidade", value: "Melhora leve" },
    ],
    recordedAtIso: "2026-04-08T16:00:00.000Z",
    recordedAtLabel: "08 abr · 13:00",
  },
];

export const adminMetrics = [
  {
    title: "Usuários ativos",
    value: "1.284",
    detail: "92 novos este mês",
    icon: Users,
  },
  {
    title: "Taxa de engajamento",
    value: "78%",
    detail: "Acima da meta trimestral",
    icon: Flame,
  },
  {
    title: "Sessões realizadas",
    value: "346",
    detail: "Últimos 30 dias",
    icon: Stethoscope,
  },
  {
    title: "Participação na agenda dr",
    value: "64%",
    detail: "Happy hour + palestra de saúde mental",
    icon: Sparkles,
  },
];

export const notificationPreferences: NotificationPreference[] = [
  {
    label: "Lembrete 1 dia antes",
    description: "Receba um push com resumo da sessão e material de apoio.",
    enabled: true,
  },
  {
    label: "Lembrete 1 hora antes",
    description: "Aviso rápido para reduzir faltas e atrasos.",
    enabled: true,
  },
  {
    label: "Vaga liberada",
    description: "Se um horário lotado abrir, você entra na frente da fila.",
    enabled: true,
  },
  {
    label: "Novidades da agenda dr",
    description: "Avisos de novos encontros, campanhas e benefícios.",
    enabled: false,
  },
];

export const inboxNotifications = [
  {
    title: "Vaga liberada com a Dra. Paula",
    detail: "Quinta, 14:00. Você foi promovido da lista de espera.",
    icon: Bell,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Novo evento de cultura",
    detail: "Talk sobre equilíbrio entre alta performance e pausas saudáveis.",
    icon: Sparkles,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Check-in pendente",
    detail: "Marque se você seguiu seu plano hoje e ganhe pontos extras.",
    icon: BadgeCheck,
    tone: "bg-amber-50 text-amber-700",
  },
];

export const upcomingEvents = [
  {
    title: "Sunset com liderança",
    date: "12 abr · 18:30",
    location: "Espaço dr.monitora",
    status: "Confirmado",
    points: 120,
  },
  {
    title: "Palestra: sono e foco",
    date: "15 abr · 10:00",
    location: "Auditório 02",
    status: "Pendente",
    points: 90,
  },
  {
    title: "Yoga no parque",
    date: "18 abr · 07:00",
    location: "Parque Ibirapuera",
    status: "Confirmado",
    points: 140,
  },
];

export const activityFeedPosts: ActivityFeedPost[] = [
  {
    id: "post-vitoria",
    professional: "Vitória",
    professionalRole: "Nutricionista",
    activity: "Oficina de lanche saudável",
    time: "Hoje · 11:20",
    location: "Copa colaborativa",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80",
    caption:
      "Turma de hoje montando lanches rápidos para o meio da tarde com foco em energia estável e saciedade.",
    likes: 48,
    likedByUser: true,
    comments: [
      { id: "c1", author: "Felipe", text: "Curti o formato prático. Dá para aplicar hoje mesmo." },
      { id: "c2", author: "Larissa", text: "As dicas de substituição foram muito boas." },
    ],
  },
  {
    id: "post-mirna",
    professional: "Mirna",
    professionalRole: "Fisioterapeuta",
    activity: "Circuito postural no escritório",
    time: "Ontem · 16:45",
    location: "Open space · andar 7",
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80",
    caption:
      "Alongamento guiado e ajustes de postura para quem passa muitas horas em reunião e computador.",
    likes: 36,
    likedByUser: false,
    comments: [
      { id: "c3", author: "Mariana", text: "A pausa de 10 minutos melhorou muito minha lombar." },
      { id: "c4", author: "João", text: "Podia repetir toda quarta." },
    ],
  },
  {
    id: "post-felipe",
    professional: "Felipe",
    professionalRole: "Instrutor de defesa pessoal",
    activity: "Defesa pessoal para iniciantes",
    time: "Sex · 18:30",
    location: "Estúdio movimento",
    image:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1400&q=80",
    caption:
      "Treino leve com foco em consciência corporal, deslocamento e técnicas básicas de proteção.",
    likes: 29,
    likedByUser: false,
    comments: [
      { id: "c5", author: "Camila", text: "Foi dinâmico e deu bastante segurança para começar." },
    ],
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    collaborator: "Amanda Costa",
    area: "Produto",
    professional: "Gabriel",
    activity: "Terapia",
    rating: 5,
    quote:
      "O acompanhamento com o Gabriel me ajudou a organizar melhor a rotina e reduzir ansiedade nas semanas mais puxadas.",
    impact: "Mais clareza emocional e constância no trabalho.",
  },
  {
    id: "t2",
    collaborator: "Bruno Lima",
    area: "Financeiro",
    professional: "Giovanna",
    activity: "Terapia",
    rating: 5,
    quote:
      "A Giovanna trouxe ferramentas simples que eu consegui aplicar logo na primeira semana. Fez diferença real.",
    impact: "Melhora de foco e manejo de estresse.",
  },
  {
    id: "t3",
    collaborator: "Carla Nunes",
    area: "Marketing",
    professional: "Vitória",
    activity: "Nutrição",
    rating: 5,
    quote:
      "A oficina com a Vitória foi objetiva e útil. Mudanças pequenas na alimentação já melhoraram minha energia durante a tarde.",
    impact: "Mais energia e menos queda de rendimento.",
  },
];

export const adminReports = [
  "Relatório por período",
  "Performance por profissional",
  "Adesão por tipo de atividade",
  "Impacto de campanhas de cultura",
];

export const quickStats = [
  { label: "Pontuação", value: "1.990", icon: Trophy },
  { label: "Presença", value: "96%", icon: Clock3 },
  { label: "Consistência", value: "5 semanas", icon: Flame },
];

export const adminActions = [
  { title: "Gerenciar usuários", description: "Convites, permissões e segmentação por área.", icon: Users },
  { title: "Profissionais", description: "Disponibilidade, limite de agenda e comparecimento.", icon: Stethoscope },
  { title: "Eventos & cultura", description: "Publicações, check-in, comentários e regras de pontuação.", icon: Sparkles },
  { title: "Notificações em massa", description: "Campanhas por público com disparo agendado.", icon: Send },
  { title: "Regras de pontuação", description: "Pontos por sessão, evento e streak de hábitos.", icon: SlidersHorizontal },
  { title: "Compliance", description: "Permissões, trilhas de auditoria e políticas de retenção.", icon: Building2 },
];
