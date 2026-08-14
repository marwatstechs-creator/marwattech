import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/app-icon";
import { CopyCode } from "@/components/marketing/copy-code";

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
          {code.title}
        </h3>
        {code.category && (
          <p className="mt-1 text-xs text-muted-foreground">{code.category}</p>
        )}
        <div className="mt-4">
          <CopyCode code={code.code} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          {code.expiry ? (
            <span className="text-xs text-muted-foreground">Exp: {code.expiry}</span>
          ) : (
            <span />
          )}
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
