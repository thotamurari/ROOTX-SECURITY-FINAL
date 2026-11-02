import { lazy, type ComponentType } from 'react'

/**
 * Drop-in replacement for React.lazy() that retries a failed dynamic
 * import() once before giving up, and forces a one-time full page reload if
 * the failure looks like a stale/missing chunk (e.g. after a redeploy the
 * browser still has an old index.html referencing a JS chunk hash that no
 * longer exists on the server).
 *
 * This is the real fix for "navigating directly to /scan sometimes doesn't
 * load, refreshing fixes it" — a raw `lazy()` throws straight to the
 * nearest ErrorBoundary on ANY import() failure (a transient network blip,
 * the dev server mid-reoptimization, or a genuinely stale chunk), forcing
 * the user to notice something's wrong and manually refresh. This wrapper
 * automates exactly what that manual refresh does, transparently, before
 * ever bothering the user.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
    importer: () => Promise<{ default: T }>
) {
    return lazy(async () => {
        try {
            return await importer()
        } catch (firstError) {
            // Wait a beat — most transient failures (a race with Vite's
            // dependency pre-bundling, a dropped chunk request) resolve
            // within a few hundred ms.
            await new Promise((resolve) => setTimeout(resolve, 300))

            try {
                return await importer()
            } catch (secondError) {
                // Guard against an infinite reload loop: only force one
                // automatic reload per browser session per failing chunk.
                const reloadKey = `chunk-reload:${String(firstError)}`
                const alreadyReloaded = sessionStorage.getItem(reloadKey)

                if (!alreadyReloaded) {
                    sessionStorage.setItem(reloadKey, '1')
                    window.location.reload()
                    // Return a never-resolving promise while the reload happens
                    // so React doesn't render an error flash right before it.
                    return new Promise<{ default: T }>(() => {})
                }

                // Already tried a reload once for this exact failure — stop
                // retrying and let the ErrorBoundary show a real error with
                // a manual retry action instead of looping forever.
                throw secondError
            }
        }
    })
}
