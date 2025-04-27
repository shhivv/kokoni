import { HydrateClient } from "~/trpc/server";
import { SearchBar } from "~/components/search-bar";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="image-background-main relative flex h-full w-full items-center justify-center">
        <SearchBar />
        <div
          id="loading-overlay"
          className="absolute inset-0 hidden items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="font-medium text-foreground">
              Creating your research...
            </p>
          </div>
        </div>
      </div>
    </HydrateClient>
  );
}
