export function PageSkeleton({ title = "Carregando" }: { title?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <div className="skeleton h-3 w-28 rounded-full" />
        <div className="skeleton h-10 w-56 rounded-3xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`${title}-${index}`}
            className="skeleton h-36 rounded-[24px]"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="skeleton h-[320px] rounded-[28px]" />
        <div className="grid gap-4">
          <div className="skeleton h-[150px] rounded-[28px]" />
          <div className="skeleton h-[150px] rounded-[28px]" />
        </div>
      </div>
    </div>
  );
}
