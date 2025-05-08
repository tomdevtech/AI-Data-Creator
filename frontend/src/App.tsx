import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Course = {
  id: number;
  name: string;
  description: string;
  price: number;
  inStock: boolean;
};

type CourseForm = Omit<Course, "id">;

const initialForm: CourseForm = {
  name: "",
  description: "",
  price: 0,
  inStock: true,
};

const defaultStructureHint =
  "Return only a JSON array of programming courses. Each course must have: id (number), name (string), description (string), price (number), inStock (boolean).";

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseForm>(initialForm);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/courses")
      .then((res) => res.json())
      .then(setCourses);
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    fetch("http://localhost:5000/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
      .then((res) => res.json())
      .then((newCourse: Course) => {
        setCourses((prev) => [...prev, newCourse]);
        setForm(initialForm);
      });
  };

  const handlePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const generateCourses = async () => {
    setLoading(true);
    const fullPrompt = `${prompt}\n\n${defaultStructureHint}`;
    const response = await fetch("http://localhost:5000/api/generate-courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: fullPrompt }),
    });
    const data = await response.json();
    try {
      const content =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.text ||
        data.content ||
        data.result ||
        "";
      const parsed = typeof content === "string" ? JSON.parse(content) : content;
      setCourses(parsed);
    } catch (err) {
      alert("Could not parse generated courses.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h1>Programming Courses</h1>
      <ul>
        {courses.map((c) => (
          <li key={c.id}>
            <b>{c.name}</b> – {c.description} <br />
            Price: {c.price} € | {c.inStock ? "Available" : "Not available"}
          </li>
        ))}
      </ul>
      <h2>Add a New Course</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <br />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          required
        />
        <br />
        <label>
          <input
            name="inStock"
            type="checkbox"
            checked={form.inStock}
            onChange={handleChange}
          />
          Available
        </label>
        <br />
        <button type="submit">Add</button>
      </form>
      <h2>Generate Courses with AI</h2>
      <textarea
        value={prompt}
        onChange={handlePromptChange}
        rows={4}
        style={{ width: "100%" }}
        placeholder="Enter your prompt for course generation"
      />
      <br />
      <button onClick={generateCourses} disabled={loading}>
        {loading ? "Generating..." : "Generate Courses"}
      </button>
      <p style={{ fontSize: "0.9em", color: "#888" }}>
        <b>Note:</b> The system expects the AI to return a JSON array of courses with the following structure: id (number), name (string), description (string), price (number), inStock (boolean).
      </p>
    </div>
  );
}

export default App;
