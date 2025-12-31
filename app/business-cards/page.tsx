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
const CARD_WIDTH = 1050;
const CARD_HEIGHT = 600;

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

type CardPayload = {
  brandName: string;
  fullName: string;
  role: string;
  email: string;
  phone: string;
  website: string;
  primary: string;
  accent: string;
  qrDataUrl: string;
};

const createBusinessCard = async ({
  brandName,
  fullName,
  role,
  email,
  phone,
  website,
  primary,
  accent,
  qrDataUrl,
}: CardPayload) => {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported");
  }

  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  gradient.addColorStop(0, "#0B0B10");
  gradient.addColorStop(1, primary);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.ellipse(
    CARD_WIDTH * 0.82,
    CARD_HEIGHT * 0.2,
    240,
    140,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.restore();

  const panelX = 70;
  const panelY = 70;
  const panelWidth = CARD_WIDTH - 140;
  const panelHeight = CARD_HEIGHT - 140;

  drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 36);
  ctx.fillStyle = "#F9F6EF";
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = accent;
  ctx.stroke();

  const rightWidth = 300;
  const rightX = panelX + panelWidth - rightWidth;

  ctx.save();
  drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 36);
  ctx.clip();
  ctx.fillStyle = "rgba(15, 23, 42, 0.06)";
  ctx.fillRect(rightX, panelY, rightWidth, panelHeight);
  ctx.restore();

  const textX = panelX + 90;
  const textWidth = rightX - textX - 40;

  const markSize = 58;
  const markX = panelX + 90;
  const markY = panelY + 95;

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(markX, markY, markSize / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0B0B10";
  ctx.font = `700 24px "${DISPLAY_FONT}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getInitials(brandName), markX, markY + 1);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 16px "${BODY_FONT}"`;
  ctx.fillStyle = "#0F172A";
  ctx.fillText(brandName, markX + 50, panelY + 102);

  drawFittedText(
    ctx,
    fullName,
    textWidth,
    44,
    DISPLAY_FONT,
    700,
    textX,
    panelY + 175,
    "#0F172A",
    "left"
  );

  ctx.font = `500 20px "${BODY_FONT}"`;
  ctx.fillStyle = "#475569";
  ctx.fillText(role, textX, panelY + 210);

  ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textX, panelY + 232);
  ctx.lineTo(rightX - 40, panelY + 232);
  ctx.stroke();

  ctx.font = `500 18px "${BODY_FONT}"`;
  ctx.fillStyle = "#0F172A";
  ctx.fillText(email, textX, panelY + 270);

  ctx.fillStyle = "#475569";
  ctx.fillText(phone, textX, panelY + 300);
  ctx.fillText(website, textX, panelY + 330);

  const qrSize = 200;
  const qrX = rightX + (rightWidth - qrSize) / 2;
  const qrY = panelY + 90;

  drawRoundedRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 24);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const qrImage = await loadImage(qrDataUrl);
  ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

  ctx.font = `600 14px "${BODY_FONT}"`;
  ctx.fillStyle = "#0F172A";
  ctx.textAlign = "center";
  ctx.fillText("Scan for contact", rightX + rightWidth / 2, qrY + qrSize + 40);

  return canvas.toDataURL("image/png");
};

export default function BusinessCardsPage() {
  const [brandName, setBrandName] = useState("Site2QR Studio");
  const [fullName, setFullName] = useState("Avery Bloom");
  const [role, setRole] = useState("Creative Director");
  const [email, setEmail] = useState("hello@site2qr.com");
  const [phone, setPhone] = useState("+1 (212) 555-0190");
  const [website, setWebsite] = useState("https://site2qr.com");
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedPrimary = normalizeHex(primaryColor, DEFAULT_PRIMARY);
  const normalizedAccent = normalizeHex(accentColor, DEFAULT_ACCENT);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const trimmedWebsite = website.trim();
    if (!trimmedWebsite) {
      setError("Please enter a website URL to generate a QR code.");
      return;
    }

    setLoading(true);
    setCardUrl(null);

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
        await Promise.all([
          document.fonts.load(`700 44px "${DISPLAY_FONT}"`),
          document.fonts.load(`600 18px "${BODY_FONT}"`),
        ]);
      }

      const qrDataUrl = await toDataURL(trimmedWebsite, {
        width: 240,
        margin: 1,
        color: {
          dark: "#0F172A",
          light: "#FFFFFF",
        },
      });

      const nextCard = await createBusinessCard({
        brandName: brandName.trim() || "Your Brand",
        fullName: fullName.trim() || "Your Name",
        role: role.trim() || "Role",
        email: email.trim() || "hello@yourbrand.com",
        phone: phone.trim() || "+1 (555) 555-5555",
        website: trimmedWebsite,
        primary: normalizedPrimary,
        accent: normalizedAccent,
        qrDataUrl,
      });

      setCardUrl(nextCard);
    } catch (err) {
      setError("Could not generate the business card. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!cardUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = cardUrl;
    link.download = "business-card.png";
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
                Business cards
              </p>
              <h1 className="mt-3 font-display text-4xl text-slate-100">
                Branded business card generator
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">
                Build a print-ready card with a scannable QR and refined
                typography in minutes.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              1050 x 600 px
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
                <h2 className="font-display text-2xl">Card details</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Update the contact fields and generate a business card PNG.
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
                    placeholder="Your studio"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="full-name"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Full name
                  </label>
                  <Input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your name"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="role"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Role
                  </label>
                  <Input
                    id="role"
                    type="text"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="Role or title"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="hello@brand.com"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Phone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+1 (555) 555-5555"
                    className="h-11 border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="website"
                    className="text-xs uppercase tracking-[0.3em] text-slate-500"
                  >
                    Website URL
                  </label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
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
                  {loading ? "Generating..." : "Generate business card"}
                </Button>

                <p className="text-xs text-slate-500">
                  Cards render locally in your browser.
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
                  <h2 className="font-display text-2xl">Card preview</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Download the generated PNG when you are happy with the look.
                  </p>
                </div>
                {cardUrl ? (
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
                <div className="aspect-[7/4] rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
              ) : cardUrl ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/20">
                  <div className="aspect-[7/4] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <img
                      src={cardUrl}
                      alt="Business card preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center text-slate-400">
                  <p className="text-sm">
                    Generate a business card to preview it here.
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