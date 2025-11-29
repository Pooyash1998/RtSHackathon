import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listClassrooms } from "../../lib/api";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { ErrorMessage } from "../shared/ErrorMessage";
import { Button } from "../shared/Button";

export function ClassroomDashboard() {
  const { data: classrooms, isLoading, error } = useQuery({
    queryKey: ["classrooms"],
    queryFn: listClassrooms,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <ErrorMessage
          message={
            error instanceof Error ? error.message : "Failed to load classrooms"
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Classrooms</h1>
        <Link to="/teacher/classroom/new">
          <Button>Create New Classroom</Button>
        </Link>
      </div>

      {classrooms && classrooms.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No classrooms yet</p>
          <Link to="/teacher/classroom/new">
            <Button>Create Your First Classroom</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms?.map((classroom) => (
            <Link
              key={classroom.id}
              to={`/teacher/classroom/${classroom.id}`}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-bold mb-2">{classroom.name}</h2>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Subject:</span>{" "}
                  {classroom.subject}
                </p>
                <p>
                  <span className="font-medium">Grade:</span>{" "}
                  {classroom.grade_level}
                </p>
                <p>
                  <span className="font-medium">Theme:</span>{" "}
                  {classroom.story_theme}
                </p>
                <p>
                  <span className="font-medium">Style:</span>{" "}
                  {classroom.design_style}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created {new Date(classroom.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
