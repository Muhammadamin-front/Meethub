import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

// Relative imports (not the `@/` alias): this runs via tsx, outside Next.
import {
  EventStatus,
  PrismaClient,
  UserRole,
} from "../src/generated/prisma/client";
import { UZ_CITIES } from "../src/lib/constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DAY = 86_400_000;
const HOUR = 3_600_000;

function cityCoord(name: string) {
  return UZ_CITIES.find((c) => c.name === name) ?? UZ_CITIES[0];
}

/** Promote the configured admin (original behaviour). */
async function promoteAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  if (!email) return;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.warn(`⚠ No user with email "${email}" yet — sign in once first.`);
    return;
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { role: UserRole.ADMIN },
  });
  console.log(`✓ Promoted ${email} to ADMIN.`);
}

const ORGS = [
  { key: "uzdev", name: "UZ Dev Community", desc: "O‘zbekistondagi dasturchilar hamjamiyati — meetup, workshop va networking." },
  { key: "speak", name: "Tashkent Speaking Club", desc: "Ingliz tilida erkin gaplashishni mashq qiladigan klub." },
  { key: "startup", name: "Startup Garage UZ", desc: "Founderlar, pitch kechalari va startap ekotizimi." },
  { key: "design", name: "Design Hamjamiyat", desc: "UX/UI va grafik dizaynerlar uchun tadbirlar." },
  { key: "itpark", name: "IT Park Events", desc: "Texnologiya, ta’lim va karyera tadbirlari." },
  { key: "marketing", name: "SMM & Marketing UZ", desc: "Raqamli marketing, SMM va brending bo‘yicha uchrashuvlar." },
  { key: "photo", name: "Photo Walk Tashkent", desc: "Foto-sayrlar va fotografiya ustaxonalari." },
  { key: "founders", name: "Founders Meetup", desc: "Tadbirkorlar uchun norasmiy networking kechalari." },
] as const;

type Tpl = {
  org: string;
  title: string;
  category: string;
  city: string;
  desc: string;
  inDays: number;
  hours: number;
  capacity: number;
};

