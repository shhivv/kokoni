import { HydrateClient } from "~/trpc/server";
import { SearchBar } from "~/components/search-bar";

export default async function Home() {
  return (
    <HydrateClient >
      <div className="image-background-main w-full h-full flex items-center justify-center">
      <SearchBar/>
      </div>
    </HydrateClient>
  );
}
