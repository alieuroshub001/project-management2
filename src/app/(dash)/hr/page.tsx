import { assertRole } from "@/lib/auth/roleGuard";

export const dynamic = "force-dynamic";

export default async function HRDashboardPage() {
  await assertRole("hr");

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">HR Dashboard</h1>
      <ul className="mt-4 list-disc list-inside space-y-1">
        <li>Employees</li>
        <li>Attendance</li>
        <li>Leaves</li>
        <li>Documents</li>
        <li>On/Offboarding</li>
      </ul>
    </div>
  );
}