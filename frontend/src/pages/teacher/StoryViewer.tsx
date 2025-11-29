import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Download, Share2, Edit, Sparkles, Check, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Panel {
  id: string;
  panel_number: number;
  image_url: string;
  dialogue: string;
}

const mockPanels: Panel[] = [
  {
    id: "1",
    panel_number: 1,
    image_url: "",
    dialogue: "Emma: 'Wow! Look at this space race challenge! We need to understand forces to win!'"
  },
  {
    id: "2",
    panel_number: 2,
    image_url: "",
    dialogue: "Liam: 'Remember Newton's First Law? An object in motion stays in motion unless acted upon by a force!'"
  },
  {
    id: "3",
    panel_number: 3,
    image_url: "",
    dialogue: "Sophia: 'And the Second Law tells us that Force equals Mass times Acceleration!'"
  },
  {
    id: "4",
    panel_number: 4,
    image_url: "",
    dialogue: "Emma: 'Let's calculate the force needed to accelerate our spacecraft!'"
  },
  {
    id: "5",
    panel_number: 5,
    image_url: "",
    dialogue: "Liam: 'If our ship has a mass of 1000kg and we need 5m/s² acceleration...'"
  },
  {
    id: "6",
    panel_number: 6,
    image_url: "",
    dialogue: "Sophia: 'That's 5000 Newtons of force! F = ma, just like we learned!'"
  },
  {
    id: "7",
    panel_number: 7,
    image_url: "",
    dialogue: "Emma: 'Don't forget Newton's Third Law! For every action, there's an equal and opposite reaction!'"
  },
  {
    id: "8",
    panel_number: 8,
    image_url: "",
    dialogue: "Liam: 'The rocket pushes gas backward, and the gas pushes the rocket forward!'"
  },
  {
    id: "9",
    panel_number: 9,
    image_url: "",
    dialogue: "Sophia: 'We're pulling ahead! Understanding physics really works!'"
  },
  {
    id: "10",
    panel_number: 10,
    image_url: "",
    dialogue: "Emma: 'Team, we need to reduce mass to go faster. Less mass means more acceleration with the same force!'"
  },
  {
    id: "11",
    panel_number: 11,
    image_url: "",
    dialogue: "Liam: 'The aliens are catching up! Time to apply maximum thrust!'"
  },
  {
    id: "12",
    panel_number: 12,
    image_url: "",
    dialogue: "All: 'We won! Newton's Laws saved the day! Science is awesome!'"
  }
];

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [panels, setPanels] = useState<Panel[]>(mockPanels);
  const [editingPanel, setEditingPanel] = useState<string | null>(null);
  const [editSuggestion, setEditSuggestion] = useState("");
  const [regeneratingPanels, setRegeneratingPanels] = useState<Set<string>>(new Set());
  const [isFinalized, setIsFinalized] = useState(false);
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    format: "webtoon", // webtoon, print
    // Webtoon settings
    panelSpacing: "none",
    panelWidth: "full",
    // Print settings
    pageSize: "a4",
    panelsPerPage: "2",
    binding: "left",
    margins: "standard",
    gridStyle: "uniform",
    borders: "thin"
  });

  const handleEditPanel = (panelId: string) => {
    setEditingPanel(panelId);
    setEditSuggestion("");
  };

  const handleCancelEdit = () => {
    setEditingPanel(null);
    setEditSuggestion("");
  };

  const handleSubmitEdit = async (panelId: string) => {
    if (!editSuggestion.trim()) {
      toast.error("Please enter a suggestion");
      return;
    }

    // Add to regenerating set
    setRegeneratingPanels(prev => new Set(prev).add(panelId));
    setEditingPanel(null);
    
    toast.success("Regenerating panel with your suggestions...");

    // Simulate API call to regenerate panel
    setTimeout(() => {
      setRegeneratingPanels(prev => {
        const newSet = new Set(prev);
        newSet.delete(panelId);
        return newSet;
      });
      toast.success("Panel regenerated successfully!");
    }, 3000);
  };

  const handleFinalize = () => {
    if (regeneratingPanels.size > 0) {
      toast.error("Please wait for all panels to finish regenerating");
      return;
    }
    setIsFinalized(true);
    setShowExportSettings(true);
    toast.success("Story finalized! Configure export settings.");
  };

  const handleExport = () => {
    if (!isFinalized) {
      toast.error("Please finalize the story before exporting");
      return;
    }
    
    const formatName = exportSettings.format === "webtoon" ? "Webtoon" : "Print";
    toast.success(`Generating ${formatName} format... Your download will begin shortly.`);
    
    // Simulate export
    setTimeout(() => {
      toast.success("Export complete!");
    }, 2000);
  };

  const story = {
    title: "Newton's Space Race",
    created_at: "2024-03-15",
    classroom: "Physics 101"
  };

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
              {!isFinalized && (
                <Button 
                  onClick={handleFinalize}
                  disabled={regeneratingPanels.size > 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Finalize Story
                </Button>
              )}
              {isFinalized && (
                <Badge className="bg-green-600 text-white px-4 py-2">
                  <Check className="w-4 h-4 mr-2" />
                  Finalized
                </Badge>
              )}
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>

            </div>
          </div>
        </div>
      </header>

      {/* Story Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          {/* Story Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">{story.title}</h1>
            <div className="flex gap-3 items-center flex-wrap">
              <p className="text-muted-foreground">
                Created on {new Date(story.created_at).toLocaleDateString()}
              </p>
              <Badge variant="outline">{story.classroom}</Badge>
            </div>
          </div>

          {/* Show Export Settings if finalized, otherwise show grid */}
          {showExportSettings && isFinalized ? (
            /* Export Settings View */
            <Card className="border-2 border-green-600">
              <CardContent className="pt-8 pb-8 space-y-8">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold">Story Finalized!</h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Your comic is ready to export. Choose your preferred format and settings below.
                  </p>
                </div>

                <div className="max-w-3xl mx-auto space-y-6">
                  {/* Format Selection */}
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold">Export Format</Label>
                    <RadioGroup value={exportSettings.format} onValueChange={(v) => setExportSettings({...exportSettings, format: v})}>
                      <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                        <RadioGroupItem value="webtoon" id="webtoon" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="webtoon" className="cursor-pointer font-semibold text-base">📱 Webtoon (Vertical Scroll)</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Continuous vertical layout, perfect for digital reading. Panels flow seamlessly top to bottom.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-accent cursor-pointer transition-colors">
                        <RadioGroupItem value="print" id="print" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="print" className="cursor-pointer font-semibold text-base">📖 Print (Traditional Comic)</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Traditional page-based layout with multiple panels per page, ideal for printing.
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Print-specific settings */}
                  {exportSettings.format === "print" && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Page Size</Label>
                        <RadioGroup value={exportSettings.pageSize} onValueChange={(v) => setExportSettings({...exportSettings, pageSize: v})}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="a4" id="a4" />
                            <Label htmlFor="a4">A4 (210 × 297 mm)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="a5" id="a5" />
                            <Label htmlFor="a5">A5 (148 × 210 mm)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="letter" id="letter" />
                            <Label htmlFor="letter">Letter (8.5 × 11 in)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Panels Per Page</Label>
                        <RadioGroup value={exportSettings.panelsPerPage} onValueChange={(v) => setExportSettings({...exportSettings, panelsPerPage: v})}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="1panel" />
                            <Label htmlFor="1panel">1 panel per page (Large format)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2" id="2panel" />
                            <Label htmlFor="2panel">2 panels per page</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="4" id="4panel" />
                            <Label htmlFor="4panel">4 panels per page</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="6" id="6panel" />
                            <Label htmlFor="6panel">6 panels per page (Compact)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Binding</Label>
                        <RadioGroup value={exportSettings.binding} onValueChange={(v) => setExportSettings({...exportSettings, binding: v})}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="left" id="left" />
                            <Label htmlFor="left">Left binding (Western style)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="right" id="right" />
                            <Label htmlFor="right">Right binding (Manga style)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </>
                  )}

                  {/* Webtoon-specific settings */}
                  {exportSettings.format === "webtoon" && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Panel Spacing</Label>
                        <RadioGroup value={exportSettings.panelSpacing || "none"} onValueChange={(v) => setExportSettings({...exportSettings, panelSpacing: v})}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="spacing-none" />
                            <Label htmlFor="spacing-none">No spacing (Seamless)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="small" id="spacing-small" />
                            <Label htmlFor="spacing-small">Small spacing</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="medium" id="spacing-medium" />
                            <Label htmlFor="spacing-medium">Medium spacing</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Panel Width</Label>
                        <RadioGroup value={exportSettings.panelWidth || "full"} onValueChange={(v) => setExportSettings({...exportSettings, panelWidth: v})}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="full" id="width-full" />
                            <Label htmlFor="width-full">Full width (Mobile optimized)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="centered" id="width-centered" />
                            <Label htmlFor="width-centered">Centered (Desktop optimized)</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </>
                  )}

                  {/* Print-specific layout settings */}
                  {exportSettings.format === "print" && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Page Margins</Label>
                        <RadioGroup value={exportSettings.margins || "standard"} onValueChange={(v) => setExportSettings({...exportSettings, margins: v})}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="margin-none" />
                            <Label htmlFor="margin-none">No margins (Full bleed)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="standard" id="margin-standard" />
                            <Label htmlFor="margin-standard">Standard margins (15mm)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="large" id="margin-large" />
                            <Label htmlFor="margin-large">Large margins (25mm)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Panel Grid Style</Label>
                        <RadioGroup value={exportSettings.gridStyle || "uniform"} onValueChange={(v) => setExportSettings({...exportSettings, gridStyle: v})}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="uniform" id="grid-uniform" />
                            <Label htmlFor="grid-uniform">Uniform grid (Equal sized panels)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="dynamic" id="grid-dynamic" />
                            <Label htmlFor="grid-dynamic">Dynamic layout (Varied panel sizes)</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-lg font-semibold">Panel Borders</Label>
                        <RadioGroup value={exportSettings.borders || "thin"} onValueChange={(v) => setExportSettings({...exportSettings, borders: v})}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="none" id="border-none" />
                            <Label htmlFor="border-none">No borders</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="thin" id="border-thin" />
                            <Label htmlFor="border-thin">Thin borders</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="thick" id="border-thick" />
                            <Label htmlFor="border-thick">Thick borders</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowExportSettings(false)}
                      className="flex-1"
                    >
                      Back to Edit
                    </Button>
                    <Button onClick={handleExport} className="flex-1" size="lg">
                      <Download className="w-5 h-5 mr-2" />
                      Export {exportSettings.format === "webtoon" ? "Webtoon" : "Print Comic"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Compact Grid of Panels */
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {panels.map((panel) => {
              const isEditing = editingPanel === panel.id;
              const isRegenerating = regeneratingPanels.has(panel.id);
              
              return (
                <Card 
                  key={panel.id} 
                  className={`overflow-hidden border-2 transition-all cursor-pointer hover:shadow-lg ${
                    isEditing ? 'ring-2 ring-primary' : ''
                  } ${isRegenerating ? 'opacity-60' : ''}`}
                  onClick={() => !isFinalized && !isRegenerating && !isEditing && handleEditPanel(panel.id)}
                >
                  <div className="relative">
                    {/* Panel Number Badge */}
                    <Badge className="absolute top-2 left-2 bg-background/90 text-foreground z-10 text-xs">
                      {panel.panel_number}
                    </Badge>

                    {/* Regenerating Overlay */}
                    {isRegenerating && (
                      <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-20">
                        <div className="text-center space-y-2">
                          <Sparkles className="w-6 h-6 mx-auto animate-pulse text-primary" />
                          <p className="text-xs font-medium">Regenerating...</p>
                        </div>
                      </div>
                    )}

                    {/* Panel Image */}
                    <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <span className="text-4xl">📚</span>
                    </div>

                    {/* Edit Indicator on Hover */}
                    {!isFinalized && !isRegenerating && !isEditing && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Edit className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Edit Panel Dialog */}
          {editingPanel && !isFinalized && (
            <Card className="border-2 border-primary">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">
                    Edit Panel {panels.find(p => p.id === editingPanel)?.panel_number}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Describe the changes you want to make. The AI will regenerate the panel based on your prompt.
                  </p>
                </div>
                <Textarea
                  placeholder="e.g., Make the background brighter, add more dynamic action, change character expression..."
                  value={editSuggestion}
                  onChange={(e) => setEditSuggestion(e.target.value)}
                  rows={4}
                  className="text-base"
                  autoFocus
                />
                <div className="flex gap-3">
                  <Button 
                    className="flex-1"
                    onClick={() => handleSubmitEdit(editingPanel)}
                    disabled={!editSuggestion.trim()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Regenerate Panel
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;
