import RadialGraph from "~/components/RadialGraph"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
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
  }
};

  const slug = (await params).slug
  return <RadialGraph data={data}/>
  
}