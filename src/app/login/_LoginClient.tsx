"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginClient() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    setSupabase(client);

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/dashboard");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={typeof window !== "undefined" ? window.location.origin + "/dashboard" : undefined}
          view="sign_in"
        />
      </div>
    </div>
  );
}