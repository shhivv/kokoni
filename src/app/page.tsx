import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import RadialGraph from "~/components/RadialGraph";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();
  const data = {
  americanRevolution: {
  causes: {
    taxation: {
      stampAct: {},
      teaAct: {},
      townshendActs: {}
    },
    representation: {
      noTaxationWithoutRepresentation: {},
      continentalCongress: {}
    },
    resistance: {
      bostonTeaParty: {},
      sonsOfLiberty: {}
    }
  },
  events: {
    battles: {
      lexingtonAndConcord: {},
      bunkerHill: {},
      saratoga: {},
      yorktown: {}
    },
    declarations: {
      declarationOfIndependence: {
        authors: {
          thomasJefferson: {},
          johnAdams: {},
          benjaminFranklin: {}
        }
      },
      oliveBranchPetition: {}
    }
  },
  people: {
    patriots: {
      georgeWashington: {},
      paulRevere: {},
      alexanderHamilton: {}
    },
    loyalists: {
      thomasHutchinson: {},
      josephGalloway: {}
    }
  },
  outcomes: {
    treatyOfParis: {
      terms: {
        independenceRecognized: {},
        britishTroopsWithdrawn: {}
      }
    },
    newGovernment: {
      articlesOfConfederation: {},
      usConstitution: {}
    }
  }
}};

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <RadialGraph data={data}/> 
          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              {hello ? hello.greeting : "Loading tRPC query..."}
            </p>

            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-2xl text-white">
                {session && <span>Logged in as {session.user?.name}</span>}
              </p>
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
