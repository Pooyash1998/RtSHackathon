import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const styles = [
  { id: "manga", name: "Manga" },
  { id: "comic", name: "Comic" },
  { id: "cartoon", name: "Cartoon" },
];

const CreateClassroom = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    grade: "",
    customTheme: "",
    style: "",
  });

  useEffect(() => {
    api.settings.get().then(({ settings }) => {
      setFormData((current) => current.style ? current : { ...current, style: settings.default_design_style });
    }).catch(() => undefined);
  }, []);

  const handleSubmit = async () => {
    try {
      await api.classrooms.create({
        name: formData.name,
        subject: formData.subject,
        grade_level: formData.grade,
        story_theme: formData.customTheme,
        design_style: formData.style,
      });
      toast.success("Classroom created successfully!");
      navigate("/teacher/dashboard");
    } catch {
      toast.error("Failed to create classroom. Please try again.");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/teacher/dashboard")}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <p className="font-mono text-xs font-bold tracking-wide text-primary">CLASSROOM SETUP</p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">Create a classroom</h1>
            <div className="flex items-center gap-2">
              <div className="font-mono text-xs text-muted-foreground">Step {step} of 2</div>
              <div
                role="progressbar"
                aria-label="Classroom setup progress"
                aria-valuemin={1}
                aria-valuemax={2}
                aria-valuenow={step}
                className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(step / 2) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Classroom Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Physics 101"
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select value={formData.subject} onValueChange={(subject) => setFormData({ ...formData, subject })}>
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {['physics', 'chemistry', 'biology', 'math', 'english', 'history'].map((subject) => (
                          <SelectItem key={subject} value={subject} className="capitalize">
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade Level *</Label>
                    <Select value={formData.grade} onValueChange={(grade) => setFormData({ ...formData, grade })}>
                      <SelectTrigger id="grade">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                          <SelectItem key={grade} value={grade.toString()}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    className="w-full"
                    disabled={!formData.name || !formData.subject || !formData.grade}
                  >
                    Next
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="customTheme">Custom Story Theme *</Label>
                    <Input
                      id="customTheme"
                      placeholder="e.g., Space Adventure, Mystery Detective, Time Travel"
                      value={formData.customTheme}
                      onChange={(event) => setFormData({ ...formData, customTheme: event.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a custom theme for your story generation (e.g., Space Adventure, Historical Fiction, Fantasy Quest)
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label id="design-style-label">Design Style *</Label>
                    <RadioGroup
                      aria-labelledby="design-style-label"
                      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                      value={formData.style}
                      onValueChange={(style) => setFormData({ ...formData, style })}
                    >
                      {styles.map((style) => (
                        <Label
                          key={style.id}
                          htmlFor={`style-${style.id}`}
                          className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border bg-card p-4 text-card-foreground transition-colors hover:bg-accent ${formData.style === style.id ? "border-primary bg-story-spark/20" : ""}`}
                        >
                          <RadioGroupItem id={`style-${style.id}`} value={style.id} />
                          <span className="text-sm font-medium">{style.name}</span>
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="flex-1"
                      disabled={!formData.customTheme || !formData.style}
                    >
                      Create Classroom
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateClassroom;
