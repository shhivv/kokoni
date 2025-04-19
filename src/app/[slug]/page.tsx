import { auth } from "~/server/auth"
import { SearchTabs } from "~/components/search-tabs"
import { redirect } from "next/navigation"
import { type Metadata } from "next"
import { api } from "~/trpc/server"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const search = await api.search.getById({ id: slug })
  
  return {
    title: search.name,
  }
}

export default async function Page({ params }: PageProps) {

  const session = await auth()
  const { slug } = await params
  if (!session) {
    redirect("/api/auth/signin")
  }

  return (
    <main className="h-[calc(100vh-4rem)] w-full bg-background">
      <SearchTabs searchId={slug} />
    </main>
  );
}