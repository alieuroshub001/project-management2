import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  async function signOut() {
    "use server";
    const s = await createSupabaseServerClient();
    await s.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr]">
      <aside className="border-r p-4 space-y-3">
        <div className="font-semibold">Dashboard</div>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/dashboard">Home</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/hr">HR</Link>
          <Link href="/team">Team</Link>
          <Link href="/client">Client</Link>
        </nav>
        <form action={signOut} className="pt-4">
          <button className="text-red-600 text-sm" type="submit">Sign out</button>
        </form>
      </aside>
      <main>{children}</main>
    </div>
  );
}