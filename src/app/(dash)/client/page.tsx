import { assertRole } from "@/lib/auth/roleGuard";

export const dynamic = "force-dynamic";

export default async function ClientDashboardPage() {
  await assertRole("client");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Client Dashboard</h1>
      <ul className="mt-4 list-disc list-inside space-y-1">
        <li>Projects</li>
        <li>Tasks</li>
        <li>Messages</li>
        <li>Reports</li>
      </ul>
    </div>
  );
}