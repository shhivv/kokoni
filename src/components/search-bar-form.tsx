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
import { ArrowRight } from "lucide-react"
import { api } from "~/trpc/react"
import type { Session } from "next-auth"
import { useState } from "react"
import { Textarea } from "~/components/ui/textarea"

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
  const [inputValue, setInputValue] = useState("")
  
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

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!session) {
      await signIn()
      return
    }
    
    createSearch.mutate({
      name: data.query,
      additionalInstruction: "",
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    form.setValue("query", e.target.value)
  }

  const getFontSize = () => {
    const baseSize = 64 // Starting font size (increased from 48)
    const minSize = 36 // Minimum font size (increased from 24)
    const maxLength = 20 // Length at which font size starts decreasing
    
    if (inputValue.length <= maxLength) {
      return baseSize
    }
    
    // Decrease font size gradually after maxLength
    const decrease = Math.min((inputValue.length - maxLength) * 3, baseSize - minSize)
    return baseSize - decrease
  }

  return (
    <div className="flex flex-col w-full gap-2 items-center justify-center min-h-[85vh]">
      <Form {...form}>
        <form autoComplete="false" onSubmit={form.handleSubmit(onSubmit)} className="w-[85vh] aspect-square flex flex-col items-center justify-center gap-4 relative">
          <FormField
            control={form.control}
            name="query"
            render={({ field }) => (
              <FormItem className="w-full h-full">
                <FormControl>
                  <div className="w-full h-full flex items-center justify-center">
                    <Textarea
                    autoFocus
                      className="w-full h-full font-serif focus:outline-none border-0 outline-0 rounded-none focus-visible:ring-0 hover:border-muted-foreground focus:border-foreground transition-all duration-300 bg-transparent text-foreground placeholder:text-muted-foreground/50 text-center resize-none"
                      autoComplete="false"
                      style={{ 
                        fontSize: `${getFontSize()}px`,
                        lineHeight: "1.2",
                        padding: "0",
                        paddingTop: "calc(42.5vh - 1em)",
                        height: "85vh",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "break-word",
                        verticalAlign: "middle"
                      }}
                      placeholder={session ? `What do you want to learn about, ${session.user.name?.split(" ")[0]}?` : "Sign in to ask questions..."}
                      {...field}
                      onChange={handleInputChange}
                      disabled={createSearch.status === "pending"}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                      onFocus={async () => {
                        if (!session) {
                          await signIn()
                        }
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-destructive" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            variant="ghost"
            className="absolute bottom-0 right-0 text-accent-foreground hover:text-foreground"
            disabled={createSearch.status === "pending"}
          >
            <ArrowRight/>
          </Button>
        </form>
      </Form>
      {session && (
        <p className="text-xs text-muted-foreground text-center font-label">
          Searches Remaining: {5 - (searchQuery.data?.length ?? 0)}/5
        </p>
      )}
    </div>
  )
}