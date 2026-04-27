import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Acesso negado
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">403</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Você não tem permissão para acessar esta área com o perfil atual.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0264af] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#015690]"
          >
            Voltar para o login
          </Link>
        </div>
      </div>
    </main>
  );
}
