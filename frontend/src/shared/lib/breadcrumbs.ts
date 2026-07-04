import { matchPath } from 'react-router-dom'

export type BreadcrumbCrumb = {
  label: string
  to?: string
}

type RouteDef = {
  path: string
  crumbs: BreadcrumbCrumb[] | ((params: Record<string, string | undefined>) => BreadcrumbCrumb[])
}

const ROUTES: RouteDef[] = [
  { path: '/patient', crumbs: [{ label: 'Trang chủ' }] },
  {
    path: '/patient/test',
    crumbs: [
      { label: 'Trang chủ', to: '/patient' },
      { label: 'Làm test MoCA' },
    ],
  },
  {
    path: '/patient/results',
    crumbs: [
      { label: 'Trang chủ', to: '/patient' },
      { label: 'Kết quả' },
    ],
  },
  {
    path: '/patient/appointments',
    crumbs: [
      { label: 'Trang chủ', to: '/patient' },
      { label: 'Lịch khám' },
    ],
  },
  {
    path: '/patient/clinicians',
    crumbs: [
      { label: 'Trang chủ', to: '/patient' },
      { label: 'Đổi bác sĩ' },
    ],
  },
  { path: '/clinician', crumbs: [{ label: 'Dashboard' }] },
  {
    path: '/clinician/patients',
    crumbs: [
      { label: 'Dashboard', to: '/clinician' },
      { label: 'Bệnh nhân' },
    ],
  },
  {
    path: '/clinician/reviews/:id',
    crumbs: [
      { label: 'Dashboard', to: '/clinician' },
      { label: 'Chấm điểm' },
    ],
  },
  { path: '/admin', crumbs: [{ label: 'Dashboard' }] },
  {
    path: '/admin/clinicians',
    crumbs: [
      { label: 'Dashboard', to: '/admin' },
      { label: 'Quản lý bác sĩ' },
    ],
  },
]

export function resolveBreadcrumbs(pathname: string): BreadcrumbCrumb[] {
  for (const route of ROUTES) {
    const match = matchPath({ path: route.path, end: true }, pathname)
    if (!match) continue
    return typeof route.crumbs === 'function' ? route.crumbs(match.params) : route.crumbs
  }
  return []
}
