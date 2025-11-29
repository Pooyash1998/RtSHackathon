<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const StudentSignup = () => {
  const navigate = useNavigate();
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const StudentSignup = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [interests, setInterests] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = firstName.trim() && lastName.trim() && interests.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // In production, this would create the student account/avatar
    const mockStudentId = "student-new-" + Date.now();

    console.log("Creating student account:", {
      studentId: mockStudentId,
      firstName,
      lastName,
      interests,
      photo
    });

    // After creating account, go to dashboard
    navigate(`/student/dashboard/${mockStudentId}`);
  };
>>>>>>> 302670a (initial student page commit)

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>
      </header>

<<<<<<< HEAD
      <div className="container mx-auto px-4 py-24 max-w-md">
        <Card>
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-3xl font-bold text-foreground">Student Portal</h1>
            <p className="text-muted-foreground">
              Student sign-up and dashboard coming soon! Ask your teacher for the classroom invite link.
            </p>
            <Button onClick={() => navigate("/")} variant="outline">
              Return Home
            </Button>
=======
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="backdrop-blur-lg bg-card/70 border-2 border-border/50">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">✨</div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Create Your Account
              </h1>
              <p className="text-muted-foreground">
                Set up your profile to get started
              </p>
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

              {/* Photo Upload (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="photo">Photo (Optional)</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                        <User className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Upload a photo to personalize your character
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!isFormValid}
              >
                Create Account
              </Button>

              {!isFormValid && (
                <p className="text-sm text-center text-muted-foreground">
                  Please fill in all required fields
                </p>
              )}
            </form>

            <div className="pt-4 border-t border-border/30 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Already have an account?
              </p>
              <Button onClick={() => navigate("/student/login")} variant="outline" size="sm">
                Sign In
              </Button>
            </div>
>>>>>>> 302670a (initial student page commit)
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentSignup;
