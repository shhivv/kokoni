"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "~/hooks/use-toast"
import { Button } from "~/components/ui/button"
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

const FormSchema = z.object({
  query: z.string().min(1, {
    message: "Query must be at least 1 character",
  }),
})

export function SearchBar(): JSX.Element {
  const router = useRouter()
  const utils = api.useUtils()
  
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: "",
    },
  })

  const { data: searches } = api.search.getAll.useQuery(undefined, {
    refetchOnWindowFocus: false,
  })

  // Mutation to create a new search
  const createSearch = api.search.create.useMutation({
    onSuccess: async (data) => {
      toast({
        title: "Search created",
        description: "Redirecting to your new search...",
      })
      // Reset the form
      form.reset()
      // Invalidate the searches query to refresh the sidebar
      await utils.search.getAll.invalidate()
      // Redirect to the new search page
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
    createSearch.mutate({
      name: data.query,
      additionalInstruction: "", // Empty string for additional instructions
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="w-full justify-center flex items-center gap-4">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="w-full max-w-md">
                <FormControl>
                  <Input
                    className="w-full border-0 border-b-2 border-neutral-700 rounded-none h-12 focus-visible:ring-0 hover:border-neutral-500 focus:border-neutral-100 transition-colors bg-transparent text-neutral-100 placeholder:text-neutral-500"
                    placeholder="Ask anything..."
                    {...field}
                    disabled={createSearch.status === "pending"}
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
            disabled={createSearch.status === "pending"}
          >
            <ArrowRight/>
          </Button>
        </form>
      </Form>
      <p className="text-sm text-neutral-500 text-center">
        Credits Remaining: {100 - (searches?.length || 0)}/100
      </p>
    </div>
  )
}
