/** Where to go after login: the `redirect` param if it is a safe in-app path, else the feed. */
export function getRedirectTarget(searchParams: URLSearchParams) {
  const target = searchParams.get('redirect')
  if (!target || !target.startsWith('/') || target.startsWith('//')) return '/'
  return target
}
