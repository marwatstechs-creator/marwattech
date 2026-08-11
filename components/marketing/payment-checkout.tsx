"use client";

import * as React from "react";
import Link from "next/link";

import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPayPalCheckout,
  capturePayPalCheckout,
} from "@/lib/actions/payments";
import {
  CURRENCIES,
  PAYMENT_ITEM_TYPES,
  DEFAULT_CURRENCY,
  MIN_AMOUNT,
  MAX_AMOUNT,
  formatMoney,
  type Currency,
  type PaymentItemType,
} from "@/lib/payments/config";

type CheckoutProps = {
  configured: boolean;
  clientId: string | null;
  env: "sandbox" | "live";
  initial?: {
    amount?: number | null;
    currency?: string;
    item?: string;
    type?: string;
    name?: string;
    email?: string;
  };
};

type Status =
  | "idle"
  | "loading"
  | "ready"
  | "processing"
  | "success"
  | "cancelled"
  | "error";

/* ── PayPal JS SDK v6 loader (injects the official v6 core script) ────── */

/** Minimal typings for the PayPal JS SDK v6 surface we use. */
type PayPalV6MethodDetails = {
  productCode?: string;
  countryCode?: string;
};

type PayPalV6SessionOptions = {
  onApprove?: (data: { orderId: string }) => void | Promise<void>;
  onCancel?: (data?: { orderId?: string }) => void;
  onError?: (err?: { code?: string; message?: string }) => void;
};

type PayPalV6Session = {
  start: (
    opts: { presentationMode?: string },
    orderPromise: Promise<{ orderId: string }>
  ) => Promise<void>;
};

type GooglePayV6Session = {
  getGooglePayConfig: () => Promise<{
    apiVersion: number;
    apiVersionMinor: number;
    allowedPaymentMethods: unknown[];
    merchantInfo?: unknown;
    countryCode?: string;
  }>;
  confirmOrder: (opts: {
    orderId: string;
    paymentMethodData: unknown;
  }) => Promise<{ status: string }>;
};

type ApplePayV6Session = {
  config: () => Promise<{
    merchantCapabilities: string[];
    supportedNetworks: string[];
  }>;
  validateMerchant: (opts: { validationUrl: string }) => Promise<{
    merchantSession: unknown;
  }>;
  confirmOrder: (opts: {
    orderId: string;
    token: unknown;
    billingContact?: unknown;
    shippingContact?: unknown;
  }) => Promise<{ status: string }>;
};

type PayPalV6Eligibility = {
  isEligible: (method: string) => boolean;
  getDetails: (method: string) => PayPalV6MethodDetails;
};

type PayPalV6Instance = {
  findEligibleMethods: (opts?: {
    currencyCode?: string;
    paymentFlow?: string;
  }) => Promise<PayPalV6Eligibility>;
  createPayPalOneTimePaymentSession: (
    o: PayPalV6SessionOptions
  ) => PayPalV6Session;
  createPayLaterOneTimePaymentSession: (
    o: PayPalV6SessionOptions
  ) => PayPalV6Session;
  createPayPalCreditOneTimePaymentSession: (
    o: PayPalV6SessionOptions
  ) => PayPalV6Session;
  createVenmoOneTimePaymentSession: (
    o: PayPalV6SessionOptions
  ) => PayPalV6Session;
  createPayPalGuestOneTimePaymentSession: (
    o: PayPalV6SessionOptions
  ) => PayPalV6Session;
  createGooglePayOneTimePaymentSession: () => GooglePayV6Session;
  createApplePayOneTimePaymentSession: () => ApplePayV6Session;
};

type PayPalV6 = {
  createInstance: (opts: {
    clientId?: string;
    clientToken?: string;
    components?: string[];
    pageType?: string;
    locale?: string;
    clientMetadataId?: string;
  }) => Promise<PayPalV6Instance>;
};

declare global {
  interface Window {
    paypal?: PayPalV6;
  }
}

let sdkPromise: { env: string; promise: Promise<PayPalV6> } | null = null;

