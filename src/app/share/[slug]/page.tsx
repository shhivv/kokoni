import { api } from "~/trpc/server";
import { ShareReport } from "~/components/share-report";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const publicSearch = await api.search.getByIdPublic({ id: slug });

  return {
    title: publicSearch.name,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="h-[calc(100vh)] w-full bg-background">
      <ShareReport searchId={slug} />
    </main>
  );
}
