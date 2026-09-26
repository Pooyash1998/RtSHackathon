import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark, BrandWordmark } from "@/components/shared/Brand";
import { Button } from "@/components/ui/button";
import { assetUrl } from "@/lib/runtime";
import "./Landing.css";

const processSteps = [
  {
    title: "Upload your lesson.",
    body: "Add PDFs, worksheets, or lesson notes. EduComic uses your materials to ground the story.",
  },
  {
    title: "Bring in the whole class.",
    body: "Every student creates an avatar. Together, they become the recurring cast of the comic.",
  },
  {
    title: "Turn learning into a story.",
    body: "EduComic combines the lesson and class cast into an educational comic for the teacher to review.",
  },
  {
    title: "Let students see themselves learning.",
    body: "Students read a story where they and their classmates are part of the adventure.",
  },
] as const;

const visualLabels = [
  "A teacher's lesson materials ready for upload",
  "Eight student avatars joining the comic cast",
  "A printable twelve-panel EduComic page ready for review",
  "Three students reading their printed class comic together",
] as const;

const avatarPaths = Array.from(
  { length: 8 },
  (_, index) => assetUrl(`demo/how-it-works/avatar-${String(index + 1).padStart(2, "0")}.png`),
);

const teamMembers = [
  {
    name: "Florian Schwieren",
    avatar: assetUrl("demo/team/florian-avatar.png"),
    linkedin: "https://www.linkedin.com/in/florian-schwieren-618750215/",
  },
  {
    name: "Pouya Shekarchizadeh",
    avatar: assetUrl("demo/team/pouya-avatar.png"),
    linkedin: "https://www.linkedin.com/in/pooyash1998/",
  },
  {
    name: "Anastasia Koslova",
    avatar: assetUrl("demo/team/anastasia-avatar.png"),
    linkedin: "https://www.linkedin.com/in/anastasia-koslova-a329091b7/",
  },
  {
    name: "Tim Gaydoul",
    avatar: assetUrl("demo/team/tim-avatar.png"),
    linkedin: "https://www.linkedin.com/in/tim-gaydoul-048788174/",
  },
  {
    name: "Ben Theurich",
    avatar: assetUrl("demo/team/ben-avatar.png"),
    linkedin: "https://www.linkedin.com/in/ben-theurich/",
  },
] as const;

type ProcessStep = 1 | 2 | 3 | 4;

const PdfLabel = ({ children }: { children: string }) => (
  <div className="landing-pdf-label">
    <span className="landing-pdf-icon"><FileText aria-hidden="true" /></span>
    {children}
  </div>
);

const LessonVisual = () => (
  <div className="landing-document-scene">
    <article className="landing-paper landing-paper-back-a" aria-hidden="true">
      <span className="landing-back-sheet-type">Vocabulary worksheet</span>
      <strong>Cloud vocabulary</strong>
      <p>Match each weather word to its meaning.</p>
      <div className="landing-answer-lines"><span /><span /><span /><span /></div>
      <footer>Student handout · Page 2</footer>
    </article>
    <article className="landing-paper landing-paper-back-b" aria-hidden="true">
      <span className="landing-back-sheet-type">Science handout</span>
      <strong>Water cycle diagram</strong>
      <p>Label how water moves through the atmosphere.</p>
      <div className="landing-cycle-diagram">
        <span>Evaporation</span><span>Condensation</span><span>Rain</span>
      </div>
      <footer>Student handout · Page 3</footer>
    </article>
    <article className="landing-paper landing-paper-front">
      <PdfLabel>Lesson material</PdfLabel>
      <h3>How clouds make rain</h3>
      <p className="landing-paper-grade">Grade 5 science</p>
      <hr />
      <p className="landing-paper-section-label">Key ideas</p>
      <ul>
        <li>Water vapor rises and cools.</li>
        <li>Cooling forms liquid droplets.</li>
        <li>Droplets gather and fall as rain.</li>
      </ul>
      <footer className="landing-paper-footer">
        <span>Clouds &amp; weather</span>
        <span>Page 1</span>
      </footer>
    </article>
    <div className="landing-upload-note">
      <Check aria-hidden="true" />
      3 teaching files uploaded
    </div>
  </div>
);

const CastVisual = () => (
  <div className="landing-cast-scene is-balanced">
    {avatarPaths.map((src, index) => (
      <figure key={src} className={`landing-avatar landing-avatar-${index + 1}`}>
        <img src={src} alt="" loading="lazy" />
      </figure>
    ))}
    <div className="landing-cast-caption">8 students · 8 characters</div>
  </div>
);

const ComicVisual = () => (
  <div className="landing-comic-scene is-enlarged">
    <div className="landing-comic-shadow-page" />
    <figure className="landing-comic-page">
      <img src={assetUrl("demo/how-it-works/educomic-12-panel-pdf-v2.png")} alt="" loading="lazy" />
    </figure>
  </div>
);

