import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Download, Share2, Edit } from "lucide-react";
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
  const [panels] = useState<Panel[]>(mockPanels);
  const [exportSettings, setExportSettings] = useState({
    pageSize: "a4",
    layout: "2",
    includeDialogue: "yes"
  });

  const handleExport = () => {
    toast.success("PDF export started! Your download will begin shortly.");
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
                      <RadioGroup value={exportSettings.pageSize} onValueChange={(v) => setExportSettings({...exportSettings, pageSize: v})}>
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
                      <RadioGroup value={exportSettings.layout} onValueChange={(v) => setExportSettings({...exportSettings, layout: v})}>
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
                      <RadioGroup value={exportSettings.includeDialogue} onValueChange={(v) => setExportSettings({...exportSettings, includeDialogue: v})}>
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
            <h1 className="text-4xl font-bold text-foreground">{story.title}</h1>
            <div className="flex gap-3 items-center flex-wrap">
              <p className="text-muted-foreground">
                Created on {new Date(story.created_at).toLocaleDateString()}
              </p>
              <Badge variant="outline">{story.classroom}</Badge>
            </div>
          </div>

          {/* Panels Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {panels.map((panel) => (
              <Card key={panel.id} className="overflow-hidden border-2">
                <div className="relative">
                  <Badge className="absolute top-2 left-2 bg-background/90 text-foreground">
                    Panel {panel.panel_number}
                  </Badge>
                  <div className="aspect-square bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <span className="text-6xl">📚</span>
                  </div>
                </div>
                <CardContent className="pt-4">
                  <div className="bg-muted rounded-lg p-4 relative">
                    <div className="absolute -top-2 left-4 w-4 h-4 bg-muted transform rotate-45" />
                    <p className="text-sm text-foreground">{panel.dialogue}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
