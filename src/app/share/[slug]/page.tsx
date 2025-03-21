import { SearchTabs } from "~/components/search-tabs"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params

  return (
    <main className="h-[calc(100vh-4rem)] w-full bg-background">
      <SearchTabs searchId={slug} />
    </main>
  );
}