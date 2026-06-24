"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type FAQItem = { q: string; a: string };

function FAQRow({
  item,
  defaultOpen,
}: {
  item: FAQItem;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-border/50 border-b last:border-0">
      <button
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium sm:text-base">{item.q}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96 pb-4" : "max-h-0",
        )}
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          {item.a}
        </p>
      </div>
    </div>
  );
}

export function FAQSection({
  items,
  title,
  subtitle,
}: {
  items: FAQItem[];
  title: string;
  subtitle: string;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground mt-2">{subtitle}</p>
      </div>

      <div className="glass rounded-2xl px-6">
        {items.map((item, i) => (
          <FAQRow key={i} item={item} defaultOpen={i === 0} />
        ))}
      </div>
    </section>
  );
}
