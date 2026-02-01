import { ContentLayout } from '@/components/content-layout';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function SeriesCategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  
  return (
    <ContentLayout 
      action="get_series" 
      categoryId={categoryId}
      title="Séries" 
    />
  );
}
