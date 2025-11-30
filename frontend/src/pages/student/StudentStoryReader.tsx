import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ZoomIn, LayoutGrid, List } from "lucide-react";
import api from "@/lib/api";
import { Panel } from "@/types/story";

const StudentStoryReader = () => {
  const { chapterId, studentId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<any>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Header visibility state
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Layout mode: 'webtoon' (vertical) or 'grid' (grid layout)
  const [layoutMode, setLayoutMode] = useState<'webtoon' | 'grid'>(() => {
    const saved = localStorage.getItem('storyReaderLayout');
    return (saved as 'webtoon' | 'grid') || 'webtoon';
  });

  // Image size control (10% - 200%), default 50% to fit 2 images on screen
  const [imageScale, setImageScale] = useState(() => {
    const saved = localStorage.getItem('storyReaderImageScale');
    return saved ? parseInt(saved) : 50;
  });

  // Load chapter data from API
  useEffect(() => {
    const loadChapter = async () => {
      if (!chapterId) return;

      setIsLoading(true);
      try {
        const response = await api.chapters.getById(chapterId);
        setChapter(response.chapter);
        setPanels(response.chapter.panels || []);
      } catch (error) {
        console.error("Failed to load chapter:", error);
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

  // Scroll direction detection
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < 10) {
      // Always show header at top
      setShowHeader(true);
    } else if (Math.abs(currentScrollY - lastScrollY) > 80) {
      // Threshold of 80px
      if (currentScrollY > lastScrollY) {
        // Scrolling down - hide header
        setShowHeader(false);
      } else {
        // Scrolling up - show header
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    }
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-muted-foreground">Loading story...</p>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-muted-foreground">Chapter not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auto-hiding header */}
      <AnimatePresence>
        {showHeader && (
          <motion.header
            initial={{ y: 0 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/90 border-b border-gray-200 shadow-sm"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
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
                  <h1 className="text-lg font-semibold text-foreground truncate">
                    {chapter.story_title || `Chapter ${chapter.index}`}
                  </h1>
                </div>

                {/* Right: Layout toggle and Image size control */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Layout Toggle */}
                  <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/30">
                    <Button
                      variant={layoutMode === 'webtoon' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLayoutMode('webtoon')}
                      className="h-8"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={layoutMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLayoutMode('grid')}
                      className="h-8"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Image Size Slider */}
                  <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2 w-32">
                    <Slider
                      value={[imageScale]}
                      onValueChange={(value) => setImageScale(value[0])}
                      min={10}
                      max={200}
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
          </motion.header>
        )}
      </AnimatePresence>

      {/* Story panels - conditional layout based on mode */}
      {layoutMode === 'webtoon' ? (
        /* Webtoon format: vertical flow, zero gaps */
        <div className="pt-20 flex flex-col items-center" style={{ width: `${imageScale}%`, margin: '0 auto' }}>
          {panels.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-8xl mb-4">🔍</div>
              <p className="text-muted-foreground text-lg">Looking for panels...</p>
              <p className="text-muted-foreground text-sm mt-2">This story is still being generated.</p>
            </div>
          ) : (
            panels
              .sort((a, b) => a.index - b.index)
              .map((panel) => (
                <div
                  key={panel.id}
                  className="w-full"
                  style={{ display: 'block', lineHeight: 0, margin: 0, padding: 0 }}
                >
                  <img
                    src={panel.image}
                    alt={`Panel ${panel.index}`}
                    className="w-full h-auto block"
                    loading="lazy"
                    style={{ margin: 0, padding: 0, display: 'block' }}
                  />
                </div>
              ))
          )}
        </div>
      ) : (
        /* Grid layout: responsive grid with direct images */
        <div className="pt-20 container mx-auto px-4 pb-8">
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
              {panels
                .sort((a, b) => a.index - b.index)
                .map((panel) => (
                  <img
                    key={panel.id}
                    src={panel.image}
                    alt={`Panel ${panel.index}`}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentStoryReader;
