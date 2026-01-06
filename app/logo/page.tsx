"use client";

import NextImage from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DISPLAY_FONT = "Cinzel";
const BODY_FONT = "Manrope";
const LOGO_WIDTH = 1000;
const LOGO_HEIGHT = 600;

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

const getInitials = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "QR";
  }
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
};

type LogoPayload = {
  brandName: string;
  tagline: string;
  primary: string;
  accent: string;
  layout: "horizontal" | "stacked";
  tone: "light" | "dark";
};

const createLogo = async ({
  brandName,
  tagline,
  primary,
  accent,
  layout,
  tone,
}: LogoPayload) => {
  const canvas = document.createElement("canvas");
  canvas.width = LOGO_WIDTH;
  canvas.height = LOGO_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  const background = tone === "light" ? "#F9F6EF" : "#0B0B10";
  const textColor = tone === "light" ? "#0F172A" : "#F8F4E6";
  const mutedColor =
    tone === "light" ? "rgba(15, 23, 42, 0.6)" : "rgba(248, 244, 230, 0.7)";
  const markText = tone === "light" ? "#0B0B10" : "#F8F4E6";
  const strokeColor =
    tone === "light" ? "rgba(15, 23, 42, 0.15)" : "rgba(248, 244, 230, 0.2)";

  ctx.fillStyle = background;
  ctx.fillRect(0, 0, LOGO_WIDTH, LOGO_HEIGHT);

  ctx.save();
  ctx.globalAlpha = tone === "light" ? 0.2 : 0.15;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(LOGO_WIDTH * 0.75, LOGO_HEIGHT * 0.2, 220, 140, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const initials = getInitials(brandName);
  const markSize = 180;
  const markGradient = ctx.createLinearGradient(0, 0, markSize, markSize);
  markGradient.addColorStop(0, accent);
  markGradient.addColorStop(1, primary);

  if (layout === "horizontal") {
    const markX = 220;
    const markY = LOGO_HEIGHT / 2;

    ctx.fillStyle = markGradient;
    ctx.beginPath();
    ctx.arc(markX, markY, markSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    ctx.fillStyle = markText;
    ctx.font = `700 64px "${DISPLAY_FONT}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, markX, markY + 2);

    const textX = markX + markSize / 2 + 60;
    const textWidth = LOGO_WIDTH - textX - 80;

    drawFittedText(
      ctx,
      brandName,
      textWidth,
      56,
      DISPLAY_FONT,
      700,
      textX,
      LOGO_HEIGHT / 2 - 10,
      textColor,
      "left"
    );

    if (tagline) {
      ctx.font = `500 20px "${BODY_FONT}"`;
      ctx.fillStyle = mutedColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(tagline, textX, LOGO_HEIGHT / 2 + 26);
    }
  } else {
    const markX = LOGO_WIDTH / 2;
    const markY = 220;

    ctx.fillStyle = markGradient;
    ctx.beginPath();
    ctx.arc(markX, markY, markSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.strokeStyle = strokeColor;
    ctx.stroke();

    ctx.fillStyle = markText;
    ctx.font = `700 64px "${DISPLAY_FONT}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, markX, markY + 2);

    drawFittedText(
      ctx,
      brandName,
      LOGO_WIDTH - 160,
      58,
      DISPLAY_FONT,
      700,
      LOGO_WIDTH / 2,
      360,
      textColor,
      "center"
    );

    if (tagline) {
      ctx.font = `500 20px "${BODY_FONT}"`;
      ctx.fillStyle = mutedColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(tagline, LOGO_WIDTH / 2, 392);
    }
  }

  return canvas.toDataURL("image/png");
};

export default function LogoPage() {
  const [brandName, setBrandName] = useState("Site2QR");
  const [tagline, setTagline] = useState("Scan. Share. Shine.");
  const [layout, setLayout] = useState<"horizontal" | "stacked">("horizontal");
  const [tone, setTone] = useState<"light" | "dark">("light");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedPrimary = normalizeHex(primaryColor, DEFAULT_PRIMARY);
  const normalizedAccent = normalizeHex(accentColor, DEFAULT_ACCENT);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    setLoading(true);
    setLogoUrl(null);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
        await Promise.all([
          document.fonts.load(`700 58px "${DISPLAY_FONT}"`),
          document.fonts.load(`500 20px "${BODY_FONT}"`),
        ]);
      }

      const nextLogo = await createLogo({
        brandName: brandName.trim() || "Your Brand",
        tagline: tagline.trim(),
        primary: normalizedPrimary,
        accent: normalizedAccent,
        layout,
        tone,
      });

      setLogoUrl(nextLogo);
    } catch (err) {
      setError("Could not generate the logo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!logoUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = logoUrl;
    link.download = "logo.png";
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
                Logo
              </p>
              <h1 className="mt-3 font-display text-4xl text-slate-100">
                Logo builder for brand marks
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">
                Generate a polished mark and wordmark pairing with your colors.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              1000 x 600 px
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
                <h2 className="font-display text-2xl">Logo details</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose a layout and palette to generate your logo.
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
                    htmlFor="tagline"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Tagline (optional)
                  </label>
                  <Input
                    id="tagline"
                    type="text"
                    value={tagline}
                    onChange={(event) => setTagline(event.target.value)}
                    placeholder="A short descriptor"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="layout"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Layout
                  </label>
                  <Select value={layout} onValueChange={(value) => setLayout(value as "horizontal" | "stacked")}>
                    <SelectTrigger
                      id="layout"
                      className="h-11 border-white/10 bg-slate-950/40 text-slate-100"
                    >
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
                      <SelectItem value="horizontal" className="focus:bg-slate-800">
                        Horizontal
                      </SelectItem>
                      <SelectItem value="stacked" className="focus:bg-slate-800">
                        Stacked
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="tone"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Background tone
                  </label>
                  <Select value={tone} onValueChange={(value) => setTone(value as "light" | "dark")}>
                    <SelectTrigger
                      id="tone"
                      className="h-11 border-white/10 bg-slate-950/40 text-slate-100"
                    >
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
                      <SelectItem value="light" className="focus:bg-slate-800">
                        Light
                      </SelectItem>
                      <SelectItem value="dark" className="focus:bg-slate-800">
                        Dark
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                  {loading ? "Generating..." : "Generate logo"}
                </Button>

                <p className="text-xs text-slate-500">
                  Logos render locally in your browser.
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
                  <h2 className="font-display text-2xl">Logo preview</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Download the PNG to use across brand touchpoints.
                  </p>
                </div>
                {logoUrl ? (
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
                <div className="aspect-[5/3] rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
              ) : logoUrl ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20">
                  <div className="aspect-[5/3] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center text-slate-400">
                  <p className="text-sm">
                    Generate a logo to preview it here.
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