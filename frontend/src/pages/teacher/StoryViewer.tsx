import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Download, Share2, Edit, Loader2 } from "lucide-react";
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
  const [exportSettings, setExportSettings] = useState({
    pageSize: "a4",
    layout: "2",
    includeDialogue: "yes"
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
      } catch (error) {
        console.error("Failed to load chapter:", error);
        toast.error("Failed to load chapter");
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [id]);

  const handleExport = () => {
    toast.success("PDF export started! Your download will begin shortly.");
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
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export as PDF</DialogTitle>
                    <DialogDescription>
                      Configure your PDF export settings
                    </DialogDescription>
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

                    <div className="space-y-3">
                      <Label>Include Dialogue</Label>
                      <RadioGroup value={exportSettings.includeDialogue} onValueChange={(v) => setExportSettings({ ...exportSettings, includeDialogue: v })}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="yes" />
                          <Label htmlFor="yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="no" />
                          <Label htmlFor="no">No</Label>
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
            </div>
          </div>
        </div>
      </header>

      {/* Story Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Story Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">{chapter.story_title || `Chapter ${chapter.index}`}</h1>
            <div className="flex gap-3 items-center flex-wrap">
              <p className="text-muted-foreground">
                Created on {new Date(chapter.created_at).toLocaleDateString()}
              </p>
              <Badge variant="outline">Chapter {chapter.index}</Badge>
            </div>
          </div>

          {/* Panels Grid */}
          {panels.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground">No panels generated yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {panels.sort((a, b) => a.index - b.index).map((panel) => (
                <Card key={panel.id} className="overflow-hidden border-2">
                  <div className="relative">
                    <Badge className="absolute top-2 left-2 bg-background/90 text-foreground">
                      Panel {panel.index}
                    </Badge>
                    {panel.image ? (
                      <div className="aspect-square overflow-hidden bg-muted">
                        <img
                          src={panel.image}
                          alt={`Panel ${panel.index}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <span className="text-6xl">📚</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t">
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous Story
            </Button>
            <Button variant="outline">
              Next Story
              <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
