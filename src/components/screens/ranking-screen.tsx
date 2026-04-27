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

  // Reward Store State
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [points, setPoints] = useState(0);
  const [redeemedItems, setRedeemedItems] = useState<string[]>([]);

  useEffect(() => {
    async function loadRanking() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ category: selectedCategory });
        const response = await fetch(`/api/user/ranking?${params.toString()}`);
        const result = (await response.json()) as {
          ok?: boolean;
          leaderboard?: RankingUser[];
          me?: { position: number | null };
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
      {/* Lojinha de Recompensas Banner */}
      <div className="flex flex-wrap items-center justify-between rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-amber-900">Exchange (Sua lojinha de wellness)</p>
            <p className="text-sm text-amber-700">Troque seus <strong className="font-black">{points} pts</strong> acumulados por um day-off ou vale-massagem!</p>
          </div>
        </div>
        <button
          onClick={() => setIsStoreOpen(true)}
          className="mt-3 md:mt-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-amber-600"
        >
          Acessar recompensas
        </button>
      </div>

      {/* Lojinha Modal */}
      {isStoreOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-xl rounded-[2rem] bg-white p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsStoreOpen(false)}
              className="absolute right-6 top-6 rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <Award className="text-amber-500" /> Mercado de Recompensas
              </h2>
              <p className="text-slate-500 mt-1">Você possui <strong className="text-amber-600 font-bold">{points} Pontos</strong> para usar hoje.</p>
            </div>

            <div className="overflow-y-auto no-scrollbar flex flex-col gap-4">
              {[
                { id: "dayoff", name: "Half Day-Off (Sexta-feira)", pts: 3000, icon: "🎉" },
                { id: "ifood", name: "Voucher iFood R$ 50", pts: 1500, icon: "🍔" },
                { id: "massage", name: "Sessão de Quick Massage na Sede", pts: 1000, icon: "💆" },
                { id: "gympass", name: "Upgrade Gympass (+1 nível) por 1 mês", pts: 2500, icon: "🏋️" }
              ].map(item => {
                const canAfford = points >= item.pts;
                const isRedeemed = redeemedItems.includes(item.id);
                return (
                  <div key={item.id} className={cn("flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl border", isRedeemed ? "bg-emerald-50 border-emerald-100 opacity-70" : "bg-slate-50 border-slate-100")}>
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-2xl border border-slate-100">{item.icon}</div>
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-1">{item.name}</h4>
                        <p className={cn("text-sm font-bold", canAfford ? "text-amber-600" : "text-slate-400")}>{item.pts} pontos</p>
                      </div>
                    </div>
                    <button
                      disabled={!canAfford || isRedeemed}
                      onClick={() => {
                        setPoints(p => p - item.pts);
                        setRedeemedItems(prev => [...prev, item.id]);
                      }}
                      className={cn(
                        "w-full sm:w-auto px-4 py-2 shrink-0 rounded-xl text-sm font-bold transition whitespace-nowrap",
                        isRedeemed
                          ? "bg-emerald-500 text-white cursor-not-allowed"
                          : canAfford
                            ? "bg-slate-900 text-white hover:scale-105"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {isRedeemed ? "Resgatado! ✓" : "Resgatar"}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

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
