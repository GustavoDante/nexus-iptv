'use client';

import { ChannelCard } from '@/components/channel-card';
import { ContentInfoDialog } from '@/components/content-info-dialog';
import { Button } from '@/components/ui/button';
import { Channel } from '@/lib/types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

interface VirtualGridProps {
  items: Channel[];
  itemsPerPage?: number;
}

const ITEMS_PER_PAGE = 30; // 30 itens por página

export const VirtualGrid = memo(function VirtualGrid({ items, itemsPerPage = ITEMS_PER_PAGE }: VirtualGridProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<Channel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular total de páginas e itens paginados
  const totalPages = useMemo(() => Math.ceil(items.length / itemsPerPage), [items.length, itemsPerPage]);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setCurrentPage(1);
  }

  const handleItemClick = useCallback((item: Channel) => {
      setSelectedItem(item);
      setDialogOpen(true);
  }, []);

  const handleDialogChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setTimeout(() => setSelectedItem(null), 150);
    }
  }, []);

  // Funções de navegação de página
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll para o topo ao mudar de página
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const goToFirstPage = useCallback(() => goToPage(1), [goToPage]);
  const goToLastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);
  const goToPrevPage = useCallback(() => goToPage(Math.max(1, currentPage - 1)), [goToPage, currentPage]);
  const goToNextPage = useCallback(() => goToPage(Math.min(totalPages, currentPage + 1)), [goToPage, currentPage, totalPages]);

  // Gerar números de páginas para exibir (max 5)
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  // Não mostrar paginação se houver apenas 1 página
  const showPagination = totalPages > 1;

  return (
    <>
        <div ref={topRef} />
        <div className="flex-1 min-h-0 w-full overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
              {paginatedItems.map((item) => (
                <div key={item.id} className="aspect-[2/3] w-full">
                    <ChannelCard item={item} onClick={handleItemClick} />
                </div>
              ))}
          </div>
        </div>
        
        {/* Barra de Paginação */}
        {showPagination && (
          <div className="flex items-center justify-center gap-1 py-3 px-4 border-t border-zinc-800 bg-zinc-900/50">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 mx-2">
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className={`h-8 w-8 p-0 ${
                    page === currentPage 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              className="h-8 w-8 text-zinc-400 hover:text-white disabled:opacity-30"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            
            <span className="ml-4 text-xs text-zinc-500">
              {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, items.length)} de {items.length}
            </span>
          </div>
        )}
        
        <ContentInfoDialog 
            item={selectedItem} 
            open={dialogOpen} 
            onOpenChange={handleDialogChange} 
        />
    </>
  );
});