const EVENTS: Tpl[] = [
  { org: "uzdev", title: "UzGeeks: Next.js 16 chuqur tahlil", category: "IT", city: "Toshkent", desc: "Server Components, caching va yangi App Router imkoniyatlari haqida amaliy meetup.", inDays: 3, hours: 3, capacity: 120 },
  { org: "uzdev", title: "TypeScript Workshop: type-safe API", category: "IT", city: "Toshkent", desc: "Amaliy mashg‘ulot: zod va type-safe ma’lumot oqimi.", inDays: 10, hours: 4, capacity: 60 },
  { org: "uzdev", title: "Open Source kuni", category: "IT", city: "Samarqand", desc: "Birinchi open-source hissangizni qo‘shing — mentorlar yordamida.", inDays: 17, hours: 5, capacity: 80 },
  { org: "speak", title: "Speaking Club — Beginner", category: "Speaking", city: "Toshkent", desc: "Boshlovchilar uchun ingliz tilida erkin suhbat kechasi.", inDays: 2, hours: 2, capacity: 40 },
  { org: "speak", title: "Speaking Club — Advanced Debate", category: "Speaking", city: "Toshkent", desc: "Munozara formatida ingliz tilini mukammallashtiring.", inDays: 9, hours: 2, capacity: 35 },
  { org: "speak", title: "English Movie Night", category: "Speaking", city: "Buxoro", desc: "Film ko‘rib, keyin ingliz tilida muhokama.", inDays: 14, hours: 3, capacity: 50 },
  { org: "startup", title: "Startup Pitch Night #7", category: "Startup", city: "Toshkent", desc: "5 ta startap investorlar oldida pitch qiladi. Networking + savol-javob.", inDays: 5, hours: 3, capacity: 150 },
  { org: "startup", title: "MVP-ni 1 haftada qurish", category: "Startup", city: "Toshkent", desc: "No-code va lean usullar bilan tez MVP. Amaliy.", inDays: 21, hours: 4, capacity: 70 },
  { org: "startup", title: "Fandraising 101", category: "Business", city: "Andijon", desc: "Investitsiya jalb qilish asoslari — term sheet, valuation, pitch deck.", inDays: 26, hours: 3, capacity: 90 },
  { org: "design", title: "Figma Masterclass", category: "Design", city: "Toshkent", desc: "Auto-layout, komponentlar va dizayn-tizim asoslari.", inDays: 4, hours: 3, capacity: 60 },
  { org: "design", title: "UX tadqiqot kechasi", category: "Design", city: "Namangan", desc: "Foydalanuvchi intervyusi va usability test amaliyoti.", inDays: 13, hours: 2, capacity: 45 },
  { org: "design", title: "Portfolio Review", category: "Design", city: "Toshkent", desc: "Dizaynerlar portfoliosini birga ko‘rib chiqamiz va fikr beramiz.", inDays: 20, hours: 2, capacity: 30 },
  { org: "itpark", title: "IT Park Career Day", category: "Networking", city: "Toshkent", desc: "Kompaniyalar bilan tanishuv, ish o‘rinlari va karyera maslahatlari.", inDays: 7, hours: 6, capacity: 300 },
  { org: "itpark", title: "Data Science Intro", category: "Science", city: "Samarqand", desc: "Python, pandas va birinchi ML modeli.", inDays: 16, hours: 4, capacity: 80 },
  { org: "itpark", title: "Cybersecurity asoslari", category: "IT", city: "Farg‘ona", desc: "Web ilovalarni himoyalash va keng tarqalgan hujumlar.", inDays: 23, hours: 3, capacity: 70 },
  { org: "marketing", title: "SMM Strategiya 2026", category: "Marketing", city: "Toshkent", desc: "Instagram va Telegram’da organik o‘sish taktikalari.", inDays: 6, hours: 2, capacity: 100 },
  { org: "marketing", title: "Kontent yaratish ustaxonasi", category: "Marketing", city: "Buxoro", desc: "Reels, stsenariy va montaj asoslari.", inDays: 15, hours: 3, capacity: 55 },
  { org: "marketing", title: "Brending kechasi", category: "Business", city: "Toshkent", desc: "Lokal brendlar tajribasi va pozitsiyalash.", inDays: 28, hours: 2, capacity: 80 },
  { org: "photo", title: "Eski shahar foto-sayri", category: "Photography", city: "Samarqand", desc: "Tarixiy joylarda fotografiya amaliyoti — kompozitsiya va yorug‘lik.", inDays: 8, hours: 3, capacity: 25 },
  { org: "photo", title: "Portret yoritish", category: "Photography", city: "Toshkent", desc: "Studiyada portret uchun yorug‘lik sxemalari.", inDays: 19, hours: 3, capacity: 20 },
  { org: "founders", title: "Founders Coffee", category: "Networking", city: "Toshkent", desc: "Tadbirkorlar uchun ertalabki norasmiy networking.", inDays: 1, hours: 2, capacity: 40 },
  { org: "founders", title: "Founders Dinner", category: "Networking", city: "Toshkent", desc: "Kechki norasmiy uchrashuv va tajriba almashish.", inDays: 12, hours: 3, capacity: 50 },
  { org: "founders", title: "Women in Tech", category: "Networking", city: "Andijon", desc: "Texnologiyadagi ayollar uchun ilhom va networking kechasi.", inDays: 24, hours: 3, capacity: 90 },
  { org: "uzdev", title: "React Performance", category: "IT", city: "Toshkent", desc: "Memo, profiler va re-render optimizatsiyasi bo‘yicha o‘tib bo‘lgan meetup.", inDays: -5, hours: 3, capacity: 100 },
  { org: "speak", title: "Speaking Club — Retro", category: "Speaking", city: "Toshkent", desc: "O‘tgan haftadagi suhbat kechasi.", inDays: -2, hours: 2, capacity: 40 },
];

async function seedContent() {
  const orgIdByKey = new Map<string, string>();
  for (const o of ORGS) {
    const user = await prisma.user.upsert({
      where: { clerkId: `seed_${o.key}` },
      create: {
        clerkId: `seed_${o.key}`,
        name: o.name,
        nickname: o.name,
        email: `${o.key}@meethub.seed`,
        role: UserRole.ORGANIZATION,
      },
      update: { name: o.name },
    });
    const org = await prisma.organization.upsert({
      where: { ownerUserId: user.id },
      create: {
        name: o.name,
        description: o.desc,
        status: "VERIFIED",
        ownerUserId: user.id,
      },
      update: { name: o.name, description: o.desc, status: "VERIFIED" },
    });
    orgIdByKey.set(o.key, org.id);
  }

  const now = Date.now();
  let i = 0;
  for (const e of EVENTS) {
    i += 1;
    const organizationId = orgIdByKey.get(e.org);
    if (!organizationId) continue;
    const startsAt = new Date(now + e.inDays * DAY);
    const endsAt = new Date(startsAt.getTime() + e.hours * HOUR);
    const coord = cityCoord(e.city);
    const id = `seed_evt_${i}`;
    const data = {
      organizationId,
      title: e.title,
      description: e.desc,
      category: e.category,
      city: e.city,
      location: `${e.city}, ${e.city === "Toshkent" ? "Amir Temur ko‘chasi" : "Markaz"}`,
      latitude: coord.lat,
      longitude: coord.lng,
      startsAt,
      endsAt,
      capacity: e.capacity,
      status:
        endsAt < new Date() ? EventStatus.FINISHED : EventStatus.PUBLISHED,
    };
    await prisma.event.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  }
  console.log(`✓ Seeded ${ORGS.length} organizers and ${EVENTS.length} events.`);
}

async function main() {
  try {
    await promoteAdmin();
    await seedContent();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
