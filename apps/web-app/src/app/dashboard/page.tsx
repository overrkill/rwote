import { redirect } from 'next/navigation'
import { getInitialData } from '@/lib/supabase-server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const { notes, user, subscription } = await getInitialData()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardClient
      initialNotes={notes}
      initialUser={user}
      initialSubscription={subscription}
    />
  )
}