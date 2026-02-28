"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ProfileEditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    display_name: "",
    slug: "",
    category: "",
    short_description: "",
    long_description: "",
    city: "",
    region: "",
    latitude: 0,
    longitude: 0,
    age_attribute: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profiles/me");
      const data = await res.json();
      
      if (data.profile) {
        setProfile(data.profile);
        setFormData({
          display_name: data.profile.display_name || "",
          slug: data.profile.slug || "",
          category: data.profile.category || "",
          short_description: data.profile.short_description || "",
          long_description: data.profile.long_description || "",
          city: data.profile.city || "",
          region: data.profile.region || "",
          latitude: data.profile.latitude || 0,
          longitude: data.profile.longitude || 0,
          age_attribute: data.profile.age_attribute || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const url = profile
        ? `/api/profiles/${profile.id}`
        : "/api/profiles";
      
      const method = profile ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          age_attribute: formData.age_attribute ? parseInt(formData.age_attribute) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile");
      }

      setSuccess("Perfil salvo com sucesso!");
      if (!profile) {
        setProfile(data.profile);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {profile ? "Editar Perfil" : "Criar Perfil"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Preencha as informações do seu perfil profissional
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="display_name">Nome de Exibição *</Label>
              <Input
                id="display_name"
                required
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Seu nome profissional"
              />
            </div>

            <div>
              <Label htmlFor="slug">
                URL Personalizada *
                {profile?.slug_last_changed_at && (
                  <span className="text-xs text-gray-500 ml-2">
                    (pode mudar a cada 90 dias)
                  </span>
                )}
              </Label>
              <Input
                id="slug"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                placeholder="seu-nome"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Input
              id="category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Ex: Consultoria, Design, Desenvolvimento"
            />
          </div>

          <div>
            <Label htmlFor="short_description">
              Descrição Curta * (máx. 160 caracteres)
            </Label>
            <Input
              id="short_description"
              required
              maxLength={160}
              value={formData.short_description}
              onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
              placeholder="Uma breve descrição dos seus serviços"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.short_description.length}/160
            </p>
          </div>

          <div>
            <Label htmlFor="long_description">Descrição Completa *</Label>
            <Textarea
              id="long_description"
              required
              rows={6}
              value={formData.long_description}
              onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
              placeholder="Descreva seus serviços em detalhes"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="São Paulo"
              />
            </div>

            <div>
              <Label htmlFor="region">Estado/Região *</Label>
              <Input
                id="region"
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="SP"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                placeholder="-23.5505"
              />
            </div>

            <div>
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                placeholder="-46.6333"
              />
            </div>

            <div>
              <Label htmlFor="age_attribute">Idade (opcional)</Label>
              <Input
                id="age_attribute"
                type="number"
                value={formData.age_attribute}
                onChange={(e) => setFormData({ ...formData, age_attribute: e.target.value })}
                placeholder="25"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/portal")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Perfil"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
