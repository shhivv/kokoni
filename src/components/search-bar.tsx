

import { auth } from "~/server/auth"
import { SearchBarForm } from "./search-bar-form"

// const FormSchema = z.object({
//   query: z.string().min(1, {
//     message: "Query must be at least 1 character",
//   }),
// })

export async function SearchBar() {
  const session = await auth()
  
  return <SearchBarForm session={session} />
}
