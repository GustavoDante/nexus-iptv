import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Disable SSL verification for this Node.js process (Potentially unsafe, but required for expired certs)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  
  // Get DNS from cookies
  const dns = request.cookies.get('nexus_dns')?.value;
  
  if (!dns) {
    return new NextResponse('Configuration Error: Missing DNS', { status: 400 });
  }

  // clean and construct URL
  // Remove trailing slash from DNS if present
  const baseUrl = dns.endsWith('/') ? dns.slice(0, -1) : dns;
  const pathString = path.join('/');
  const targetUrl = `${baseUrl}/${pathString}`;

  console.log(`[Proxy] Proxying to: ${targetUrl}`);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Nexus-IPTV/1.0',
      },
      // Next.js (Node runtime) respects NODE_TLS_REJECT_UNAUTHORIZED
      // cache: 'no-store' is important for live streams
      cache: 'no-store',
    });

    // Create headers for the response
    const headers = new Headers(upstreamResponse.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    
    // Ensure correct content type for HLS/Video if upstream misses it
    if (path.some(p => p.endsWith('.m3u8'))) {
        headers.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (path.some(p => p.endsWith('.ts'))) {
        headers.set('Content-Type', 'video/mp2t');
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: headers,
    });

  } catch (error) {
    console.error('[Proxy] Error:', error);
    return new NextResponse(`Proxy Error: ${(error as Error).message}`, { status: 502 });
  }
}
