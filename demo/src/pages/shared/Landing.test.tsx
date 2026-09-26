import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Landing from "./Landing";

describe("Landing", () => {
  it("shows the fictional portrait-to-avatar-to-comic transformation", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Turn a lesson into a comic starring your class." })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Fictional portrait of Maya Rivers" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Comic avatar generated from Maya's fictional portrait" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Maya and her fictional classmates investigate condensation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your lesson. Their characters. One shared story." })).toBeInTheDocument();
  });

  it("keeps the mobile hero sequence centered and connected", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(document.querySelector(".landing-hero-art")).toBeInTheDocument();
    expect(document.querySelector(".landing-hero-photo")).toBeInTheDocument();
    expect(document.querySelector(".landing-hero-avatar")).toBeInTheDocument();
    expect(document.querySelector(".landing-hero-photo-arrow-mobile")).toBeInTheDocument();
    expect(document.querySelector(".landing-hero-arrow-desktop")).toBeInTheDocument();

    const strip = document.querySelector(".landing-flow-strip");
    expect(strip).toBeInTheDocument();
    expect(strip?.querySelectorAll(".landing-flow-label")).toHaveLength(3);
    expect(strip?.querySelectorAll(".landing-flow-arrow")).toHaveLength(2);
  });

  it("shows the complete four-part lesson-to-comic process", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Upload your lesson." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bring in the whole class." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Turn learning into a story." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Let students see themselves learning." })).toBeInTheDocument();
  });

  it("keeps the process headline above the scrolling beats without the old lead copy", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", { name: "Your lesson. Their characters. One shared story." });
    expect(heading.closest("article")).toBeNull();
    expect(screen.queryByText("Teaching materials ground the plot. Every student avatar joins the cast.")).not.toBeInTheDocument();
  });

  it("keeps each scrolling beat focused on its primary explanation", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    [
      "The teacher’s material stays at the center.",
      "Not one mascot—a recognizable classroom community.",
      "A complete printable story, grounded in the lesson.",
      "Recognition turns the finished comic into a shared class moment.",
    ].forEach((copy) => expect(screen.queryByText(copy)).not.toBeInTheDocument());
  });

  it("presents the complete printable comic without a review badge", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.queryAllByText("Class story · ready to review")).toHaveLength(0);
    expect(document.querySelectorAll(".landing-comic-scene.is-enlarged")).toHaveLength(2);
    expect(document.querySelector<HTMLImageElement>(".landing-comic-page img")?.src).toContain(
      "educomic-12-panel-pdf-v2.png",
    );
  });

  it("shows the lesson stack as three distinct teaching documents", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Cloud vocabulary").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Water cycle diagram").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "How clouds make rain" })).toBeInTheDocument();
  });

  it("keeps the sticky illustration stable while adjacent steps cross observer thresholds", () => {
    let notify: IntersectionObserverCallback = () => undefined;
    class TestIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        notify = callback;
      }

      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
      readonly root = null;
      readonly rootMargin = "0px";
      readonly thresholds = [];
    }
    vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);

    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const lessonStep = screen.getByRole("heading", { name: "Upload your lesson." }).closest("article");
    const castStep = screen.getByRole("heading", { name: "Bring in the whole class." }).closest("article");
    expect(lessonStep).not.toBeNull();
    expect(castStep).not.toBeNull();
    const stepTops = [0, 720, 1440, 2160];
    document.querySelectorAll<HTMLElement>(".landing-process-step").forEach((step, index) => {
      vi.spyOn(step, "getBoundingClientRect").mockImplementation(
        () => ({ top: stepTops[index], height: 720 }) as DOMRect,
      );
    });

    act(() => {
      notify(
        [
          { isIntersecting: true, intersectionRatio: 0.4, target: lessonStep } as unknown as IntersectionObserverEntry,
          { isIntersecting: true, intersectionRatio: 0.1, target: castStep } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    stepTops.splice(0, 4, -720, 0, 720, 1440);
    act(() => {
      notify(
        [{ isIntersecting: true, intersectionRatio: 0.41, target: castStep } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    act(() => {
      notify(
        [{ isIntersecting: true, intersectionRatio: 0.42, target: lessonStep } as unknown as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(document.querySelector(".landing-process-sticky .landing-process-visual.is-active")).toHaveAttribute(
      "aria-label",
      "Eight student avatars joining the comic cast",
    );

    const castVisual = screen.getByRole("img", { name: "Eight student avatars joining the comic cast" });
    expect(castVisual).toHaveClass("landing-process-visual-cast");
    expect(castVisual.querySelector(".landing-mini-materials")).toBeNull();
    expect(castVisual.querySelector(".landing-flow-arrow")).toBeNull();
    expect(castVisual.querySelectorAll(".landing-avatar")).toHaveLength(8);
    expect(castVisual.querySelector(".landing-cast-scene")).toHaveClass("is-balanced");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("offers only working role and workflow links without setup copy", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/BYOK|local project data|bring your own API keys/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Teacher workspace" })[0]).toHaveAttribute("href", "/teacher/dashboard");
    expect(screen.getAllByRole("link", { name: "Student profiles" })[0]).toHaveAttribute("href", "/student/select");
    const scrollIntoView = vi.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    fireEvent.click(screen.getByRole("button", { name: /see how it works/i }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("credits the five creators and the tools used to build EduComic", () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    const team = screen.getByRole("region", { name: "Meet the team behind EduComic." });
    const expectedNames = [
      "Florian Schwieren",
      "Pouya Shekarchizadeh",
      "Anastasia Koslova",
      "Tim Gaydoul",
      "Ben Theurich",
    ];
    const names = within(team).getAllByTestId("team-member-name").map((node) => node.textContent);
    expect(names).toEqual(expectedNames);

    expect(within(team).getByRole("link", { name: "Florian Schwieren" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/florian-schwieren-618750215/",
    );
    expect(within(team).getByRole("link", { name: "Pouya Shekarchizadeh" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/pooyash1998/",
    );
    expect(within(team).getByRole("link", { name: "Anastasia Koslova" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/anastasia-koslova-a329091b7/",
    );
    expect(within(team).getByRole("link", { name: "Tim Gaydoul" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/tim-gaydoul-048788174/",
    );
    expect(within(team).getByRole("link", { name: "Ben Theurich" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/ben-theurich/",
    );
    expectedNames.forEach((name) => {
      const link = within(team).getByRole("link", { name });
      expect(link.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    });
    expect(team).toHaveTextContent(
      "Built with FLUX by Black Forest Labs for artwork and OpenAI for story generation.",
    );
    expect(within(team).queryByText("LinkedIn")).not.toBeInTheDocument();
  });
});
