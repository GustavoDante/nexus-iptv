'use client';

import { ChannelCard } from '@/components/channel-card';
import { ContentInfoDialog } from '@/components/content-info-dialog';
import { Button } from '@/components/ui/button';
import { Channel } from '@/lib/types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface VirtualGridProps {
  items: Channel[];
  itemsPerPage?: number;
}

const ITEMS_PER_PAGE = 60; // 60 itens por página (padrão)

// Número de colunas baseado no breakpoint
const getColumns = (width: number) => {
  if (width >= 1280) return 6; // xl
  if (width >= 1024) return 5; // lg
  if (width >= 768) return 4;  // md
  if (width >= 640) return 3;  // sm
  return 2;
};

const getRowHeight = (containerWidth: number, columns: number, gap: number = 16) => {
  const totalGap = gap * (columns - 1);
  const padding = 16;
  const cardWidth = (containerWidth - totalGap - padding) / columns;
  const cardHeight = cardWidth * 1.5;
  return cardHeight + 16;
};

export const VirtualGrid = memo(function VirtualGrid({ items, itemsPerPage = ITEMS_PER_PAGE }: VirtualGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<Channel | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [columns, setColumns] = useState(4);
  const [containerWidth, setContainerWidth] = useState(800);
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular total de páginas e itens paginados
  const totalPages = useMemo(() => Math.ceil(items.length / itemsPerPage), [items.length, itemsPerPage]);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  }, [items, currentPage, itemsPerPage]);

  // Reset para página 1 quando os items mudam (nova busca/categoria)
  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  // Observar mudanças de tamanho do container
  useEffect(() => {
    if (!parentRef.current) return;

    const updateSize = (width: number) => {
      const newColumns = getColumns(width);
      setColumns((prev) => (prev !== newColumns ? newColumns : prev));
      setContainerWidth((prev) => (prev !== width ? width : prev));
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        updateSize(entry.contentRect.width);
      }
    });

    resizeObserver.observe(parentRef.current);
    updateSize(parentRef.current.clientWidth);

    return () => resizeObserver.disconnect();
  }, []);

  const rowCount = useMemo(() => Math.ceil(paginatedItems.length / columns), [paginatedItems.length, columns]);
  
  const estimatedRowHeight = useMemo(() => 
    getRowHeight(containerWidth, columns), 
    [containerWidth, columns]
  );

    // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: 2,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

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
    parentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div
          ref={parentRef}
          className="flex-1 min-h-0 w-full overflow-auto"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const startIndex = virtualRow.index * columns;
              const rowItems = paginatedItems.slice(startIndex, startIndex + columns);

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                    gap: '16px',
                    padding: '8px',
                  }}
                >
                  {rowItems.map((item) => (
                    <ChannelCard key={item.id} item={item} onClick={handleItemClick} />
                  ))}
                </div>
              );
            })}
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
