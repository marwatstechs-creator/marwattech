import Link from "next/link";

import { SITE } from "@/lib/constants";

/** Floating WhatsApp chat bubble — shown on all marketing pages. */
export function WhatsAppButton() {
  return (
    <Link
      href={SITE.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Marwat Tech on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-3 sm:bottom-6 sm:right-6"
    >
      {/* Tooltip label (desktop only) */}
      <span className="pointer-events-none hidden translate-x-2 rounded-full border bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-sm backdrop-blur transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
        Chat with us
      </span>

      <span className="relative inline-flex">
        {/* Pulse ring */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-50 animate-ping"
          style={{ animationDuration: "2.6s" }}
        />
        {/* 3D WhatsApp button */}
        <span
          className="relative grid size-14 shrink-0 place-items-center rounded-full text-white transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105 group-active:scale-95"
          style={{
            background: "linear-gradient(to bottom, #2fd86b, #1faf54)",
            boxShadow:
              "0 8px 20px -4px rgba(31,175,84,0.55), inset 0 1px 0 rgba(255,255,255,0.35)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
        </span>
      </span>
    </Link>
  );
}
