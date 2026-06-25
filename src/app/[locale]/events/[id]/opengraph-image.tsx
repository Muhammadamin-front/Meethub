import { ImageResponse } from "next/og";

import { APP_NAME } from "@/lib/constants";
import { prisma } from "@/server/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = APP_NAME;

/**
 * Load a Google font subset covering exactly the glyphs we render (so Uzbek
 * Latin + Russian Cyrillic show correctly). Fetching server-side without a
 * browser UA makes Google return a TTF, which Satori can use.
 */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  const url = `https://fonts.googleapis.com/css2?family=Inter:wght@700&text=${encodeURIComponent(
    text,
  )}`;
  try {
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      title: true,
      category: true,
      location: true,
      startsAt: true,
      organization: { select: { name: true } },
    },
  });

  const title = event?.title ?? APP_NAME;
  const category = event?.category ?? "";
  const location = event?.location ?? "";
  const org = event?.organization.name ?? "";
  const date = event
    ? new Intl.DateTimeFormat(locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }).format(event.startsAt)
    : "";

  const fontData = await loadFont(
    `${APP_NAME}MeetHub${title}${category}${location}${org}${date} ·`,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px",
          background: "linear-gradient(135deg, #140a2e 0%, #0a0613 55%, #1b0f3d 100%)",
          color: "white",
          fontFamily: "Inter",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", fontSize: 38 }}>
          <span style={{ color: "white" }}>Meet</span>
          <span style={{ color: "#a78bfa" }}>Hub</span>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {category ? (
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                background: "rgba(167,139,250,0.18)",
                color: "#c4b5fd",
                padding: "8px 20px",
                borderRadius: 999,
                fontSize: 26,
                marginBottom: 24,
              }}
            >
              {category}
            </div>
          ) : null}
          <div style={{ fontSize: 70, lineHeight: 1.1, display: "flex" }}>
            {title.length > 80 ? title.slice(0, 79) + "…" : title}
          </div>
        </div>

        {/* Meta */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 30,
            color: "#cbb9f5",
          }}
        >
          {date ? <div style={{ display: "flex" }}>{date}</div> : null}
          <div style={{ display: "flex", color: "#9d8bd0" }}>
            {[location, org].filter(Boolean).join("  ·  ")}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Inter", data: fontData, weight: 700, style: "normal" }]
        : [],
    },
  );
}
