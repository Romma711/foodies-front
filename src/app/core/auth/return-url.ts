import { Router, UrlTree } from '@angular/router';

/**
 * Accepts only in-app absolute paths, so a crafted `?returnUrl=` cannot send the user to another
 * site after signing in (open redirect). `//host` and `/\host` are rejected because browsers
 * treat both as protocol-relative URLs.
 */
export function safeReturnUrl(url: string | null | undefined): string | null {
  if (
    !url ||
    url === '/' ||
    !url.startsWith('/') ||
    url.startsWith('//') ||
    url.startsWith('/\\')
  ) {
    return null;
  }
  return url;
}

/** Login redirect that carries the URL being navigated to, when there is one worth returning to. */
export function loginRedirect(router: Router, loginPath: string): UrlTree {
  const returnUrl = safeReturnUrl(router.currentNavigation()?.extractedUrl.toString());
  return router.createUrlTree([loginPath], returnUrl ? { queryParams: { returnUrl } } : {});
}
