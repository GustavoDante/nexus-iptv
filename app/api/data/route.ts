import { Category, Channel, XtreamCategory, XtreamSeries, XtreamStream } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * NOTA: Esta API Route não é mais usada em produção.
 * As requisições agora são feitas diretamente do cliente (navegador) 
 * para evitar bloqueio de IP de datacenter.
 * 
 * Este arquivo é mantido apenas para:
 * 1. Desenvolvimento local (onde não há bloqueio de IP)
 * 2. Possível fallback futuro
 */

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (!action) {
    return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
  }

  // Get credentials from cookies (secure server-side access)
  const dns = request.cookies.get('nexus_dns')?.value;
  const username = request.cookies.get('nexus_username')?.value;
  const password = request.cookies.get('nexus_password')?.value;

  if (!dns || !username || !password) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const apiUrl = `${dns}/player_api.php?username=${username}&password=${password}&action=${action}`;
    
    const category_id = searchParams.get('category_id');
    const stream_id = searchParams.get('stream_id');
    const series_id = searchParams.get('series_id');
    const vod_id = searchParams.get('vod_id');

    let fetchUrl = apiUrl;
    if (category_id) fetchUrl += `&category_id=${category_id}`;
    if (stream_id) fetchUrl += `&stream_id=${stream_id}`;
    if (series_id) fetchUrl += `&series_id=${series_id}`;
    if (vod_id) fetchUrl += `&vod_id=${vod_id}`;
    
    const res = await fetch(fetchUrl, {
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      redirect: 'follow',
    });
    
    if (!res.ok) {
        return NextResponse.json({ 
          error: 'Upstream server error',
          details: `Server returned ${res.status}: ${res.statusText}`,
          note: 'Use client-side requests instead (lib/xtream-client.ts)',
        }, { status: res.status });
    }

    const data = await res.json();

    // Optimization Layer for CATEGORIES
    if (action === 'get_live_categories' || action === 'get_vod_categories' || action === 'get_series_categories') {
        if (Array.isArray(data)) {
            const optimized: Category[] = data.map((item: XtreamCategory) => ({
               id: item.category_id,
               name: item.category_name,
            }));
            return NextResponse.json(optimized);
        }
    }

    // Optimization Layer for STREAMS
    if (action === 'get_live_streams' || action === 'get_vod_streams' || action === 'get_series') {
        if (Array.isArray(data)) {
             const type = action === 'get_live_streams' ? 'live' : 
                          action === 'get_vod_streams' ? 'movie' : 'series';

             const optimized: Channel[] = data.map((item: XtreamStream | XtreamSeries) => {
                 const stream = item as XtreamStream;
                 const series = item as XtreamSeries;
                 
                 return {
                    id: stream.stream_id || series.series_id,
                    name: item.name,
                    logo: stream.stream_icon || series.cover,
                    group_id: item.category_id,
                    stream_type: type,
                    extension: stream.container_extension,
                 };
             });
             return NextResponse.json(optimized);
        }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      note: 'Server-side requests may be blocked. Use client-side requests instead.',
    }, { status: 500 });
  }
}
