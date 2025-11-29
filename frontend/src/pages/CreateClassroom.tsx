import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MaterialFile {
  file: File;
  title: string;
  description: string;
}

const styles = [
  { id: "manga", name: "Manga" },
  { id: "american", name: "American Comic" },
  { id: "cartoon", name: "Cartoon" }
];

const CreateClassroom = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<MaterialFile[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    grade: "",
    customTheme: "",
    style: ""
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: ""
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const updateFile = (index: number, field: keyof MaterialFile, value: string) => {
    const updatedFiles = [...files];
    updatedFiles[index] = { ...updatedFiles[index], [field]: value };
    setFiles(updatedFiles);
  };

  const handleSubmit = () => {
    toast.success("Classroom created successfully!");
    navigate("/teacher/dashboard");
  };

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/teacher/dashboard")}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-8">
          {/* Progress */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Create New Classroom</h1>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Step {step} of 3
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Classroom Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Physics 101"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Select value={formData.subject} onValueChange={(value) => setFormData({...formData, subject: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physics">Physics</SelectItem>
                        <SelectItem value="chemistry">Chemistry</SelectItem>
                        <SelectItem value="biology">Biology</SelectItem>
                        <SelectItem value="math">Math</SelectItem>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="history">History</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade Level *</Label>
                    <Select value={formData.grade} onValueChange={(value) => setFormData({...formData, grade: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12].map(grade => (
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
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="customTheme">Custom Story Theme *</Label>
                    <Input
                      id="customTheme"
                      placeholder="e.g., Space Adventure, Mystery Detective, Time Travel"
                      value={formData.customTheme}
                      onChange={(e) => setFormData({...formData, customTheme: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a custom theme for your story generation (e.g., Space Adventure, Historical Fiction, Fantasy Quest)
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Design Style *</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {styles.map((style) => (
                        <Card
                          key={style.id}
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            formData.style === style.id ? 'border-primary border-2' : ''
                          }`}
                          onClick={() => setFormData({...formData, style: style.id})}
                        >
                          <CardContent className="pt-6 text-center">
                            <div className="text-sm font-medium">{style.name}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={() => setStep(3)} 
                      className="flex-1"
                      disabled={!formData.customTheme || !formData.style}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>Learning Materials (Optional)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf"
                        multiple
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <div className="text-sm font-medium text-foreground mb-1">
                          Click to upload or drag PDF files
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Max 10MB per file
                        </div>
                      </label>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-4">
                        {files.map((materialFile, index) => (
                          <Card key={index}>
                            <CardContent className="pt-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <span className="text-sm font-medium truncate flex-1">{materialFile.file.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`title-${index}`}>Material Title *</Label>
                                <Input
                                  id={`title-${index}`}
                                  placeholder="e.g., Chapter 1 Notes"
                                  value={materialFile.title}
                                  onChange={(e) => updateFile(index, 'title', e.target.value)}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`description-${index}`}>Description</Label>
                                <Textarea
                                  id={`description-${index}`}
                                  placeholder="Brief description of this material"
                                  value={materialFile.description}
                                  onChange={(e) => updateFile(index, 'description', e.target.value)}
                                  rows={2}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleSubmit} className="flex-1">
                      Create Classroom
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateClassroom;
