"use client";

import NextImage from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { toDataURL } from "qrcode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const QR_SIZES = [220, 260, 300, 340];
const DISPLAY_FONT = "Cinzel";
const BODY_FONT = "Manrope";
const NAV_ITEMS = [
  { label: "Business cards", href: "/business-cards" },
  { label: "Banner", href: "/banner" },
  { label: "Logo", href: "/logo" },
];
const POSTER_WIDTH = 1200;
const POSTER_HEIGHT = 800;

const DEFAULT_PRIMARY = "#D6B36C";
const DEFAULT_ACCENT = "#4AA7A0";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

type PosterTemplate = {
  id: string;
  name: string;
  description: string;
  cta: string;
  palette: {
    background: string;
    backgroundAlt: string;
    frame: string;
    text: string;
    muted: string;
    accent: string;
    glow: string;
    card: string;
    cardBorder: string;
    qrDark: string;
    qrLight: string;
  };
};

type PosterResult = {
  id: string;
  name: string;
  description: string;
  posterUrl: string;
};

const hexPattern = /^#[0-9a-fA-F]{6}$/;

const normalizeHex = (value: string, fallback: string) => {
  const trimmed = value.trim();
  return hexPattern.test(trimmed) ? trimmed.toUpperCase() : fallback;
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const mixHex = (first: string, second: string, amount: number) => {
  const colorA = hexToRgb(first);
  const colorB = hexToRgb(second);
  const mix = (a: number, b: number) =>
    Math.round(a + (b - a) * amount);
  return rgbToHex(
    mix(colorA.r, colorB.r),
    mix(colorA.g, colorB.g),
    mix(colorA.b, colorB.b)
  );
};

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 3)}...`;
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
  color: string
) => {
  let size = fontSize;
  ctx.textAlign = "center";
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

const buildTemplates = (primary: string, accent: string): PosterTemplate[] => {
  const baseDark = "#0B0B10";
  const baseLight = "#F7F3EA";

  return [
    {
      id: "gilt",
      name: "Gilt Plaque",
      description: "Classic dark board with gold framing.",
      cta: "Connect with us",
      palette: {
        background: baseDark,
        backgroundAlt: mixHex(baseDark, primary, 0.12),
        frame: mixHex(primary, "#FFFFFF", 0.25),
        text: "#F8F4E6",
        muted: mixHex("#F8F4E6", "#9CA3AF", 0.25),
        accent: primary,
        glow: mixHex(primary, "#FFFFFF", 0.35),
        card: "#FDF8EE",
        cardBorder: mixHex(primary, "#FFFFFF", 0.35),
        qrDark: mixHex(primary, "#101010", 0.4),
        qrLight: "#FFFFFF",
      },
    },
    {
      id: "noir",
      name: "Noir Accent",
      description: "Deep tones with bold accent energy.",
      cta: "Scan the code",
      palette: {
        background: mixHex(baseDark, accent, 0.08),
        backgroundAlt: mixHex("#111827", accent, 0.16),
        frame: mixHex(accent, "#FFFFFF", 0.22),
        text: "#F3F4F6",
        muted: mixHex("#F3F4F6", "#94A3B8", 0.35),
        accent,
        glow: mixHex(accent, "#FFFFFF", 0.28),
        card: mixHex("#F8FAFC", accent, 0.08),
        cardBorder: mixHex(accent, "#FFFFFF", 0.35),
        qrDark: mixHex(accent, "#0F172A", 0.5),
        qrLight: "#FFFFFF",
      },
    },
    {
      id: "ivory",
      name: "Ivory Studio",
      description: "Light premium layout with soft framing.",
      cta: "Your link, beautifully",
      palette: {
        background: baseLight,
        backgroundAlt: mixHex(baseLight, primary, 0.1),
        frame: mixHex(primary, "#000000", 0.2),
        text: "#1F2937",
        muted: mixHex("#1F2937", "#6B7280", 0.55),
        accent,
        glow: mixHex(accent, "#FFFFFF", 0.35),
        card: "#FFFFFF",
        cardBorder: mixHex(primary, "#FFFFFF", 0.5),
        qrDark: mixHex(primary, "#111827", 0.4),
        qrLight: "#FFFFFF",
      },
    },
  ];
};

type PosterPayload = {
  template: PosterTemplate;
  brandName: string;
  tagline: string;
  url: string;
  qrSize: number;
  qrDataUrl: string;
  logoImage: HTMLImageElement | null;
};

const createPoster = async ({
  template,
  brandName,
  tagline,
  url,
  qrSize,
  qrDataUrl,
  logoImage,
}: PosterPayload) => {
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  const { palette } = template;
  const gradient = ctx.createLinearGradient(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  gradient.addColorStop(0, palette.background);
  gradient.addColorStop(1, palette.backgroundAlt);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = palette.glow;
  ctx.beginPath();
  ctx.ellipse(POSTER_WIDTH * 0.82, POSTER_HEIGHT * 0.18, 190, 120, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.ellipse(POSTER_WIDTH * 0.18, POSTER_HEIGHT * 0.86, 220, 140, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.lineWidth = 6;
  ctx.strokeStyle = palette.frame;
  ctx.strokeRect(28, 28, POSTER_WIDTH - 56, POSTER_HEIGHT - 56);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.strokeRect(52, 52, POSTER_WIDTH - 104, POSTER_HEIGHT - 104);

  if (logoImage) {
    const logoSize = 88;
    const logoX = 110;
    const logoY = 110;
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      logoImage,
      logoX - logoSize / 2,
      logoY - logoSize / 2,
      logoSize,
      logoSize
    );
    ctx.restore();

    ctx.strokeStyle = palette.frame;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoSize / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawFittedText(
    ctx,
    brandName,
    POSTER_WIDTH - 200,
    48,
    DISPLAY_FONT,
    700,
    POSTER_WIDTH / 2,
    128,
    palette.text
  );

  drawFittedText(
    ctx,
    tagline,
    POSTER_WIDTH - 240,
    22,
    BODY_FONT,
    500,
    POSTER_WIDTH / 2,
    162,
    palette.muted
  );

  ctx.font = `600 26px "${DISPLAY_FONT}"`;
  ctx.textAlign = "center";
  ctx.fillStyle = palette.accent;
  ctx.fillText(template.cta, POSTER_WIDTH / 2, 220);

  const cardWidth = qrSize + 90;
  const cardHeight = qrSize + 90;
  const cardX = (POSTER_WIDTH - cardWidth) / 2;
  const cardY = 260;

  drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 28);
  ctx.fillStyle = palette.card;
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = palette.cardBorder;
  ctx.stroke();

  const qrImage = await loadImage(qrDataUrl);
  ctx.drawImage(qrImage, cardX + 45, cardY + 45, qrSize, qrSize);

  const displayUrl = truncateText(url, 52);
  ctx.font = `500 20px "${BODY_FONT}"`;
  ctx.fillStyle = palette.muted;
  ctx.textAlign = "center";
  ctx.fillText(displayUrl, POSTER_WIDTH / 2, cardY + cardHeight + 50);

  ctx.font = `600 18px "${BODY_FONT}"`;
  ctx.fillStyle = palette.text;
  ctx.fillText(template.name, POSTER_WIDTH / 2, POSTER_HEIGHT - 62);

  return canvas.toDataURL("image/png");
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [brandName, setBrandName] = useState("Site2QR Studio");
  const [tagline, setTagline] = useState("Scan to connect");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [size, setSize] = useState(String(QR_SIZES[1]));
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [posters, setPosters] = useState<PosterResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedPrimary = normalizeHex(primaryColor, DEFAULT_PRIMARY);
  const normalizedAccent = normalizeHex(accentColor, DEFAULT_ACCENT);

  const templates = useMemo(
    () => buildTemplates(normalizedPrimary, normalizedAccent),
    [normalizedPrimary, normalizedAccent]
  );

  useEffect(() => {
    return () => {
      if (logoUrl) {
        URL.revokeObjectURL(logoUrl);
      }
    };
  }, [logoUrl]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return objectUrl;
    });
  };

  const handleLogoClear = () => {
    setLogoUrl((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return null;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Please enter a URL to generate posters.");
      return;
    }

    setLoading(true);
    setPosters([]);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
        await Promise.all([
          document.fonts.load(`700 48px "${DISPLAY_FONT}"`),
          document.fonts.load(`500 20px "${BODY_FONT}"`),
        ]);
      }

      const logoImage = logoUrl ? await loadImage(logoUrl) : null;
      const qrSize = Math.min(Math.max(Number(size) || 260, 200), 360);
      const resolvedBrand = brandName.trim() || "Your Brand";
      const resolvedTagline = tagline.trim() || "Scan to connect";

      const nextPosters = await Promise.all(
        templates.map(async (template) => {
          const qrDataUrl = await toDataURL(trimmedUrl, {
            width: qrSize,
            margin: 1,
            color: {
              dark: template.palette.qrDark,
              light: template.palette.qrLight,
            },
          });

          const posterUrl = await createPoster({
            template,
            brandName: resolvedBrand,
            tagline: resolvedTagline,
            url: trimmedUrl,
            qrSize,
            qrDataUrl,
            logoImage,
          });

          return {
            id: template.id,
            name: template.name,
            description: template.description,
            posterUrl,
          };
        })
      );

      setPosters(nextPosters);
    } catch (err) {
      setError("Could not generate branded posters. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (poster: PosterResult) => {
    const link = document.createElement("a");
    link.href = poster.posterUrl;
    const fileSafeName = poster.name.replace(/\s+/g, "-").toLowerCase();
    link.download = `${fileSafeName}.png`;
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
          <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
            <motion.section
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur"
              initial={fadeUp.initial}
              animate={fadeUp.animate}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl">Brand inputs</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Enter a URL and brand details to generate three poster styles.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Palette
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{ backgroundColor: normalizedPrimary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full border border-white/20"
                      style={{ backgroundColor: normalizedAccent }}
                    />
                  </div>
                </div>
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
                    placeholder="Your brand name"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="brand-tagline"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Tagline
                  </label>
                  <Input
                    id="brand-tagline"
                    type="text"
                    value={tagline}
                    onChange={(event) => setTagline(event.target.value)}
                    placeholder="A short descriptor"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="brand-url"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Website URL
                  </label>
                  <Input
                    id="brand-url"
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

                <div className="space-y-2">
                  <label
                    htmlFor="qr-size"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    QR size
                  </label>
                  <Select value={size} onValueChange={setSize}>
                    <SelectTrigger
                      id="qr-size"
                      className="h-11 border-white/10 bg-slate-950/40 text-slate-100"
                    >
                      <SelectValue placeholder="Select QR size" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-slate-900 text-slate-100">
                      {QR_SIZES.map((value) => (
                        <SelectItem
                          key={value}
                          value={String(value)}
                          className="focus:bg-slate-800"
                        >
                          {value}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="brand-logo"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Logo (optional)
                  </label>
                  <input
                    id="brand-logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.3em] file:text-slate-200 hover:file:bg-white/20"
                  />
                  {logoUrl ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLogoClear}
                      className="h-10 w-full border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
                    >
                      Remove logo
                    </Button>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Use a square image for best results.
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-white text-slate-900 hover:bg-white/90"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate branded posters"}
                </Button>

                <p className="text-xs text-slate-500">
                  Posters are rendered locally in your browser.
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
                  <h2 className="font-display text-2xl">Poster preview</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Each style uses your brand colors and the same URL.
                  </p>
                </div>
                {posters.length ? (
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {posters.length} styles ready
                  </span>
                ) : null}
              </div>

              <div
                className={cn(
                  "grid gap-6",
                  posters.length ? "lg:grid-cols-2 xl:grid-cols-3" : ""
                )}
              >
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="aspect-[3/2] rounded-3xl border border-white/10 bg-white/5 animate-pulse"
                      />
                    ))
                  : posters.length
                    ? posters.map((poster, index) => (
                        <motion.div
                          key={poster.id}
                          className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                          <div className="aspect-[3/2] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                            <img
                              src={poster.posterUrl}
                              alt={`${poster.name} poster preview`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-display text-lg">
                                {poster.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {poster.description}
                              </p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => handleDownload(poster)}
                              className="bg-white/10 text-slate-100 hover:bg-white/20"
                            >
                              Download PNG
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    : (
                        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center text-slate-400">
                          <p className="text-sm">
                            Generate posters to preview your branded QR boards.
                          </p>
                        </div>
                      )}
              </div>
            </motion.section>
          </div>
        </main>
      </div>
    </div>
  );
}
