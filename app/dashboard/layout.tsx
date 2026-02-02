import { AppSidebar } from '@/components/app-sidebar';
import { SearchInput } from '@/components/search-input';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { VideoPlayer } from '@/components/video-player';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-zinc-950 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-zinc-800 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-40 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="w-full">
                <SearchInput />
            </div>
        </header>
        <div className="flex-1 p-4 overflow-auto">
            {children}
        </div>
        
        {/* Helper div to verify VideoPlayer z-index fix */}
        <VideoPlayer />
      </SidebarInset>
    </SidebarProvider>
  );
}
