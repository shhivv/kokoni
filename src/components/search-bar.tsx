"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { toast } from "~/hooks/use-toast"
import { Button } from "~/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { ArrowRight } from "lucide-react"

const FormSchema = z.object({
  query: z.string().min(1, {
    message: "Query must be atleast 1 character",
  }),
})

export function SearchBar(): JSX.Element {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: "",
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    })
  }

  return (
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
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
        >
          <ArrowRight/>
        </Button>
      </form>
    </Form>
  )
}
