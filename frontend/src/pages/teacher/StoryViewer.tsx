import { useState, useEffect, useCallback } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";

interface Panel {
  id: string;
  index: number;
  image: string;
  chapter_id: string;
  created_at: string;
}

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<any>(null);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [exportSettings, setExportSettings] = useState({
    pageSize: "a4",
    layout: "2"
  });

  // Header visibility state
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Layout mode: 'webtoon' (vertical) or 'grid' (grid layout)
  const [layoutMode, setLayoutMode] = useState<'webtoon' | 'grid'>(() => {
    const saved = localStorage.getItem('teacherStoryReaderLayout');
    return (saved as 'webtoon' | 'grid') || 'webtoon';
  });

  // Image size control (10% - 200%), default 50%
  const [imageScale, setImageScale] = useState(() => {
    const saved = localStorage.getItem('teacherStoryReaderImageScale');
    return saved ? parseInt(saved) : 50;
  });

  // Load chapter data from API
  useEffect(() => {
    const loadChapter = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await api.chapters.getById(id);
        setChapter(response.chapter);
        setPanels(response.chapter.panels || []);

        // Load all chapters for this classroom to enable navigation
        if (response.chapter.classroom_id) {
          try {
            const chaptersResponse = await api.classrooms.getChapters(response.chapter.classroom_id);
            if (chaptersResponse.success && chaptersResponse.chapters) {
              // Sort chapters by created_at descending (newest first)
              const sortedChapters = [...chaptersResponse.chapters].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              setAllChapters(sortedChapters);
              
              // Find current chapter index
              const index = sortedChapters.findIndex(ch => ch.id === id);
              setCurrentIndex(index);
            }
          } catch (error) {
            console.error("Failed to load chapters list:", error);
          }
        }
      } catch (error) {
        console.error("Failed to load chapter:", error);
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

  // Scroll direction detection
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < 10) {
      setShowHeader(true);
    } else if (Math.abs(currentScrollY - lastScrollY) > 80) {
      if (currentScrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    }
  }, [lastScrollY]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleExport = async () => {
    if (!chapter || panels.length === 0) {
      toast.error("No panels to export");
      return;
    }

    try {
      toast.info("Generating PDF...");

      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF({
        orientation: exportSettings.pageSize === 'letter' ? 'portrait' : 'portrait',
        unit: 'mm',
        format: exportSettings.pageSize === 'letter' ? 'letter' : 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const panelsPerPage = parseInt(exportSettings.layout);
      const margin = 10;
      const spacing = 5;
      const usableWidth = pageWidth - (2 * margin);
      const usableHeight = pageHeight - (2 * margin);

      const sortedPanels = [...panels].sort((a, b) => a.index - b.index);
      const aspectRatio = 1;
      
      let maxPanelWidth: number, maxPanelHeight: number;
      
      if (panelsPerPage === 2) {
        maxPanelWidth = usableWidth;
        maxPanelHeight = (usableHeight - spacing) / 2;
      } else {
        maxPanelWidth = (usableWidth - spacing) / 2;
        maxPanelHeight = (usableHeight - spacing) / 2;
      }

      let panelWidth: number, panelHeight: number;
      if (maxPanelWidth / maxPanelHeight > aspectRatio) {
        panelHeight = maxPanelHeight;
        panelWidth = panelHeight * aspectRatio;
      } else {
        panelWidth = maxPanelWidth;
        panelHeight = panelWidth / aspectRatio;
      }

      for (let i = 0; i < sortedPanels.length; i++) {
        const panel = sortedPanels[i];

        if (i > 0 && i % panelsPerPage === 0) {
          doc.addPage();
        }

        const indexOnPage = i % panelsPerPage;
        let x: number, y: number;

        if (panelsPerPage === 2) {
          x = margin + (usableWidth - panelWidth) / 2;
          y = margin + (indexOnPage * (maxPanelHeight + spacing)) + (maxPanelHeight - panelHeight) / 2;
        } else {
          const row = Math.floor(indexOnPage / 2);
          const col = indexOnPage % 2;
          x = margin + (col * (maxPanelWidth + spacing)) + (maxPanelWidth - panelWidth) / 2;
          y = margin + (row * (maxPanelHeight + spacing)) + (maxPanelHeight - panelHeight) / 2;
        }

        try {
          doc.addImage(panel.image, 'PNG', x, y, panelWidth, panelHeight);
        } catch (err) {
          console.error(`Failed to add panel ${panel.index}:`, err);
        }
      }

      const fileName = `${chapter.story_title || `Chapter ${chapter.index}`}.pdf`;
      doc.save(fileName);

      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF export failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
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

  if (!chapter) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Chapter not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex-shrink-0">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                  <h1 className="text-lg font-semibold text-foreground truncate">
                    {chapter?.story_title || `Chapter ${chapter?.index}`}
                  </h1>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
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

                  <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/30">
                    <Button variant={layoutMode === 'webtoon' ? 'default' : 'ghost'} size="sm" onClick={() => setLayoutMode('webtoon')} className="h-8">
                      <List className="w-4 h-4" />
                    </Button>
                    <Button variant={layoutMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setLayoutMode('grid')} className="h-8">
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                  </div>

                  <ZoomIn className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2 w-32">
                    <Slider value={[imageScale]} onValueChange={(value) => setImageScale(value[0])} min={10} max={200} step={5} className="flex-1" />
                    <span className="text-sm text-muted-foreground w-10 text-right">{imageScale}%</span>
                  </div>
                </div>
              </div>

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
          </motion.header>
        )}
      </AnimatePresence>

      {layoutMode === 'webtoon' ? (
        <div className="pt-20 flex flex-col items-center" style={{ width: `${imageScale}%`, margin: '0 auto' }}>
          {panels.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-8xl mb-4">📚</div>
              <p className="text-muted-foreground text-lg">No panels yet</p>
            </div>
          ) : (
            panels.sort((a, b) => a.index - b.index).map((panel) => (
              <div key={panel.id} className="w-full" style={{ display: 'block', lineHeight: 0, margin: 0, padding: 0 }}>
                <img src={panel.image} alt={`Panel ${panel.index}`} className="w-full h-auto block" loading="lazy" style={{ margin: 0, padding: 0, display: 'block' }} />
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="pt-20 container mx-auto px-4 pb-8">
          {panels.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-8xl mb-4">📚</div>
              <p className="text-muted-foreground text-lg">No panels yet</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${imageScale <= 30 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : imageScale <= 50 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : imageScale <= 80 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : imageScale <= 120 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {panels.sort((a, b) => a.index - b.index).map((panel) => (
                <img key={panel.id} src={panel.image} alt={`Panel ${panel.index}`} className="w-full h-auto" loading="lazy" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
