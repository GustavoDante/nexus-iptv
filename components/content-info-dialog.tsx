'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Channel, XtreamEpgShortResponse, XtreamEpisode, XtreamSeason, XtreamSeriesInfo, XtreamVodInfo } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { ChevronDown, Clock, Heart, Loader2, Play, Star } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ContentInfoDialogProps {
  item: Channel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function safeDecode(str: string) {
    try {
        if (/^[A-Za-z0-9+/]+={0,2}$/.test(str) && !str.includes(' ')) {
             return atob(str);
        }
        return str;
    } catch (e) {
        console.error("Error decoding string", e);
        return str;
    }
}

export function ContentInfoDialog({ item, open, onOpenChange }: ContentInfoDialogProps) {
    console.log("ContentInfoDialog render", { item, open });
    const [epg, setEpg] = useState<XtreamEpgShortResponse | null>(null);
    const [seriesData, setSeriesData] = useState<XtreamSeriesInfo | null>(null);
    const [vodData, setVodData] = useState<XtreamVodInfo | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const playChannel = usePlayerStore((state) => state.playChannel);
    const username = useAuthStore((state) => state.username);
    const password = useAuthStore((state) => state.password);
    
    // Favorites - usando selector estável para evitar re-renders
    const favorites = useFavoritesStore((state) => state.favorites);
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    
    // Memoizar o estado de favorito para evitar recálculos desnecessários
    const isFavorite = useMemo(() => {
        if (!item) return false;
        return favorites.some((fav) => fav.id === item.id);
    }, [favorites, item]);

    const handleToggleFavorite = useCallback(() => {
        if (item) {
            toggleFavorite(item);
        }
    }, [item, toggleFavorite]);

    // Reset state e fetch data quando o dialog abre ou o item muda
    useEffect(() => {
        if (!open || !item) {
            return;
        }

        // Reset state
        setEpg(null);
        setSeriesData(null);
        setVodData(null);
        setSelectedSeason('');
        setLoading(true);

        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async () => {
            try {
                if (item.stream_type === 'live' || !item.stream_type) {
                    const res = await fetch(
                        `/api/data?action=get_short_epg&stream_id=${item.id}&limit=1`,
                        { signal: controller.signal }
                    );
                    const data = await res.json();
                    if (isMounted) setEpg(data);
                } else if (item.stream_type === 'series') {
                    const res = await fetch(
                        `/api/data?action=get_series_info&series_id=${item.id}`,
                        { signal: controller.signal }
                    );
                    const data = await res.json();
                    if (isMounted) {
                        setSeriesData(data);
                        if (data.seasons && data.seasons.length > 0) {
                            setSelectedSeason(data.seasons[0].season_number?.toString());
                        }
                    }
                } else if (item.stream_type === 'movie') {
                    const res = await fetch(
                        `/api/data?action=get_vod_info&vod_id=${item.id}`,
                        { signal: controller.signal }
                    );
                    const data = await res.json();
                    if (isMounted) {
                        setVodData(data);
                    }
                }
            } catch (e) {
                if (e instanceof Error && e.name !== 'AbortError') {
                    console.error("Fetch error", e);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [open, item?.id, item?.stream_type, item]);

    const handlePlayItem = useCallback(() => {
        if (!item || !username || !password) return;

        let streamUrl = '';
        if (item.stream_type === 'movie') {
            const ext = item.extension || 'mp4';
            streamUrl = `/api/nexus/movie/${username}/${password}/${item.id}.${ext}`;
            playChannel(streamUrl, item.name);
            onOpenChange(false);
        } else {
             // Fallback/Default
             streamUrl = `/api/nexus/live/${username}/${password}/${item.id}.m3u8`;
             playChannel(streamUrl, item.name);
             onOpenChange(false);
        }
    }, [item, username, password, playChannel, onOpenChange]);

    const handlePlayEpisode = useCallback((episode: XtreamEpisode) => {
        if (!username || !password) return;
        const streamId = episode.id;
        const ext = episode.container_extension || 'mp4';
        const streamUrl = `/api/nexus/series/${username}/${password}/${streamId}.${ext}`;
        
        playChannel(streamUrl, `${episode.title} - ${item?.name}`);
        onOpenChange(false);
    }, [username, password, playChannel, item?.name, onOpenChange]);

    if (!item) return null;

    const currentProgram = epg?.epg_listings?.[0];
    
    // Determinar a melhor imagem de capa disponível
    const coverImage = vodData?.info?.cover_big || 
                       vodData?.info?.movie_image || 
                       seriesData?.info?.cover || 
                       item.logo;
    
    const hasLargeCover = !!(vodData?.info?.cover_big || 
                             vodData?.info?.movie_image || 
                             seriesData?.info?.cover);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl bg-zinc-900 border-zinc-800 p-0 overflow-hidden text-white max-h-[90vh] flex flex-col">
                {/* Header com imagem grande (para filmes/séries com capa) ou compacto (para canais) */}
                {hasLargeCover ? (
                    <div className="relative h-80 w-full shrink-0 bg-black">
                        <Image 
                            src={coverImage!} 
                            alt={item.name} 
                            fill 
                            className="object-cover z-0"
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-zinc-900 via-zinc-900/60 to-transparent z-10" />
                        
                        {/* Título sobreposto na imagem */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <DialogTitle className="text-3xl font-bold text-white drop-shadow-lg">
                                        {item.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-zinc-200 drop-shadow-md text-base mt-1">
                                       {item.stream_type === 'live' || !item.stream_type ? 'TV Ao Vivo' : 
                                        item.stream_type === 'movie' ? 'Filme' : 'Série'}
                                    </DialogDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className={cn(
                                        "shrink-0 border-zinc-600/50 bg-zinc-900/80 backdrop-blur-sm hover:bg-zinc-800",
                                        isFavorite && "border-red-600 bg-red-600/20 hover:bg-red-600/30"
                                    )}
                                    onClick={handleToggleFavorite}
                                >
                                    <Heart className={cn(
                                        "w-5 h-5",
                                        isFavorite ? "fill-red-600 text-red-600" : "text-white"
                                    )} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full shrink-0 bg-zinc-950 border-b border-zinc-800">
                        <div className="flex items-start gap-4 p-6">
                            {/* Logo pequeno lateral */}
                            {item.logo && (
                                <div className="relative h-24 w-24 shrink-0 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                                    <Image 
                                        src={item.logo} 
                                        alt={item.name} 
                                        fill 
                                        className="object-contain p-2"
                                        unoptimized
                                    />
                                </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
                                        <DialogDescription className="text-zinc-400 mt-1">
                                           {item.stream_type === 'live' || !item.stream_type ? 'TV Ao Vivo' : 
                                            item.stream_type === 'movie' ? 'Filme' : 'Série'}
                                        </DialogDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className={cn(
                                            "shrink-0 border-zinc-700 hover:bg-zinc-800",
                                            isFavorite && "border-red-600 bg-red-600/10 hover:bg-red-600/20"
                                        )}
                                        onClick={handleToggleFavorite}
                                    >
                                        <Heart className={cn(
                                            "w-5 h-5",
                                            isFavorite ? "fill-red-600 text-red-600" : "text-zinc-400"
                                        )} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="px-6 pb-6 pt-4 flex-1 overflow-auto">
                    {/* MOVIE/SERIES INFO quando tem capa grande */}
                    {hasLargeCover && (item.stream_type === 'movie' || item.stream_type === 'series') && (
                        <div className="mb-4 space-y-3">
                            {/* Rating para filmes/séries */}
                            {(vodData?.info?.rating || seriesData?.info?.rating) && (
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-medium text-white">
                                        {vodData?.info?.rating || seriesData?.info?.rating}
                                    </span>
                                    {(vodData?.info?.rating_5based || seriesData?.info?.rating_5based) && (
                                        <span className="text-xs text-zinc-500">
                                            ({vodData?.info?.rating_5based || seriesData?.info?.rating_5based}/5)
                                        </span>
                                    )}
                                </div>
                            )}
                            
                            {/* Sinopse */}
                            {(vodData?.info?.plot || vodData?.info?.description || seriesData?.info?.plot) && (
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    {vodData?.info?.plot || vodData?.info?.description || seriesData?.info?.plot}
                                </p>
                            )}
                            
                            {/* Metadados */}
                            {(vodData?.info?.director || vodData?.info?.actors || vodData?.info?.cast || 
                              seriesData?.info?.director || seriesData?.info?.cast) && (
                                <div className="text-xs text-zinc-400 space-y-1.5 pt-2 border-t border-zinc-800">
                                    {(vodData?.info?.director || seriesData?.info?.director) && (
                                        <p>
                                            <span className="text-zinc-500 font-medium">Diretor:</span>{' '}
                                            {vodData?.info?.director || seriesData?.info?.director}
                                        </p>
                                    )}
                                    {(vodData?.info?.actors || vodData?.info?.cast || seriesData?.info?.cast) && (
                                        <p className="line-clamp-2">
                                            <span className="text-zinc-500 font-medium">Elenco:</span>{' '}
                                            {vodData?.info?.actors || vodData?.info?.cast || seriesData?.info?.cast}
                                        </p>
                                    )}
                                    {(vodData?.info?.genre || seriesData?.info?.genre) && (
                                        <p>
                                            <span className="text-zinc-500 font-medium">Gênero:</span>{' '}
                                            {vodData?.info?.genre || seriesData?.info?.genre}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                
                     {/* SERIES DESCRIPTION - só para layout compacto sem capa grande */}
                     {item.stream_type === 'series' && seriesData?.info?.plot && !hasLargeCover && (
                        <p className="text-sm text-zinc-300 mb-4 line-clamp-3">
                            {seriesData.info.plot}
                        </p>
                    )}

                    {/* MOVIE DESCRIPTION & RATING - só para layout compacto sem capa grande */}
                    {item.stream_type === 'movie' && vodData?.info && !hasLargeCover && (
                        <div className="mb-4 space-y-2">
                            {vodData.info.rating && (
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm font-medium text-white">
                                        {vodData.info.rating}
                                    </span>
                                    {vodData.info.rating_5based && (
                                        <span className="text-xs text-zinc-500">
                                            ({vodData.info.rating_5based}/5)
                                        </span>
                                    )}
                                </div>
                            )}
                            {(vodData.info.plot || vodData.info.description) && (
                                <p className="text-sm text-zinc-300 line-clamp-3">
                                    {vodData.info.plot || vodData.info.description}
                                </p>
                            )}
                            {(vodData.info.director || vodData.info.actors || vodData.info.cast) && (
                                <div className="text-xs text-zinc-400 space-y-1">
                                    {vodData.info.director && (
                                        <p><span className="text-zinc-500">Diretor:</span> {vodData.info.director}</p>
                                    )}
                                    {(vodData.info.actors || vodData.info.cast) && (
                                        <p className="line-clamp-2">
                                            <span className="text-zinc-500">Elenco:</span> {vodData.info.actors || vodData.info.cast}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}


                    <div className="space-y-4">
                        {/* LIVE EPG SECTION */}
                        {(item.stream_type === 'live' || !item.stream_type) && (
                            <div className="bg-zinc-950/80 p-5 rounded-xl border border-zinc-800 min-h-30">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full py-4">
                                        <Loader2 className="animate-spin text-primary w-6 h-6" />
                                        <span className="ml-2 text-zinc-500 text-sm">Carregando guia...</span>
                                    </div>
                                ) : currentProgram ? (
                                    <div className="space-y-2 animate-in fade-in duration-300">
                                        <div className="flex items-center gap-2 text-red-500 font-medium uppercase text-xs tracking-wider">
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            <span>No Ar</span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white leading-tight">
                                            {safeDecode(currentProgram.title)}
                                        </h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">
                                            {safeDecode(currentProgram.description)}
                                        </p>
                                        <div className="text-xs text-zinc-500 font-mono mt-3 pt-3 border-t border-zinc-900 flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            {currentProgram.start} - {currentProgram.end}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-4 gap-2">
                                        <Clock className="w-8 h-8 opacity-20" />
                                        <p className="text-sm">Informações de programação indisponíveis.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SERIES SEASONS & EPISODES */}
                        {item.stream_type === 'series' && (
                            <div className="space-y-4">
                                {loading ? (
                                     <div className="flex justify-center p-8">
                                         <Loader2 className="animate-spin text-primary w-8 h-8" />
                                     </div>
                                ) : seriesData ? (
                                    <>
                                        {/* Season Selector */}
                                        <div className="relative">
                                            <select 
                                                className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-md p-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                                                value={selectedSeason}
                                                onChange={(e) => setSelectedSeason(e.target.value)}
                                            >
                                                {seriesData.seasons.map((season: XtreamSeason) => (
                                                    <option key={season.season_number} value={season.season_number}>
                                                        {season.name || `Temporada ${season.season_number}`}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3.5 w-5 h-5 text-zinc-500 pointer-events-none" />
                                        </div>

                                        {/* Episodes List */}
                                        <div className="flex flex-col gap-2 max-h-62.5 overflow-y-auto pr-2 custom-scrollbar">
                                            {selectedSeason && seriesData.episodes && seriesData.episodes[selectedSeason] ? (
                                                seriesData.episodes[selectedSeason].map((episode: XtreamEpisode) => (
                                                    <div 
                                                        key={episode.id} 
                                                        className="flex items-center gap-3 p-3 bg-zinc-950/50 hover:bg-zinc-800 rounded-lg group cursor-pointer transition-colors border border-zinc-800/50"
                                                        onClick={() => handlePlayEpisode(episode)}
                                                    >
                                                        <div className="shrink-0 w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center group-hover:bg-primary transition-colors">
                                                            <Play className="w-4 h-4 text-zinc-400 group-hover:text-black fill-current ml-0.5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">
                                                                {episode.episode_num}. {episode.title}
                                                            </p>
                                                            <p className="text-xs text-zinc-500">
                                                                {episode.container_extension?.toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-zinc-500 text-center py-4">Nenhum episódio encontrado.</p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-zinc-500 text-center">Erro ao carregar séries.</p>
                                )}
                            </div>
                        )}
                        
                         {/* MOVIE PLAY BUTTON */}
                         {item.stream_type === 'movie' && (
                             <Button 
                                className="w-full text-lg font-medium shadow-lg hover:shadow-primary/20 transition-all" 
                                size="lg"
                                onClick={handlePlayItem}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                        Carregando...
                                    </>
                                ) : (
                                    <>
                                        <Play className="fill-current w-5 h-5 mr-2" />
                                        Assistir Agora
                                    </>
                                )}
                            </Button>
                        )}
                        
                        {/* LIVE PLAY BUTTON */}
                        {(item.stream_type === 'live' || !item.stream_type) && (
                             <Button 
                                className="w-full mt-4 text-lg font-medium shadow-lg hover:shadow-primary/20 transition-all" 
                                size="lg"
                                onClick={handlePlayItem}
                            >
                                <Play className="fill-current w-5 h-5 mr-2" />
                                Assistir Agora
                            </Button>
                        )}

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
