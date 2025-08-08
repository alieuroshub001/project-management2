import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { AuthProvider } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Loading from '@/components/ui/Loading';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar userRole={profile.role} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header userProfile={profile} />
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            <Suspense fallback={<Loading />}>
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}