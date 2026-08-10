import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/app-icon";
import { LogoWatermark } from "@/components/marketing/logo-watermark";
import type { IconName } from "@/lib/icons";

type Service = {
  title: string;
  slug: string;
  icon: string | null;
  summary: string | null;
};

export function ServiceCard({ service }: { service: Service }) {
  const iconName = (service.icon ?? "code") as IconName;

  return (
    <Link href={`/services/${service.slug}`} className="group block h-full">
      <Card className="relative h-full overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-lg">
        <LogoWatermark className="bottom-0 right-0 h-28 w-28 translate-x-6 translate-y-6" />
        <CardContent className="relative flex flex-col gap-4 p-6">
          <span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <AppIcon name={iconName} size={24} />
          </span>
          <h3 className="font-display text-lg font-semibold text-foreground">
            {service.title}
          </h3>
          {service.summary && (
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {service.summary}
            </p>
          )}
          <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            Learn more
            <AppIcon
              name="arrowRight"
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
