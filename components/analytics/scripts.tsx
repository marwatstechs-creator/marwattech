import { Suspense } from "react";
import Script from "next/script";

import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/db/content";

/**
 * Loads Google Tag Manager (which can then load GA), plus optional direct
 * GA, Microsoft Clarity and PostHog snippets.
 *
 * IDs are read from Admin → Settings (site_settings table) first, falling
 * back to NEXT_PUBLIC_* env vars — so you can change them in the dashboard
 * without a redeploy.
 */
async function AnalyticsScripts() {
  let settings: Record<string, string> = {};
  try {
    const db = await createClient();
    settings = await getSiteSettings(db);
  } catch {
    // fall through to env vars
  }

  const gtmId = settings.gtm_id?.trim() || process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = settings.ga_id?.trim() || process.env.NEXT_PUBLIC_GA_ID;
  const clarityId = settings.clarity_id?.trim() || process.env.NEXT_PUBLIC_CLARITY_ID;
  const posthogKey = settings.posthog_key?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!gtmId && !gaId && !clarityId && !posthogKey) return null;

  return (
    <>
      {/* Google Tag Manager */}
      {gtmId && (
        <>
          <Script
            id="gtm-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics (direct, only when not loaded via GTM) */}
      {gaId && !gtmId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
            }}
          />
        </>
      )}

      {/* Microsoft Clarity */}
      {clarityId && (
        <Script
          id="clarity-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityId}");`,
          }}
        />
      )}

      {/* PostHog */}
      {posthogKey && (
        <Script
          id="posthog-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.querySelectorAll(t+"; *");return o.length?e.querySelectorAll(t):e.querySelectorAll("*")}function m(t,e){var o=e.querySelectorAll("["+t+"='"+e.getAttribute(t)+"']");return o.length?o:e.querySelectorAll(t)}function d(t,e){var o=e.querySelectorAll("["+t+"]");return o.length?o:e.querySelectorAll(t)}function h(t,e){var o=e.querySelectorAll(t);return o.length?o:e.querySelectorAll(t)}e._i.push([i,s,a])},e.__SV=1)})(document,window.posthog||[]);posthog.init('${posthogKey}',{api_host:'${posthogHost ?? "https://us.i.posthog.com"}'});`,
          }}
        />
      )}
    </>
  );
}

export function Analytics() {
  return (
    <Suspense fallback={null}>
      <AnalyticsScripts />
    </Suspense>
  );
}
