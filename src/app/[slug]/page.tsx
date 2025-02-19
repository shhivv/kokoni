import { auth } from "~/server/auth"
import { SearchTabs } from "~/components/search-tabs"
import { redirect } from "next/navigation"

export default async function Page({
  params,
}: {
  params: { slug: string }
}) {
  const session = await auth()
  
  if (!session) {
    redirect("/api/auth/signin")
  }

  return (
    <main className="h-[calc(100vh-4rem)] w-full bg-neutral-900">
      <SearchTabs searchId={params.slug} />
    </main>
  );
}