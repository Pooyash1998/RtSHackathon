import { useState, useEffect, type CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Download, Loader2, ZoomIn, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api from "@/lib/api";
import type { PanelRegenerationStatus } from "@/lib/api";
import { exportStoryPdf } from "@/lib/exportStoryPdf";
import { clampReaderScale } from "@/lib/utils";
import type { Chapter, ChapterWithPanels, Panel } from "@/types/story";
import { isDemoMode } from "@/lib/runtime";

type CorrectionOutcome = "editing" | "working" | "failed" | "unknown" | "published";

interface CorrectionAttempt {
  idempotencyKey: string;
  runId?: string;
}

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<ChapterWithPanels | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [correctionPanel, setCorrectionPanel] = useState<number | null>(null);
  const [correction, setCorrection] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [correctionOutcome, setCorrectionOutcome] = useState<CorrectionOutcome>("editing");
  const [correctionAttempt, setCorrectionAttempt] = useState<CorrectionAttempt | null>(null);
  const [candidateUrl, setCandidateUrl] = useState<string | null>(null);
  const [candidatePanelNumber, setCandidatePanelNumber] = useState<number | null>(null);
  const [candidateCost, setCandidateCost] = useState<number | null>(null);
  const [correctionFailureCode, setCorrectionFailureCode] = useState<string | null>(null);
  const [exportSettings, setExportSettings] = useState({
    pageSize: "a4",
    layout: "2"
  });

  // Layout mode: 'webtoon' (vertical) or 'grid' (grid layout)
  const [layoutMode, setLayoutMode] = useState<'webtoon' | 'grid'>(() => {
    const saved = localStorage.getItem('teacherStoryReaderLayout');
    return (saved as 'webtoon' | 'grid') || 'webtoon';
  });

  const [imageScale, setImageScale] = useState(() => clampReaderScale(localStorage.getItem('teacherStoryReaderImageScale')));

  // Load chapter data from API
  useEffect(() => {
    const loadChapter = async () => {
      if (!id) return;

      setIsLoading(true);
      setLoadError(null);
      setChapter(null);
      setPanels([]);
      try {
        const response = await api.chapters.getById(id);
        if (response.chapter.status !== "ready") {
          setLoadError(`This chapter is ${response.chapter.status.replace(/_/g, " ")} and cannot be viewed yet.`);
          return;
        }
        setChapter(response.chapter);
        setPanels(response.chapter.panels || []);
        const candidate = response.chapter.panel_regeneration_candidate;
        setCandidateUrl(candidate?.candidate_url ?? null);
        setCandidatePanelNumber(candidate?.panel_number ?? null);
        setCandidateCost(candidate?.reported_bfl_cost ?? null);
        setCorrectionAttempt(candidate ? { idempotencyKey: "persisted", runId: candidate.run_id } : null);

        // Load all chapters for this classroom to enable navigation
        if (response.chapter.classroom_id) {
          try {
            const chaptersResponse = await api.classrooms.getChapters(response.chapter.classroom_id);
            if (chaptersResponse.success && chaptersResponse.chapters) {
              // Sort chapters by created_at descending (newest first)
              const sortedChapters = chaptersResponse.chapters
                .filter(chapter => chapter.status === "ready")
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              setAllChapters(sortedChapters);
              
              // Find current chapter index
              const index = sortedChapters.findIndex(ch => ch.id === id);
              setCurrentIndex(index);
            }
          } catch {
            // The current chapter remains readable without adjacent-story navigation.
          }
        }
      } catch {
        setLoadError("Failed to load this chapter. Please try again.");
        toast.error("Failed to load chapter");
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [id]);

  // Save image scale preference
  useEffect(() => {
    localStorage.setItem('teacherStoryReaderImageScale', imageScale.toString());
  }, [imageScale]);

  // Save layout mode preference
  useEffect(() => {
    localStorage.setItem('teacherStoryReaderLayout', layoutMode);
  }, [layoutMode]);

  const handleExport = async () => {
    if (!chapter || panels.length === 0) {
      toast.error("No panels to export");
      return;
    }

    try {
      toast.info("Generating PDF...");

      const title = chapter.story_title || `Chapter ${chapter.index}`;
      await exportStoryPdf({
        panels,
        title,
        pageSize: exportSettings.pageSize as "a4" | "letter",
        panelsPerPage: Number(exportSettings.layout) as 2 | 4,
      });

      toast.success("PDF downloaded successfully!");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const refreshPublishedPanel = async (panel: Panel) => {
    if (!chapter) return;
    setIsRegenerating(true);
    try {
      const refreshed = await api.chapters.getById(chapter.id);
      setChapter(refreshed.chapter);
      setPanels(refreshed.chapter.panels || []);
      setCorrectionPanel(null);
      setCorrection("");
      setCorrectionAttempt(null);
      setCandidateUrl(null);
      setCandidatePanelNumber(null);
      setCandidateCost(null);
      setCorrectionFailureCode(null);
      setCorrectionOutcome("editing");
      toast.success(`Panel ${panel.index} regenerated`);
    } catch {
      setCorrectionOutcome("published");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePanelRegeneration = async (panel: Panel, resume = false) => {
    if (!chapter || !correction.trim()) return;
    let attempt = resume ? correctionAttempt : null;
    if (!attempt) {
      attempt = { idempotencyKey: crypto.randomUUID() };
      setCorrectionAttempt(attempt);
    }
    setIsRegenerating(true);
    setCorrectionOutcome("working");
    try {
      let run: PanelRegenerationStatus;
      if (resume && attempt.runId) {
        run = await api.chapters.getPanelRegeneration(attempt.runId);
      } else {
        run = await api.chapters.regeneratePanel(
          chapter.id,
          panel.index,
          chapter.revision,
          correction,
          attempt.idempotencyKey,
        );
      }
      attempt = { ...attempt, runId: run.run_id };
      setCorrectionAttempt(attempt);
      for (let poll = 0; run.status === "regenerating" && poll < 300; poll += 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
        run = await api.chapters.getPanelRegeneration(run.run_id);
      }
      if (run.status === "regenerating") {
        setCorrectionOutcome("unknown");
        return;
      }
      if (run.status === "failed") {
        setCorrectionFailureCode(run.error_code);
        setCorrectionAttempt(null);
        setCorrectionOutcome("failed");
        return;
      }
      if (run.status === "candidate_ready" && run.candidate_url) {
        setCandidateUrl(run.candidate_url);
        setCandidatePanelNumber(panel.index);
        setCandidateCost(run.reported_bfl_cost);
        setCorrectionOutcome("editing");
        return;
      }
      setCorrectionOutcome("published");
      await refreshPublishedPanel(panel);
    } catch {
      setCorrectionOutcome("unknown");
    } finally {
      setIsRegenerating(false);
    }
  };

  const acceptCandidate = async (panel: Panel) => {
    if (!correctionAttempt?.runId) return;
    setIsRegenerating(true);
    try {
      await api.chapters.acceptPanelRegeneration(correctionAttempt.runId);
      setCorrectionOutcome("published");
      await refreshPublishedPanel(panel);
    } catch {
      setCorrectionOutcome("published");
    } finally {
      setIsRegenerating(false);
    }
  };

  const keepOriginal = async () => {
    if (!correctionAttempt?.runId) return;
    setIsRegenerating(true);
    try {
      await api.chapters.rejectPanelRegeneration(correctionAttempt.runId);
      setCorrectionPanel(null);
      setCorrection("");
      setCorrectionAttempt(null);
      setCandidateUrl(null);
      setCandidatePanelNumber(null);
      setCandidateCost(null);
      setCorrectionOutcome("editing");
      toast.success("Original panel kept");
    } catch {
      toast.error("Could not discard the replacement. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const renderPanel = (panel: Panel, grid: boolean) => {
    const hasCandidate = candidatePanelNumber === panel.index && Boolean(candidateUrl);
    return (
    <div key={panel.id} className={grid ? "overflow-hidden rounded-lg border-2 border-foreground/15 bg-card" : "w-full border-x-2 border-foreground/15 bg-card"}>
      <img
        src={panel.image}
        alt={`Panel ${panel.index}`}
        className="block h-auto w-full"
        loading="lazy"
      />
      {!isDemoMode && <div className="p-3 text-left leading-normal">
        <Button
          aria-label={hasCandidate ? `Review replacement for panel ${panel.index}` : `Correct panel ${panel.index}`}
          variant="outline"
          size="sm"
          disabled={isRegenerating || correctionOutcome === "unknown" || correctionOutcome === "published" || (candidatePanelNumber !== null && !hasCandidate)}
          onClick={() => {
            setCorrectionPanel(panel.index);
            if (!hasCandidate) {
              setCorrection("");
              setCorrectionAttempt(null);
              setCorrectionOutcome("editing");
              setCorrectionFailureCode(null);
            }
          }}
        >
          {hasCandidate ? "Review replacement" : `Correct panel ${panel.index}`}
        </Button>
        <Dialog open={correctionPanel === panel.index} onOpenChange={(open) => {
          if (!open) setCorrectionPanel(null);
        }}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Correct panel {panel.index}</DialogTitle>
              <DialogDescription>
                The original stays in the story until you accept a replacement.
              </DialogDescription>
            </DialogHeader>
            <div className={hasCandidate ? "grid gap-4 md:grid-cols-2" : "mx-auto w-full max-w-xl"}>
              <figure className="space-y-2">
                <img src={panel.image} alt={`Original panel ${panel.index}`} className="w-full rounded-md border" />
                <figcaption className="text-sm font-medium">Original</figcaption>
              </figure>
              {hasCandidate && candidateUrl && (
                <figure className="space-y-2">
                  <img src={candidateUrl} alt={`Candidate panel ${panel.index}`} className="w-full rounded-md border" />
                  <figcaption className="text-sm font-medium">Replacement</figcaption>
                </figure>
              )}
            </div>
            {!hasCandidate && (
              <div className="space-y-3">
            <Label htmlFor={`panel-correction-${panel.index}`}>Correction for panel {panel.index}</Label>
            <Textarea
              id={`panel-correction-${panel.index}`}
              value={correction}
              maxLength={500}
              disabled={isRegenerating || correctionOutcome === "unknown" || correctionOutcome === "published"}
              onChange={event => setCorrection(event.target.value)}
              placeholder="Describe the visual correction for this panel"
            />
                <p className="text-xs text-muted-foreground">Generating a replacement makes one paid BFL image request. Automatic review is off.</p>
              </div>
            )}
            {isRegenerating && <p role="status">Regenerating panel {panel.index}...</p>}
            {correctionOutcome === "failed" && (
              <p role="alert" className="text-sm text-destructive">
                {correctionFailureCode === "bfl_request_moderated" || correctionFailureCode === "bfl_content_moderated"
                  ? "BFL blocked this replacement during moderation. The original panel is unchanged."
                  : `Panel ${panel.index} could not be regenerated. The previous panel is still available.`}
              </p>
            )}
            {correctionOutcome === "unknown" && (
              <p role="alert" className="text-sm text-destructive">
                Panel {panel.index} regeneration status could not be confirmed. Check the existing attempt before trying again.
              </p>
            )}
            {correctionOutcome === "published" && (
              <p role="alert" className="text-sm text-destructive">
                Panel {panel.index} correction completed, but the story could not be refreshed.
              </p>
            )}
            {candidateCost !== null && <p className="text-sm text-muted-foreground">BFL reported cost: {candidateCost}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              {hasCandidate ? (
                <>
                  <Button variant="outline" disabled={isRegenerating} onClick={() => void keepOriginal()}>Keep original</Button>
                  <Button disabled={isRegenerating} onClick={() => void acceptCandidate(panel)}>Accept replacement</Button>
                </>
              ) : (
                <>
              <Button
                aria-label={correctionOutcome === "unknown"
                  ? `Check panel ${panel.index} status`
                  : correctionOutcome === "failed"
                    ? `Retry panel ${panel.index}`
                    : undefined}
                size="sm"
                disabled={isRegenerating || !correction.trim()}
                onClick={() => {
                  if (correctionOutcome === "published") void refreshPublishedPanel(panel);
                  else void handlePanelRegeneration(panel, correctionOutcome === "unknown");
                }}
              >
                {isRegenerating
                  ? "Regenerating..."
                  : correctionOutcome === "published"
                    ? "Reload story"
                  : correctionOutcome === "unknown"
                      ? "Check status"
                      : correctionOutcome === "failed"
                        ? "Retry"
                        : "Generate replacement"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={isRegenerating || correctionOutcome === "unknown" || correctionOutcome === "published"}
                onClick={() => {
                  setCorrectionPanel(null);
                  setCorrectionAttempt(null);
                  setCorrectionOutcome("editing");
                }}
              >
                Cancel
              </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>}
    </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (loadError || !chapter) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p role="alert" className="text-muted-foreground">{loadError || "Chapter not found"}</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex-shrink-0">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <h1 className="truncate font-serif text-xl font-semibold text-foreground">
                    {chapter?.story_title || `Chapter ${chapter?.index}`}
                  </h1>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Export as PDF</DialogTitle>
                        <DialogDescription>Configure your PDF export settings</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-3">
                          <Label>Page Size</Label>
                          <RadioGroup value={exportSettings.pageSize} onValueChange={(v) => setExportSettings({ ...exportSettings, pageSize: v })}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="a4" id="a4" />
                              <Label htmlFor="a4">A4</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="letter" id="letter" />
                              <Label htmlFor="letter">Letter</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <div className="space-y-3">
                          <Label>Layout</Label>
                          <RadioGroup value={exportSettings.layout} onValueChange={(v) => setExportSettings({ ...exportSettings, layout: v })}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="2" id="2panel" />
                              <Label htmlFor="2panel">2 panels per page</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="4" id="4panel" />
                              <Label htmlFor="4panel">4 panels per page</Label>
                            </div>
                          </RadioGroup>
                        </div>
                        <Button onClick={handleExport} className="w-full">
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
                    <Button aria-label="Vertical layout" aria-pressed={layoutMode === 'webtoon'} variant={layoutMode === 'webtoon' ? 'default' : 'ghost'} size="sm" onClick={() => setLayoutMode('webtoon')}>
                      <List className="w-4 h-4" />
                    </Button>
                    <Button aria-label="Grid layout" aria-pressed={layoutMode === 'grid'} variant={layoutMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setLayoutMode('grid')}>
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>

                  <ZoomIn aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                  <div className="flex min-w-40 flex-1 items-center gap-2 sm:flex-none">
                    <Slider aria-label="Image size" aria-valuetext={`${imageScale} percent`} value={[imageScale]} onValueChange={(value) => setImageScale(value[0])} min={10} max={100} step={5} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-10 text-right">{imageScale}%</span>
                  </div>
                </div>
              </div>

              {chapter.grounded_sources && chapter.grounded_sources.length > 0 && (
                <div aria-label="Lesson sources" className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>Lesson sources</span>
                  {chapter.grounded_sources.map((source) => (
                    <Badge key={source.material_id} variant="outline" className="font-normal">
                      {source.source_label} · Page {source.excerpts[0]?.page}
                    </Badge>
                  ))}
                </div>
              )}

              {allChapters.length > 1 && (
                <div className="flex justify-between mt-3 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => { if (currentIndex < allChapters.length - 1) navigate(`/teacher/story/${allChapters[currentIndex + 1].id}`); }} disabled={currentIndex === -1 || currentIndex >= allChapters.length - 1}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous Story
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { if (currentIndex > 0) navigate(`/teacher/story/${allChapters[currentIndex - 1].id}`); }} disabled={currentIndex === -1 || currentIndex <= 0}>
                    Next Story
                    <ChevronLeft className="w-4 h-4 ml-1 rotate-180" />
                  </Button>
                </div>
              )}
            </div>
      </header>

      {layoutMode === 'webtoon' ? (
        <main
          aria-label="Comic panels"
          className="reader-strip mx-auto flex flex-col items-center"
          style={{ "--reader-scale": `${imageScale}%` } as CSSProperties}
        >
          {panels.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-8xl mb-4">📚</div>
              <p className="text-muted-foreground text-lg">No panels yet</p>
            </div>
          ) : (
            [...panels].sort((a, b) => a.index - b.index).map((panel) => renderPanel(panel, false))
          )}
        </main>
      ) : (
        <div className="container mx-auto px-4 pb-8">
          {panels.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-8xl mb-4">📚</div>
              <p className="text-muted-foreground text-lg">No panels yet</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${imageScale <= 30 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : imageScale <= 50 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : imageScale <= 80 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : imageScale <= 120 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {[...panels].sort((a, b) => a.index - b.index).map((panel) => renderPanel(panel, true))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
