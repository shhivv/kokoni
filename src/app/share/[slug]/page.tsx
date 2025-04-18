import { SearchTabs } from "~/components/search-tabs"
import { type Metadata } from "next"
import { api } from "~/trpc/server"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const publicSearch = await api.search.getByIdPublic({ id: slug })
  
  return {
    title: publicSearch.name,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params

  return (
    <main className="h-[calc(100vh-4r em)] w-full bg-background">
      <SearchTabs searchId={slug} />
    </main>
  );
}