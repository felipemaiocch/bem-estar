export const departmentOptions = [
  {
    value: "DIRETORIA",
    label: "Diretoria",
    description: "Gestão executiva, decisões estratégicas e acompanhamento geral.",
  },
  {
    value: "MARKETING",
    label: "Marketing",
    description: "Campanhas, comunicação, conteúdo e posicionamento.",
  },
  {
    value: "COMERCIAL",
    label: "Comercial",
    description: "Treinamentos comerciais, abordagem, proposta e funil.",
  },
  {
    value: "FINANCEIRO",
    label: "Financeiro",
    description: "Rotinas financeiras, cobranças, lançamentos e conferências.",
  },
  {
    value: "BACKOFFICE",
    label: "Backoffice",
    description: "Apoio operacional, conferências e rotinas internas.",
  },
  {
    value: "RECUPERACAO",
    label: "Recuperação",
    description: "Recuperação de clientes, negociações e acompanhamento.",
  },
  {
    value: "TECNICA",
    label: "Técnica",
    description: "Atividades técnicas, suporte especializado e operação.",
  },
  {
    value: "FACILITIES",
    label: "Facilities",
    description: "Infraestrutura, apoio predial e recursos do ambiente.",
  },
  {
    value: "QUALIDADE",
    label: "Qualidade",
    description: "Padrões, auditoria, revisão e melhoria contínua.",
  },
  {
    value: "ATENDIMENTO",
    label: "Atendimento",
    description: "Padrões de suporte, relacionamento e experiência do cliente.",
  },
  {
    value: "SAC",
    label: "SAC",
    description: "Relacionamento, chamados, suporte e satisfação do cliente.",
  },
  {
    value: "TI",
    label: "TI",
    description: "Tecnologia, sistemas, acessos e suporte interno.",
  },
  {
    value: "PIRAPORA",
    label: "Pirapora",
    description: "Operação e equipe da unidade Pirapora.",
  },
  {
    value: "ASSISTENCIA_24H",
    label: "Assistência 24h",
    description: "Atendimento contínuo, plantões e assistência emergencial.",
  },
  {
    value: "RE",
    label: "RE",
    description: "Área RE e rotinas vinculadas ao departamento.",
  },
  {
    value: "JURIDICO",
    label: "Jurídico",
    description: "Demandas jurídicas, contratos e suporte legal.",
  },
  {
    value: "RETENTROCAS",
    label: "Retentrocas",
    description: "Retenção, trocas e tratativas operacionais relacionadas.",
  },
  {
    value: "RA",
    label: "RA",
    description: "Área RA e rotinas vinculadas ao departamento.",
  },
  {
    value: "TECNICOS",
    label: "Técnicos",
    description: "Equipe técnica, campo e execução especializada.",
  },
] as const;

export type DepartmentCode = (typeof departmentOptions)[number]["value"];

export const departmentValues = departmentOptions.map((department) => department.value) as [
  DepartmentCode,
  ...DepartmentCode[],
];

export function isDepartmentCode(value: unknown): value is DepartmentCode {
  return departmentOptions.some((department) => department.value === value);
}

export function getDepartmentLabel(value?: string | null) {
  return (
    departmentOptions.find((department) => department.value === value)?.label ??
    "Sem departamento"
  );
}

export function getDepartmentDescription(value?: string | null) {
  return (
    departmentOptions.find((department) => department.value === value)?.description ??
    "Departamento ainda não definido para este usuário."
  );
}
