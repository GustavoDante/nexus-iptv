import { ContentLayout } from '@/components/content-layout';

export const dynamic = 'force-dynamic';

export default function AllSeriesPage() {
  return (
    <ContentLayout 
      action="get_series" 
      title="Todas as Séries" 
    />
  );
}
