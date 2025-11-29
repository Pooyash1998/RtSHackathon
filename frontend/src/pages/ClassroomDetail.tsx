import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Copy, Plus, Upload, CheckCircle, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  interests: string;
  avatar_url: string | null;
  status: "pending" | "generated";
}

interface Story {
  id: string;
  title: string;
  created_at: string;
  status: "generating" | "completed";
  progress?: number;
  thumbnail_url: string;
}

const mockStudents: Student[] = [
  { id: "1", name: "Emma Johnson", interests: "Space, Robots", avatar_url: null, status: "generated" },
  { id: "2", name: "Liam Chen", interests: "Sports, Adventure", avatar_url: null, status: "generated" },
  { id: "3", name: "Sophia Martinez", interests: "Mystery, Books", avatar_url: null, status: "pending" }
];

const mockStories: Story[] = [
  {
    id: "1",
    title: "Newton's Laws in Space",
    created_at: "2024-11-20",
    status: "completed",
    thumbnail_url: ""
  },
  {
    id: "2",
    title: "The Gravity Mystery",
    created_at: "2024-11-15",
    status: "completed",
    thumbnail_url: ""
  },
  {
    id: "3",
    title: "Energy and Motion",
    created_at: "2024-11-08",
    status: "completed",
    thumbnail_url: ""
  },
  {
    id: "4",
    title: "Forces in Action",
    created_at: "2024-10-28",
    status: "completed",
    thumbnail_url: ""
  }
];

const ClassroomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students] = useState<Student[]>(mockStudents);
  const [stories] = useState<Story[]>(mockStories);
  const [storySortBy, setStorySortBy] = useState<"week" | "date">("week");
  
  const classroom = {
    name: "Physics 101",
    subject: "Physics",
    grade_level: "10",
    theme: "Space Adventure"
  };

  // Get tab from URL or default to students
  const currentTab = searchParams.get('tab') || 'students';

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/student/join/${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard!");
  };

  // Get calendar week from date
  const getWeek = (date: Date) => {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil((((date.getTime() - onejan.getTime()) / millisecsInDay) + onejan.getDay() + 1) / 7);
  };

  // Group stories by week or keep sorted by date
  const groupedStories = () => {
    if (storySortBy === "date") {
      return [{ label: "All Stories", stories: [...stories].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )}];
    }

    const groups: { [key: string]: Story[] } = {};
    stories.forEach(story => {
      const date = new Date(story.created_at);
      const week = getWeek(date);
      const year = date.getFullYear();
      const key = `KW ${week} ${year}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(story);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([label, stories]) => ({ label, stories }));
  };

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
                    <Badge className="backdrop-blur-sm bg-background/60 border-border/50" variant="outline">{classroom.theme}</Badge>
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
                  <motion.div 
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                        <Card className="backdrop-blur-lg bg-card/70 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl">
                          <CardContent className="pt-6 space-y-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-12 h-12 border-2 border-border/30">
                                <AvatarImage src={student.avatar_url || undefined} />
                                <AvatarFallback className="bg-primary/20">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground">{student.name}</h3>
                                <p className="text-sm text-muted-foreground">{student.interests}</p>
                              </div>
                            </div>
                            <Badge 
                              className={student.status === "generated" 
                                ? "bg-green-500/80 text-white backdrop-blur-sm border-green-300/30" 
                                : "bg-amber-500/80 text-white backdrop-blur-sm border-amber-300/30"
                              }
                            >
                              {student.status === "generated" ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Generated
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </Badge>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
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
                    <a href="/teacher/story/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Generate New Story
                    </a>
                  </Button>
                </div>

                {stories.length === 0 ? (
                  <Card className="backdrop-blur-lg bg-card/70 border-border/50">
                    <CardContent className="pt-12 pb-12 text-center space-y-4">
                      <p className="text-muted-foreground">
                        No stories yet. Generate your first story based on a lesson!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-8">
                    {groupedStories().map((group, groupIdx) => (
                      <div key={group.label} className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground/80 backdrop-blur-sm">
                          {group.label}
                        </h3>
                        {group.stories.map((story, idx) => (
                          <motion.div
                            key={story.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: (groupIdx * 0.1) + (idx * 0.05) }}
                          >
                            <Card className="backdrop-blur-lg bg-card/70 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl">
                              <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                  <div className="w-full md:w-32 h-32 bg-muted/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-border/30">
                                    <span className="text-4xl">📚</span>
                                  </div>
                                  <div className="flex-1 space-y-3">
                                    <div>
                                      <h3 className="text-xl font-bold text-foreground">{story.title}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        Created on {new Date(story.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Badge className="bg-green-500/80 text-white backdrop-blur-sm border-green-300/30">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Completed
                                    </Badge>
                                    <div className="flex gap-2 flex-wrap">
                                      <Button asChild variant="default" className="backdrop-blur-sm">
                                        <a href={`/teacher/story/${story.id}`}>View Story</a>
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
                >
                  <div className="backdrop-blur-lg bg-card/50 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <div className="text-sm font-medium text-foreground mb-1">
                      Click to upload or drag PDF files
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Max 10MB per file
                    </div>
                  </div>
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
