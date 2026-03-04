import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CharacteristicsManagerClient from "./CharacteristicsManagerClient";

export default async function CharacteristicsPage() {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect("/login");
  }

  // Fetch user's profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ color: "hsl(var(--destructive))" }}>
          Erro ao carregar perfil. Por favor, crie seu perfil primeiro.
        </p>
      </div>
    );
  }

  return <CharacteristicsManagerClient profileId={profile.id} />;
}
