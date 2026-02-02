import { Category, Channel, XtreamCategory, XtreamSeries, XtreamStream } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent caching of credentials

// Bypass SSL certificate validation for this route (fixes CERT_HAS_EXPIRED)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

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
    console.log('[API] ========== REQUEST START ==========');
    console.log('[API] Original DNS from cookie:', dns);
    console.log('[API] Action:', action);
    console.log('[API] Username:', username);
    console.log('[API] Has password:', !!password);
    
    // Detectar protocolo
    const usesHttps = dns.startsWith('https://');
    const usesHttp = dns.startsWith('http://');
    console.log('[API] Protocol detection:', { usesHttps, usesHttp });
    
    const apiUrl = `${dns}/player_api.php?username=${username}&password=${password}&action=${action}`;
    
    // Check if we need to fetch category_id specifically (for filtered streams)
    const category_id = searchParams.get('category_id');
    const stream_id = searchParams.get('stream_id');
    const series_id = searchParams.get('series_id');
    const vod_id = searchParams.get('vod_id');

    let fetchUrl = apiUrl;
    if (category_id) fetchUrl += `&category_id=${category_id}`;
    if (stream_id) fetchUrl += `&stream_id=${stream_id}`;
    if (series_id) fetchUrl += `&series_id=${series_id}`;
    if (vod_id) fetchUrl += `&vod_id=${vod_id}`;

    console.log('[API] Final URL (with protocol):', fetchUrl.replace(password, '***'));
    console.log('[API] URL protocol:', new URL(fetchUrl).protocol);
    console.log('[API] URL hostname:', new URL(fetchUrl).hostname);
    console.log('[API] URL port:', new URL(fetchUrl).port || 'default');
    
    const fetchOptions = {
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Nexus-IPTV/1.0',
        'Accept': 'application/json',
      },
      redirect: 'follow' as RequestRedirect, // Seguir redirecionamentos
    };
    
    console.log('[API] Fetch options:', JSON.stringify(fetchOptions, null, 2));
    console.log('[API] Starting fetch...');
    
    const fetchStart = Date.now();
    const res = await fetch(fetchUrl, fetchOptions);
    const fetchDuration = Date.now() - fetchStart;
    
    console.log('[API] ========== RESPONSE RECEIVED ==========');
    console.log('[API] Response time:', fetchDuration + 'ms');
    console.log('[API] Response status:', res.status, res.statusText);
    console.log('[API] Response URL (after redirects):', res.url);
    console.log('[API] Response headers:', JSON.stringify(Object.fromEntries(res.headers.entries()), null, 2));
    console.log('[API] Response redirected:', res.redirected);
    console.log('[API] Response type:', res.type);
    
    if (!res.ok) {
        console.log('[API] ========== ERROR RESPONSE ==========');
        const errorText = await res.text().catch(() => 'No error body');
        console.error('[API] Upstream error details:', {
          status: res.status,
          statusText: res.statusText,
          body: errorText.substring(0, 500),
          url: fetchUrl.replace(password, '***'),
          finalUrl: res.url,
          redirected: res.redirected,
        });
        
        // Se for 404 com HTTP, sugerir tentar HTTPS
        if (res.status === 404 && dns.startsWith('http://')) {
          console.log('[API] 💡 SUGGESTION: 404 with HTTP protocol. Server might require HTTPS.');
          console.log('[API] Try updating DNS to use https:// instead of http://');
          
          return NextResponse.json({ 
            error: 'Upstream server error',
            details: `Server returned ${res.status}: ${res.statusText}`,
            suggestion: 'Servidor retornou 404. Tente usar https:// ao invés de http:// no DNS.',
            upstream_url: dns,
            tested_url: fetchUrl.replace(password, '***'),
          }, { status: res.status });
        }
        
        return NextResponse.json({ 
          error: 'Upstream server error',
          details: `Server returned ${res.status}: ${res.statusText}`,
          upstream_url: dns,
        }, { status: res.status });
    }
    
    console.log('[API] ========== SUCCESS ==========');
    console.log('[API] Starting JSON parse...');

    const data = await res.json();
    
    console.log('[API] JSON parsed successfully');
    console.log('[API] Data type:', Array.isArray(data) ? `array[${data.length}]` : typeof data);
    console.log('[API] First item sample:', Array.isArray(data) && data[0] ? JSON.stringify(data[0]).substring(0, 200) : 'N/A');

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

    if (action === 'get_short_epg') {
        // Return EPG data as is, or optimize if needed
        return NextResponse.json(data);
    }

    // Return raw data for other actions (categories, login check)
    return NextResponse.json(data);

  } catch (error) {
    console.error('[API] Fatal error:', error);
    console.error('[API] Request details:', {
      action,
      dns: dns ? `${dns.substring(0, 20)}...` : 'missing',
      hasUsername: !!username,
      hasPassword: !!password,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCause: error instanceof Error && 'cause' in error ? (error).cause : undefined,
    });
    
    // Erro específico de timeout
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ 
        error: 'Request timeout',
        message: 'O servidor Xtream demorou muito para responder (>30s)',
        action,
      }, { status: 504 });
    }
    
    // Erro de rede/conexão
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      return NextResponse.json({ 
        error: 'Network error',
        message: 'Não foi possível conectar ao servidor Xtream. Verifique se o DNS está correto e acessível.',
        details: error.message,
        action,
      }, { status: 502 });
    }
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      action,
    }, { status: 500 });
  }
}
