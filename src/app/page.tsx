import { HydrateClient } from "~/trpc/server";
import { SearchBar } from "~/components/search-bar";

export default async function Home() {
  return (
    <HydrateClient>
      <SearchBar/>
    </HydrateClient>
  );
}
