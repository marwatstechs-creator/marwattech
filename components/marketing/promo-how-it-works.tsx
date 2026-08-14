import { AppIcon } from "@/components/app-icon";

const POINTS = [
  {
    icon: "refresh",
    title: "New courses all the time",
    desc: "We list fresh deals continuously — the page updates with new courses as they appear, every hour.",
  },
  {
    icon: "clock",
    title: "Coupons expire fast",
    desc: "Each code is limited. If you come late, free courses can already be claimed or expired — that's why you may miss some.",
  },
  {
    icon: "sparkles",
    title: "Come back regularly",
    desc: "Deals rotate every few hours and the best free courses go first. Check back often to catch the newest ones.",
  },
  {
    icon: "star",
    title: "Bookmark for deals",
    desc: "Save this page and you'll never miss a fresh drop. New courses show up here all the time.",
  },
];

/** Bottom note explaining how the promo system works. */
export function PromoHowItWorks() {
  return (
    <div className="mt-12 rounded-2xl border bg-card p-6 sm:p-8">
      <h2 className="font-display text-lg font-bold">How our promo system works</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Here&apos;s what to know so you always grab deals before they&apos;re gone.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {POINTS.map((p) => (
          <div key={p.title} className="flex gap-3">
            <span className="icon-3d-tile grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <AppIcon name={p.icon as "refresh"} size={17} />
            </span>
            <div>
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
