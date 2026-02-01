import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/nexus')) {
    const dns = request.cookies.get('nexus_dns')?.value;

    if (!dns) {
      return NextResponse.json(
        { error: 'DNS not configured', details: 'Please login first' },
        { status: 401 }
      );
    }

    const path = request.nextUrl.pathname.replace('/api/nexus', '');
    const searchParams = request.nextUrl.search;
    const targetUrl = `${dns}${path}${searchParams}`;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('Host', new URL(dns).host);

    return NextResponse.rewrite(new URL(targetUrl));
  }
}

export const config = {
  matcher: '/api/nexus/:path*',
};
