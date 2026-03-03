import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import "./components.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Libertage — Plataforma de Serviços Premium",
  description: "Encontre e conecte-se com profissionais premium de serviços. Catálogo completo com perfis verificados e avaliações.",
  keywords: ["serviços premium", "profissionais", "catálogo", "libertage"],
  openGraph: {
    title: "Libertage — Plataforma de Serviços Premium",
    description: "Encontre e conecte-se com profissionais premium de serviços",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