const ReaderVisual = () => (
  <div className="landing-reader-scene">
    <figure className="landing-reader-photo">
      <img src={assetUrl("demo/how-it-works/group-reading-paper-back.png")} alt="" loading="lazy" />
    </figure>
    <div className="landing-reader-note">
      <strong>Their class. Their story.</strong>
      <span>Inside the finished comic</span>
    </div>
  </div>
);

const ProcessVisual = ({ step, active }: { step: ProcessStep; active: boolean }) => (
  <div
    className={`landing-process-visual${step === 2 ? " landing-process-visual-cast" : ""}${active ? " is-active" : ""}`}
    aria-hidden={!active}
    aria-label={visualLabels[step - 1]}
    role="img"
  >
    {step === 1 && <LessonVisual />}
    {step === 2 && <CastVisual />}
    {step === 3 && <ComicVisual />}
    {step === 4 && <ReaderVisual />}
  </div>
);

const Landing = () => {
  const [activeStep, setActiveStep] = useState<ProcessStep>(1);
  const stepElements = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      () => {
        const viewportCenter = window.innerHeight / 2;
        const focusedStep = stepElements.current
          .filter((element): element is HTMLElement => Boolean(element))
          .map((element) => {
            const { top, height } = element.getBoundingClientRect();
            return { element, distance: Math.abs(top + height / 2 - viewportCenter) };
          })
          .sort((a, b) => a.distance - b.distance)[0]?.element;

        if (focusedStep) setActiveStep(Number(focusedStep.dataset.step) as ProcessStep);
      },
      { rootMargin: "-28% 0px -28% 0px", threshold: [0, 0.2, 0.35] },
    );

    stepElements.current.forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
  <div className="educomic-landing min-h-screen bg-background">
    <header className="border-b bg-card">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-2 sm:px-10"
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground"
          aria-label="EduComic home"
        >
          <BrandMark className="size-7" />
          <BrandWordmark className="text-2xl" />
        </Link>

        <div className="flex min-h-11 items-center text-sm font-semibold text-primary">
          <Link
            to="/teacher/dashboard"
            aria-label="Teacher workspace"
            className="flex min-h-11 items-center border-r px-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-5"
          >
            <span className="sm:hidden">Teacher</span>
            <span className="hidden sm:inline">I'm a Teacher</span>
          </Link>
          <Link
            to="/student/select"
            aria-label="Student profiles"
            className="flex min-h-11 items-center px-3 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-5"
          >
            <span className="sm:hidden">Student</span>
            <span className="hidden sm:inline">I'm a Student</span>
          </Link>
        </div>
      </nav>
    </header>

    <main>
      <section className="overflow-hidden border-b text-primary-foreground">
        <div className="relative bg-[radial-gradient(circle_at_34%_28%,hsl(200_98%_40%),hsl(var(--primary))_68%)]">
          <div className="relative mx-auto max-w-[1500px] px-4 pb-8 pt-10 sm:px-10 sm:pt-14 lg:h-[572px] lg:px-12 lg:py-0">
            <div className="relative z-10 max-w-xl lg:absolute lg:left-12 lg:top-[82px] lg:w-[39%]">
              <h1 className="font-serif text-4xl font-semibold leading-[1.04] tracking-[-0.03em] sm:text-5xl lg:text-[3.85rem]">
                <span className="block lg:whitespace-nowrap">Turn a lesson</span>
                <span className="block lg:whitespace-nowrap">into a comic</span>
                <span className="block lg:whitespace-nowrap">starring your class.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-7 text-primary-foreground/90">
                <span className="block">Students become the heroes of their learning.</span>
                <span className="block">You bring the lesson. We turn it into a comic.</span>
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-14 w-full bg-card px-6 text-primary hover:bg-card/90 sm:w-auto"
                >
                  <Link to="/teacher/dashboard">
                    Get Started
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex h-14 w-full items-center justify-center rounded-md border border-primary-foreground/80 px-7 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary sm:w-auto"
                >
                  See How It Works
                </button>
              </div>
            </div>

            <div className="landing-hero-art relative mt-10 h-[390px] w-full lg:absolute lg:inset-0 lg:mt-0 lg:h-full">
              <figure className="landing-hero-comic absolute right-[-20%] top-[2%] z-50 w-[108%] -rotate-3 border-[8px] border-card bg-card shadow-[0_30px_48px_-20px_hsl(222_47%_11%/0.78)] sm:right-[-7%] sm:w-[92%] sm:border-[12px] lg:right-[-5%] lg:top-[5.5%] lg:w-[55%] lg:max-w-[790px] lg:-rotate-[4deg]">
                <img
                  src={assetUrl("demo/condensation-jar.png")}
                  alt="Maya and her fictional classmates investigate condensation"
                  className="aspect-[4/3] w-full border-2 border-foreground object-cover 2xl:aspect-[25/16]"
                />
              </figure>

              <figure className="landing-hero-photo absolute bottom-0 left-0 z-[60] w-[31%] rotate-6 border-[7px] border-card bg-card shadow-[0_22px_38px_-18px_hsl(222_47%_11%/0.82)] sm:border-[9px] lg:bottom-[1.5%] lg:left-[39.5%] lg:w-[15%] lg:max-w-[215px] lg:rotate-[5deg]">
                <img
                  src={assetUrl("demo/maya-fictional-portrait.png")}
                  alt="Fictional portrait of Maya Rivers"
                  className="aspect-[3/4] w-full object-cover"
                />
              </figure>

              <figure className="landing-hero-avatar absolute bottom-[3%] left-[24%] z-[70] size-[20%] overflow-hidden rounded-full border-[6px] border-card bg-card shadow-[0_16px_30px_-13px_hsl(222_47%_11%/0.9)] sm:border-[8px] lg:bottom-[7%] lg:left-[51.7%] lg:size-[8.5vw] lg:max-h-[118px] lg:max-w-[118px]">
                <img
                  src={assetUrl("demo/maya-avatar-bfl.jpg")}
                  alt="Comic avatar generated from Maya's fictional portrait"
                  className="absolute left-1/2 top-[-6%] w-[220%] max-w-none -translate-x-1/2"
                />
              </figure>

              <svg
                viewBox="0 0 150 85"
                className="landing-hero-arrow landing-hero-photo-arrow-mobile absolute bottom-[14%] left-[9%] z-[65] w-[28%] overflow-visible text-primary-foreground lg:hidden"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 12C17 55 42 72 80 71C102 70 118 61 130 49"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M115 52L133 48L128 66"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <svg
                viewBox="0 0 150 85"
                className="landing-hero-arrow landing-hero-arrow-desktop absolute hidden overflow-visible text-primary-foreground lg:bottom-[6%] lg:left-[36.3%] lg:z-[65] lg:block lg:w-[9%]"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 12C17 55 42 72 80 71C102 70 118 61 130 49"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M115 52L133 48L128 66"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <ol className="landing-flow-strip relative z-40 grid h-20 grid-cols-3 divide-x border-t bg-card text-foreground">
          {["Photo", "Character", "Comic"].map((label, index) => (
            <li key={label} className="landing-flow-step relative overflow-visible">
              <span className="landing-flow-label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[0.12em] sm:left-[30%] sm:translate-x-0 sm:text-sm">
                {label}
              </span>
              {index < 2 && (
                <svg
                  viewBox="0 0 220 14"
                  className="landing-flow-arrow absolute left-[76%] top-1/2 block w-[42%] -translate-y-1/2 overflow-visible text-foreground/55 sm:left-[58%] sm:w-[63%]"
                  aria-hidden="true"
                >
                  <path d="M1 7H211" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
                  <path d="M211 3L219 7L211 11Z" fill="currentColor" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section id="how-it-works" aria-labelledby="how-it-works-title" className="landing-process-section">
        <header className="landing-process-header">
          <h2 id="how-it-works-title" className="landing-process-title">
            Your lesson. Their characters. One shared story.
          </h2>
        </header>

        <div className="landing-process-story">
          <div className="landing-process-visual-column" aria-live="polite">
            <div className="landing-process-sticky">
              <div className="landing-process-stage">
                {processSteps.map((_, index) => (
                  <ProcessVisual
                    key={index}
                    step={(index + 1) as ProcessStep}
                    active={activeStep === index + 1}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="landing-process-steps">
            {processSteps.map((step, index) => (
              <article
                key={step.title}
                ref={(element) => { stepElements.current[index] = element; }}
                data-step={index + 1}
                className="landing-process-step"
              >
                <div className="landing-process-step-inner">
                  <div className="landing-process-sequence">
                    {String(index + 1).padStart(2, "0")} of 04
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <div className="landing-process-mobile-visual" aria-hidden="true">
                    <ProcessVisual step={(index + 1) as ProcessStep} active />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-team-section" aria-labelledby="landing-team-title">
        <div className="landing-team-inner">
          <h2 id="landing-team-title" className="landing-team-title">
            Meet the team behind EduComic.
          </h2>

          <div className="landing-team-grid">
            {teamMembers.map((member) => (
              <article key={member.name} className="landing-team-member">
                <div className="landing-team-avatar">
                  <img
                    src={member.avatar}
                    alt={`Illustrated portrait of ${member.name}`}
                    width="640"
                    height="640"
                    loading="lazy"
                  />
                </div>
                <h3 data-testid="team-member-name">
                  <a href={member.linkedin} target="_blank" rel="noreferrer">
                    {member.name}
                    <ArrowUpRight aria-hidden="true" />
                  </a>
                </h3>
              </article>
            ))}
          </div>

          <p className="landing-team-credit">
            Built with{" "}
            <a href="https://bfl.ai/" target="_blank" rel="noreferrer">
              FLUX by Black Forest Labs
            </a>{" "}
            for artwork and{" "}
            <a href="https://openai.com/" target="_blank" rel="noreferrer">
              OpenAI
            </a>{" "}
            for story generation.
          </p>
        </div>
      </section>
    </main>
  </div>
  );
};

export default Landing;
