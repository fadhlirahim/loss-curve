import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router'
import { Moon, Sun } from 'lucide-react'
import { overallProgress } from '@/data/roadmap'
import { useProgress } from '@/hooks/use-progress'
import appCss from '@/styles/app.css?url'

// Runs before paint so the page never flashes the wrong theme.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('roadmap-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){}})()`

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Roadmap to Mastery — ML/LLM research' },
      {
        name: 'description',
        content:
          'An interactive roadmap from strong software engineer to independent ML researcher. Artifacts over courses.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=IBM+Plex+Mono:wght@400;500;600&display=swap',
      },
    ],
    scripts: [{ children: THEME_INIT }],
  }),
  component: RootComponent,
})

function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    localStorage.setItem('roadmap-theme', next)
  }

  // No React state: the icons swap via the `dark:` CSS variant, so SSR
  // markup is theme-agnostic and there's nothing to mismatch on hydration.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="lamp on / lamp off"
      className="self-center text-ink-soft transition-colors hover:text-vermillion"
    >
      <Moon className="h-3.5 w-3.5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden h-3.5 w-3.5 dark:inline" aria-hidden="true" />
    </button>
  )
}

const NAV = [
  { to: '/', label: 'overview' },
  { to: '/phases/$phaseId', params: { phaseId: '0' }, label: 'phases' },
  { to: '/method', label: 'method' },
  { to: '/rl', label: 'rl-track' },
  { to: '/habits', label: 'habits' },
  { to: '/glossary', label: 'glossary' },
  { to: '/resources', label: 'resources' },
] as const

function Nav() {
  const { checked } = useProgress()
  const { done, total } = overallProgress(checked)

  return (
    <header className="sticky top-0 z-40 border-paper-edge border-b bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-baseline justify-between gap-4 px-6 py-3 sm:px-10">
        <Link to="/" className="font-display font-semibold text-lg tracking-tight">
          Roadmap<span className="text-vermillion">.</span>
        </Link>
        <nav className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-[0.72rem] tracking-wide">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              params={'params' in item ? item.params : undefined}
              className="text-ink-soft transition-colors hover:text-vermillion [&.active]:text-vermillion [&.active]:underline [&.active]:underline-offset-4"
              activeOptions={{ exact: item.to === '/' }}
            >
              {item.label}
            </Link>
          ))}
          <span className="hidden text-ink-faint sm:inline" title="checklist artifacts shipped">
            [{done}/{total}]
          </span>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

function RootComponent() {
  return (
    // data-theme is set pre-hydration by THEME_INIT, so the attribute mismatch is expected
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Nav />
        <Outlet />
        <footer className="border-paper-edge border-t">
          <div className="mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-3 px-6 py-8 font-mono text-[0.7rem] text-ink-faint sm:px-10">
            <span>mastery is asymptotic — measure shipped artifacts instead</span>
            <span>progress lives in your browser · no account</span>
          </div>
        </footer>
        <Scripts />
      </body>
    </html>
  )
}
