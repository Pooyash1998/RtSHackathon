import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";

const StudentSignup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [interests, setInterests] = useState("");
  const [portrait, setPortrait] = useState<File>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestStudentId] = useState(() => crypto.randomUUID());
  const [pendingClassroom, setPendingClassroom] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    // Check if student is joining from a classroom invite
    const classroomId = sessionStorage.getItem('pendingClassroomId');
    const classroomName = sessionStorage.getItem('pendingClassroomName');
    
    if (classroomId && classroomName) {
      setPendingClassroom({ id: classroomId, name: classroomName });
    }
  }, []);

  const isFormValid = firstName.trim() && lastName.trim() && interests.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      toast.info("Creating your local profile...");
      
      const response = await api.students.create(
        fullName,
        interests.trim(),
        pendingClassroom?.id,
        requestStudentId,
      );
      
      const studentId = response.student.id;

      if (pendingClassroom) {
        sessionStorage.removeItem('pendingClassroomId');
        sessionStorage.removeItem('pendingClassroomName');
        toast.success(`Joined ${pendingClassroom.name}!`);
      }

      try {
        toast.info("🎨 Generating your avatar...");
        await api.avatar.create(studentId, portrait);
        toast.success("Avatar generated!");
      } catch {
        toast.error("Your profile was saved locally, but avatar generation failed. You can retry from your profile.");
      }

      toast.success("Profile created locally!");

      // Remember this local preview selection on this device.
      localStorage.setItem('studentId', studentId);

      // Navigate to student dashboard
      navigate(`/student/dashboard/${studentId}`);
    } catch (error) {
      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : "Failed to create profile";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <Card>
          <CardContent className="space-y-6 py-8">
            <div className="text-center">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
              <h1 className="mb-2 font-serif text-3xl font-semibold text-foreground">
                Create a Student Profile
              </h1>
              {pendingClassroom ? (
                <p className="text-muted-foreground">
                  Join <strong>{pendingClassroom.name}</strong> and set up your profile
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Set up your profile to get started
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Interests/Hobbies */}
              <div className="space-y-2">
                <Label htmlFor="interests">
                  Interests / Hobbies <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="interests"
                  placeholder="Tell us about your interests and hobbies (e.g., Sports, Reading, Music, Science)"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  rows={3}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  This helps personalize your character in stories
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="portrait">Portrait photo (optional)</Label>
                <Input
                  id="portrait"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setPortrait(event.target.files?.[0])}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  If selected, this image is sent to Black Forest Labs for avatar generation and is not kept by EduComic after the request.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  `Create Profile${pendingClassroom ? ` & Join ${pendingClassroom.name}` : ''}`
                )}
              </Button>

              {!isFormValid && (
                <p className="text-sm text-center text-muted-foreground">
                  Please fill in all required fields
                </p>
              )}
            </form>

            <div className="pt-4 border-t border-border/30 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Already created a local profile?
              </p>
              <Button onClick={() => navigate("/student/select")} variant="outline" size="sm">
                Choose Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentSignup;
