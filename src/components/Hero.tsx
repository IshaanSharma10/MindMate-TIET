import { Button } from "@/components/ui/button";
import heroIllustration from "@/assets/hero-illustration.png";

const Hero = () => {
  return (
    <section className="container mx-auto px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-24">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
        <div className="flex-1 animate-fade-in">
          <img
            src={heroIllustration}
            alt="Mental health support illustration"
            className="w-full max-w-md mx-auto lg:max-w-full"
          />
        </div>

        <div className="flex-1 text-center lg:text-left animate-fade-in">
          <h1 className="mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Hi, I'm MindMate
            <span className="inline-flex items-center justify-center ml-2 h-8 w-8 rounded bg-accent text-accent-foreground md:h-10 md:w-10">
              ✕
            </span>
            —your calm AI companion.
          </h1>
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            Share how you feel and receive gentle reflections.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button
              size="lg"
              className="bg-cta-blue text-cta-blue-foreground hover:bg-cta-blue/90 transition-all duration-200 hover:scale-105"
            >
              Start Chat
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 hover:bg-secondary transition-all duration-200 hover:scale-105"
            >
              View Insights
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
