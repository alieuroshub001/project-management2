import { assertRole } from "@/lib/auth/roleGuard";

export const dynamic = "force-dynamic";

export default async function TeamDashboardPage() {
  await assertRole("team");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Team Dashboard</h1>
      <ul className="mt-4 list-disc list-inside space-y-1">
        <li>My Projects</li>
        <li>My Tasks</li>
        <li>Time Tracking</li>
        <li>Messages</li>
      </ul>
    </div>
  );
}