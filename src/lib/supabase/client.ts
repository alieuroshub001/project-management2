"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      name: "sb",
      maxAge: 60 * 60 * 24 * 7,
      domain: undefined,
      path: "/",
      sameSite: "lax",
    },
  });
}