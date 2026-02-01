import { ContentLayout } from '@/components/content-layout';

export const dynamic = 'force-dynamic';

export default function AllLivePage() {
  return (
    <ContentLayout 
      action="get_live_streams" 
      title="Todos os Canais" 
    />
  );
}
