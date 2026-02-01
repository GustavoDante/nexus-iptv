'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Channel } from '@/lib/types';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlayerStore } from '@/store/usePlayerStore';
import { Play } from 'lucide-react';
import Image from 'next/image';
import { memo, useCallback, useEffect, useState } from 'react';

interface ChannelCardProps {
    item: Channel;
    onClick?: (item: Channel) => void;
}

export const ChannelCard = memo(function ChannelCard({ item, onClick }: ChannelCardProps) {
    const playChannel = usePlayerStore((state) => state.playChannel);
    const username = useAuthStore((state) => state.username);
    const password = useAuthStore((state) => state.password);
    
    const [imgSrc, setImgSrc] = useState(item.logo || '/default.jpg');
    const [imgError, setImgError] = useState(false);

    // Usar useEffect para atualizar a imagem quando o item mudar
    useEffect(() => {
         // eslint-disable-next-line react-hooks/set-state-in-effect
        setImgSrc(item.logo || '/default.jpg');
        setImgError(false);
    }, [item.logo]);

    const handlePlay = useCallback(() => {
        if (onClick) {
            onClick(item);
            return;
        }

        if (!username || !password) {
            alert("Credenciais não encontradas.");
            return;
        }
        
        let streamUrl = '';
        if (item.stream_type === 'movie') {
            const ext = item.extension || 'mp4';
            streamUrl = `/api/nexus/movie/${username}/${password}/${item.id}.${ext}`;
        } else if (item.stream_type === 'series') {
             const ext = item.extension || 'mp4';
             streamUrl = `/api/nexus/series/${username}/${password}/${item.id}.${ext}`;
        } else {
            streamUrl = `/api/nexus/live/${username}/${password}/${item.id}.m3u8`;
        }

        playChannel(streamUrl, item.name);
    }, [username, password, item, playChannel, onClick]);

    const handleImageError = useCallback(() => {
        if (!imgError) {
            setImgError(true);
            setImgSrc('/default.png');
        }
    }, [imgError]);

    return (
        <Card 
            className="group relative overflow-hidden bg-zinc-900 border-zinc-800 cursor-pointer hover:ring-2 hover:ring-primary transition-all h-full"
            onClick={handlePlay}
        >
            <CardContent className="p-0 relative h-full">
                {/* Container com aspect ratio para poster (2:3) */}
                <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center text-zinc-700">
                        <Play className="opacity-20 w-10 h-10" />
                    </div>
                    
                    <Image
                        src={imgSrc}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                        onError={handleImageError}
                    />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="text-white fill-white w-10 h-10 drop-shadow-lg" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black via-black/80 to-transparent pt-6">
                        <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{item.name}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
});
