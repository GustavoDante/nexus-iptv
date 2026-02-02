'use client';

import { Button } from '@/components/ui/button';
import { VirtualGrid } from '@/components/virtual-grid';
import { Channel } from '@/lib/types';
import { fetchStreams } from '@/lib/xtream-client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useMemo } from 'react';

interface ContentLayoutProps {
  action: string;
  categoryId?: string;
  title: string;
}

function ContentLayoutInner({ action, categoryId, title }: ContentLayoutProps) {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const router = useRouter();
  const pathname = usePathname();

  // Busca streams diretamente do navegador do usuário
  const { data, isLoading, error } = useQuery<Channel[]>({
    queryKey: ['content', action, categoryId],
    queryFn: () => fetchStreams(action, categoryId),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!query) return data;
    const lowerQuery = query.toLowerCase();
    return data.filter((item) => item.name.toLowerCase().includes(lowerQuery));
  }, [data, query]);

  // Determine parent route for "Back" button
  const handleBack = () => {
    // If we are deep in /dashboard/live/[id], go back to /dashboard/live
    const segments = pathname.split('/');
    if (segments.length > 3) {
        segments.pop(); 
        router.push(segments.join('/'));
    } else {
        router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-zinc-400">Carregando lista...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500">
        Erro ao carregar conteúdo. Verifique sua conexão ou credenciais.
      </div>
    );
  }

  // Determine if we should show back button (any nested page)
  const showBackButton = pathname.split('/').length > 3;

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-zinc-800 mb-2 flex items-center gap-4">
         {showBackButton && (
            <Button variant="ghost" size="icon" onClick={handleBack} className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
            </Button>
         )}
         <h1 className="text-xl font-semibold text-white">
            {title} <span className="text-zinc-500 text-sm ml-2">({filteredData.length})</span>
         </h1>
      </div>
      {filteredData.length > 0 ? (
        <VirtualGrid items={filteredData} />
      ) : (
        <div className="flex h-64 items-center justify-center text-zinc-500">
          Nenhum item encontrado.
        </div>
      )}
    </div>
  );
}

export function ContentLayout(props: ContentLayoutProps) {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ContentLayoutInner {...props} />
    </Suspense>
  );
}
