import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint para diagnosticar problemas de conexão
 * Acesse: /api/health
 */
export async function GET(request: NextRequest) {
  const dns = request.cookies.get('nexus_dns')?.value;
  const username = request.cookies.get('nexus_username')?.value;
  const password = request.cookies.get('nexus_password')?.value;

  const diagnostics = {
    timestamp: new Date().toISOString(),
    server: {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
    },
    cookies: {
      hasDns: !!dns,
      hasUsername: !!username,
      hasPassword: !!password,
      dnsPreview: dns ? `${dns.substring(0, 30)}...` : null,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upstreamTest: null as any,
  };

  // Se tiver credenciais, testar conexão com o servidor Xtream
  if (dns && username && password) {
    try {
      const testUrl = `${dns}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;
      
      console.log('[Health] Testing upstream:', testUrl.replace(password, '***'));
      
      const startTime = Date.now();
      const response = await fetch(testUrl, {
        signal: AbortSignal.timeout(10000), // 10s timeout para teste
        headers: {
          'User-Agent': 'Nexus-IPTV-Health/1.0',
        },
      });
      const elapsed = Date.now() - startTime;

      diagnostics.upstreamTest = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${elapsed}ms`,
        headers: Object.fromEntries(response.headers.entries()),
      };

      // Tentar ler resposta
      if (response.ok) {
        try {
          const data = await response.json();
          diagnostics.upstreamTest.dataType = Array.isArray(data) ? 'array' : typeof data;
          diagnostics.upstreamTest.dataLength = Array.isArray(data) ? data.length : 0;
        } catch (e) {
            console.log('[Health] Failed to parse upstream JSON response', e);
          diagnostics.upstreamTest.parseError = 'Failed to parse JSON';
        }
      } else {
        const errorBody = await response.text().catch(() => 'No body');
        diagnostics.upstreamTest.errorBody = errorBody.substring(0, 200);
      }

    } catch (error) {
      diagnostics.upstreamTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      };
    }
  }

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
