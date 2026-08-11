import { AppIcon } from "@/components/app-icon";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoWatermark } from "@/components/marketing/logo-watermark";
import { initials } from "@/lib/utils";

type Testimonial = {
  client_name: string;
  company: string | null;
  role: string | null;
  quote: string;
  rating: number;
  avatar_url: string | null;
};

export function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <Card className="relative h-full overflow-hidden">
      <LogoWatermark className="bottom-0 right-0 h-28 w-28 translate-x-6 translate-y-6" />
      <CardContent className="relative flex h-full flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <span className="text-primary">
            <AppIcon name="quote" size={28} />
          </span>
          <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <AppIcon
                key={i}
                name="star"
                size={15}
                color={i < t.rating ? "hsl(var(--gold))" : "hsl(var(--muted-foreground))"}
                className={i < t.rating ? undefined : "opacity-40"}
              />
            ))}
          </div>
        </div>

        <blockquote className="line-clamp-2 flex-1 text-sm leading-relaxed text-foreground/85">
          “{t.quote}”
        </blockquote>

        <div className="flex items-center gap-3 border-t pt-4">
          <Avatar className="size-10">
            {t.avatar_url ? (
              <AvatarImage src={t.avatar_url} alt={t.client_name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials(t.client_name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t.client_name}
            </p>
            {(t.company || t.role) && (
              <p className="text-xs text-muted-foreground">
                {[t.role, t.company].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
