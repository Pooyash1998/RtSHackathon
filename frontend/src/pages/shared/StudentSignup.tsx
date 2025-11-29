import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const StudentSignup = () => {
  const navigate = useNavigate();

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentSignup;
