import { auth } from "~/server/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import Flow from "~/components/Flow" 
 

export default async function Page({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const session = await auth()
 

  return (
    <main>
        <Tabs defaultValue="response" className="relative">
            <TabsList>
              <TabsTrigger value="knowledge-map">Knowledge Map</TabsTrigger>
              <TabsTrigger value="response">Report</TabsTrigger>
            </TabsList>
          <TabsContent value="response">
            <div className="prose prose-invert max-w-none">
              <h1>Response Analysis</h1>
              <p>This is a detailed analysis of the response provided by the system. The content here will help users understand the context and implications of the data.</p>
              <h2>Key Findings</h2>
              <ul>
                <li>Important point one about the response</li>
                <li>Critical observation about the data</li>
                <li>Relevant patterns identified</li>
              </ul>
              <h2>Recommendations</h2>
              <p>Based on the analysis above, here are some recommended actions:</p>
              <ol>
                <li>First recommended action with explanation</li>
                <li>Second recommended action with context</li>
                <li>Third recommended action with implementation details</li>
              </ol>
              <blockquote>
                <p>Important insights and key takeaways from the analysis should be highlighted here for quick reference.</p>
              </blockquote>
            </div>
          </TabsContent>
          <TabsContent value="knowledge-map">
            <div className="w-full h-full border border-red-500 w-screen h-screen">
              <Flow/>
            </div>
          </TabsContent>
        </Tabs>
    </main>
  )
}