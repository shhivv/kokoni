import { auth } from "~/server/auth"
import { SearchTabs } from "~/components/search-tabs"
import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
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