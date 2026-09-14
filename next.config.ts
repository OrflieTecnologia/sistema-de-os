import type { NextConfig } from "next";

// Cabeçalhos de segurança aplicados a todas as respostas.
// São proteções reais (transporte, clickjacking, sniffing, vazamento de referer
// e políticas de permissão), sem qualquer impacto visual no app.
const securityHeaders = [
  // Impede o navegador de "adivinhar" (sniff) o tipo do conteúdo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Impede que o site seja embutido em iframes de terceiros (anti-clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Não vaza a URL completa (com query) para sites externos.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Força HTTPS neste domínio por 2 anos (Vercel já serve por HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Desliga APIs sensíveis que o sistema não usa.
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
