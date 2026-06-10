import { createRouter, Link } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

function NotFound() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-24 sm:px-10">
      <p className="overline">404 · off the map</p>
      <h1 className="mt-3 font-display font-medium text-4xl tracking-tight">
        This page doesn't exist.
      </h1>
      <p className="prose-note mt-4">
        Like most shortcuts in this field. Go back to the{' '}
        <Link to="/" className="link-ink">
          overview
        </Link>
        .
      </p>
    </main>
  )
}

export function getRouter() {
  // New router instance per call — SSR isolates per request.
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultNotFoundComponent: NotFound,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
