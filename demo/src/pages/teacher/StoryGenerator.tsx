import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, ImageIcon, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Material } from "@/lib/api";
import type { Chapter, Panel, StoryIdea } from "@/types/story";
import { formatGradeLevel } from "@/lib/utils";

const StoryGenerator = () => {
  const navigate = useNavigate();
  const { classroomId } = useParams<{ classroomId: string }>();
  const [searchParams] = useSearchParams();
  const resumableChapterId = searchParams.get("chapter");
  const [step, setStep] = useState(1);
  const [lessonInput, setLessonInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationFailure, setGenerationFailure] = useState<Chapter["generation_failure"]>(null);
  const [storyOptions, setStoryOptions] = useState<StoryIdea[]>([]);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [classroom, setClassroom] = useState<{ name: string; subject: string; grade_level: string } | null>(null);
  const [classroomLoadError, setClassroomLoadError] = useState<string | null>(null);
  const [classroomReloadKey, setClassroomReloadKey] = useState(0);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [groundedSourceLabels, setGroundedSourceLabels] = useState<string[]>([]);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationRequestRef = useRef<{
    chapterId: string;
    storyId: string;
    idempotencyKey: string;
    stage: "choose" | "commit";
  } | null>(null);
  const pollAttempts = useRef(0);
  const consecutivePollingErrors = useRef(0);
  const maxPollAttempts = 300; // 10 minutes at 2-second intervals

  // Fetch classroom data on mount
  useEffect(() => {
    if (classroomId) {
      setClassroomLoadError(null);
      api.classrooms.getById(classroomId)
        .then(response => {
          if (response.success && response.classroom) {
            setClassroom({
              name: response.classroom.name,
              subject: response.classroom.subject,
              grade_level: response.classroom.grade_level
            });
          } else {
            setClassroomLoadError("Failed to load classroom details. Please try again.");
          }
        })
        .catch(() => {
          setClassroomLoadError("Failed to load classroom details. Please try again.");
        });
      api.materials.getAll(classroomId)
        .then((response) => setMaterials(response.materials))
        .catch(() => setMaterials([]));
    }
  }, [classroomId, classroomReloadKey]);

  useEffect(() => {
    if (!classroomId || !resumableChapterId) return;
    let cancelled = false;
    api.chapters.getById(resumableChapterId)
      .then(({ chapter }) => {
        if (cancelled) return;
        if (chapter.classroom_id !== classroomId || chapter.status !== "options_generated" || !chapter.story_ideas?.length) {
          setGenerationError("This story is no longer waiting for a choice.");
          return;
        }
        setChapterId(chapter.id);
        setLessonInput(chapter.original_prompt);
        setStoryOptions(chapter.story_ideas);
        setGroundedSourceLabels((chapter.grounded_sources || []).map((source) => source.source_label));
        setStep(2);
      })
      .catch(() => {
        if (!cancelled) setGenerationError("Could not resume this story. Return to the classroom and try again.");
      });
    return () => { cancelled = true; };
  }, [classroomId, resumableChapterId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const previewsActive = storyOptions.some((option) =>
    option.preview_status === "pending" || option.preview_status === "generating"
  );

  useEffect(() => {
    if (step !== 2 || !chapterId || !previewsActive) return;
    let cancelled = false;
    const refreshPreviews = async () => {
      try {
        const response = await api.chapters.getById(chapterId);
        if (!cancelled && response.chapter.story_ideas?.length) {
          setStoryOptions(response.chapter.story_ideas);
        }
      } catch {
        // Text ideas stay selectable while local preview status is temporarily unavailable.
      }
    };
    const interval = setInterval(refreshPreviews, 2000);
    refreshPreviews();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [chapterId, previewsActive, step]);

  const pollPanelsProgress = async () => {
    if (!chapterId) return;

    try {
      const response = await api.chapters.getById(chapterId);
      consecutivePollingErrors.current = 0;
      pollAttempts.current += 1;
      if (response.success && response.chapter) {
        const chapterPanels = response.chapter.panels?.length
          ? response.chapter.panels
          : (response.chapter.temporary_panel_previews || []).map((panel) => ({
              id: `temporary-${panel.index}`,
              chapter_id: response.chapter.id,
              index: panel.index,
              image: panel.image,
              created_at: "",
            }));
        setPanels(chapterPanels);

        // Check if generation is complete
        if (response.chapter.status === 'ready') {
          generationRequestRef.current = null;
          setGenerationFailure(null);
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          toast.success("Story chapter created!");
          setTimeout(() => {
            navigate(`/teacher/classroom/${classroomId}`);
          }, 1000);
          return;
        }

        if (response.chapter.status === 'failed') {
          generationRequestRef.current = null;
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          const failure = response.chapter.generation_failure;
          setGenerationFailure(failure ?? null);
          if (failure?.error_code === "bfl_request_moderated" || failure?.error_code === "bfl_content_moderated") {
            const panel = failure.panel_number ? `panel ${failure.panel_number}` : "a panel";
            setGenerationError(
              `BFL blocked ${panel} during moderation. EduComic stopped without submitting an automatic retry.`
            );
          } else {
            setGenerationError("Story generation failed. Try another story or retry your lesson.");
          }
          return;
        }
      }

      // Timeout after max attempts
      if (pollAttempts.current >= maxPollAttempts) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        toast.error("Generation is taking longer than expected. You can check back later.");
      }
    } catch {
      consecutivePollingErrors.current += 1;

      // Stop after too many errors
      if (consecutivePollingErrors.current >= 10) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        const message = "Lost connection to server. Generation may still be in progress.";
        setGenerationError(message);
        toast.error(message);
      }
    }
  };

  const startPolling = (preservePanels = false) => {
    setIsPolling(true);
    pollAttempts.current = 0;
    consecutivePollingErrors.current = 0;
    setGenerationError(null);
    setGenerationFailure(null);
    if (!preservePanels) setPanels([]);

    // Initial poll
    pollPanelsProgress();

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(() => {
      pollPanelsProgress();
    }, 2000);
  };

  const generateOptions = async () => {
    if (!classroomId) {
      toast.error("No classroom selected");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationFailure(null);
    try {
      // Start chapter and generate story options
      const response = await api.story.startChapter(classroomId, lessonInput, selectedMaterialIds);

      setChapterId(response.chapter.id);
      generationRequestRef.current = null;
      const options = response.chapter.story_ideas || [];
      setStoryOptions(options);
      setGroundedSourceLabels((response.chapter.grounded_sources || []).map((source) => source.source_label));
      setStep(2);
      toast.success("Story options generated!");

    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate story options";
      setGenerationError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectStory = async (storyId: string) => {
    if (!chapterId) {
      toast.error("No chapter found");
      return;
    }

    setSelectedStory(storyId);
    setGenerationError(null);
    setGenerationFailure(null);
    setStep(3);
    const previousRequest = generationRequestRef.current;
    const request = previousRequest?.chapterId === chapterId && previousRequest.storyId === storyId
      ? previousRequest
      : { chapterId, storyId, idempotencyKey: crypto.randomUUID(), stage: "choose" as const };
    generationRequestRef.current = request;

    try {
      if (request.stage === "choose") {
        await api.story.chooseIdea(chapterId, storyId);
        request.stage = "commit";
      }

      // Start the comic generation in the background
      await api.story.commitChapter(chapterId, storyId, request.idempotencyKey);

      // Start polling for panels
      startPolling();
    } catch {
      toast.error("Failed to start comic generation");
      setStep(2); // Go back to selection
    }
  };

  const resumeGeneration = async () => {
    if (!generationFailure?.run_id) return;
    try {
      await api.generationRuns.resume(generationFailure.run_id);
      startPolling(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not resume generation";
      toast.error(message);
    }
  };

  const discardGeneration = async () => {
    if (!generationFailure?.run_id || !window.confirm("Discard the saved panels from this attempt?")) return;
    try {
      await api.generationRuns.discard(generationFailure.run_id);
      setGenerationError(null);
      setGenerationFailure(null);
      setSelectedStory(null);
      setPanels([]);
      setStep(2);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not discard generation";
      toast.error(message);
    }
  };

  const retryStoryPreview = async (ideaId: string) => {
    if (!chapterId) return;
    setStoryOptions((options) => options.map((option) =>
      option.id === ideaId
        ? { ...option, preview_status: "generating", preview_error_reference: null }
        : option
    ));
    try {
      const response = await api.story.retryPreview(chapterId, ideaId);
      setStoryOptions(response.chapter.story_ideas);
    } catch (error) {
      setStoryOptions((options) => options.map((option) =>
        option.id === ideaId ? { ...option, preview_status: "failed" } : option
      ));
      toast.error(error instanceof Error ? error.message : "Preview retry failed");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div className="space-y-8">
          <div>
            <p className="mb-2 font-mono text-xs font-bold tracking-wide text-primary">STORY WORKSHOP</p>
            <h1 className="mb-2 font-serif text-4xl font-semibold tracking-tight text-foreground">Create a classroom story</h1>
            {classroom && (
              <p className="font-mono text-xs text-muted-foreground">
                {classroom.subject} • {formatGradeLevel(classroom.grade_level)}
              </p>
            )}
          </div>

          {classroomLoadError && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p role="alert" className="text-sm text-destructive">{classroomLoadError}</p>
              <Button
                variant="outline"
                onClick={() => setClassroomReloadKey((key) => key + 1)}
              >
                Retry classroom details
              </Button>
            </div>
          )}

          {step === 1 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <label htmlFor="lesson-brief" className="text-sm font-medium text-foreground">
                    What did you teach today? *
                  </label>
                  <Textarea
                    id="lesson-brief"
                    placeholder="Example: Today we covered Newton's Three Laws of Motion. Students learned about force, mass, and acceleration through hands-on experiments with balls and ramps."
                    value={lessonInput}
                    onChange={(e) => setLessonInput(e.target.value)}
                    className="min-h-[200px]"
                    maxLength={500}
                  />
                  <div className="text-right font-mono text-xs text-muted-foreground">
                    {lessonInput.length}/500 characters
                  </div>
                </div>

                {materials.length > 0 && (
                  <fieldset className="space-y-3 border-t pt-5">
                    <legend className="px-1 text-sm font-medium">Lesson materials (optional)</legend>
                    <p className="text-xs text-muted-foreground">Only checked PDFs will be sent as bounded source excerpts.</p>
                    {materials.map((material) => (
                      <label key={material.id} className="flex min-h-11 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          aria-label={`Use ${material.source_filename}`}
                          checked={selectedMaterialIds.includes(material.id)}
                          onChange={(event) => setSelectedMaterialIds((current) => event.target.checked
                            ? [...current, material.id]
                            : current.filter((id) => id !== material.id))}
                          className="h-5 w-5"
                        />
                        <span>{material.source_filename} · {material.page_count} page{material.page_count === 1 ? "" : "s"}</span>
                      </label>
                    ))}
                  </fieldset>
                )}

                {generationError && (
                  <p role="alert" className="text-sm text-destructive">
                    {generationError} Please try again.
                  </p>
                )}

                <Button
                  onClick={generateOptions}
                  disabled={!lessonInput || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Options...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Story Options
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="mb-2 font-mono text-xs font-bold tracking-wide text-primary">THREE DIRECTIONS</p>
                <h2 className="font-serif text-3xl font-semibold text-foreground">Choose Your Story</h2>
                <p className="mt-2 text-sm text-muted-foreground">Compare the complete concepts. Preview images can finish independently.</p>
              </div>
              {groundedSourceLabels.length > 0 && (
                <p className="rounded-md border bg-muted/40 p-3 text-sm">Grounded in {groundedSourceLabels.join(", ")}</p>
              )}
              <div className="grid md:grid-cols-3 gap-6">
                {storyOptions.map((option) => (
                  <Card key={option.id} className="overflow-hidden border">
                    <CardContent className="flex h-full flex-col p-0 sm:p-0">
                      <div className="flex aspect-square w-full items-center justify-center overflow-hidden border-b-2 border-foreground/15 bg-muted/40">
                        {option.preview_status === "ready" && option.preview_url ? (
                          <img
                            src={option.preview_url}
                            alt={`${option.title} story preview`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : option.preview_status === "pending" || option.preview_status === "generating" ? (
                          <div className="flex flex-col items-center gap-3 px-4 text-center" role="status">
                            <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
                            <span className="text-sm text-muted-foreground">Creating preview…</span>
                          </div>
                        ) : option.preview_status === "failed" ? (
                          <div className="flex flex-col items-center gap-3 px-4 text-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                            <span className="text-sm text-muted-foreground">Preview unavailable</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label={`Retry ${option.title} preview`}
                              onClick={() => retryStoryPreview(option.id)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                              Retry preview
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 px-4 text-center text-muted-foreground">
                            <Sparkles className="h-8 w-8" aria-hidden="true" />
                            <span className="text-sm">{option.theme}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-4 p-5">
                        <h3 className="font-serif text-xl font-semibold leading-tight text-foreground">{option.title}</h3>
                        <p className="flex-1 text-sm leading-6 text-muted-foreground">{option.summary}</p>
                        <Button className="w-full" onClick={() => selectStory(option.id)}>
                          Select This Story
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <Card>
              <CardContent className="space-y-8 py-10 sm:py-12">
                {generationError ? (
                  <div className="text-center space-y-4">
                    <p role="alert" className="text-destructive">{generationError}</p>
                    {generationFailure?.run_id && generationFailure.resumable ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {generationFailure.completed_panels ?? panels.length} of {generationFailure.expected_panels ?? 12} panels preserved
                        </p>
                        <p className="text-sm text-muted-foreground">
                          BFL reported cost: {generationFailure.reported_bfl_cost ?? 0}
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                          <Button onClick={resumeGeneration}>
                            Resume from panel {generationFailure.panel_number ?? (generationFailure.completed_panels ?? panels.length) + 1}
                          </Button>
                          <Button variant="outline" onClick={discardGeneration}>Discard saved attempt</Button>
                        </div>
                      </>
                    ) : (
                      <Button onClick={() => {
                        setGenerationError(null);
                        setGenerationFailure(null);
                        setSelectedStory(null);
                        setPanels([]);
                        setStep(2);
                      }}>
                        Try another story
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 text-center" role="status">
                      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" aria-hidden="true" />
                      <h2 className="font-serif text-3xl font-semibold text-foreground">
                        Building your comic, panel by panel
                      </h2>
                      <p className="text-muted-foreground">
                        {panels.length} panel{panels.length !== 1 ? 's' : ''} completed
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Progress aria-label="Story generation progress" className="h-3 animate-pulse" />
                      <p className="text-sm text-muted-foreground text-center">
                        You can leave this screen; generation continues locally.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {panels.map((panel) => (
                        <div
                          key={panel.id}
                          className="aspect-square overflow-hidden rounded-lg border-2 border-foreground/15 bg-muted"
                        >
                          <img
                            src={panel.image}
                            alt={`Generated panel ${panel.index} preview`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {isPolling && (
                        <div className="aspect-square rounded-lg bg-muted animate-pulse flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default StoryGenerator;
