export const departmentOptions = [
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
    value: "ATENDIMENTO",
    label: "Atendimento",
    description: "Padrões de suporte, relacionamento e experiência do cliente.",
  },
] as const;

export type DepartmentCode = (typeof departmentOptions)[number]["value"];

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
