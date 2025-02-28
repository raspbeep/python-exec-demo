import React, { useState, JSX, useRef } from "react";
import Editor, { MonacoDiffEditor } from "@monaco-editor/react";
import "./App.css";

const baseInput =
  "IyBQeXRob24gcHJvZ3JhbSB0byBkaXNwbGF5IHRoZSBGaWJvbmFjY2kgc2VxdWVuY2UKCmRlZiByZWN1cl9maWJvKG4pOgogICBpZiBuIDw9IDE6CiAgICAgICByZXR1cm4gbgogICBlbHNlOgogICAgICAgcmV0dXJuKHJlY3VyX2ZpYm8obi0xKSArIHJlY3VyX2ZpYm8obi0yKSkKCm50ZXJtcyA9IDMwCgojIGNoZWNrIGlmIHRoZSBudW1iZXIgb2YgdGVybXMgaXMgdmFsaWQKaWYgbnRlcm1zIDw9IDA6CiAgIHByaW50KCJQbGVzZSBlbnRlciBhIHBvc2l0aXZlIGludGVnZXIiKQplbHNlOgogICBwcmludCgiRmlib25hY2NpIHNlcXVlbmNlOiIpCiAgIGZvciBpIGluIHJhbmdlKG50ZXJtcyk6CiAgICAgICBwcmludChyZWN1cl9maWJvKGkpKQ==";

const SimplePage: React.FC = () => {
  const [text, setText] = useState(
    localStorage.getItem("code") || atob(baseInput),
  );
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const editorRef = useRef<MonacoDiffEditor | null>(null);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    localStorage.setItem("code", text);
    try {
      const fetchResult = await fetch(
        "https://python-exec-714558093143.us-central1.run.app/execute",
        {
          // const fetchResult = await fetch("http://127.0.0.1:5000/execute", {
          headers: {
            "Content-Type": "text/plain",
            mode: "no-cors",
          },
          method: "POST",
          body: text,
        },
      );
      setLoading(false);
      const body = await fetchResult.json();
      setResult(body.output);
      if (fetchResult.status == 400 || fetchResult.status == 401) {
        setSuccess(false);
        if (body.output.includes("Syntax error")) {
          const lineNumberMatch = body.output.match(/line (\d+)/);
          if (lineNumberMatch) {
            const lineNumber = parseInt(lineNumberMatch[1], 10);
            editorRef.current?.focus();
            editorRef.current?.revealLine(lineNumber);
            editorRef.current?.setPosition({ lineNumber, column: 1 });
          }
        }
      } else if (fetchResult.status == 200) {
        setSuccess(true);
      }
    } catch (e: unknown) {
      setLoading(false);
      setResult(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    setText(value || "");
  };

  return (
    <div style={{ maxWidth: 1200, margin: "50px auto", textAlign: "start" }}>
      <Title level={2}>Simple Python exec container demo</Title>
      <div
        style={{
          border: "1px solid #d9d9d9",
          borderRadius: 4,
          marginBottom: 16,
        }}
      >
        <Editor
          value={text}
          height={"40vh"}
          language="python"
          theme="vs-light"
          onChange={handleCodeChange}
          saveViewState={true}
          options={{
            wordWrap: "on",
            minimap: { enabled: false },
            automaticLayout: true,
            scrollbar: { vertical: "auto", horizontal: "auto" },
          }}
          defaultValue={text}
          onMount={(editor) => (editorRef.current = editor)}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "start",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <button className="button" onClick={handleSubmit}>
          {loading ? <span>Executing... </span> : "Submit"}
        </button>
        {success ? "✅" : "❌"}
      </div>

      <Title level={3}>Output:</Title>
      <textarea
        className="output"
        rows={40}
        value={result}
        onChange={(e) => setResult(e.target.value)}
        placeholder="Output will be displayed here..."
        style={{ marginBottom: 16, width: "100%", height: "40vh" }}
      />
    </div>
  );
};

const Title: React.FC<{ level: number; children: React.ReactNode }> = ({
  level,
  children,
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag>{children}</Tag>;
};

export default SimplePage;
