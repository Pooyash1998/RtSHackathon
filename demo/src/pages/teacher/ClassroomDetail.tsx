import { useState, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, ChevronLeft, Copy, Plus, CheckCircle, Clock, Filter, Loader2, Grid3x3, List, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Material } from "@/lib/api";
import { exportStoryPdf } from "@/lib/exportStoryPdf";
import type { Chapter } from "@/types/story";
import { formatGradeLevel } from "@/lib/utils";
import { isDemoMode } from "@/lib/runtime";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  name: string;
  interests: string;
  avatar_url: string | null;
  avatar_thumbnail_url: string | null;
  status: "pending" | "generated";
}

interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  story_theme: string;
  design_style: string;
}

const ClassroomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialError, setMaterialError] = useState("");
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [storySortBy, setStorySortBy] = useState<"week" | "date">("week");
  const [studentViewMode, setStudentViewMode] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Classroom | null>(null);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setLoadError(null);
        setClassroom(null);
        setStudents([]);
        setChapters([]);
        setMaterials([]);

        // Fetch classroom with students
        const classroomResponse = await api.classrooms.getById(id);
        setClassroom(classroomResponse.classroom);

        // Map students and add status based on avatar_url
        const studentsWithStatus = classroomResponse.classroom.students.map(student => ({
          ...student,
          status: student.avatar_url ? "generated" as const : "pending" as const
        }));
        setStudents(studentsWithStatus);

        // Fetch chapters
        const chaptersResponse = await api.classrooms.getChapters(id);
        setChapters(chaptersResponse.chapters);
        const materialsResponse = await api.materials.getAll(id);
        setMaterials(materialsResponse.materials);

      } catch {
        setLoadError("Failed to load classroom. Please try again.");
        toast.error("Failed to load classroom data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassroomData();
  }, [id, reloadKey]);

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

  const saveClassroom = async () => {
    if (!id || !editDraft) return;
    setEditError("");
    try {
      await api.classrooms.update(id, editDraft);
      setClassroom(editDraft);
      setEditing(false);
      toast.success("Classroom saved");
    } catch {
      setEditError("Classroom could not be saved. Check the fields and retry.");
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!id) return;
    try {
      await api.students.leaveClassroom(studentId, id);
      setStudents((current) => current.filter((student) => student.id !== studentId));
      toast.success("Student removed from this classroom");
    } catch { toast.error("Classroom removal failed. Please retry."); }
  };

  const eraseStudent = async (studentId: string) => {
    try {
      await api.students.erase(studentId);
      setStudents((current) => current.filter((student) => student.id !== studentId));
      toast.success("Student personal data erased");
    } catch { toast.error("Erasure is incomplete. Retry to finish local file cleanup."); }
  };

  const deleteClassroom = async () => {
    if (!id) return;
    try {
      await api.classrooms.delete(id);
      navigate("/teacher/dashboard");
    } catch { toast.error("Classroom deletion is incomplete. Retry to finish local file cleanup."); }
  };

  const uploadMaterial = async () => {
    if (!id || !materialFile) return;
    setIsUploadingMaterial(true);
    setMaterialError("");
    try {
      const response = await api.materials.upload(id, materialFile);
      setMaterials((current) => [...current, response.material]);
      setMaterialFile(null);
      toast.success("Lesson PDF is ready");
    } catch (error) {
      setMaterialError(error instanceof Error ? error.message : "The PDF could not be uploaded.");
    } finally {
      setIsUploadingMaterial(false);
    }
  };

  const deleteMaterial = async (materialId: string) => {
    try {
      await api.materials.delete(materialId);
      setMaterials((current) => current.filter((material) => material.id !== materialId));
      toast.success("Material deleted; existing story provenance was retained");
    } catch {
      setMaterialError("Local file cleanup is incomplete. Retry material deletion.");
    }
  };

  // Get calendar week from date
  const getWeek = (date: Date) => {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil((((date.getTime() - onejan.getTime()) / millisecsInDay) + onejan.getDay() + 1) / 7);
  };

  // Export chapter as PDF
  const handleExportPDF = async (chapterId: string, chapterTitle: string) => {
    try {
      toast.info("Generating PDF...");

      // Fetch chapter with panels
      const response = await api.chapters.getById(chapterId);
      const panels = response.chapter.panels || [];

      if (panels.length === 0) {
        toast.error("No panels to export");
        return;
      }

      await exportStoryPdf({ panels, title: chapterTitle });
      toast.success("PDF downloaded successfully!");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  // Delete chapter
  const handleDeleteChapter = async (chapterId: string, chapterTitle: string) => {
    try {
      toast.info("Deleting chapter...");
      
      await api.chapters.delete(chapterId);
      
      // Remove from local state
      setChapters(chapters.filter(ch => ch.id !== chapterId));
      
      toast.success(`"${chapterTitle}" deleted successfully!`);
    } catch {
      toast.error("Failed to delete chapter. Please try again.");
    }
  };

  // Group chapters by week or keep sorted by date
  const groupedChapters = () => {
    if (storySortBy === "date") {
      return [{
        label: "All Stories", chapters: [...chapters].sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      }];
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

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p role="alert" className="text-destructive">{loadError}</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>
            <Button variant="outline" onClick={() => navigate("/teacher/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
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
      <header className="sticky top-0 z-20 border-b bg-background/95">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/teacher/dashboard")}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-6xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <p className="mb-2 font-mono text-xs font-bold tracking-wide text-primary">CLASSROOM WORKSPACE</p>
              <h1 className="mb-3 font-serif text-4xl font-semibold tracking-tight text-foreground">
                {classroom.name}
              </h1>
              {!isDemoMode && !editing && <div className="mb-3 flex gap-2"><Button variant="outline" onClick={() => { setEditDraft(classroom); setEditing(true); setEditError(""); }}>Edit classroom</Button>
                <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive">Delete classroom</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this classroom?</AlertDialogTitle><AlertDialogDescription>This deletes its chapters, materials, and managed story files. Student profiles are not fully erased.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void deleteClassroom()}>Confirm classroom deletion</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
              </div>}
              {!isDemoMode && editing && editDraft && <form className="mb-4 grid gap-3 rounded-lg border p-4" onSubmit={(event) => { event.preventDefault(); void saveClassroom(); }}>
                {([
                  ["name", "Classroom name"], ["subject", "Subject"], ["grade_level", "Grade level"], ["story_theme", "Story theme"],
                ] as const).map(([field, label]) => <label key={field}>{label}<Input required maxLength={field === "story_theme" ? 500 : 100} value={editDraft[field]} onChange={(event) => setEditDraft({ ...editDraft, [field]: event.target.value })} /></label>)}
                <label>Design style<select className="block min-h-11 w-full rounded-md border bg-background px-3" value={editDraft.design_style} onChange={(event) => setEditDraft({ ...editDraft, design_style: event.target.value })}><option value="comic">Comic</option><option value="manga">Manga</option><option value="cartoon">Cartoon</option></select></label>
                <div className="flex gap-2"><Button type="submit">Save classroom</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel edit</Button></div>
                {editError && <p role="alert" className="text-destructive">{editError}</p>}
              </form>}
              <div className="flex gap-2 flex-wrap mb-3">
                <Badge variant="outline">{classroom.subject}</Badge>
                <Badge variant="outline">{formatGradeLevel(classroom.grade_level)}</Badge>
                <Badge variant="outline">{classroom.story_theme}</Badge>
              </div>
              {!isDemoMode && <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center">
                <span>Invite students:</span>
                <code className="break-all rounded border bg-card px-2 py-1 font-mono text-xs">
                  {window.location.origin}/student/join/{id}
                </code>
                <Button
                  aria-label="Copy invite link"
                  onClick={copyInviteLink}
                  size="sm"
                  variant="ghost"
                  className="px-2"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>}
            </div>
          </div>
        </motion.div>

        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            {students.length === 0 ? (
              <Card>
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
                  <div className="flex gap-1 rounded-lg border bg-card p-1">
                    <Button
                      variant={studentViewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setStudentViewMode("grid")}
                    >
                      <Grid3x3 className="w-4 h-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={studentViewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setStudentViewMode("list")}
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
                        <Card className="h-full">
                          <CardContent className="pt-6 pb-6 flex flex-col h-full">
                            {/* Student Avatar - Fixed Height */}
                            <div className="flex justify-center mb-4">
                              <Avatar className="w-24 h-24 border-4 border-border/30">
                                <AvatarImage
                                  src={student.avatar_thumbnail_url || student.avatar_url || undefined}
                                  alt={student.name}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-primary/20 text-2xl">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
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
                                ? "border-green-700 bg-green-700 text-white"
                                : "border-amber-300 bg-amber-100 text-amber-900"
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
                            {!isDemoMode && <div className="mt-3 grid gap-2">
                              <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" aria-label={`Remove ${student.name} from classroom`}>Remove from classroom</Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove from this classroom?</AlertDialogTitle><AlertDialogDescription>The student profile and personal files are kept.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void removeStudent(student.id)}>Confirm classroom removal</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                              </AlertDialog>
                              <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" aria-label={`Erase all data for ${student.name}`}>Erase all personal data</Button></AlertDialogTrigger>
                                <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Erase all personal data?</AlertDialogTitle><AlertDialogDescription>This removes the profile, classroom memberships, source photo, avatar, and other student-owned files. Completed stories and their artwork remain unchanged.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void eraseStudent(student.id)}>Confirm full erasure</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                              </AlertDialog>
                            </div>}
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
                        <Card>
                          <CardContent className="py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-foreground text-lg">{student.name}</h3>
                                  <Badge
                                    className={student.status === "generated"
                                      ? "border-green-700 bg-green-700 text-white"
                                      : "border-amber-300 bg-amber-100 text-amber-900"
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
                                      src={student.avatar_thumbnail_url || student.avatar_url}
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

          <TabsContent value="materials" className="space-y-6">
            {!isDemoMode && <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <h2 className="text-xl font-semibold">Lesson materials</h2>
                  <p className="text-sm text-muted-foreground">Native-text PDFs only. Scanned files need OCR, which is not supported yet.</p>
                </div>
                <label className="block text-sm font-medium" htmlFor="lesson-pdf">Upload lesson PDF</label>
                <input
                  id="lesson-pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => setMaterialFile(event.target.files?.[0] || null)}
                  className="block min-h-11 w-full rounded-md border bg-card p-2 text-sm"
                />
                <Button onClick={() => void uploadMaterial()} disabled={!materialFile || isUploadingMaterial}>
                  {isUploadingMaterial ? "Uploading and extracting..." : "Upload and extract"}
                </Button>
                {materialError && <p role="alert" className="text-sm text-destructive">{materialError}</p>}
              </CardContent>
            </Card>}

            {materials.length === 0 ? <p className="text-sm text-muted-foreground">No ready lesson materials.</p> : materials.map((material) => (
              <Card key={material.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
                  <div>
                    <p className="font-medium">{material.source_filename}</p>
                    <p className="text-sm text-muted-foreground">Ready · {material.page_count} page{material.page_count === 1 ? "" : "s"} · {material.text_char_count} characters</p>
                    <p className="text-xs text-muted-foreground">SHA-256 {material.content_hash.slice(0, 12)}…</p>
                  </div>
                  {!isDemoMode && <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="destructive" aria-label={`Delete ${material.source_filename}`}>Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete {material.source_filename}?</AlertDialogTitle><AlertDialogDescription>The local PDF is deleted. Existing stories keep their source hash, page references, and excerpts.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void deleteMaterial(material.id)}>Confirm material deletion</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="stories" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={storySortBy} onValueChange={(value: "week" | "date") => setStorySortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">By Week</SelectItem>
                    <SelectItem value="date">By Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!isDemoMode && <Button asChild>
                <Link to={`/teacher/classroom/${id}/story/new`}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Story
                </Link>
              </Button>}
            </div>

            {chapters.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center space-y-4">
                  <p className="text-muted-foreground">
                    No stories yet. Generate your first story based on a lesson!
                  </p>
                  {!isDemoMode && <Button asChild>
                    <Link to={`/teacher/classroom/${id}/story/new`}>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Story
                    </Link>
                  </Button>}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {groupedChapters().map((group, groupIdx) => (
                  <div key={group.label} className="space-y-4">
                    <h3 className="font-mono text-sm font-bold text-muted-foreground">
                      {group.label}
                    </h3>
                    {group.chapters.map((chapter, idx) => (
                      <motion.div
                        key={chapter.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: (groupIdx * 0.1) + (idx * 0.05) }}
                      >
                        <Card className="h-full overflow-hidden">
                          <CardContent className="pt-6 h-full">
                            <div className="flex flex-col md:flex-row gap-4 h-full">
                              <div className="flex h-48 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-foreground/15 bg-muted md:h-auto md:w-40">
                                {chapter.thumbnail_url ? (
                                  <img
                                    src={chapter.thumbnail_url}
                                    alt={`${chapter.story_title} story preview`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <BookOpen className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                                )}
                              </div>
                              <div className="flex-1 flex flex-col justify-between space-y-3 min-h-[180px]">
                                <div className="flex-1">
                                  <h3 className="font-serif text-xl font-semibold text-foreground">{chapter.story_title || `Chapter ${chapter.index}`}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {chapter.story_description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Created on {new Date(chapter.created_at).toLocaleDateString()}
                                  </p>
                                  <div className="mt-2">
                                    <Badge
                                      variant={chapter.status === "ready" ? "default" : chapter.status === "failed" ? "destructive" : "outline"}
                                      className="capitalize"
                                    >
                                      {chapter.status === "ready" && <CheckCircle className="w-3 h-3 mr-1" />}
                                      {chapter.status.replace(/_/g, " ")}
                                    </Badge>
                                  </div>
                                  {(chapter.grounded_sources?.length || 0) > 0 && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Grounded in {chapter.grounded_sources?.map((source) => source.source_label).join(", ")} · provenance retained
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {chapter.status === "ready" && (
                                    <>
                                      <Button asChild variant="default">
                                        <Link to={`/teacher/story/${chapter.id}`}>View Chapter</Link>
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => handleExportPDF(chapter.id, chapter.story_title || `Chapter ${chapter.index}`)}
                                      >
                                        Export PDF
                                      </Button>
                                    </>
                                  )}
                                  {!isDemoMode && chapter.status === "options_generated" && (
                                    <Button asChild>
                                      <Link to={`/teacher/classroom/${id}/story/new?chapter=${chapter.id}`}>Continue Story</Link>
                                    </Button>
                                  )}
                                  {!isDemoMode && <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        aria-label={`Delete ${chapter.story_title || `Chapter ${chapter.index}`}`}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{chapter.story_title || `Chapter ${chapter.index}`}"? 
                                          This will permanently delete the chapter and all its panels. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteChapter(chapter.id, chapter.story_title || `Chapter ${chapter.index}`)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>}
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

        </Tabs>
      </main>
    </div>
  );
};

export default ClassroomDetail;
