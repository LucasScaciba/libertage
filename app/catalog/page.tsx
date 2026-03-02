"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function CatalogPage() {
  const [boostedProfiles, setBoostedProfiles] = useState<any[]>([]);
  const [regularProfiles, setRegularProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    city: "",
    region: "",
  });
  const [availableFilters, setAvailableFilters] = useState({
    categories: [],
    cities: [],
    regions: [],
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [filters, page]);

  const fetchFilters = async () => {
    try {
      const res = await fetch("/api/catalog/filters");
      const data = await res.json();
      setAvailableFilters(data);
    } catch (err) {
      console.error("Error fetching filters:", err);
    }
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.city && { city: filters.city }),
        ...(filters.region && { region: filters.region }),
      });

      const res = await fetch(`/api/catalog?${params}`);
      const data = await res.json();

      setBoostedProfiles(data.boostedProfiles || []);
      setRegularProfiles(data.regularProfiles || []);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error fetching catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCatalog();
  };

  const ProfileCard = ({ profile, isBoosted = false }: any) => (
    <Link href={`/profiles/${profile.slug}`}>
      <Card style={{ cursor: "pointer", transition: "box-shadow 0.2s", height: "100%" }} className="hover:shadow-lg">
        {profile.media?.[0]?.public_url && (
          <div style={{ width: "100%", height: "12rem", overflow: "hidden", borderTopLeftRadius: "var(--radius)", borderTopRightRadius: "var(--radius)" }}>
            <img
              src={profile.media[0].public_url}
              alt={profile.display_name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        )}
        <CardContent style={{ padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "1.125rem", fontWeight: "600" }}>
              {profile.display_name}
            </h3>
            {isBoosted && (
              <Badge style={{ backgroundColor: "hsl(45 93% 47%)", color: "hsl(26 90% 10%)" }}>
                Destaque
              </Badge>
            )}
          </div>
          <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.5rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {profile.short_description}
          </p>
          <div style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <span>{profile.city}</span>
            <span>•</span>
            <span>{profile.region}</span>
          </div>
          <Badge variant="secondary">{profile.category}</Badge>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="container-custom" style={{ padding: "1.5rem 1rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700" }}>
            Catálogo de Serviços Premium
          </h1>
          <p style={{ marginTop: "0.5rem", color: "hsl(var(--muted-foreground))" }}>
            Encontre os melhores profissionais para seu projeto
          </p>
        </div>
      </header>

      <div className="container-custom" style={{ padding: "2rem 1rem" }}>
        {/* Search and Filters */}
        <Card style={{ marginBottom: "2rem" }}>
          <CardContent style={{ padding: "1.5rem" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <Input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                <select
                  style={{ 
                    width: "100%", 
                    height: "2.5rem", 
                    borderRadius: "var(--radius)", 
                    border: "1px solid hsl(var(--input))", 
                    backgroundColor: "hsl(var(--background))",
                    padding: "0 0.75rem",
                    fontSize: "0.875rem"
                  }}
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="">Todas as categorias</option>
                  {availableFilters.categories.map((cat: string) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  style={{ 
                    width: "100%", 
                    height: "2.5rem", 
                    borderRadius: "var(--radius)", 
                    border: "1px solid hsl(var(--input))", 
                    backgroundColor: "hsl(var(--background))",
                    padding: "0 0.75rem",
                    fontSize: "0.875rem"
                  }}
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                >
                  <option value="">Todas as cidades</option>
                  {availableFilters.cities.map((city: string) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                <select
                  style={{ 
                    width: "100%", 
                    height: "2.5rem", 
                    borderRadius: "var(--radius)", 
                    border: "1px solid hsl(var(--input))", 
                    backgroundColor: "hsl(var(--background))",
                    padding: "0 0.75rem",
                    fontSize: "0.875rem"
                  }}
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                >
                  <option value="">Todas as regiões</option>
                  {availableFilters.regions.map((region: string) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <Button type="submit">Buscar</Button>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <p style={{ color: "hsl(var(--muted-foreground))" }}>Carregando...</p>
          </div>
        ) : (
          <>
            {/* Boosted Profiles Section */}
            {boostedProfiles.length > 0 && (
              <div style={{ marginBottom: "3rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem" }}>
                  Perfis em Destaque
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  {boostedProfiles.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} isBoosted />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Profiles Section */}
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem" }}>
                {boostedProfiles.length > 0 ? "Todos os Perfis" : "Perfis"}
              </h2>
              {regularProfiles.length > 0 ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                    {regularProfiles.map((profile) => (
                      <ProfileCard key={profile.id} profile={profile} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {hasMore && (
                    <div style={{ marginTop: "2rem", textAlign: "center" }}>
                      <Button onClick={() => setPage(page + 1)}>
                        Carregar Mais
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ textAlign: "center", color: "hsl(var(--muted-foreground))", padding: "3rem 0" }}>
                  Nenhum perfil encontrado com os filtros selecionados.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
