"use client";

import NextImage from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { toDataURL } from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DISPLAY_FONT = "Cinzel";
const BODY_FONT = "Manrope";
const BANNER_WIDTH = 1600;
const BANNER_HEIGHT = 600;

const DEFAULT_PRIMARY = "#D6B36C";
const DEFAULT_ACCENT = "#4AA7A0";

const NAV_ITEMS = [
  { label: "Business cards", href: "/business-cards" },
  { label: "Banner", href: "/banner" },
  { label: "Logo", href: "/logo" },
];

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

const hexPattern = /^#[0-9a-fA-F]{6}$/;

const normalizeHex = (value: string, fallback: string) => {
  const trimmed = value.trim();
  return hexPattern.test(trimmed) ? trimmed.toUpperCase() : fallback;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + safeRadius, y);
  ctx.lineTo(x + width - safeRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  ctx.lineTo(x + width, y + height - safeRadius);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height
  );
  ctx.lineTo(x + safeRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  ctx.lineTo(x, y + safeRadius);
  ctx.quadraticCurveTo(x, y, x + safeRadius, y);
  ctx.closePath();
};

const drawFittedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  fontWeight: number,
  x: number,
  y: number,
  color: string,
  align: CanvasTextAlign = "left"
) => {
  let size = fontSize;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = color;

  while (size > 14) {
    ctx.font = `${fontWeight} ${size}px "${fontFamily}"`;
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    size -= 2;
  }

  ctx.fillText(text, x, y);
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image failed to load"));
    image.src = src;
  });

type BannerPayload = {
  brandName: string;
  headline: string;
  subheadline: string;
  cta: string;
  url: string;
  primary: string;
  accent: string;
  qrDataUrl: string;
};

