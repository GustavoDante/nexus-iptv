'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

function SearchInputInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Usar ref para valores que não devem triggerar re-render
  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  
  // Atualizar refs quando mudam
  useEffect(() => {
    routerRef.current = router;
    pathnameRef.current = pathname;
  }, [router, pathname]);
  
  // Initialize from URL only once
  const initialQuery = searchParams.get('q') || '';
  const [term, setTerm] = useState(initialQuery);
  const isFirstRender = useRef(true);

  // Debounced search - only update URL after user stops typing
  useEffect(() => {
    // Não atualizar na primeira renderização
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams();
      if (term) {
        params.set('q', term);
      }
      const queryString = params.toString();
      const newUrl = queryString ? `${pathnameRef.current}?${queryString}` : pathnameRef.current;
      routerRef.current.replace(newUrl, { scroll: false });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [term]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  }, []);

  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
      <Input
        placeholder="Buscar canais, filmes..."
        value={term}
        onChange={handleChange}
        className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
      />
    </div>
  );
}

// Wrap in Suspense to prevent hydration issues with useSearchParams
export function SearchInput() {
  return (
    <Suspense fallback={
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Buscar canais, filmes..."
          disabled
          className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500"
        />
      </div>
    }>
      <SearchInputInner />
    </Suspense>
  );
}
