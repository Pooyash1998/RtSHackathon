import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { generateStoryThumbnails } from "@/services/thumbnailGenerator";

interface StoryOption {
  id: string;
  title: string;
  theme: string;
  summary: string;
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
  const [progress, setProgress] = useState(0);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [classroom, setClassroom] = useState<{ name: string; subject: string; grade_level: string } | null>(null);
  const [thumbnails, setThumbnails] = useState<Map<string, string | null>>(new Map());
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);

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
      
      // Simulate generation progress
      simulateGeneration();
    } catch (error) {
      console.error("Failed to choose idea:", error);
      toast.error("Failed to save story choice");
      // Continue with simulation anyway for demo
      simulateGeneration();
    }
  };

  const simulateGeneration = () => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          toast.success("Story chapter created!");
          // Navigate back to classroom
          navigate(`/teacher/classroom/${classroomId}`);
        }, 500);
      }
    }, 200);
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
              {isGeneratingThumbnails && (
                <p className="text-sm text-muted-foreground text-center">
                  Generating thumbnails... ✨
                </p>
              )}
              <div className="grid md:grid-cols-3 gap-6">
                {storyOptions.map((option) => {
                  const thumbnail = thumbnails.get(option.id);
                  return (
                    <Card 
                      key={option.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-primary"
                      onClick={() => selectStory(option.id)}
                    >
                      <CardContent className="pt-6 space-y-4">
                        {thumbnail ? (
                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted">
                            <img 
                              src={thumbnail} 
                              alt={option.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="text-5xl text-center">{option.theme}</div>
                        )}
                        <h3 className="text-xl font-bold text-foreground text-center">
                          {option.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {option.summary}
                        </p>
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
                    {Math.floor(progress / 5)} of 20 panels completed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    Estimated time remaining: {Math.max(0, 40 - Math.floor(progress / 2.5))} seconds
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`aspect-square rounded-lg ${
                        i < progress / 12.5 
                          ? 'bg-primary/20' 
                          : 'bg-muted animate-pulse'
                      }`}
                    />
                  ))}
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
