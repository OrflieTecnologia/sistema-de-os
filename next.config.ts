import type { NextConfig } from "next";

// Origem do Supabase (Storage serve as imagens via URL assinada). Público, não é segredo.
const supabaseOrigin = (() => {
  try {
    return process.env.SUPABASE_URL
      ? new URL(process.env.SUPABASE_URL).origin
      : "https://tqkpaqyxptcvojiomxbg.supabase.co";
  } catch {
    return "https://tqkpaqyxptcvojiomxbg.supabase.co";
  }
})();

const isDev = process.env.NODE_ENV !== "production";

// script-src: em produção não precisa de eval; em dev o HMR usa eval.
const scriptSrc = ["'self'", "'unsafe-inline'"];
if (isDev) scriptSrc.push("'unsafe-eval'");

// connect-src: server actions (mesma origem) + Supabase; em dev libera websocket do HMR.
const connectSrc = ["'self'", supabaseOrigin];
if (isDev) connectSrc.push("ws:", "wss:");

// Content-Security-Policy sob medida para o app (Next.js + Tailwind + Supabase Storage).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src ${scriptSrc.join(" ")}`,
  `connect-src ${connectSrc.join(" ")}`,
].join("; ");

// Cabeçalhos de segurança aplicados a todas as respostas (sem impacto visual).
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
