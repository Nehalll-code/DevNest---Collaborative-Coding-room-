import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.trim().length < 2) e.name = "At least 2 characters";

    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email address";

    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";

    if (!form.confirm) e.confirm = "Please confirm your password";
    else if (form.confirm !== form.password) e.confirm = "Passwords don't match";

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
    await new Promise((r) => setTimeout(r, 1000));

    login({ name: form.name.trim(), email: form.email });
    navigate("/dashboard");
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ff6b6b", "#ffd93d", "#4da6ff", "#3ddc84"][strength];

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
            Join thousands of<br />
            <span className="auth-headline-accent">developers.</span>
          </h1>
          <p className="auth-sub">
            Create your free account and start collaborating on code with your
            team in seconds.
          </p>

          <div className="auth-stats">
            {[
              { value: "10K+", label: "Active Rooms" },
              { value: "50K+", label: "Developers" },
              { value: "99.9%", label: "Uptime" },
            ].map((s) => (
              <div key={s.label} className="auth-stat">
                <div className="auth-stat-value">{s.value}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="auth-quote">
            <div className="auth-quote-text">
              "DevNest completely changed how our team does pair programming."
            </div>
            <div className="auth-quote-author">— Sarah K., Senior Engineer</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className={`auth-card anim-fade-up ${shake ? "shake" : ""}`}>
          <h2 className="auth-card-title">Create account</h2>
          <p className="auth-card-sub">Get started for free — no credit card needed</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className={`form-input ${errors.name ? "is-error" : ""}`}
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange("name")}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
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

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-input ${errors.password ? "is-error" : ""}`}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange("password")}
              />
              {form.password && (
                <div className="strength-bar">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="strength-segment"
                      style={{ background: i <= strength ? strengthColor : "var(--border)" }}
                    />
                  ))}
                  {strengthLabel && (
                    <span className="strength-label" style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  )}
                </div>
              )}
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className={`form-input ${errors.confirm ? "is-error" : ""}`}
                placeholder="••••••••"
                value={form.confirm}
                onChange={handleChange("confirm")}
              />
              {errors.confirm && <span className="form-error">{errors.confirm}</span>}
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
                  Creating account…
                </>
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          <div className="divider" />

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}