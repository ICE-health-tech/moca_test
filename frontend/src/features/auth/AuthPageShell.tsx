import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
}

/* LAYOUT: header brand | centered card | form inside card */
export function AuthPageShell({ title, subtitle, children }: Props) {
  return (
    <div className="app-shell bg-background text-on-background">
      <header className="flex h-12 shrink-0 items-center justify-center border-b border-outline-variant/40 bg-surface px-[var(--stitch-margin-mobile)]">
        <h1 className="text-lg font-semibold text-primary">Assessment Pro</h1>
      </header>

      <main className="app-shell__main app-shell__main--center px-[var(--stitch-margin-mobile)]">
        <div className="mx-auto w-full max-w-md">
          <section className="mb-5 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-on-background">{title}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
          </section>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export const authInputClass =
  'stitch-input w-full h-11 px-4 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm text-on-surface placeholder:text-outline transition-all duration-200'

export const authPrimaryBtn =
  'flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-on-primary shadow-sm transition-all active:scale-[0.98] disabled:opacity-60'

export const authSecondaryBtn =
  'flex h-11 flex-1 items-center justify-center rounded-lg border border-outline-variant bg-surface text-sm font-medium text-primary transition-all hover:border-primary/40 active:scale-[0.98]'
