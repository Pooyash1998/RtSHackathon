import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ZoomIn } from "lucide-react";
import { getStoryWithPanels } from "@/lib/mockData";

interface Panel {
  id: string;
  panel_number: number;
  image_url: string;
  dialogue: string;
}

const StudentStoryReader = () => {
  const { storyId, studentId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<any>(null);
  const [panels, setPanels] = useState<Panel[]>([]);

  // Header visibility state
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Image size control (10% - 200%)
  const [imageScale, setImageScale] = useState(() => {
    const saved = localStorage.getItem('storyReaderImageScale');
    return saved ? parseInt(saved) : 75;
  });

  // Load story data
  useEffect(() => {
    if (storyId) {
      const storyData = getStoryWithPanels(storyId);
      if (storyData) {
        setStory(storyData);
        setPanels(storyData.panels || []);
      }
    }
  }, [storyId]);

  // Save image scale preference
  useEffect(() => {
    localStorage.setItem('storyReaderImageScale', imageScale.toString());
  }, [imageScale]);

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

  if (!story) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-muted-foreground">Loading story...</p>
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
                    {story.title}
                  </h1>
                </div>

                {/* Right: Image size control */}
                <div className="flex items-center gap-3 flex-shrink-0">
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

      {/* Story panels - clean vertical flow */}
      <div className="pt-20 pb-8 flex flex-col items-center" style={{ width: `${imageScale}%`, margin: '0 auto' }}>
        {panels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No panels available for this story.</p>
          </div>
        ) : (
          panels.map((panel) => (
            <motion.div
              key={panel.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full"
              style={{ display: 'block', lineHeight: 0 }}
            >
              {panel.image_url ? (
                <img
                  src={panel.image_url}
                  alt={`Panel ${panel.panel_number}`}
                  className="w-full h-auto block"
                  loading="lazy"
                  style={{ margin: 0, padding: 0, display: 'block' }}
                />
              ) : (
                // Fallback for missing images
                <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center">
                  <span className="text-6xl">📚</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentStoryReader;
