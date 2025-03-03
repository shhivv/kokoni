import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { SearchBar } from "~/components/search-bar";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <SearchBar/>
    </HydrateClient>
  );
}
