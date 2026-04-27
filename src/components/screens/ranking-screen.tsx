"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Award, Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
const rankingCategories = ["Geral"];
interface RankingUser {
  id: string;
  name: string;
  area: string;
  points: number;
  delta: string;
  isMe: boolean;
}

export function RankingScreen() {
  const [selectedCategory, setSelectedCategory] = useState(rankingCategories[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<RankingUser[]>([]);
  const [myPosition, setMyPosition] = useState<number | null>(null);

  const [points, setPoints] = useState(0);

  useEffect(() => {
    async function loadRanking() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ category: selectedCategory });
        const response = await fetch(`/api/user/ranking?${params.toString()}`);
        const result = (await response.json()) as {
          ok?: boolean;
          leaderboard?: RankingUser[];
          me?: { position: number | null; points: number };
        };

        if (result.ok && result.leaderboard) {
          setData(result.leaderboard);
          setMyPosition(result.me?.position ?? null);
          setPoints(result.me?.points ?? 0);
        }
      } catch (error) {
        console.error("Falha ao carregar ranking", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadRanking();
  }, [selectedCategory]);

  return (
    <div className="animate-in fade-in flex flex-col gap-6 pb-24 md:pb-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0264af] via-[#0b75c7] to-[#fd3a83] p-8 text-center text-white shadow-xl md:p-12">
        <div className="absolute -right-10 -top-10 opacity-10">
          <Trophy size={180} />
        </div>
        <h2 className="mb-2 text-base font-medium uppercase tracking-wide opacity-90">
          Sua posição atual
        </h2>
        {isLoading ? (
          <div className="mx-auto my-3 h-12 w-48 animate-pulse rounded bg-white/20 md:h-16 md:w-64" />
        ) : (
          <p className="mb-3 text-5xl font-black md:text-6xl">
            {myPosition ? `${myPosition}º Lugar` : "Não rankeado"}
          </p>
        )}
        <p className="text-base font-medium opacity-90 md:text-lg">
          {myPosition && myPosition <= Math.ceil(data.length * 0.2)
            ? "Você está no Top da empresa. Continue assim!"
            : "Participe de mais atividades e suba no ranking!"}
        </p>
      </div>

      <Card className="overflow-hidden p-0 shadow-sm">
        <div className="hidden grid-cols-12 border-b border-gray-100 bg-gray-50/60 p-4 text-xs font-bold uppercase tracking-wider text-gray-500 md:grid">
          <div className="col-span-1 text-center">Pos</div>
          <div className="col-span-7">Prestador</div>
          <div className="col-span-2 text-center">Crescimento</div>
          <div className="col-span-2 text-right">Pontos</div>
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-b border-gray-50 p-4 md:grid md:grid-cols-12">
                <div className="h-6 w-6 animate-pulse rounded bg-gray-200 md:col-span-1 md:mx-auto" />
                <div className="flex flex-1 items-center gap-3 md:col-span-7">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200 md:h-12 md:w-12" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100 md:hidden" />
                  </div>
                </div>
                <div className="hidden justify-center md:col-span-2 md:flex">
                  <div className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="hidden justify-end md:col-span-2 md:flex">
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Nenhum usuário rankeado nesta categoria.
          </div>
        ) : (
          <div className="flex flex-col">
            {data.map((user, index) => {
              const isPositive = user.delta.startsWith("+");
              const isNegative = user.delta.startsWith("-");

              return (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-4 border-b border-gray-50 p-4 transition-colors last:border-0 hover:bg-gray-50 md:grid md:grid-cols-12",
                    user.isMe ? "bg-[#0264af]/8 hover:bg-[#0264af]/12" : "",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 text-center text-lg font-black md:col-span-1 md:w-full",
                      index === 0
                        ? "text-amber-500"
                        : index === 1
                          ? "text-gray-400"
                          : index === 2
                            ? "text-amber-700"
                            : "text-gray-300",
                    )}
                  >
                    #{index + 1}
                  </div>

                  <div className="flex flex-1 items-center gap-3 md:col-span-7">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 shadow-sm md:h-12 md:w-12">
                      {user.name.slice(0, 1)}
                    </div>
                    <div>
                      <p
                        className={cn(
                          "text-sm font-bold md:text-base",
                          user.isMe ? "text-[#0264af]" : "text-gray-900",
                        )}
                      >
                        {user.isMe ? `${user.name} (Você)` : user.name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-gray-500 md:hidden">
                        {user.points} pts
                        <span
                          className={cn(
                            "ml-1 font-semibold",
                            isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "",
                          )}
                        >
                          {user.delta}
                        </span>
                      </p>
                    </div>
                    {index === 0 ? <Award className="ml-1 hidden text-amber-500 md:block" size={20} /> : null}
                  </div>

                  <div className="hidden items-center justify-center gap-1 font-semibold md:col-span-2 md:flex">
                    {isPositive ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    ) : isNegative ? (
                      <ArrowDownRight className="h-4 w-4 text-rose-500" />
                    ) : null}
                    <span
                      className={cn(
                        "text-sm",
                        isPositive ? "text-emerald-600" : isNegative ? "text-rose-600" : "text-gray-500",
                      )}
                    >
                      {user.delta}
                    </span>
                  </div>

                  <div className="hidden items-center justify-end font-bold text-gray-700 md:col-span-2 md:flex">
                    {user.points} pts
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