/** Load the v6 core script. Live vs sandbox uses a different script URL. */
function loadPaypalV6(env: "sandbox" | "live"): Promise<PayPalV6> {
  if (sdkPromise && sdkPromise.env === env) {
    return sdkPromise.promise;
  }
  document
    .querySelectorAll("script[data-paypal-v6]")
    .forEach((s) => s.remove());
  try {
    delete (window as { paypal?: unknown }).paypal;
  } catch {
    /* ignore */
  }

  const src =
    env === "live"
      ? "https://www.paypal.com/web-sdk/v6/core"
      : "https://www.sandbox.paypal.com/web-sdk/v6/core";

  const promise = new Promise<PayPalV6>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.setAttribute("data-paypal-v6", env);
    script.async = true;
    script.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal v6 SDK failed to load"));
    };
    script.onerror = () => reject(new Error("PayPal v6 SDK failed to load"));
    document.body.appendChild(script);
  });
  sdkPromise = { env, promise };
  return promise;
}

/** Inject an external wallet SDK (Google Pay / Apple Pay) once. */
function loadWalletScript(src: string, attr: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[${attr}]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.setAttribute(attr, "1");
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("wallet sdk failed to load"));
    document.body.appendChild(script);
  });
}

/* ── Status summary card ──────────────────────────────────────────────── */

function StatusCard({ status, amount, currency }: { status: Status; amount: number; currency: string }) {
  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
            <AppIcon name="check" size={20} />
          </span>
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              Payment successful!
            </p>
            <p className="text-sm text-muted-foreground">
              {formatMoney(amount, currency)} received. A confirmation has been
              recorded — we&apos;ll be in touch shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (status === "processing") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
            <AppIcon name="refresh" size={20} className="animate-spin" />
          </span>
          <div>
            <p className="font-semibold">Confirming your payment…</p>
            <p className="text-sm text-muted-foreground">
              Please don&apos;t close this window.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (status === "cancelled") {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-700 dark:text-amber-400">
        You cancelled the payment. No charge was made — you can try again below.
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
        Something went wrong with your payment. Please try again, or contact us
        for help.
      </div>
    );
  }
  return null;
}

/* ── Main component ───────────────────────────────────────────────────── */

