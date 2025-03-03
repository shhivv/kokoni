"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "~/hooks/use-toast"
import { Button } from "~/components/ui/button"
import { signIn } from "next-auth/react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { ArrowRight } from "lucide-react"
import { api } from "~/trpc/react"
import { Session } from "next-auth"

const FormSchema = z.object({
  query: z.string().min(1, {
    message: "Query must be at least 1 character",
  }),
})

interface SearchBarFormProps {
  session: Session | null
}

export function SearchBarForm({ session }: SearchBarFormProps): JSX.Element {
  const router = useRouter()
  const utils = api.useUtils()
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: "",
    },
  })

  const searchQuery = api.search.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
    enabled: !!session,
  })

  const createSearch = api.search.create.useMutation({
    onSuccess: async (data) => {
      toast({
        title: "Search created",
        description: "Redirecting to your new search...",
      })
      form.reset()
      await utils.search.getAll.invalidate()
      router.push(`/${data.id}`)
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!session) {
      signIn()
      return
    }
    
    createSearch.mutate({
      name: data.query,
      additionalInstruction: "",
    })
  }

  return (
    <div className="flex flex-col w-full gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full justify-center flex items-center gap-4">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="w-full max-w-md">
                <FormControl>
                  <Input
                    className="w-full border-0 border-b-2 border-border rounded-none h-12 focus-visible:ring-0 hover:border-muted-foreground focus:border-foreground transition-colors bg-transparent text-foreground placeholder:text-muted-foreground"
                    placeholder={session ? "Ask anything..." : "Sign in to ask questions..."}
                    {...field}
                    disabled={createSearch.status === "pending"}
                    onFocus={() => {
                      if (!session) {
                        signIn()
                      }
                    }}
                  />
                </FormControl>
                <FormMessage className="text-destructive" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="bg-accent hover:bg-accent-foreground text-accent-foreground hover:text-accent"
            disabled={createSearch.status === "pending"}
          >
            <ArrowRight/>
          </Button>
        </form>
      </Form>
      {session && (
        <p className="text-sm text-muted-foreground text-center">
          Credits Remaining: {100 - (searchQuery.data?.length ?? 0)}/100
        </p>
      )}
    </div>
  )
}