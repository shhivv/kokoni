import { HydrateClient } from "~/trpc/server";
import { SearchBar } from "~/components/search-bar";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="image-background-main w-full h-full flex items-center justify-center relative">
        <SearchBar/>
        <div id="loading-overlay" className="absolute inset-0 bg-background/80 backdrop-blur-sm hidden items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-foreground font-medium">Creating your research...</p>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
