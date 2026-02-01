import { Clapperboard, Film, Heart, PlayCircle, Sparkles, TrendingUp, Tv } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <div className="flex min-h-full w-full flex-col gap-8 p-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-linear-to-br from-primary/20 via-zinc-900 to-black p-8 shadow-2xl">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Bem-vindo de volta
          </div>
          <h1 className="mb-4 text-5xl font-black tracking-tight text-white md:text-6xl">
            NEXUS <span className="text-primary">IPTV</span>
          </h1>
          <p className="text-lg text-zinc-300">
            Seu player de alta performance para TV ao vivo, filmes e séries.
            <br className="hidden sm:block" />
            Escolha uma categoria ou use os atalhos abaixo para começar.
          </p>
        </div>
        {/* Efeito visual de fundo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent)]" />
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAccessCard
          href="/dashboard/live"
          icon={Tv}
          title="Ao Vivo"
          description="Canais em tempo real"
          color="from-blue-500/20 to-blue-600/20"
          borderColor="border-blue-500/30"
        />
        <QuickAccessCard
          href="/dashboard/movies"
          icon={Film}
          title="Filmes"
          description="Catálogo completo VOD"
          color="from-purple-500/20 to-purple-600/20"
          borderColor="border-purple-500/30"
        />
        <QuickAccessCard
          href="/dashboard/series"
          icon={Clapperboard}
          title="Séries"
          description="Episódios e temporadas"
          color="from-pink-500/20 to-pink-600/20"
          borderColor="border-pink-500/30"
        />
        <QuickAccessCard
          href="/dashboard/favorites"
          icon={Heart}
          title="Favoritos"
          description="Seus conteúdos salvos"
          color="from-red-500/20 to-red-600/20"
          borderColor="border-red-500/30"
        />
      </div>

      {/* Stats & Info Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          icon={PlayCircle}
          title="Reprodução Instantânea"
          description="Clique em qualquer conteúdo para assistir imediatamente no player integrado"
        />
        <InfoCard
          icon={TrendingUp}
          title="Atualizado Constantemente"
          description="Novo conteúdo adicionado diariamente ao catálogo"
        />
        <InfoCard
          icon={Heart}
          title="Gerencie Favoritos"
          description="Salve seus canais e programas favoritos para acesso rápido"
        />
      </div>

     
    </div>
  );
}

function QuickAccessCard({
  href,
  icon: Icon,
  title,
  description,
  color,
  borderColor,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  borderColor: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl border ${borderColor} bg-linear-to-br ${color} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
    >
      <div className="relative z-10">
        <Icon className="mb-3 h-10 w-10 text-white transition-transform duration-300 group-hover:scale-110" />
        <h3 className="mb-1 text-xl font-bold text-white">{title}</h3>
        <p className="text-sm text-zinc-300">{description}</p>
      </div>
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Link>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-700">
      <Icon className="mb-3 h-7 w-7 text-primary" />
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  );
}
