import { assertRole } from "@/lib/auth/roleGuard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await assertRole("admin");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <ul className="mt-4 list-disc list-inside space-y-1">
        <li>Project Management</li>
        <li>HR Management</li>
        <li>Communication</li>
        <li>Reporting</li>
        <li>Time Tracking</li>
      </ul>
    </div>
  );
}