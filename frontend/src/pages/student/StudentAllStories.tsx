import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle } from "lucide-react";
import {
    getAllStoriesForStudent,
    getClassroomById
} from "@/lib/mockData";

const StudentAllStories = () => {
    const { studentId } = useParams();
    const [stories, setStories] = useState<any[]>([]);

    useEffect(() => {
        if (studentId) {
            const allStories = getAllStoriesForStudent(studentId);
            // Enrich stories with classroom info
            const enrichedStories = allStories.map(story => ({
                ...story,
                classroom: getClassroomById(story.classroom_id)
            }));
            setStories(enrichedStories);
        }
    }, [studentId]);

    const subjectColors: Record<string, string> = {
        Physics: "bg-blue-500",
        Math: "bg-purple-500",
        History: "bg-amber-500",
        English: "bg-green-500",
        Chemistry: "bg-cyan-500",
        Biology: "bg-emerald-500"
    };

    return (
        <div className="min-h-screen bg-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-bold text-foreground mb-3">
                        All Stories
                    </h1>
                    <p className="text-muted-foreground">
                        Browse all your stories across all classrooms
                    </p>
                </motion.div>

                {/* Stories Grid */}
                {stories.length === 0 ? (
                    <Card className="backdrop-blur-lg bg-card/70 border-border/50">
                        <CardContent className="pt-12 pb-12 text-center">
                            <p className="text-muted-foreground">
                                No stories available yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stories.map((story, idx) => (
                            <motion.div
                                key={story.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.1 }}
                            >
                                <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50 hover:bg-card/80 transition-all hover:shadow-xl hover:scale-[1.02]">
                                    <CardContent className="pt-6 space-y-4">
                                        <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center border border-border/30">
                                            <span className="text-5xl">📚</span>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-foreground mb-2">
                                                {story.title}
                                            </h3>

                                            {/* Classroom badge */}
                                            {story.classroom && (
                                                <div className="mb-3">
                                                    <Badge
                                                        className={`${subjectColors[story.classroom.subject] || 'bg-gray-500'} text-white`}
                                                    >
                                                        {story.classroom.name}
                                                    </Badge>
                                                </div>
                                            )}

                                            <p className="text-sm text-muted-foreground mb-3">
                                                Created on {new Date(story.created_at).toLocaleDateString()}
                                            </p>

                                            <div className="flex gap-2 flex-wrap mb-4">
                                                <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Completed
                                                </Badge>
                                                <Badge variant="outline">
                                                    {story.design_style}
                                                </Badge>
                                            </div>
                                        </div>

                                        <Button asChild className="w-full">
                                            <Link to={`/student/story/${story.id}/${studentId}`}>
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                Read Story
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAllStories;
