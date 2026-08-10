import { HugeiconsIcon } from "@hugeicons/react";
import { ICONS, type IconName } from "@/lib/icons";

type AppIconProps = {
  name: IconName;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  color?: string;
};

/**
 * Convenience wrapper around HugeiconsIcon using the semantic icon registry.
 */
export function AppIcon({
  name,
  size = 20,
  className,
  strokeWidth,
  color,
}: AppIconProps) {
  return (
    <HugeiconsIcon
      icon={ICONS[name]}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      className={className}
    />
  );
}
