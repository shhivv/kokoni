import { Skeleton } from "~/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"

export default function Loading() {
  return (
    <main className="h-[calc(100vh-4rem)] w-full">
      <Tabs defaultValue="knowledge-map" className="h-full flex flex-col bg-card">
        <div>
          <TabsList className="m-4">
            <TabsTrigger value="knowledge-map">Knowledge Map</TabsTrigger>
            <TabsTrigger value="response">Report</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="knowledge-map" className="flex-1 overflow-hidden p-8">
          <div className="h-full w-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-8 w-[200px]" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24 w-24 rounded-lg" />
                <Skeleton className="h-24 w-24 rounded-lg" />
                <Skeleton className="h-24 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="response" className="flex-1 overflow-hidden">
          <div className="space-y-4 p-8">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[350px]" />
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-4 w-[400px]" />
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
} 