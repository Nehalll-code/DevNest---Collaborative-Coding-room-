import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    return e;
  };

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 900));

    // Mock login — any valid email/password works
    login({ name: form.email.split("@")[0], email: form.email });
    navigate("/dashboard");
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-inner anim-fade-up">
          <div className="auth-brand">
            <div className="auth-brand-icon">{`</>`}</div>
            <span className="auth-brand-name">DevNest</span>
          </div>

          <h1 className="auth-headline">
            Code together,<br />
            <span className="auth-headline-accent">ship faster.</span>
          </h1>
          <p className="auth-sub">
            A real-time collaborative code editor for teams who move fast and
            build things together.
          </p>

          <ul className="auth-features">
            {[
              { icon: "🖊️", text: "Live multi-user editing" },
              { icon: "📜", text: "Version history & restore" },
              { icon: "🌐", text: "JavaScript, Python, C++ & more" },
              { icon: "🔒", text: "Secure JWT authentication" },
            ].map((f) => (
              <li key={f.text} className="auth-feature">
                <span className="auth-feature-icon">{f.icon}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="auth-code-preview">
            <div className="code-preview-bar">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="code-preview-name">session.js</span>
            </div>
            <pre className="code-preview-body">{`const room = await createRoom({
  name: "My Project",
  lang: "javascript",
});
// ✅ Room ready — share the link!`}</pre>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className={`auth-card anim-fade-up ${shake ? "shake" : ""}`}>
          <h2 className="auth-card-title">Welcome back</h2>
          <p className="auth-card-sub">Sign in to your workspace</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-input ${errors.email ? "is-error" : ""}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange("email")}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-input ${errors.password ? "is-error" : ""}`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange("password")}
              />
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 28 }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in…
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>

          <p className="auth-demo-hint">
            💡 Demo: use any email + 6-char password
          </p>
        </div>
      </div>
    </div>
  );
}