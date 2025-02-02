import Link from "next/link";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 text-black p-4">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">Rover</h1>
          <p className="text-gray-600 text-lg">Explore with precision</p>
        </header>

        <section className="w-1/2">
          <div className="bg-white shadow-lg rounded-2xl p-6 space-y-4">
            <form className="flex flex-col space-y-4" action="/">
              <input
                id="search-box"
                type="text"
                placeholder="Search..."
                className="border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition w-full"
              >
                Search
              </button>
            </form>

            <div className="flex justify-between">
              <form className="space-x-2">
                <input type="hidden" name="search" id="search-input" />
                <button
                  type="submit"
                  formAction="#"
                  // onFocus={(e) => {
                  //   document.getElementById("search-box").value = e.target.innerText;
                  // }}
                  className="bg-gray-200 text-gray-800 rounded-xl px-4 py-2 hover:bg-gray-300 transition"
                >
                  Machine Learning
                </button>
                <button
                  type="submit"
                  formAction="#"
                  // onFocus={(e) => {
                  //   document.getElementById("search-box").value = e.target.innerText;
                  // }}
                  className="bg-gray-200 text-gray-800 rounded-xl px-4 py-2 hover:bg-gray-300 transition"
                >
                  Web Development
                </button>
                <button
                  type="submit"
                  formAction="#"
                  // onFocus={(e) => {
                  //   document.getElementById("search-box").value = e.target.innerText;
                  // }}
                  className="bg-gray-200 text-gray-800 rounded-xl px-4 py-2 hover:bg-gray-300 transition"
                >
                  Blockchain
                </button>
              </form>
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center">
          <div className="flex flex-col items-center space-y-3">
            {session && (
              <p className="text-sm text-gray-600">Logged in as {session.user?.name}</p>
            )}
            <Link
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              className="text-sm text-blue-600 hover:underline"
            >
              {session ? "Sign out" : "Sign in"}
            </Link>
          </div>
        </footer>
      </main>
    </HydrateClient>
  );
}
