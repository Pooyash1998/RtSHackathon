import { Link } from "react-router-dom";
import { BookOpen, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Landing = () => {
  const features = [
    {
      icon: Users,
      title: "Personalized Characters",
      description: "Students become the heroes of their own learning adventures"
    },
    {
      icon: Sparkles,
      title: "AI-Generated Stories",
      description: "Curriculum-aligned content created automatically from your lessons"
    },
    {
      icon: BookOpen,
      title: "Easy to Use",
      description: "From classroom setup to story export in just minutes"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Transform Learning with<br />
            <span className="text-primary">Personalized Graphic Novels</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered stories featuring your students as the main characters
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              asChild 
              size="lg" 
              className="w-full sm:w-auto text-lg px-8 py-6"
            >
              <Link to="/teacher/dashboard">
                Get Started as Teacher
              </Link>
            </Button>
            
            <Button 
              asChild 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-6"
            >
              <Link to="/student/signup">
                Join as Student
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-8 pb-6 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Landing;
