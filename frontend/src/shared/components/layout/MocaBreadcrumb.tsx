import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { resolveBreadcrumbs, type BreadcrumbCrumb } from '../../lib/breadcrumbs'

type Props = {
  items?: BreadcrumbCrumb[]
  variant?: 'stitch' | 'glass'
  className?: string
}

export function MocaBreadcrumb({ items, variant = 'stitch', className = '' }: Props) {
  const { pathname } = useLocation()
  const crumbs = items ?? resolveBreadcrumbs(pathname)

  if (crumbs.length <= 1) return null

  const crumbBase = 'inline-flex items-center !min-h-0 py-0 !text-sm leading-none'

  const linkClass =
    variant === 'stitch'
      ? `${crumbBase} text-on-surface-variant transition-colors hover:text-primary`
      : `${crumbBase} text-slate-500 transition-colors hover:text-blue-600`

  const currentClass =
    variant === 'stitch'
      ? `${crumbBase} font-medium text-on-surface`
      : `${crumbBase} font-medium text-slate-900`

  const sepClass = variant === 'stitch' ? 'text-outline shrink-0' : 'text-slate-300 shrink-0'

  return (
    <nav aria-label="Breadcrumb" className={`w-full ${className}`}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 w-full text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          return (
            <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight size={14} className={sepClass} aria-hidden />
              )}
              {isLast || !crumb.to ? (
                <span className={currentClass} aria-current={isLast ? 'page' : undefined}>
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className={linkClass}>
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
