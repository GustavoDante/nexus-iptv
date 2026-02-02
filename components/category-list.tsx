'use client';

import { Card, CardContent } from '@/components/ui/card';
import { VirtualGrid } from '@/components/virtual-grid';
import { Category, Channel } from '@/lib/types';
import { fetchCategories, fetchStreams } from '@/lib/xtream-client';
import { useQuery } from '@tanstack/react-query';
import { Clapperboard, Film, Loader2, Search, Tv } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

interface CategoryListProps {
  action: string;
  streamAction: string;
  title: string;
  baseRoute: string;
  Icon: React.ElementType;
}

function CategoryListInner({ action, streamAction, title, baseRoute, Icon }: CategoryListProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  // Busca categorias diretamente do navegador do usuário
  const { data: categories, isLoading: loadingCategories, error: categoriesError } = useQuery<Category[]>({
    queryKey: ['categories', action],
    queryFn: () => fetchCategories(action),
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
  });
  
  // Buscar todos os streams apenas quando há uma busca
  const { data: allStreams, isLoading: loadingStreams } = useQuery<Channel[]>({
    queryKey: ['allStreams', streamAction],
    queryFn: () => fetchStreams(streamAction),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!query, // Só busca quando tem query
  });
  
  // Filtrar resultados da busca
  const filteredStreams = useMemo(() => {
    if (!query || !allStreams) return [];
    const lowerQuery = query.toLowerCase();
    return allStreams.filter((item) => item.name.toLowerCase().includes(lowerQuery));
  }, [query, allStreams]);

  const isLoading = loadingCategories || (query && loadingStreams);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-zinc-400">
          {query ? 'Buscando...' : 'Carregando categorias...'}
        </span>
      </div>
    );
  }

  if (categoriesError) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Erro ao carregar categorias. Verifique sua conexão ou credenciais.
      </div>
    );
  }

  // Se há busca, mostrar resultados da busca
  if (query) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2 border-b border-zinc-800 mb-2">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Resultados para &quot;{query}&quot;
            <span className="text-zinc-500 text-sm ml-2">({filteredStreams.length})</span>
          </h1>
        </div>
        {filteredStreams.length > 0 ? (
          <VirtualGrid items={filteredStreams} />
        ) : (
          <div className="flex h-64 items-center justify-center text-zinc-500">
            Nenhum resultado encontrado para &quot;{query}&quot;.
          </div>
        )}
      </div>
    );
  }

  // Sem busca, mostrar categorias normalmente
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-zinc-800 mb-8">
         <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Icon className="w-6 h-6 text-primary" />
            {title} 
            <span className="text-zinc-500 text-sm ml-2">({categories?.length || 0} categorias)</span>
         </h1>
      </div>
      <div className="grid grid-cols-2 pt-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-4 overflow-auto pb-4">
        {/* Card "Ver Todos" */}
        <Link href={`${baseRoute}/all`}>
          <Card className="group bg-primary/10 border-primary/30 hover:ring-2 p-2 hover:ring-primary transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full min-h-25">
              <Search className="w-8 h-8 text-primary mb-2" />
              <p className="text-primary text-sm font-medium">Ver Todos</p>
            </CardContent>
          </Card>
        </Link>
        
        {categories?.map((category) => (
          <Link key={category.id} href={`${baseRoute}/${category.id}`}>
            <Card className="group bg-zinc-900 border-zinc-800 hover:ring-2 p-2 hover:ring-primary transition-all cursor-pointer h-full">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full min-h-25">
                <Icon className="w-8 h-8 text-zinc-500 group-hover:text-primary transition-colors mb-2" />
                <p className="text-white text-sm font-medium line-clamp-2">{category.name}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function CategoryList(props: CategoryListProps) {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <CategoryListInner {...props} />
    </Suspense>
  );
}

// Convenience exports for specific content types
export function LiveCategoryList() {
  return <CategoryList 
    action="get_live_categories" 
    streamAction="get_live_streams"
    title="Categorias de TV" 
    baseRoute="/dashboard/live" 
    Icon={Tv} 
  />;
}

export function MovieCategoryList() {
  return <CategoryList 
    action="get_vod_categories" 
    streamAction="get_vod_streams"
    title="Categorias de Filmes" 
    baseRoute="/dashboard/movies" 
    Icon={Film} 
  />;
}

export function SeriesCategoryList() {
  return <CategoryList 
    action="get_series_categories" 
    streamAction="get_series"
    title="Categorias de Séries" 
    baseRoute="/dashboard/series" 
    Icon={Clapperboard} 
  />;
}
