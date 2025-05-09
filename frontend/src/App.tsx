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
  "Return only a JSON array of programming courses. Each course must have: id (number), name (string), description (string), price (number), inStock (boolean). Output only valid JSON, no explanation, no markdown, no text.";

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState<CourseForm>(initialForm);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedCourses, setGeneratedCourses] = useState<Course[]>([]);

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
    const response = await fetch("http://localhost:5000/api/generate-courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: defaultStructureHint }),
    });
    const data = await response.json();

    if (Array.isArray(data)) {
      setGeneratedCourses(data);
    } else if (data.error) {
      alert("Fehler: " + data.error + "\nRaw:\n" + data.raw);
      setGeneratedCourses([]);
    } else {
      alert("Unbekanntes Backend-Format:\n" + JSON.stringify(data));
      setGeneratedCourses([]);
    }
    setLoading(false);
  };

  const saveGeneratedCourses = async () => {
    for (const course of generatedCourses) {
      // Remove id if present, so backend assigns a new one
      const { id, ...courseData } = course;
      await fetch("http://localhost:5000/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
      })
        .then((res) => res.json())
        .then((newCourse: Course) => {
          setCourses((prev) => [...prev, newCourse]);
        });
    }
    setGeneratedCourses([]);
  };

  return (
    <div className="container">
      <h1>🎓 Programming Courses</h1>
      <div className="section">
        <h2>Add a New Course</h2>
        <form onSubmit={handleSubmit} className="form">
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleChange}
            required
          />
          <input
            name="price"
            type="number"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={handleChange}
            required
          />
          <label className="checkbox-label">
            <input
              name="inStock"
              type="checkbox"
              checked={form.inStock}
              onChange={handleChange}
            />
            Available
          </label>
          <button type="submit">Add</button>
        </form>
      </div>
      <div className="section">
        <h2>Generate Courses with AI</h2>
        <textarea
          value={prompt}
          onChange={handlePromptChange}
          rows={4}
          style={{ width: "100%" }}
          placeholder="Enter your prompt for course generation"
        />
        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <button onClick={generateCourses} disabled={loading}>
            {loading ? "Generating..." : "Generate Courses"}
          </button>
          <button
            onClick={saveGeneratedCourses}
            disabled={generatedCourses.length === 0}
            style={{
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 5,
              padding: "0.7rem 1.2rem",
              cursor: generatedCourses.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Save
          </button>
        </div>
        <p className="note">
          <b>Note:</b> The system expects the AI to return a JSON array of courses with the following structure: id (number), name (string), description (string), price (number), inStock (boolean).
        </p>
        {generatedCourses.length > 0 && (
          <div style={{ marginTop: "1.5rem" }}>
            <h3>Preview Generated Courses</h3>
            <ul className="course-list">
              {generatedCourses.map((c, idx) => (
                <li key={idx} className="course-item">
                  <b>{c.name}</b> – {c.description}
                  <div className="course-meta">
                    <span>💶 {c.price} €</span>
                    <span className={c.inStock ? "in-stock" : "not-available"}>
                      {c.inStock ? "Available" : "Not available"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="section">
        <h2>All Courses</h2>
        <ul className="course-list">
          {courses.map((c) => (
            <li key={c.id} className="course-item">
              <b>{c.name}</b> – {c.description}
              <div className="course-meta">
                <span>💶 {c.price} €</span>
                <span className={c.inStock ? "in-stock" : "not-available"}>
                  {c.inStock ? "Available" : "Not available"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <style>{`
        .container {
          max-width: 700px;
          margin: 2rem auto;
          padding: 2rem;
          background: #f9f9fb;
          border-radius: 12px;
          box-shadow: 0 2px 12px #0001;
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        h1 {
          text-align: center;
          margin-bottom: 2rem;
          color: #3b82f6;
        }
        .course-list {
          list-style: none;
          padding: 0;
        }
        .course-item {
          background: #fff;
          margin-bottom: 1rem;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 1px 4px #0001;
        }
        .course-meta {
          margin-top: 0.5rem;
          font-size: 0.95em;
          color: #555;
          display: flex;
          gap: 1.5rem;
        }
        .in-stock {
          color: #16a34a;
          font-weight: bold;
        }
        .not-available {
          color: #dc2626;
          font-weight: bold;
        }
        .section {
          margin-top: 2.5rem;
        }
        .form {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          margin-top: 1rem;
        }
        .form input,
        .form textarea {
          padding: 0.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 5px;
          font-size: 1em;
        }
        .form button {
          background: #3b82f6;
          color: #fff;
          border: none;
          padding: 0.7rem 1.2rem;
          border-radius: 5px;
          font-size: 1em;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: background 0.2s;
        }
        .form button:hover {
          background: #2563eb;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        textarea {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          font-size: 1em;
        }
        button[disabled] {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .note {
          font-size: 0.95em;
          color: #64748b;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}

export default App;
