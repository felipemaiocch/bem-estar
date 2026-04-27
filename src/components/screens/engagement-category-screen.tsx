"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Leaf,
  MapPin,
  MessageSquareText,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import type { EngagementCategorySlug } from "@/types";

const engagementCategoryPages = {
  "saude-bem-estar": {
    icon: Leaf,
    eyebrow: "Saúde e bem-estar",
    heroTitle: "Cuidado contínuo com foco em saúde física, emocional e prevenção.",
    heroDescription: "Psicologia, fisioterapia, nutrição e enfermagem organizadas em uma frente clara de acompanhamento e bem-estar.",
    heroGradient: "from-emerald-500 via-teal-500 to-cyan-500",
    featureList: ["Psicologia para apoio emocional e rotina mental saudável.", "Fisioterapia para postura, dor e recuperação funcional.", "Nutrição e enfermagem como suporte contínuo de saúde."],
    sectionEyebrow: "Bem-estar ativo",
    sectionTitle: "Frentes de atendimento",
    sectionDescription: "Areas principais de saúde e bem-estar disponíveis na plataforma.",
    feedTitle: "Frentes de cuidado",
    feedDescription: "As quatro bases de cuidado presentes na operação atual.",
    feedItems: [
      { title: "Psicologia", description: "Apoio emocional, escuta qualificada e fortalecimento da rotina mental." },
      { title: "Fisioterapia", description: "Postura, recuperação funcional e prevenção de dores recorrentes." },
      { title: "Nutrição e enfermagem", description: "Orientação alimentar, apoio preventivo e acompanhamento básico de saúde." },
    ],
    interactionTitle: "Ações rápidas",
    interactionDescription: "Ative rotinas com poucos cliques e acompanhe o impacto em pontos.",
    comments: ["84 prestadores concluíram o check-in diário de humor hoje.", "Nova leva de vouchers para terapia online foi liberada para o time.", "O desafio de sono já elevou a consistência semanal em 12%."],
    primaryAction: "Agendar cuidado",
    secondaryAction: "Ativar benefício",
  },
  cultura: {
    icon: Sparkles,
    eyebrow: "Cultura organizacional",
    heroTitle: "Cultura viva com repertório, expressão e desenvolvimento contínuo.",
    heroDescription: "Filosofia, música e inglês organizados como frentes culturais que fortalecem repertório, expressão e convivência.",
    heroGradient: "from-indigo-600 via-blue-600 to-cyan-500",
    featureList: ["Filosofia para reflexão, senso crítico e repertório humano.", "Música como experiência cultural e conexão entre pessoas.", "Inglês como desenvolvimento prático e ampliação de acesso."],
    sectionEyebrow: "Conteúdo interno",
    sectionTitle: "Frentes culturais da operação",
    sectionDescription: "Areas principais que entram dentro da categoria cultura.",
    feedTitle: "Pilares em destaque",
    feedDescription: "As três bases culturais que estruturam essa categoria.",
    feedItems: [
      { title: "Filosofia", description: "Reflexão, pensamento crítico e conversas que ampliam repertório." },
      { title: "Música", description: "Vivências, expressão e integração por meio de atividades musicais." },
      { title: "Inglês", description: "Desenvolvimento de idioma aplicado ao cotidiano e à autonomia." },
    ],
    interactionTitle: "Engajamento cultural",
    interactionDescription: "Mantenha feedbacks rápidos e ações simples para ampliar adesão.",
    comments: ["A campanha de reconhecimento dobrou a participação do time de produto.", "O vídeo da liderança teve 92% de conclusão no mobile.", "A nova trilha de onboarding reduziu dúvidas nas duas primeiras semanas."],
    primaryAction: "Ver campanha",
    secondaryAction: "Compartilhar com time",
  },
  "agenda-dr": {
    icon: CalendarDays,
    eyebrow: "Agenda dr",
    heroTitle: "Agenda da dr.monitora com encontros, festas e ações especiais.",
    heroDescription: "Tudo o que envolve encontros, comemorações e eventos especiais fica concentrado aqui, inclusive quando houver festas.",
    heroGradient: "from-[#0264af] via-[#0b75c7] to-[#fd3a83]",
    featureList: ["Eventos, encontros e festas da operação em uma única agenda.", "Confirmação de presença e comunicação centralizada.", "Espaço para programações especiais ao longo do mês."],
    sectionEyebrow: "Programação da agenda",
    sectionTitle: "Próximas ações da agenda dr",
    sectionDescription: "Eventos, encontros e festas concentrados em uma única frente.",
    feedTitle: "Como a agenda dr funciona",
    feedDescription: "Uma única categoria para concentrar encontros e ativações especiais.",
    feedItems: [
      { title: "Eventos", description: "Palestras, talks e encontros especiais entram direto na agenda dr." },
      { title: "Festas", description: "Quando houver comemorações, elas aparecem dentro dessa mesma agenda." },
      { title: "Confirmação simples", description: "O prestador visualiza, confirma presença e acompanha a programação." },
    ],
    interactionTitle: "Engajamento da agenda",
    interactionDescription: "Eventos e festas concentrados no mesmo fluxo de acompanhamento.",
    comments: ["As festas passam a entrar dentro da agenda dr quando forem abertas.", "Os eventos especiais ficam agrupados em uma frente única.", "A confirmação de presença ocorre direto pelo app."],
    primaryAction: "Confirmar presença",
    secondaryAction: "Compartilhar evento",
  },
} as const;

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

  const cardsToRender = dbCards.length > 0 ? dbCards : [];

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
