import { Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "./reveal";

const TESTIMONIALS = [
  {
    name: "Sardor Toshmatov",
    role: "Frontend Developer",
    avatar: "ST",
    text: "MeetHub orqali Tashkentdagi eng yaxshi texnologiya uchrashuvlarini topdim. Real muloqot, real tarmoq!",
    rating: 5,
  },
  {
    name: "Malika Yusupova",
    role: "UX Designer",
    avatar: "MY",
    text: "Har hafta yangi speaking club topaman. Platforma juda qulay va tez — hatto mobil telefondan ham zo'r ishlaydi.",
    rating: 5,
  },
  {
    name: "Bobur Rahimov",
    role: "Startup Founder",
    avatar: "BR",
    text: "Tashkilotchi sifatida MeetHub menga 50+ ishtirokchi to'plashga yordam berdi. Reputatsiya tizimi ishni qulaylashtiradi.",
    rating: 5,
  },
] as const;

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="from-primary flex size-10 items-center justify-center rounded-full bg-linear-to-br to-blue-600 text-sm font-bold text-white">
      {initials}
    </div>
  );
}

export async function TestimonialsSection() {
  const t = await getTranslations("Landing");
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("testimonialsTitle")}
          </h2>
          <p className="text-muted-foreground mt-2">
            {t("testimonialsSubtitle")}
          </p>
        </div>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-3">
        {TESTIMONIALS.map((item, i) => (
          <Reveal key={item.name} delay={i as 0 | 1 | 2}>
            <div className="glass flex h-full flex-col gap-4 rounded-2xl p-6">
              <Stars count={item.rating} />
              <p className="text-muted-foreground flex-1 text-sm leading-relaxed">
                &ldquo;{item.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Avatar initials={item.avatar} />
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="text-muted-foreground text-xs">{item.role}</p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
