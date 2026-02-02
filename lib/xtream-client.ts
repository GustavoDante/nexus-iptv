'use client';

import { Category, Channel, XtreamCategory, XtreamSeries, XtreamStream } from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Serviço para fazer requisições direto do cliente (navegador)
 * Isso evita o bloqueio de IP da VPS por servidores Xtream
 */

interface FetchOptions {
  action: string;
  category_id?: string;
  stream_id?: string;
  series_id?: string;
  vod_id?: string;
}

export async function fetchXtreamDirect(options: FetchOptions): Promise<unknown> {
  const { dns, username, password } = useAuthStore.getState();
  
  if (!dns || !username || !password) {
    throw new Error('Não autenticado');
  }
  
  const { action, category_id, stream_id, series_id, vod_id } = options;
  
  let url = `${dns}/player_api.php?username=${username}&password=${password}&action=${action}`;
  
  if (category_id) url += `&category_id=${category_id}`;
  if (stream_id) url += `&stream_id=${stream_id}`;
  if (series_id) url += `&series_id=${series_id}`;
  if (vod_id) url += `&vod_id=${vod_id}`;
  
  console.log('[Client API] Fetching:', url.replace(password, '***'));
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Funções otimizadas para cada tipo de dado

export async function fetchCategories(action: string): Promise<Category[]> {
  const data = await fetchXtreamDirect({ action }) as XtreamCategory[];
  
  if (!Array.isArray(data)) {
    console.error('[Client API] Expected array, got:', typeof data);
    return [];
  }
  
  return data.map((item) => ({
    id: item.category_id,
    name: item.category_name,
  }));
}

export async function fetchStreams(action: string, category_id?: string): Promise<Channel[]> {
  const data = await fetchXtreamDirect({ action, category_id }) as (XtreamStream | XtreamSeries)[];
  
  if (!Array.isArray(data)) {
    console.error('[Client API] Expected array, got:', typeof data);
    return [];
  }
  
  const type = action === 'get_live_streams' ? 'live' : 
               action === 'get_vod_streams' ? 'movie' : 'series';
  
  return data.map((item) => {
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
}

export async function fetchVodInfo(vod_id: string): Promise<unknown> {
  return fetchXtreamDirect({ action: 'get_vod_info', vod_id });
}

export async function fetchSeriesInfo(series_id: string): Promise<unknown> {
  return fetchXtreamDirect({ action: 'get_series_info', series_id });
}

export async function fetchShortEpg(stream_id: string): Promise<unknown> {
  return fetchXtreamDirect({ action: 'get_short_epg', stream_id });
}