export function PaymentCheckout({ configured, clientId, env, initial }: CheckoutProps) {
  const [amount, setAmount] = React.useState<string>(
    initial?.amount ? String(initial.amount) : ""
  );
  const [currency, setCurrency] = React.useState<Currency>(
    (initial?.currency as Currency) || DEFAULT_CURRENCY
  );
  const [itemType, setItemType] = React.useState<PaymentItemType>(
    (initial?.type as PaymentItemType) || "custom"
  );
  const [itemName, setItemName] = React.useState<string>(initial?.item || "");
  const [description, setDescription] = React.useState<string>("");
  const [customerName, setCustomerName] = React.useState<string>(initial?.name || "");
  const [customerEmail, setCustomerEmail] = React.useState<string>(initial?.email || "");
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [saveMethod, setSaveMethod] = React.useState(false);
  const [vaultStatus, setVaultStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");

  const buttonContainerRef = React.useRef<HTMLDivElement>(null);
  const internalOrderRef = React.useRef("");
  const valuesRef = React.useRef({ amount, currency, itemType, itemName, description, customerName, customerEmail });
  React.useEffect(() => {
    valuesRef.current = { amount, currency, itemType, itemName, description, customerName, customerEmail };
  });

  const amountNum = React.useMemo(() => {
    const n = Number(String(amount).replace(/[^0-9.]/g, ""));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
  }, [amount]);

  const valid = amountNum !== null && amountNum >= MIN_AMOUNT && amountNum <= MAX_AMOUNT;

  /* Render v6 PayPal buttons (PayPal, Pay Later, PayPal Credit) once the SDK
     loads + amount/currency are valid. Uses the PayPal JS SDK v6 custom
     elements + payment sessions, with eligibility-based method detection. */
  React.useEffect(() => {
    if (!configured || !clientId || !amountNum || !buttonContainerRef.current || status === "success") {
      return;
    }
    let cancelled = false;
    const mounted: HTMLElement[] = [];

    (async () => {
      try {
        const paypal = await loadPaypalV6(env);
        if (cancelled || !buttonContainerRef.current) return;

        const sdkInstance = await paypal.createInstance({
          clientId,
          components: [
            "paypal-payments",
            "venmo-payments",
            "paypal-guest-payments",
            "googlepay-payments",
            "applepay-payments",
          ],
          pageType: "checkout",
          clientMetadataId:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `mts-${Date.now()}`,
        });
        if (cancelled || !buttonContainerRef.current) return;

        const eligibility = await sdkInstance.findEligibleMethods({
          currencyCode: currency,
        });
        if (cancelled || !buttonContainerRef.current) return;

        const container = buttonContainerRef.current;
        container.innerHTML = "";

        // Loading skeleton shown while the SDK checks available methods.
        const skeleton = document.createElement("div");
        skeleton.id = "mt-loading";
        skeleton.className =
          "flex min-h-[120px] items-center justify-center gap-2 text-sm text-muted-foreground";
        skeleton.innerHTML =
          '<span class="size-4 animate-spin rounded-full border-2 border-foreground/15 border-t-foreground"></span><span>Loading payment options…</span>';
        container.appendChild(skeleton);
        const hideSkeleton = () => {
          const s = container.querySelector("#mt-loading");
          if (s) s.remove();
        };

        // Grouped, labelled payment sections (PayPal / Card / More ways to pay).
        type SectionKey = "paypal" | "card" | "wallet";
        const usedSections = new Set<SectionKey>();
        const sectionEls: Record<SectionKey, HTMLDivElement | null> = {
          paypal: null,
          card: null,
          wallet: null,
        };
        const sectionLabels: Record<SectionKey, string> = {
          paypal: "Pay with PayPal",
          card: "Debit or Credit Card",
          wallet: "More ways to pay",
        };
        const ensureSection = (key: SectionKey): HTMLDivElement => {
          if (sectionEls[key]) return sectionEls[key]!;
          const sec = document.createElement("div");
          const lbl = document.createElement("p");
          lbl.className =
            "mt-pay-label-hide mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80";
          const txt = document.createElement("span");
          txt.textContent = sectionLabels[key];
          const rule = document.createElement("span");
          rule.className = "h-px flex-1 bg-border";
          lbl.appendChild(txt);
          lbl.appendChild(rule);
          sec.appendChild(lbl);
          if (key !== "paypal") sec.style.marginTop = "6px";
          container.appendChild(sec);
          sectionEls[key] = sec;
          usedSections.add(key);
          return sec;
        };
        // Hide the section labels unless more than one payment method shows.
        const finalizeSections = () => {
          hideSkeleton();
          if (usedSections.size <= 1) {
            container
              .querySelectorAll(".mt-pay-label-hide")
              .forEach((l) => ((l as HTMLElement).style.display = "none"));
          }
        };

        // v6 requires createOrder to resolve to { orderId } (NOT a plain string).
        const createOrderFor =
          (method: "paypal" | "card" | "googlepay" | "applepay" = "paypal") =>
          async (): Promise<{ orderId: string }> => {
            const v = valuesRef.current;
            const res = await createPayPalCheckout({
              amount: Number(v.amount),
              currency: v.currency,
              itemType: v.itemType,
              itemName: v.itemName,
              description: v.description,
              customerName: v.customerName,
              customerEmail: v.customerEmail,
              // Only PayPal / Card methods can be vaulted ("save this payment
              // method"); wallet orders are created without vaulting.
              saveMethod:
                method === "paypal" || method === "card" ? saveMethod : false,
              paymentSource:
                method === "googlepay" || method === "applepay"
                  ? method
                  : undefined,
            });
            if (!res.ok) {
              if (res.notConfigured) {
                setError("The payment gateway isn't configured yet. Please contact us.");
              } else {
                setError(res.error || "Could not start payment.");
              }
              throw new Error(res.error || "create failed");
            }
            internalOrderRef.current = res.orderId;
            setError(null);
            return { orderId: res.paypalOrderId };
          };

        const sessionOptions: PayPalV6SessionOptions = {
          onApprove: async ({ orderId }) => {
            setStatus("processing");
            const res = await capturePayPalCheckout(
              internalOrderRef.current,
              orderId,
              saveMethod
            );
            setStatus(res.ok ? "success" : "error");
            if (res.ok && saveMethod) setVaultStatus("saved");
          },
          onCancel: () => setStatus("cancelled"),
          onError: () => setStatus("error"),
        };

        const addButton = (
          el: HTMLElement,
          session: PayPalV6Session,
          section: SectionKey = "paypal"
        ) => {
          el.setAttribute("hidden", "");
          el.style.width = "100%";
          el.style.marginBottom = "8px";
          el.addEventListener("click", async () => {
            try {
              // Pass the create-order promise without awaiting it first, so
              // popups are still allowed (transient activation).
              await session.start(
                { presentationMode: "auto" },
                createOrderFor()()
              );
            } catch {
              setStatus("error");
            }
          });
          ensureSection(section).appendChild(el);
          mounted.push(el);
          el.removeAttribute("hidden");
        };

        if (eligibility.isEligible("paypal")) {
          addButton(
            document.createElement("paypal-button"),
            sdkInstance.createPayPalOneTimePaymentSession(sessionOptions)
          );
        }
        if (eligibility.isEligible("paylater")) {
          const d = eligibility.getDetails("paylater");
          const el = document.createElement(
            "paypal-pay-later-button"
          ) as HTMLElement & { productCode?: string; countryCode?: string };
          el.productCode = d.productCode;
          el.countryCode = d.countryCode;
          addButton(
            el,
            sdkInstance.createPayLaterOneTimePaymentSession(sessionOptions)
          );
        }
        if (eligibility.isEligible("credit")) {
          const d = eligibility.getDetails("credit");
          const el = document.createElement(
            "paypal-credit-button"
          ) as HTMLElement & { countryCode?: string };
          el.countryCode = d.countryCode;
          addButton(
            el,
            sdkInstance.createPayPalCreditOneTimePaymentSession(sessionOptions)
          );
        }
        // Venmo (US-only; shows when eligible)
        if (eligibility.isEligible("venmo")) {
          const el = document.createElement("venmo-button");
          el.setAttribute("type", "pay");
          addButton(
            el,
            sdkInstance.createVenmoOneTimePaymentSession(sessionOptions)
          );
        }
        // Guest Debit / Credit Card button (shows when eligible)
        if (eligibility.isEligible("card")) {
          const cardBtn = document.createElement("paypal-basic-card-button");
          const cardWrap = document.createElement("paypal-basic-card-container");
          cardBtn.style.width = "100%";
          const guestSession =
            sdkInstance.createPayPalGuestOneTimePaymentSession(sessionOptions);
          cardBtn.addEventListener("click", async () => {
            try {
              await guestSession.start(
                { presentationMode: "auto" },
                createOrderFor("card")()
              );
            } catch {
              setStatus("error");
            }
          });
          cardWrap.appendChild(cardBtn);
          cardWrap.style.width = "100%";
          cardWrap.style.marginBottom = "8px";
          ensureSection("card").appendChild(cardWrap);
          mounted.push(cardWrap);
        }
        // Google Pay (shows when eligible + Google Pay available)
        if (eligibility.isEligible("googlepay")) {
          try {
            await loadWalletScript(
              "https://pay.google.com/gp/p/js/pay.js",
              "data-googlepay-sdk"
            );
            const gwin = window as unknown as {
              google?: {
                payments?: {
                  api?: {
                    PaymentsClient: new (
                      opts: Record<string, unknown>
                    ) => {
                      isReadyToPay: (o: unknown) => Promise<{ result?: boolean }>;
                      createButton: (o: Record<string, unknown>) => HTMLElement;
                      loadPaymentData: (o: unknown) => Promise<unknown>;
                    };
                  };
                };
              };
            };
            const PaymentsClient = gwin.google?.payments?.api?.PaymentsClient;
            if (PaymentsClient) {
              const gSession =
                sdkInstance.createGooglePayOneTimePaymentSession();
              const gConfig = await gSession.getGooglePayConfig();
              const paymentsClient = new PaymentsClient({
                environment: env === "live" ? "PRODUCTION" : "TEST",
                paymentDataCallbacks: {
                  onPaymentAuthorized: async (paymentData: {
                    paymentMethodData?: unknown;
                  }) => {
                    try {
                      const { orderId } = await createOrderFor()();
                      const res = await gSession.confirmOrder({
                        orderId,
                        paymentMethodData: paymentData.paymentMethodData,
                      });
                      if (res.status !== "PAYER_ACTION_REQUIRED") {
                        const capt = await capturePayPalCheckout(
                          internalOrderRef.current,
                          orderId,
                          saveMethod
                        );
                        setStatus(capt.ok ? "success" : "error");
                        return capt.ok
                          ? { transactionState: "SUCCESS" }
                          : { transactionState: "ERROR" };
                      }
                      return { transactionState: "ERROR" };
                    } catch {
                      return { transactionState: "ERROR" };
                    }
                  },
                },
              });
              const ready = await paymentsClient.isReadyToPay({
                apiVersion: gConfig.apiVersion,
                apiVersionMinor: gConfig.apiVersionMinor,
                allowedPaymentMethods: gConfig.allowedPaymentMethods,
              });
              if (ready?.result) {
                const buildReq = () => ({
                  apiVersion: gConfig.apiVersion,
                  apiVersionMinor: gConfig.apiVersionMinor,
                  allowedPaymentMethods: gConfig.allowedPaymentMethods,
                  merchantInfo: gConfig.merchantInfo,
                  transactionInfo: {
                    countryCode: gConfig.countryCode ?? "US",
                    currencyCode: currency,
                    totalPriceStatus: "FINAL",
                    totalPrice: amountNum.toFixed(2),
                    totalPriceLabel: "Total",
                    displayItems: [
                      {
                        label: "Total",
                        type: "SUBTOTAL",
                        price: amountNum.toFixed(2),
                      },
                    ],
                  },
                  callbackIntents: ["PAYMENT_AUTHORIZATION"],
                });
                const gpBtn = paymentsClient.createButton({
                  onClick: () => paymentsClient.loadPaymentData(buildReq()),
                  buttonType: "pay",
                  buttonColor: "black",
                  buttonSizeMode: "fill",
                  buttonRadius: 8,
                });
                gpBtn.style.width = "100%";
                gpBtn.style.marginBottom = "8px";
                ensureSection("wallet").appendChild(gpBtn);
                mounted.push(gpBtn);
              }
            }
          } catch {
            /* Google Pay not available — skip silently */
          }
        }
        // Apple Pay (shows when eligible + Apple Pay available in this browser)
        if (eligibility.isEligible("applepay")) {
          try {
            await loadWalletScript(
              "https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js",
              "data-applepay-sdk"
            );
            const awin = window as unknown as {
              ApplePaySession?: {
                canMakePayments: () => boolean;
                STATUS_SUCCESS: number;
                STATUS_FAILURE: number;
                new (
                  version: number,
                  request: Record<string, unknown>
                ): {
                  begin: () => void;
                  abort: () => void;
                  completeMerchantValidation: (s: unknown) => void;
                  completePaymentMethodSelection: (o: unknown) => void;
                  completePayment: (o: unknown) => void;
                  onvalidatemerchant:
                    | ((e: { validationURL: string }) => void)
                    | null;
                  onpaymentmethodselected: (() => void) | null;
                  onpaymentauthorized:
                    | ((e: {
                        payment: {
                          token: unknown;
                          billingContact?: unknown;
                          shippingContact?: unknown;
                        };
                      }) => void)
                    | null;
                  oncancel: (() => void) | null;
                };
              };
            };
            const APS = awin.ApplePaySession;
            if (APS && APS.canMakePayments()) {
              const aSession =
                sdkInstance.createApplePayOneTimePaymentSession();
              const { merchantCapabilities, supportedNetworks } =
                await aSession.config();
              const apBtn = document.createElement("apple-pay-button");
              apBtn.setAttribute("buttonstyle", "black");
              apBtn.setAttribute("type", "buy");
              apBtn.setAttribute("locale", "en");
              apBtn.style.width = "100%";
              apBtn.style.marginBottom = "8px";
              apBtn.addEventListener("click", () => {
                const paymentRequest = {
                  countryCode: "US",
                  currencyCode: currency,
                  merchantCapabilities,
                  supportedNetworks,
                  requiredBillingContactFields: [
                    "name",
                    "phone",
                    "email",
                    "postalAddress",
                  ],
                  requiredShippingContactFields: [],
                  total: {
                    label: "Marwat Tech",
                    amount: amountNum.toFixed(2),
                    type: "final",
                  },
                };
                const session = new APS(4, paymentRequest);
                session.onvalidatemerchant = (event) => {
                  aSession
                    .validateMerchant({ validationUrl: event.validationURL })
                    .then((p) =>
                      session.completeMerchantValidation(p.merchantSession)
                    )
                    .catch(() => session.abort());
                };
                session.onpaymentmethodselected = () =>
                  session.completePaymentMethodSelection({
                    newTotal: paymentRequest.total,
                  });
                session.onpaymentauthorized = async (event) => {
                  try {
                    const { orderId } = await createOrderFor()();
                    await aSession.confirmOrder({
                      orderId,
                      token: event.payment.token,
                      billingContact: event.payment.billingContact,
                      shippingContact: event.payment.shippingContact,
                    });
                    const capt = await capturePayPalCheckout(
                      internalOrderRef.current,
                      orderId,
                      saveMethod
                    );
                    session.completePayment({
                      status: capt.ok
                        ? APS.STATUS_SUCCESS
                        : APS.STATUS_FAILURE,
                    });
                    setStatus(capt.ok ? "success" : "error");
                  } catch {
                    session.completePayment({ status: APS.STATUS_FAILURE });
                    setStatus("error");
                  }
                };
                session.oncancel = () => setStatus("cancelled");
                session.begin();
              });
              ensureSection("wallet").appendChild(apBtn);
              mounted.push(apBtn);
            }
          } catch {
            /* Apple Pay not available — skip silently */
          }
        }

        if (!mounted.length) {
          hideSkeleton();
          setStatus("error");
        } else {
          finalizeSections();
        }
      } catch {
        if (!cancelled) {
          hideSkeleton();
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      mounted.forEach((el) => {
        try {
          el.remove();
        } catch {
          /* ignore */
        }
      });
      if (buttonContainerRef.current) buttonContainerRef.current.innerHTML = "";
    };
  }, [configured, clientId, amountNum, currency, env, status, saveMethod]);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* ── Details form ─────────────────────────────────────── */}
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-xl">Payment details</CardTitle>
            <CardDescription>
              Tell us what this payment is for. You&apos;ll pay securely
              through PayPal, cards, and digital wallets (Google Pay &amp; Apple
              Pay) where available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  min={MIN_AMOUNT}
                  max={MAX_AMOUNT}
                  step="0.01"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>What is this for?</Label>
                <Select value={itemType} onValueChange={(v) => setItemType(v as PaymentItemType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_ITEM_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item">Item / service name</Label>
                <Input
                  id="item"
                  placeholder="e.g. Web Development — retainer"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes (optional)</Label>
              <Input
                id="description"
                placeholder="Anything we should know?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Your email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Summary + PayPal ─────────────────────────────────── */}
      <div className="lg:col-span-2">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="font-display text-xl">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Total due</span>
              <span className="font-display text-2xl font-bold text-primary">
                {amountNum ? formatMoney(amountNum, currency) : formatMoney(0, currency)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AppIcon name="shield" size={15} />
              <span>256-bit encrypted · PCI-compliant · money-back guarantee</span>
            </div>

            {!valid && (
              <p className="text-sm text-muted-foreground">
                Enter an amount between {MIN_AMOUNT} and {MAX_AMOUNT} to continue.
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <StatusCard status={status} amount={amountNum ?? 0} currency={currency} />

            {configured ? (
              <div>
                {valid ? (
                  <>
                    <div className="mt-3">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                        Choose how to pay
                      </p>
                      <div
                        ref={buttonContainerRef}
                        className="rounded-2xl border border-border/70 bg-muted/20 p-3 [&_iframe]:rounded-xl"
                      />
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        {env === "sandbox"
                          ? "Sandbox mode — test payments only."
                          : "Secure checkout via PayPal."}
                      </p>
                    </div>

                    {/* Save payment method (v6 vault-with-purchase) */}
                    <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={saveMethod}
                        onChange={(e) => setSaveMethod(e.target.checked)}
                        className="mt-0.5 size-3.5"
                      />
                      <span>
                        <strong className="text-foreground">Save this payment method</strong> for
                        faster checkout next time — your PayPal method is saved to the vault when
                        this payment completes.
                      </span>
                    </label>
                    {saveMethod && vaultStatus === "saved" && (
                      <p className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                        Payment method saved — you&apos;ll see it under Payments → Saved methods.
                      </p>
                    )}
                    {saveMethod && vaultStatus === "error" && (
                      <p className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        Could not save the payment method. You can still pay below.
                      </p>
                    )}
                  </>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-dashed bg-muted/30 p-5 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <AppIcon name="wallet" size={24} />
                </span>
                <p className="font-semibold">Online payments coming soon</p>
                <p className="text-sm text-muted-foreground">
                  We&apos;re connecting our payment gateway — you&apos;ll be able
                  to pay securely online shortly. In the meantime, reach out and
                  we&apos;ll invoice you directly.
                </p>
                <Button asChild variant="gold" className="w-full">
                  <Link href="/contact">Contact us to arrange payment</Link>
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <AppIcon name="lock" size={13} />
              <span>Marwat Tech · {env === "live" ? "Live" : "Test"} gateway</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
