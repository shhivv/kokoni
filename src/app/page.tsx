import Link from "next/link";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { SearchBar } from "~/components/SearchBar";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] bg-opacity-[0.98] text-neutral-100 p-4">
        {
          session && <SearchBar/>
        }
      </main>
    </HydrateClient>
  );
}
