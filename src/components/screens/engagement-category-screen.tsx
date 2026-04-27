"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageSquareText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { engagementCategoryPages } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { EngagementCategorySlug } from "@/types";

const statusTone: Record<string, string> = {
  Confirmado: "bg-emerald-50 text-emerald-700",
  Pendente: "bg-amber-50 text-amber-700",
  Publicado: "bg-blue-50 text-blue-700",
  Ativo: "bg-blue-50 text-blue-700",
  "Agenda aberta": "bg-blue-50 text-blue-700",
  Planejamento: "bg-violet-50 text-violet-700",
  "Inscrições abertas": "bg-amber-50 text-amber-700",
  "Sempre disponível": "bg-emerald-50 text-emerald-700",
};

export function EngagementCategoryScreen({ slug }: { slug: EngagementCategorySlug }) {
  const page = engagementCategoryPages[slug];
  const Icon = page.icon;

  const [dbCards, setDbCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => {
    async function loadCards() {
      try {
        const res = await fetch(`/api/user/cards?category=${slug}`);
        const data = await res.json();
        if (data.ok) {
          setDbCards(data.cards);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCards(false);
      }
    }
    void loadCards();
  }, [slug]);

  const cardsToRender = dbCards.length > 0 ? dbCards : (!loadingCards ? page.cards : []);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className={cn("overflow-hidden bg-gradient-to-br text-white", page.heroGradient)}>
          <CardContent className="space-y-4 px-5 pb-5 pt-6 sm:px-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90">
              <Icon className="h-4 w-4" />
              {page.eyebrow}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {page.heroTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">
                {page.heroDescription}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diferenciais da categoria</CardTitle>
            <CardDescription>Conteúdo e ações específicas para essa frente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {page.featureList.map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-[24px] bg-slate-50 px-4 py-4"
              >
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl bg-white text-blue-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p>{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <SectionHeading
          eyebrow={page.sectionEyebrow}
          title={page.sectionTitle}
          description={page.sectionDescription}
        />
        <div className="grid gap-4 xl:grid-cols-3">
          {loadingCards ? (
             <div className="col-span-3 py-10 text-center text-slate-500">Carregando conteúdos...</div>
          ) : cardsToRender.map((item: any) => (
            <Card key={item.id || item.title} className="overflow-hidden flex flex-col">
              <div className={cn("h-40 bg-gradient-to-br relative", item.gradient || "from-slate-200 to-slate-100")}>
                 {item.imageUrl && (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
                 )}
              </div>
              <CardContent className="space-y-4 px-5 pb-5 pt-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold tracking-tight text-slate-950">
                        {item.title}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 line-clamp-1">
                        <CalendarDays className="h-4 w-4 shrink-0" />
                        {item.date}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-500 line-clamp-1">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {item.location}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
                        statusTone[item.status] ?? "bg-slate-100 text-slate-700",
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-[24px] bg-slate-50 px-4 py-4 text-sm mt-4">
                    <span className="text-slate-500">Pontos na participação</span>
                    <span className="font-semibold text-slate-950">+{item.points}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button>{page.primaryAction}</Button>
                    <Button variant="secondary">{page.secondaryAction}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>{page.feedTitle}</CardTitle>
            <CardDescription>{page.feedDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {page.feedItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4"
              >
                <p className="font-medium text-slate-950">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{page.interactionTitle}</CardTitle>
            <CardDescription>{page.interactionDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {page.comments.map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-slate-100 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
                    <MessageSquareText className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              </div>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary">{page.secondaryAction}</Button>
              <Button>
                {page.primaryAction}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
