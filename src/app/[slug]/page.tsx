import { auth } from "~/server/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import { Flow } from "~/components/flow"
import { Report } from "~/components/report"
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
      <Tabs defaultValue="response" className="h-full flex flex-col">
        <div className="px-4">
          <TabsList className="h-12">
            <TabsTrigger value="knowledge-map">Knowledge Map</TabsTrigger>
            <TabsTrigger value="response">Report</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="response" className="flex-1 overflow-hidden">
          <Report searchId={params.slug} />
        </TabsContent>
        
        <TabsContent value="knowledge-map" className="flex-1 overflow-hidden">
          <Flow />
        </TabsContent>
      </Tabs>
    </main>
  )
}