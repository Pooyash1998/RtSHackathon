import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createClassroom } from "../../lib/api";
import type { ClassroomCreate } from "../../types";
import { Button } from "../shared/Button";
import { ErrorMessage } from "../shared/ErrorMessage";

export function ClassroomForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ClassroomCreate>({
    name: "",
    subject: "",
    grade_level: "",
    story_theme: "",
    design_style: "manga",
    duration: "",
  });

  const mutation = useMutation({
    mutationFn: createClassroom,
    onSuccess: (classroom) => {
      navigate(`/teacher/classroom/${classroom.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Classroom</h1>

      {mutation.isError && (
        <ErrorMessage
          message={
            mutation.error instanceof Error
              ? mutation.error.message
              : "Failed to create classroom"
          }
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Classroom Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Ms. Smith's 3rd Grade"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subject *</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Math, Science, History"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Grade Level *
          </label>
          <input
            type="text"
            name="grade_level"
            value={formData.grade_level}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 3rd Grade, 5-6 years old"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Story Theme *
          </label>
          <input
            type="text"
            name="story_theme"
            value={formData.story_theme}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Space Adventure, Playground, Ancient Egypt"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Design Style *
          </label>
          <select
            name="design_style"
            value={formData.design_style}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="manga">Manga</option>
            <option value="comic">Comic</option>
            <option value="cartoon">Cartoon</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Duration *</label>
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., 1 week, 1 month, semester"
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" isLoading={mutation.isPending}>
            Create Classroom
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/teacher/dashboard")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
