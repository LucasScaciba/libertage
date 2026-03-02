import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="container-custom" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "4rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "700" }}>Premium Service Marketplace</h1>
          <nav style={{ display: "flex", gap: "1rem" }}>
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/catalog">
              <Button>Explorar</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ flex: "1", display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1rem" }}>
        <div className="container-custom" style={{ textAlign: "center", maxWidth: "48rem" }}>
          <h2 style={{ fontSize: "3rem", fontWeight: "800", lineHeight: "1.1", marginBottom: "1.5rem" }}>
            Encontre profissionais premium para seus projetos
          </h2>
          <p style={{ fontSize: "1.25rem", color: "hsl(var(--muted-foreground))", marginBottom: "2rem" }}>
            Conecte-se com os melhores prestadores de serviços. Qualidade garantida, resultados excepcionais.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/catalog">
              <Button size="lg" style={{ fontSize: "1.125rem", padding: "1.5rem 2rem" }}>
                Explorar Serviços
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" style={{ fontSize: "1.125rem", padding: "1.5rem 2rem" }}>
                Oferecer Serviços
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid hsl(var(--border))", padding: "2rem 1rem", textAlign: "center" }}>
        <div className="container-custom">
          <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
            © 2024 Premium Service Marketplace. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
