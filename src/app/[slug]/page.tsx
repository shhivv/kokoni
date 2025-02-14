import { auth } from "~/server/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"


export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const slug = (await params).slug
  const session = await auth()
  return <main className="flex min-h-screen flex-col items-center justify-center bg-background w-full bg-opacity-[0.98] text-neutral-100 p-4">
    <Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">Make changes to your account here.</TabsContent>
  <TabsContent value="password">Change your password here.</TabsContent>
</Tabs>
      </main>
}