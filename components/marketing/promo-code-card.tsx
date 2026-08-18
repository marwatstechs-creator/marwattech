import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/app-icon";
import { CopyCode } from "@/components/marketing/copy-code";
import { ShareDeal } from "@/components/marketing/share-deal";
import { promoCodeSlug } from "@/lib/promo/slug";

export type PromoCodeCardData = {
  id: string;
  title: string;
  store: string;
  code: string;
  discount_label?: string | null;
  url: string;
  image_url?: string | null;
  category?: string | null;
  expiry?: string | null;
};

export function PromoCodeCard({ code }: { code: PromoCodeCardData }) {
  return (
    <Card className="card-3d flex flex-col overflow-hidden">
      {code.image_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={code.image_url}
          alt={code.title}
          className="h-36 w-full border-b object-cover"
          loading="lazy"
        />
      ) : (
        <div className="grid h-36 w-full place-items-center border-b bg-gradient-to-br from-primary/15 via-gold/10 to-azure/15">
          <AppIcon name="dollar" size={40} className="text-primary/40" />
        </div>
      )}
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="gold">{code.store}</Badge>
          {code.discount_label && (
            <Badge variant="destructive">{code.discount_label}</Badge>
          )}
        </div>
        <h3 className="font-display mt-3 line-clamp-2 text-base font-bold leading-snug">
          <Link
            href={`/free-courses/${promoCodeSlug(code.title, code.id)}`}
            className="transition-colors hover:text-primary"
          >
            {code.title}
          </Link>
        </h3>
        {code.category && (
          <p className="mt-1 text-xs text-muted-foreground">{code.category}</p>
        )}
        <div className="mt-4">
          <CopyCode code={code.code} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex flex-col items-start gap-1.5">
            <ShareDeal
              title={code.title}
              url={code.url}
              image_url={code.image_url}
              store={code.store}
              discount_label={code.discount_label}
              code={code.code}
            />
            {code.expiry && (
              <span className="text-[11px] text-muted-foreground">Exp: {code.expiry}</span>
            )}
          </div>
          <Button asChild size="sm" className="shrink-0">
            <a href={code.url} target="_blank" rel="noopener noreferrer">
              Get Deal
              <AppIcon name="external" size={14} />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
