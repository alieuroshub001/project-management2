import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "hr" | "team" | "client";

export async function getSessionAndProfile() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, email")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  return { session, profile } as const;
}

export async function assertRole(required: AppRole | AppRole[]) {
  const requiredRoles = Array.isArray(required) ? required : [required];
  const { profile } = await getSessionAndProfile();
  if (!requiredRoles.includes(profile.role as AppRole)) {
    redirect(`/dashboard`);
  }
  return profile as { id: string; role: AppRole; full_name?: string | null };
}