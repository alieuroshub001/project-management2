"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Project } from "./types";

export async function listProjects(): Promise<Project[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as Project[];
}

export async function createProject(input: Pick<Project, "name" | "description" | "visibility">) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from("projects").insert(input).select("*").single();
  if (error) throw error;
  return data as Project;
}