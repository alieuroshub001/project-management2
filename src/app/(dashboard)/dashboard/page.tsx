import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import HRDashboard from '@/components/dashboards/HRDashboard';
import TeamDashboard from '@/components/dashboards/TeamDashboard';
import ClientDashboard from '@/components/dashboards/ClientDashboard';

export default async function DashboardPage() {
  const supabase = createServerClient();

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/auth/signin');
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (!profile) {
    // If profile doesn't exist, sign out and redirect
    await supabase.auth.signOut();
    redirect('/auth/signin');
  }

  // Render the appropriate dashboard based on user role
  switch (profile.role) {
    case 'admin':
      return <AdminDashboard userId={profile.id} />;
    case 'hr':
      return <HRDashboard userId={profile.id} />;
    case 'team':
      return <TeamDashboard userId={profile.id} />;
    case 'client':
      return <ClientDashboard userId={profile.id} />;
    default:
      // Fallback to team dashboard if role is not recognized
      return <TeamDashboard userId={profile.id} />;
  }
}