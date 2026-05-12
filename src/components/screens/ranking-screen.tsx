"use client";

import { useEffect, useState } from "react";
import { Award, EyeOff, Medal, ShieldCheck, Trophy } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const rankingCategories = ["Geral"];

interface RankingUser {
  id: string;
  position: number;
  name: string;
  area: string;
  points: number;
  isMe: boolean;
  isAnonymous: boolean;
  showInRanking: boolean;
}

export function RankingScreen() {
  const [selectedCategory] = useState(rankingCategories[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<RankingUser[]>([]);
  const [me, setMe] = useState<RankingUser | null>(null);

  useEffect(() => {
    async function loadRanking() {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({ category: selectedCategory });
        const response = await fetch(`/api/user/ranking?${params.toString()}`);
        const result = (await response.json()) as {
          ok?: boolean;
          leaderboard?: RankingUser[];
          me?: RankingUser | null;
        };

        if (result.ok) {
          setLeaderboard(result.leaderboard ?? []);
          setMe(result.me ?? null);
        }
      } catch (error) {
        console.error("Falha ao carregar ranking", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadRanking();
  }, [selectedCategory]);

  const isMeInTopFive = leaderboard.some((user) => user.isMe);

  return (
    <div className="animate-in fade-in flex flex-col gap-6 pb-24 md:pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0264af] via-[#0b75c7] to-[#fd3a83] p-8 text-white shadow-xl md:p-10">
        <div className="absolute -right-10 -top-10 opacity-10">
          <Trophy size={180} />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/75">
          Ranking geral
        </p>
        <h2 className="mt-2 text-3xl font-black md:text-5xl">
          Top 5 da plataforma
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
          A lista pública mostra apenas os cinco primeiros. Sua posição completa
          aparece separada para você.
        </p>
      </div>

      <Card className="overflow-hidden p-0 shadow-sm">
        <div className="hidden grid-cols-12 border-b border-gray-100 bg-gray-50/60 p-4 text-xs font-bold uppercase tracking-wider text-gray-500 md:grid">
          <div className="col-span-1 text-center">Pos</div>
          <div className="col-span-7">Participante</div>
          <div className="col-span-2 text-center">Privacidade</div>
          <div className="col-span-2 text-right">Pontos</div>
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 border-b border-gray-50 p-4 md:grid md:grid-cols-12">
                <div className="h-6 w-6 animate-pulse rounded bg-gray-200 md:col-span-1 md:mx-auto" />
                <div className="flex flex-1 items-center gap-3 md:col-span-7">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200 md:h-12 md:w-12" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
                <div className="hidden justify-center md:col-span-2 md:flex">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="hidden justify-end md:col-span-2 md:flex">
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Nenhum usuário rankeado nesta categoria.
          </div>
        ) : (
          <div className="flex flex-col">
            {leaderboard.map((user) => (
              <RankingRow key={user.id} user={user} />
            ))}
          </div>
        )}
      </Card>

      {!isLoading && me && !isMeInTopFive ? (
        <Card className="border-[#0264af]/20 bg-[#0264af]/5 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0264af] text-lg font-black text-white">
                #{me.position}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#0264af]">
                  Sua posição
                </p>
                <h3 className="text-xl font-black text-slate-950">
                  {me.name}
                </h3>
                <p className="text-sm text-slate-500">{me.area}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-2xl font-black text-slate-950">{me.points} pts</p>
              <p className="text-xs font-medium text-slate-500">
                A lista completa fica privada.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {!isLoading && me && isMeInTopFive ? (
        <Card className="flex items-center gap-3 border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <ShieldCheck size={18} />
          Você já está no Top 5 e aparece destacado apenas para você.
        </Card>
      ) : null}
    </div>
  );
}

function RankingRow({ user }: { user: RankingUser }) {
  const isPodium = user.position <= 3;

  return (
    <div
      className={cn(
        "flex items-center gap-4 border-b border-gray-50 p-4 transition-colors last:border-0 hover:bg-gray-50 md:grid md:grid-cols-12",
        user.isMe ? "bg-[#0264af]/8 hover:bg-[#0264af]/12" : "",
      )}
    >
      <div
        className={cn(
          "w-8 text-center text-lg font-black md:col-span-1 md:w-full",
          user.position === 1
            ? "text-amber-500"
            : user.position === 2
              ? "text-gray-400"
              : user.position === 3
                ? "text-amber-700"
                : "text-gray-300",
        )}
      >
        #{user.position}
      </div>

      <div className="flex flex-1 items-center gap-3 md:col-span-7">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shadow-sm md:h-12 md:w-12",
            user.isAnonymous
              ? "bg-slate-100 text-slate-500"
              : "bg-[#0264af]/10 text-[#0264af]",
          )}
        >
          {user.isAnonymous ? <EyeOff size={18} /> : user.name.slice(0, 1)}
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
          <p className="text-xs text-gray-500">{user.area}</p>
        </div>
        {user.position === 1 ? <Award className="ml-1 hidden text-amber-500 md:block" size={20} /> : null}
        {isPodium && user.position !== 1 ? <Medal className="ml-1 hidden text-slate-400 md:block" size={19} /> : null}
      </div>

      <div className="hidden items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider md:col-span-2 md:flex">
        {!user.showInRanking ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-500">
            Anônimo
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
            Público
          </span>
        )}
      </div>

      <div className="font-bold text-gray-700 md:col-span-2 md:flex md:justify-end">
        {user.points} pts
      </div>
    </div>
  );
}
