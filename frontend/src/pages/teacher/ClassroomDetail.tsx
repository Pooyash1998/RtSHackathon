import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Copy, Plus, Upload, CheckCircle, Clock, Filter, X, Loader2, Grid3x3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface Student {
  id: string;
  name: string;
  interests: string;
  avatar_url: string | null;
  photo_url: string | null;
  status: "pending" | "generated";
}

interface Chapter {
  id: string;
  index: number;
  chapter_outline: string;
  created_at: string;
}

interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  story_theme: string;
  design_style: string;
}

interface MaterialFile {
  file: File;
  title: string;
  description: string;
}

const ClassroomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storySortBy, setStorySortBy] = useState<"week" | "date">("week");
  const [studentViewMode, setStudentViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [materials, setMaterials] = useState<MaterialFile[]>([]);
  const [uploadedMaterials, setUploadedMaterials] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch classroom with students
        const classroomResponse = await api.classrooms.getById(id);
        setClassroom(classroomResponse.classroom);
        
        // Map students and add status based on avatar_url
        const studentsWithStatus = classroomResponse.classroom.students.map(student => {
          console.log(`Student ${student.name}:`, {
            hasPhoto: !!student.photo_url,
            hasAvatar: !!student.avatar_url,
            avatarUrl: student.avatar_url?.substring(0, 50) + '...'
          });
          return {
            ...student,
            status: student.avatar_url ? "generated" as const : "pending" as const
          };
        });
        setStudents(studentsWithStatus);
        
        // Fetch chapters
        const chaptersResponse = await api.classrooms.getChapters(id);
        setChapters(chaptersResponse.chapters);
        
        // Fetch materials
        const materialsResponse = await api.classrooms.getMaterials(id);
        setUploadedMaterials(materialsResponse.materials);
      } catch (error) {
        console.error("Failed to fetch classroom data:", error);
        toast.error("Failed to load classroom data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassroomData();
  }, [id]);

  // Get tab from URL or default to stories
  const currentTab = searchParams.get('tab') || 'stories';

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/student/join/${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: ""
      }));
      setMaterials([...materials, ...newFiles]);
      toast.success(`${newFiles.length} file(s) added`);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== droppedFiles.length) {
      toast.error("Only PDF files are allowed");
    }

    if (pdfFiles.length > 0) {
      const newFiles = pdfFiles.map(file => ({
        file,
        title: file.name.replace(/\.[^/.]+$/, ""),
        description: ""
      }));
      setMaterials([...materials, ...newFiles]);
      toast.success(`${pdfFiles.length} file(s) added`);
    }
  };

  const updateMaterial = (index: number, field: keyof MaterialFile, value: string) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
    setMaterials(updatedMaterials);
  };

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleUploadMaterials = async () => {
    if (!id) return;
    
    setIsUploading(true);
    try {
      // Upload each material
      for (const materialFile of materials) {
        if (!materialFile.title.trim()) {
          toast.error(`Please provide a title for ${materialFile.file.name}`);
          setIsUploading(false);
          return;
        }
        
        await api.classrooms.uploadMaterial(
          id,
          materialFile.file,
          materialFile.title,
          materialFile.description || undefined
        );
      }
      
      toast.success(`${materials.length} material${materials.length > 1 ? 's' : ''} uploaded successfully!`);
      
      // Clear the materials list
      setMaterials([]);
      
      // Refresh uploaded materials
      const materialsResponse = await api.classrooms.getMaterials(id);
      setUploadedMaterials(materialsResponse.materials);
      
    } catch (error) {
      console.error("Failed to upload materials:", error);
      toast.error("Failed to upload materials. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Get calendar week from date
  const getWeek = (date: Date) => {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil((((date.getTime() - onejan.getTime()) / millisecsInDay) + onejan.getDay() + 1) / 7);
  };

  // Group chapters by week or keep sorted by date
  const groupedChapters = () => {
    if (storySortBy === "date") {
      return [{ label: "All Stories", chapters: [...chapters].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )}];
    }

    const groups: { [key: string]: Chapter[] } = {};
    chapters.forEach(chapter => {
      const date = new Date(chapter.created_at);
      const week = getWeek(date);
      const year = date.getFullYear();
      const key = `KW ${week} ${year}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(chapter);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([label, chapters]) => ({ label, chapters }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading classroom...</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Classroom not found</p>
          <Button onClick={() => navigate("/teacher/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AuroraBackground className="absolute inset-0" showRadialGradient={true}>
        <div className="relative z-10 w-full h-full overflow-auto">
          {/* Header - Glass Effect */}
          <header className="sticky top-0 z-20 backdrop-blur-lg bg-background/70 border-b border-border/50">
            <div className="container mx-auto px-4 py-4">
              <Button variant="ghost" onClick={() => navigate("/teacher/dashboard")}>
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-8">
            {/* Classroom Header - Glass Effect */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    {classroom.name}
                  </h1>
                  <div className="flex gap-2 flex-wrap mb-3">
                    <Badge className="bg-blue-500/80 backdrop-blur-sm text-white border-blue-300/30">{classroom.subject}</Badge>
                    <Badge className="backdrop-blur-sm bg-background/60 border-border/50" variant="outline">Grade {classroom.grade_level}</Badge>
                    <Badge className="backdrop-blur-sm bg-background/60 border-border/50" variant="outline">{classroom.story_theme}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Invite students:</span>
                    <code className="px-2 py-1 bg-muted/50 backdrop-blur-sm rounded text-xs font-mono border border-border/30">
                      {window.location.origin}/student/join/{id}
                    </code>
                    <Button 
                      onClick={copyInviteLink} 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 backdrop-blur-sm"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="backdrop-blur-sm bg-background/60">Edit Classroom</Button>
              </div>
            </motion.div>

            {/* Tabs - Glass Effect */}
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className="backdrop-blur-lg bg-muted/50 border border-border/30">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="stories">Stories</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-6">
                {students.length === 0 ? (
                  <Card className="backdrop-blur-lg bg-card/70 border-border/50">
                    <CardContent className="pt-12 pb-12 text-center space-y-4">
                      <p className="text-muted-foreground">
                        No students yet. Share the invite link to get started.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* View Toggle */}
                    <div className="flex justify-end">
                      <div className="flex gap-1 p-1 backdrop-blur-lg bg-muted/50 rounded-lg border border-border/30">
                        <Button
                          variant={studentViewMode === "grid" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setStudentViewMode("grid")}
                          className="backdrop-blur-sm"
                        >
                          <Grid3x3 className="w-4 h-4 mr-2" />
                          Grid
                        </Button>
                        <Button
                          variant={studentViewMode === "list" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setStudentViewMode("list")}
                          className="backdrop-blur-sm"
                        >
                          <List className="w-4 h-4 mr-2" />
                          List
                        </Button>
                      </div>
                    </div>

                    {/* Grid View */}
                    {studentViewMode === "grid" && (
                      <motion.div 
                        className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        {students.map((student, idx) => (
                          <motion.div
                            key={student.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                          >
                            <Card className="backdrop-blur-lg bg-card/70 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl h-full">
                              <CardContent className="pt-6 pb-6 flex flex-col h-full">
                                {/* Student Photo - Fixed Height */}
                                <div className="flex justify-center mb-4">
                                  <div className="relative">
                                    <Avatar className="w-24 h-24 border-4 border-border/30">
                                      <AvatarImage 
                                        src={student.photo_url || student.avatar_url || undefined} 
                                        alt={student.name}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="bg-primary/20 text-2xl">
                                        {student.name.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    {student.avatar_url && student.photo_url && (
                                      <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full border-3 border-background overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                                        <Avatar className="w-full h-full">
                                          <AvatarImage 
                                            src={student.avatar_url} 
                                            alt={`${student.name} avatar`}
                                            className="object-cover"
                                          />
                                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                                            🎨
                                          </AvatarFallback>
                                        </Avatar>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Student Info - Fixed Height */}
                                <div className="text-center flex-1 flex flex-col">
                                  <h3 className="font-semibold text-foreground text-lg mb-2 min-h-[28px]">
                                    {student.name}
                                  </h3>
                                  {/* Exactly 2 lines for interests - Fixed Height */}
                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-[40px] leading-[20px]">
                                    {student.interests}
                                  </p>
                                </div>
                                
                                {/* Status Badge - Fixed at Bottom */}
                                <Badge 
                                  className={`w-full justify-center ${student.status === "generated" 
                                    ? "bg-green-500/80 text-white backdrop-blur-sm border-green-300/30" 
                                    : "bg-amber-500/80 text-white backdrop-blur-sm border-amber-300/30"
                                  }`}
                                >
                                  {student.status === "generated" ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Avatar Generated
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      Avatar Pending
                                    </>
                                  )}
                                </Badge>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    {/* List View */}
                    {studentViewMode === "list" && (
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        {students.map((student, idx) => (
                          <motion.div
                            key={student.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.05 }}
                          >
                            <Card className="backdrop-blur-lg bg-card/70 border-border/50 hover:bg-card/80 transition-all hover:shadow-lg">
                              <CardContent className="py-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                      <h3 className="font-semibold text-foreground text-lg">{student.name}</h3>
                                      <Badge 
                                        className={student.status === "generated" 
                                          ? "bg-green-500/80 text-white backdrop-blur-sm border-green-300/30" 
                                          : "bg-amber-500/80 text-white backdrop-blur-sm border-amber-300/30"
                                        }
                                      >
                                        {student.status === "generated" ? (
                                          <>
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Avatar Generated
                                          </>
                                        ) : (
                                          <>
                                            <Clock className="w-3 h-3 mr-1" />
                                            Avatar Pending
                                          </>
                                        )}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                      {student.interests}
                                    </p>
                                  </div>
                                  
                                  {student.avatar_url && (
                                    <div className="flex-shrink-0">
                                      <div className="w-12 h-12 rounded-lg border-2 border-border/30 overflow-hidden">
                                        <img 
                                          src={student.avatar_url} 
                                          alt={`${student.name} avatar`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="stories" className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={storySortBy} onValueChange={(value: "week" | "date") => setStorySortBy(value)}>
                      <SelectTrigger className="w-[180px] backdrop-blur-sm bg-background/60">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">By Week</SelectItem>
                        <SelectItem value="date">By Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button asChild className="backdrop-blur-sm">
                    <a href={`/teacher/classroom/${id}/story/new`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Story
                    </a>
                  </Button>
                </div>

                {chapters.length === 0 ? (
                  <Card className="backdrop-blur-lg bg-card/70 border-border/50">
                    <CardContent className="pt-12 pb-12 text-center space-y-4">
                      <p className="text-muted-foreground">
                        No stories yet. Generate your first story based on a lesson!
                      </p>
                      <Button asChild className="backdrop-blur-sm">
                        <a href={`/teacher/classroom/${id}/story/generate`}>
                          <Plus className="w-4 h-4 mr-2" />
                          Generate Story
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {groupedChapters().map((group, groupIdx) => (
                      <div key={group.label} className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground/80 backdrop-blur-sm">
                          {group.label}
                        </h3>
                        {group.chapters.map((chapter, idx) => (
                          <motion.div
                            key={chapter.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: (groupIdx * 0.1) + (idx * 0.05) }}
                          >
                            <Card className="backdrop-blur-lg bg-card/70 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl">
                              <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="w-full md:w-32 h-32 bg-muted/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/30 overflow-hidden">
                                    {chapter.thumbnail_url ? (
                                      <img 
                                        src={chapter.thumbnail_url} 
                                        alt={`Chapter ${chapter.index}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-4xl">📚</span>
                                    )}
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div>
                                      <h3 className="text-xl font-bold text-foreground">Chapter {chapter.index}</h3>
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {chapter.chapter_outline || chapter.original_prompt}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Created on {new Date(chapter.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Badge className="bg-green-500/80 text-white backdrop-blur-sm border-green-300/30">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Completed
                                    </Badge>
                                    <div className="flex gap-2 flex-wrap">
                                      <Button asChild variant="default" className="backdrop-blur-sm">
                                        <a href={`/teacher/story/${chapter.id}`}>View Chapter</a>
                                      </Button>
                                      <Button variant="outline" className="backdrop-blur-sm bg-background/60">Export PDF</Button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="materials" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Upload Area */}
                  <div 
                    className={`backdrop-blur-lg bg-card/50 border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                      isDragging 
                        ? 'border-primary bg-primary/10 scale-[1.02]' 
                        : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="material-upload"
                      className="hidden"
                      accept=".pdf"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="material-upload" className="cursor-pointer block">
                      <Upload className={`w-12 h-12 mx-auto mb-4 transition-all ${isDragging ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
                      <div className={`text-sm font-medium mb-1 transition-colors ${isDragging ? 'text-primary' : 'text-foreground'}`}>
                        {isDragging ? '📄 Drop PDF files here!' : 'Click to upload or drag PDF files'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Max 10MB per file • PDF only
                      </div>
                    </label>
                  </div>

                  {/* Existing Uploaded Materials */}
                  {uploadedMaterials.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Existing Materials ({uploadedMaterials.length})</h3>
                      <div className="space-y-3">
                        {uploadedMaterials.map((material) => (
                          <Card key={material.id} className="backdrop-blur-lg bg-card/70 border-border/50">
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl">📄</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground">{material.title}</p>
                                    {material.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">{material.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      Uploaded {new Date(material.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => window.open(material.file_url, '_blank')}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={async () => {
                                      if (confirm('Are you sure you want to delete this material?')) {
                                        try {
                                          await api.classrooms.deleteMaterial(material.id);
                                          setUploadedMaterials(uploadedMaterials.filter(m => m.id !== material.id));
                                          toast.success('Material deleted');
                                        } catch (error) {
                                          toast.error('Failed to delete material');
                                        }
                                      }
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Materials to Upload */}
                  {materials.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">New Materials to Upload ({materials.length})</h3>
                      <div className="space-y-4">
                        {materials.map((materialFile, index) => (
                          <Card key={index} className="backdrop-blur-lg bg-card/70 border-border/50">
                            <CardContent className="pt-4 space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="w-10 h-10 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xl">📄</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">{materialFile.file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(materialFile.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeMaterial(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`material-title-${index}`}>Material Title *</Label>
                                <Input
                                  id={`material-title-${index}`}
                                  placeholder="e.g., Week 3: Newton's Laws"
                                  value={materialFile.title}
                                  onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                                  className="backdrop-blur-sm bg-background/60"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`material-description-${index}`}>Description (Optional)</Label>
                                <Textarea
                                  id={`material-description-${index}`}
                                  placeholder="Brief description of this material"
                                  value={materialFile.description}
                                  onChange={(e) => updateMaterial(index, 'description', e.target.value)}
                                  rows={2}
                                  className="backdrop-blur-sm bg-background/60"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Button 
                        className="w-full backdrop-blur-sm" 
                        onClick={handleUploadMaterials}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload {materials.length} Material{materials.length > 1 ? 's' : ''}
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </AuroraBackground>
    </div>
  );
};

export default ClassroomDetail;
