import { useState, useEffect, type CSSProperties } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DemoBanner } from "@/components/shared/DemoBanner";
import { ChevronLeft, ZoomIn, LayoutGrid, List } from "lucide-react";
import api from "@/lib/api";
import { clampReaderScale } from "@/lib/utils";
import type { ChapterWithPanels, Panel } from "@/types/story";

const StudentStoryReader = () => {
  const { chapterId, studentId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<ChapterWithPanels | null>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Layout mode: 'webtoon' (vertical) or 'grid' (grid layout)
  const [layoutMode, setLayoutMode] = useState<'webtoon' | 'grid'>(() => {
    const saved = localStorage.getItem('storyReaderLayout');
    return (saved as 'webtoon' | 'grid') || 'webtoon';
  });

  const [imageScale, setImageScale] = useState(() => clampReaderScale(localStorage.getItem('storyReaderImageScale')));

  // Load chapter data from API
  useEffect(() => {
    const loadChapter = async () => {
      if (!chapterId) return;

      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await api.chapters.getById(chapterId);
        if (response.chapter.status !== "ready") {
          setLoadError(`This story is ${response.chapter.status.replace(/_/g, " ")} and cannot be read yet.`);
          return;
        }
        setChapter(response.chapter);
        setPanels(response.chapter.panels || []);
      } catch {
        setLoadError("Failed to load this story. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [chapterId]);

  // Save image scale preference
  useEffect(() => {
    localStorage.setItem('storyReaderImageScale', imageScale.toString());
  }, [imageScale]);

  // Save layout mode preference
  useEffect(() => {
    localStorage.setItem('storyReaderLayout', layoutMode);
  }, [layoutMode]);

  // ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <DemoBanner />
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-muted-foreground">Loading story...</p>
        </div>
      </div>
    );
  }

  if (loadError || !chapter) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <DemoBanner />
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <p role="alert" className="text-muted-foreground">{loadError || "Chapter not found"}</p>
            <Button onClick={() => navigate(-1)}>Back to stories</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <DemoBanner />
      <div className="min-h-0 flex-1 overflow-auto">
        <header className="sticky top-0 z-50 border-b bg-background/95">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Back button and title */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="flex-shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <h1 className="truncate font-serif text-xl font-semibold text-foreground">
                    {chapter.story_title || `Chapter ${chapter.index}`}
                  </h1>
                </div>

                {/* Right: Layout toggle and Image size control */}
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                  {/* Layout Toggle */}
                  <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
                    <Button
                      variant={layoutMode === 'webtoon' ? 'default' : 'ghost'}
                      size="sm"
                      aria-label="Vertical layout"
                      aria-pressed={layoutMode === 'webtoon'}
                      onClick={() => setLayoutMode('webtoon')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={layoutMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      aria-label="Grid layout"
                      aria-pressed={layoutMode === 'grid'}
                      onClick={() => setLayoutMode('grid')}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Image Size Slider */}
                  <ZoomIn aria-hidden="true" className="w-4 h-4 text-muted-foreground" />
                  <div className="flex min-w-40 flex-1 items-center gap-2 sm:flex-none">
                    <Slider
                      aria-label="Image size"
                      aria-valuetext={`${imageScale} percent`}
                      value={[imageScale]}
                      onValueChange={(value) => setImageScale(value[0])}
                      min={10}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-10 text-right">
                      {imageScale}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
        </header>

      {/* Story panels - conditional layout based on mode */}
        {layoutMode === 'webtoon' ? (
        /* Webtoon format: vertical flow, zero gaps */
        <main
          aria-label="Comic panels"
          className="reader-strip mx-auto flex flex-col items-center"
          style={{ "--reader-scale": `${imageScale}%` } as CSSProperties}
        >
          {panels.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-8xl mb-4">🔍</div>
              <p className="text-muted-foreground text-lg">Looking for panels...</p>
              <p className="text-muted-foreground text-sm mt-2">This story is still being generated.</p>
            </div>
          ) : (
            [...panels]
              .sort((a, b) => a.index - b.index)
              .map((panel) => (
                <div
                  key={panel.id}
                  className="w-full"
                  style={{ display: 'block', lineHeight: 0, margin: 0, padding: 0 }}
                >
                  <img
                    src={panel.image}
                    alt={`Panel ${panel.index} from ${chapter.story_title || `Chapter ${chapter.index}`}`}
                    className="w-full h-auto block"
                    loading="lazy"
                    style={{ margin: 0, padding: 0, display: 'block' }}
                  />
                </div>
              ))
          )}
        </main>
      ) : (
        /* Grid layout: responsive grid with direct images */
        <div className="container mx-auto px-4 pb-8">
          {panels.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-8xl mb-4">🔍</div>
              <p className="text-muted-foreground text-lg">Looking for panels...</p>
              <p className="text-muted-foreground text-sm mt-2">This story is still being generated.</p>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${imageScale <= 30 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' :
                  imageScale <= 50 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
                    imageScale <= 80 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                      imageScale <= 120 ? 'grid-cols-1 md:grid-cols-2' :
                        'grid-cols-1'
                }`}
            >
              {[...panels]
                .sort((a, b) => a.index - b.index)
                .map((panel) => (
                  <img
                    key={panel.id}
                    src={panel.image}
                    alt={`Panel ${panel.index} from ${chapter.story_title || `Chapter ${chapter.index}`}`}
                    className="h-auto w-full border-2 border-foreground/15"
                    loading="lazy"
                  />
                ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default StudentStoryReader;
