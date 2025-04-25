import { Github } from "lucide-react"
import Link from "next/link"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"

export default async function Page() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] w-full flex-col items-center bg-card px-4 pb-8 pt-24 md:px-8">
      <div className="mx-auto max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl font-bold font-heading">Kokoni Research Assistant</h1>
          <p className="text-xl text-muted-foreground">
            An open-source research assistant powered by AI that helps you pick and organize topics 
            to do comprehensive research on anything you want to learn about.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href="/">Get Started</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://github.com/shhivv/kokoni" target="_blank">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Link>
            </Button>
          </div>
        </section>

        <Separator />

        {/* Features Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Key Features</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">AI-Powered Topic Discovery</h3>
              <p className="text-muted-foreground">
                Leverage advanced AI to explore and discover relevant topics based on your interests,
                helping you build comprehensive research paths.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Smart Organization</h3>
              <p className="text-muted-foreground">
                Automatically organize your research materials, create connections between related topics,
                and maintain a clear overview of your learning journey.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Personalized Learning</h3>
              <p className="text-muted-foreground">
                Get customized recommendations and learning paths tailored to your interests,
                knowledge level, and learning style.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Collaborative Research</h3>
              <p className="text-muted-foreground">
                Share your research findings, collaborate with others, and build upon existing
                knowledge bases within the community.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* How It Works Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-center">How It Works</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">1. Choose Your Topic</h3>
              <p className="text-muted-foreground">
                Start by entering a topic you're interested in learning about. Kokoni will help you
                break it down into manageable subtopics and learning objectives.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">2. Explore and Organize</h3>
              <p className="text-muted-foreground">
                Use our AI-powered tools to discover related concepts, find high-quality resources,
                and organize your research materials in a structured way.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">3. Track Your Progress</h3>
              <p className="text-muted-foreground">
                Monitor your learning journey, set goals, and celebrate your achievements as you
                progress through your research topics.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* Open Source Section */}
        <section className="space-y-4 text-center">
          <h2 className="text-2xl font-bold">Open Source</h2>
          <Button variant="outline" asChild>
            <Link href="https://github.com/shhivv/kokoni" target="_blank">
              <Github className="mr-2 h-4 w-4" />
              Contribute on GitHub
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}