'use client'

import DashboardView from '@/components/admin-kit/DashboardView'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function AdminDashboard() {
  useDocumentTitle('Dashboard')
  return <DashboardView appName="Berry Fitness for Health" showOrders />
}