const createBanner = async ({
  brandName,
  headline,
  subheadline,
  cta,
  url,
  primary,
  accent,
  qrDataUrl,
}: BannerPayload) => {
  const canvas = document.createElement("canvas");
  canvas.width = BANNER_WIDTH;
  canvas.height = BANNER_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  const gradient = ctx.createLinearGradient(0, 0, BANNER_WIDTH, BANNER_HEIGHT);
  gradient.addColorStop(0, "#0B0B10");
  gradient.addColorStop(1, primary);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(
    BANNER_WIDTH * 0.85,
    BANNER_HEIGHT * 0.2,
    260,
    160,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.ellipse(
    BANNER_WIDTH * 0.18,
    BANNER_HEIGHT * 0.82,
    320,
    180,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.strokeRect(28, 28, BANNER_WIDTH - 56, BANNER_HEIGHT - 56);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.strokeRect(50, 50, BANNER_WIDTH - 100, BANNER_HEIGHT - 100);

  const leftX = 120;
  const rightWidth = 320;
  const rightX = BANNER_WIDTH - rightWidth - 120;
  const leftWidth = rightX - leftX - 20;

  ctx.font = `600 16px "${BODY_FONT}"`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(248, 244, 230, 0.7)";
  ctx.fillText(brandName, leftX, 140);

  drawFittedText(
    ctx,
    headline,
    leftWidth,
    60,
    DISPLAY_FONT,
    700,
    leftX,
    230,
    "#F8F4E6",
    "left"
  );

  drawFittedText(
    ctx,
    subheadline,
    leftWidth,
    26,
    BODY_FONT,
    500,
    leftX,
    300,
    "rgba(248, 244, 230, 0.75)",
    "left"
  );

  ctx.font = `600 18px "${BODY_FONT}"`;
  const ctaTextWidth = ctx.measureText(cta).width;
  const ctaWidth = ctaTextWidth + 56;
  const ctaHeight = 50;
  const ctaY = 350;

  drawRoundedRect(ctx, leftX, ctaY, ctaWidth, ctaHeight, 999);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = "#0B0B10";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(cta, leftX + 28, ctaY + ctaHeight / 2);

  drawFittedText(
    ctx,
    url,
    leftWidth,
    16,
    BODY_FONT,
    500,
    leftX,
    BANNER_HEIGHT - 80,
    "rgba(248, 244, 230, 0.6)",
    "left"
  );

  const cardX = rightX;
  const cardY = 130;
  const cardWidth = rightWidth;
  const cardHeight = 340;

  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 28);
  ctx.fillStyle = "#F8F4E6";
  ctx.fill();

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.stroke();

  const qrImage = await loadImage(qrDataUrl);
  const qrSize = 200;
  const qrX = cardX + (cardWidth - qrSize) / 2;
  const qrY = cardY + 50;
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.font = `600 14px "${BODY_FONT}"`;
  ctx.fillStyle = "#0F172A";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("Scan to visit", cardX + cardWidth / 2, cardY + cardHeight - 40);

  return canvas.toDataURL("image/png");
};

export default function BannerPage() {
  const [brandName, setBrandName] = useState("Site2QR Studio");
  const [headline, setHeadline] = useState("Instant QR banners");
  const [subheadline, setSubheadline] = useState(
    "Turn walk-bys into visitors with a scannable banner."
  );
  const [cta, setCta] = useState("Scan to explore");
  const [url, setUrl] = useState("https://site2qr.com");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedPrimary = normalizeHex(primaryColor, DEFAULT_PRIMARY);
  const normalizedAccent = normalizeHex(accentColor, DEFAULT_ACCENT);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter a URL to embed in the banner QR code.");
      return;
    }

    setLoading(true);
    setBannerUrl(null);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
        await Promise.all([
          document.fonts.load(`700 60px "${DISPLAY_FONT}"`),
          document.fonts.load(`500 24px "${BODY_FONT}"`),
        ]);
      }

      const qrDataUrl = await toDataURL(trimmedUrl, {
        width: 240,
        margin: 1,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });

      const nextBanner = await createBanner({
        brandName: brandName.trim() || "Your Brand",
        headline: headline.trim() || "Your headline",
        subheadline: subheadline.trim() || "Your banner subheadline",
        cta: cta.trim() || "Scan now",
        url: trimmedUrl,
        primary: normalizedPrimary,
        accent: normalizedAccent,
        qrDataUrl,
      });

      setBannerUrl(nextBanner);
    } catch (err) {
      setError("Could not generate the banner. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!bannerUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = bannerUrl;
    link.download = "banner.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,179,108,0.2),_transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(74,167,160,0.2),_transparent_50%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/60 via-transparent to-transparent" />

        <header className="relative border-b border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <NextImage
                  src="/qr-code.svg"
                  alt="QR mark"
                  width={28}
                  height={28}
                  className="opacity-80"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  Site2QR Studio
                </p>
                <p className="font-display text-2xl text-slate-100">
                  Branded QR Boards
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 text-xs uppercase tracking-[0.3em] text-slate-500 md:items-end">
              <span>Print-ready posters</span>
              <nav
                aria-label="Primary"
                className="flex flex-wrap items-center justify-end gap-2 text-[0.6rem] tracking-[0.24em] text-slate-400"
              >
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-200 transition hover:border-white/40 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>

        <main className="relative mx-auto max-w-6xl px-6 pb-20 pt-12">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                Banner
              </p>
              <h1 className="mt-3 font-display text-4xl text-slate-100">
                Banner generator for QR-ready marketing
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">
                Design a bold, scannable banner for storefronts, events, or web
                hero sections.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              1600 x 600 px
            </div>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[380px_1fr]">
            <motion.section
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur"
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              transition={{ duration: 0.6 }}
            >
              <div>
                <h2 className="font-display text-2xl">Banner details</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Customize the headline, CTA, and QR destination.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="brand-name"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Brand name
                  </label>
                  <Input
                    id="brand-name"
                    type="text"
                    value={brandName}
                    onChange={(event) => setBrandName(event.target.value)}
                    placeholder="Your brand"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="headline"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Headline
                  </label>
                  <Input
                    id="headline"
                    type="text"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    placeholder="Banner headline"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="subheadline"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Subheadline
                  </label>
                  <Input
                    id="subheadline"
                    type="text"
                    value={subheadline}
                    onChange={(event) => setSubheadline(event.target.value)}
                    placeholder="Short supporting line"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cta"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Call to action
                  </label>
                  <Input
                    id="cta"
                    type="text"
                    value={cta}
                    onChange={(event) => setCta(event.target.value)}
                    placeholder="CTA button label"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="banner-url"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    QR destination
                  </label>
                  <Input
                    id="banner-url"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://yourbrand.com"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                {error ? (
                  <p className="text-sm text-rose-300">{error}</p>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="primary-color"
                      className="text-xs uppercase tracking-[0.3em] text-slate-500"
                    >
                      Primary color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="primary-color"
                        type="color"
                        value={primaryColor}
                        onChange={(event) =>
                          setPrimaryColor(event.target.value)
                        }
                        className="h-11 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0"
                      />
                      <Input
                        type="text"
                        value={primaryColor}
                        readOnly
                        className="h-11 flex-1 border-white/10 bg-slate-950/40 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="accent-color"
                      className="text-xs uppercase tracking-[0.3em] text-slate-500"
                    >
                      Accent color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="accent-color"
                        type="color"
                        value={accentColor}
                        onChange={(event) =>
                          setAccentColor(event.target.value)
                        }
                        className="h-11 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0"
                      />
                      <Input
                        type="text"
                        value={accentColor}
                        readOnly
                        className="h-11 flex-1 border-white/10 bg-slate-950/40 text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-slate-900 hover:bg-white/90"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate banner"}
                </Button>

                <p className="text-xs text-slate-500">
                  Banners render locally in your browser.
                </p>
              </form>
            </motion.section>

            <motion.section
              className="space-y-6"
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl">Banner preview</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Download the PNG for your marketing channels.
                  </p>
                </div>
                {bannerUrl ? (
                  <Button
                    type="button"
                    onClick={handleDownload}
                    className="bg-white/10 text-slate-100 hover:bg-white/20"
                  >
                    Download PNG
                  </Button>
                ) : null}
              </div>

              {loading ? (
                <div className="aspect-[8/3] rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
              ) : bannerUrl ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20">
                  <div className="aspect-[8/3] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center text-slate-400">
                  <p className="text-sm">
                    Generate a banner to preview it here.
                  </p>
                </div>
              )}
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
}