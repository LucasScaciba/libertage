"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer">
        {profile.media?.[0]?.public_url && (
          <img
            src={profile.media[0].public_url}
            alt={profile.display_name}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {profile.display_name}
            </h3>
            {isBoosted && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                Destaque
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {profile.short_description}
          </p>
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <span>{profile.city}</span>
            <span>•</span>
            <span>{profile.region}</span>
          </div>
          <div className="mt-2">
            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
              {profile.category}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Catálogo de Serviços Premium
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
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
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
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
                className="block w-full rounded-md border border-gray-300 px-3 py-2"
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
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Boosted Profiles Section */}
            {boostedProfiles.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Perfis em Destaque
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {boostedProfiles.map((profile) => (
                    <ProfileCard key={profile.id} profile={profile} isBoosted />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Profiles Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {boostedProfiles.length > 0 ? "Todos os Perfis" : "Perfis"}
              </h2>
              {regularProfiles.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {regularProfiles.map((profile) => (
                      <ProfileCard key={profile.id} profile={profile} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {hasMore && (
                    <div className="mt-8 text-center">
                      <Button onClick={() => setPage(page + 1)}>
                        Carregar Mais
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-gray-500 py-12">
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
