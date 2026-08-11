import Image from "next/image";

/**
 * Branded blog cover — shows the post image, or a Marwat-Tech gradient with the
 * logo mark when a post has no cover image yet.
 */
export function BlogCover({
  src,
  alt,
  className = "",
  featured = false,
}: {
  src: string | null;
  alt: string;
  className?: string;
  featured?: boolean;
}) {
  return (
    <div className={`relative w-full overflow-hidden bg-muted/50 ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
        />
      ) : (
        <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#7464c6]/30 via-[#f8c640]/15 to-[#5f4fa8]/30">
          {/* dot pattern */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(116,100,198,0.4) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          <img
            src="/assets/logo-light-square.svg"
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 m-auto h-[34%] w-[34%] object-contain opacity-35 dark:hidden"
          />
          <img
            src="/assets/logo-dark-square.svg"
            alt=""
            aria-hidden
            draggable={false}
            className="absolute inset-0 m-auto hidden h-[34%] w-[34%] object-contain opacity-35 dark:block"
          />
        </div>
      )}
      {featured && (
        <span className="absolute right-3.5 top-3.5 z-10 rounded-full border border-white/15 bg-black/55 px-3 py-1 font-mono text-[10.5px] uppercase tracking-wider text-white backdrop-blur-sm">
          Featured
        </span>
      )}
    </div>
  );
}
