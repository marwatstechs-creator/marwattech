import { HugeiconsIcon } from "@hugeicons/react";
import { ICONS, type IconName } from "@/lib/icons";

type AppIconProps = {
  name: IconName | string;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  color?: string;
};

/**
 * Convenience wrapper around HugeiconsIcon using the semantic icon registry.
 * Unknown icon names fall back to a neutral icon instead of crashing the
 * page (protects against bad data from the CMS/DB).
 */
export function AppIcon({
  name,
  size = 20,
  className,
  strokeWidth,
  color,
}: AppIconProps) {
  const icon = ICONS[name as IconName] ?? ICONS.arrowRight;
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
    />
  );
}
