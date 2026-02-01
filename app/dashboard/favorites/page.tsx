'use client';

import { VirtualGrid } from '@/components/virtual-grid';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import { Heart, Loader2 } from 'lucide-react';
import { useSyncExternalStore } from 'react';

export default function FavoritesPage() {
    const favorites = useFavoritesStore((state) => state.favorites);
    const isClient = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    if (!isClient) {
         return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
         );
    }

    return (
        <div className="h-full flex flex-col">
             <div className="px-4 py-2 border-b border-zinc-800 mb-2 flex items-center gap-4">
                 <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                 <h1 className="text-xl font-semibold text-white">
                    Meus Favoritos <span className="text-zinc-500 text-sm ml-2">({favorites.length})</span>
                 </h1>
             </div>
             
             {favorites.length > 0 ? (
                <VirtualGrid items={favorites} />
             ) : (
                <div className="flex flex-col h-96 items-center justify-center text-zinc-500">
                    <Heart className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg">Você ainda não tem favoritos.</p>
                    <p className="text-sm">Adicione canais, filmes ou séries aos seus favoritos para vê-los aqui.</p>
                </div>
             )}
        </div>
    );
}
