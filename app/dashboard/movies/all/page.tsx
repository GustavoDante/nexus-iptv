import { ContentLayout } from '@/components/content-layout';

export const dynamic = 'force-dynamic';

export default function AllMoviesPage() {
  return (
    <ContentLayout 
      action="get_vod_streams" 
      title="Todos os Filmes" 
    />
  );
}
