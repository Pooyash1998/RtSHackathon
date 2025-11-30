import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { generateStoryThumbnails } from "@/services/thumbnailGenerator";
import ClassicLoader from "@/components/ui/loader";

interface StoryOption {
  id: string;
  title: string;
  theme: string;
  summary: string;
}

interface Panel {
  id: string;
  chapter_id: string;
  index: number;
  image: string;
  created_at: string;
}

const mockStoryOptions: StoryOption[] = [
  {
    id: "1",
    title: "Newton's Space Race",
    theme: "🚀",
    summary: "Emma and Liam find themselves in a space race where understanding forces and acceleration is the key to winning against alien competitors."
  },
  {
    id: "2",
    title: "The Gravity Challenge",
    theme: "🌍",
    summary: "When gravity mysteriously changes on different parts of the playground, Sophia must use Newton's laws to save her friends from floating away."
  },
  {
    id: "3",
    title: "Motion Lab Mystery",
    theme: "🔬",
    summary: "The students discover a lab where they can manipulate forces and mass. They must solve physics puzzles to unlock the secret of perpetual motion."
  }
];

const StoryGenerator = () => {
  const navigate = useNavigate();
  const { classroomId } = useParams<{ classroomId: string }>();
  const [step, setStep] = useState(1);
  const [lessonInput, setLessonInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [storyOptions, setStoryOptions] = useState<StoryOption[]>([]);
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [classroom, setClassroom] = useState<{ name: string; subject: string; grade_level: string } | null>(null);
  const [thumbnails, setThumbnails] = useState<Map<string, string | null>>(new Map());
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttempts = useRef(0);
  const maxPollAttempts = 300; // 5 minutes at 1 second intervals

  // Fetch classroom data on mount
  useEffect(() => {
    if (classroomId) {
      api.classrooms.getById(classroomId)
        .then(response => {
          if (response.success && response.classroom) {
            setClassroom({
              name: response.classroom.name,
              subject: response.classroom.subject,
              grade_level: response.classroom.grade_level
            });
          }
        })
        .catch(error => {
          console.error('Failed to fetch classroom:', error);
        });
    }
  }, [classroomId]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const pollPanelsProgress = async () => {
    if (!chapterId) return;

    try {
      const response = await api.chapters.getById(chapterId);
      if (response.success && response.chapter) {
        const chapterPanels = response.chapter.panels || [];
        setPanels(chapterPanels);

        // Check if generation is complete
        if (response.chapter.status === 'ready') {
          setIsPolling(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          toast.success("Story chapter created!");
          setTimeout(() => {
            navigate(`/teacher/classroom/${classroomId}`);
          }, 1000);
        }
      }

      pollAttempts.current += 1;

      // Timeout after max attempts
      if (pollAttempts.current >= maxPollAttempts) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        toast.error("Generation is taking longer than expected. You can check back later.");
      }
    } catch (error) {
      console.error("Polling error:", error);
      pollAttempts.current += 1;

      // Stop after too many errors
      if (pollAttempts.current >= 10) {
        setIsPolling(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        toast.error("Lost connection to server. Generation may still be in progress.");
      }
    }
  };

  const startPolling = () => {
    setIsPolling(true);
    pollAttempts.current = 0;
    setPanels([]);

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
    try {
      // Start chapter and generate story options
      const response = await api.story.startChapter(classroomId, lessonInput);
      console.log("Chapter started:", response.chapter);

      setChapterId(response.chapter.id);
      const options = response.chapter.story_ideas || [];
      setStoryOptions(options);
      setStep(2);
      toast.success("Story options generated!");

      // Generate thumbnails in the background (optional, non-blocking)
      if (options.length > 0) {
        console.log('Starting thumbnail generation for', options.length, 'options');
        setIsGeneratingThumbnails(true);
        generateStoryThumbnails(options)
          .then(thumbnailMap => {
            console.log('Thumbnails generated:', thumbnailMap);
            setThumbnails(thumbnailMap);
            setIsGeneratingThumbnails(false);
          })
          .catch(error => {
            console.error('Failed to generate thumbnails:', error);
            setIsGeneratingThumbnails(false);
          });
      }
    } catch (error) {
      console.error("Failed to generate story options:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate story options");
      // Fallback to mock data for testing
      setStoryOptions(mockStoryOptions);
      setStep(2);
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
    setStep(3);

    try {
      // Get the thumbnail URL for the selected story
      const thumbnailUrl = thumbnails.get(storyId) || undefined;

      // Save the chosen idea to the database with thumbnail
      await api.story.chooseIdea(chapterId, storyId, thumbnailUrl);
      console.log("Idea chosen:", storyId, "with thumbnail:", thumbnailUrl);

      // Start the comic generation in the background
      await api.story.commitChapter(chapterId, storyId);
      console.log("Comic generation started");

      // Start polling for panels
      startPolling();
    } catch (error) {
      console.error("Failed to start comic generation:", error);
      toast.error("Failed to start comic generation");
      setStep(2); // Go back to selection
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
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
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Generate New Story</h1>
            {classroom && (
              <p className="text-muted-foreground">
                {classroom.subject} • {classroom.grade_level}
              </p>
            )}
          </div>

          {step === 1 && (
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    What did you teach today? *
                  </label>
                  <Textarea
                    placeholder="Example: Today we covered Newton's Three Laws of Motion. Students learned about force, mass, and acceleration through hands-on experiments with balls and ramps."
                    value={lessonInput}
                    onChange={(e) => setLessonInput(e.target.value)}
                    className="min-h-[200px]"
                    maxLength={500}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {lessonInput.length}/500 characters
                  </div>
                </div>

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
              <h2 className="text-2xl font-bold text-foreground">Choose Your Story</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {storyOptions.map((option) => {
                  const thumbnail = thumbnails.get(option.id);
                  const isLoading = isGeneratingThumbnails && !thumbnail;
                  
                  return (
                    <Card
                      key={option.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
                      onClick={() => selectStory(option.id)}
                    >
                      <CardContent className="pt-6 space-y-4">
                        {/* Thumbnail or Loading Placeholder */}
                        <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={option.title}
                              className="w-full h-full object-cover"
                            />
                          ) : isLoading ? (
                            <ClassicLoader />
                          ) : (
                            <span className="text-5xl">{option.theme}</span>
                          )}
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-lg font-bold text-foreground text-center line-clamp-2 min-h-[3.5rem]">
                          {option.title}
                        </h3>
                        
                        {/* Summary */}
                        <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4rem]">
                          {option.summary}
                        </p>
                        
                        {/* Select Button */}
                        <Button className="w-full">
                          Select This Story
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <Card>
              <CardContent className="pt-12 pb-12 space-y-8">
                <div className="text-center space-y-4">
                  <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">
                    Generating your personalized graphic novel...
                  </h2>
                  <p className="text-muted-foreground">
                    {panels.length} panel{panels.length !== 1 ? 's' : ''} completed
                  </p>
                </div>

                {panels.length > 0 && (
                  <div className="space-y-2">
                    <Progress value={(panels.length / 12) * 100} className="h-3" />
                    <p className="text-sm text-muted-foreground text-center">
                      This may take a few minutes...
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {panels.map((panel) => (
                    <div
                      key={panel.id}
                      className="aspect-square rounded-lg overflow-hidden bg-primary/20 shadow-md"
                    >
                      <img
                        src={panel.image}
                        alt={`Panel ${panel.index}`}
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryGenerator;
