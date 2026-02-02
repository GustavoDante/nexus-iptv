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
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Encoding', 'gzip, deflate');
    requestHeaders.set('Connection', 'keep-alive');

    return NextResponse.rewrite(new URL(targetUrl), {
      request: {
        headers: requestHeaders,
      },
    });
  }
}

export const config = {
  matcher: '/api/nexus/:path*',
};
