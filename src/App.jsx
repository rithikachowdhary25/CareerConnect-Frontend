
import { useEffect, useState } from "react";
import api from "./api";
import "./App.css";

export default function App() {
  const [page, setPage] = useState("home");
  const [authPage, setAuthPage] = useState("login");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [message, setMessage] = useState("");
  const [resumeLink, setResumeLink] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "Internship",
    salary: "",
    description: "",
  });

  const loadJobs = async () => {
    try {
      const response = await api.get("/jobs");
      setJobs(response.data);
    } catch {
      setMessage("Unable to load jobs. Check the backend.");
    }
  };

  const loadStudentApplications = async () => {
    if (!user?.email) return;
    try {
      const response = await api.get(
        `/applications/student/${encodeURIComponent(user.email)}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setApplications(response.data);
    } catch {
      setMessage("Unable to load your applications.");
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      loadStudentApplications();
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage("Please wait...");
    try {
      const endpoint =
        authPage === "register" ? "/auth/register" : "/auth/login";
      const response = await api.post(endpoint, form);
      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      setUser(data);
      setPage("dashboard");
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Authentication failed. Check your details."
      );
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("home");
    setApplications([]);
    setMessage("");
  };

  const postJob = async (e) => {
    e.preventDefault();
    setMessage("Posting job...");
    try {
      await api.post("/jobs", jobForm, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setJobForm({
        title: "",
        company: "",
        location: "",
        type: "Internship",
        salary: "",
        description: "",
      });
      setMessage("Job posted successfully!");
      await loadJobs();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Unable to post job."
      );
    }
  };

  const applyForJob = async (job) => {
    if (!user) {
      setAuthPage("login");
      setPage("auth");
      setMessage("Please log in as a student to apply.");
      return;
    }

    if (user.role !== "STUDENT") {
      setMessage("Only student accounts can apply for jobs.");
      return;
    }

    try {
      await api.post(
        `/applications/${job.id}`,
        {
          studentName: user.name,
          studentEmail: user.email,
          resumeLink,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setMessage(`Application submitted for ${job.title}!`);
      await loadStudentApplications();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Could not submit application. You may have already applied."
      );
    }
  };

  const loadJobApplications = async (jobId) => {
    try {
      const response = await api.get(
        `/applications/job/${jobId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setApplications(response.data);
      setMessage("");
    } catch {
      setMessage("Unable to load applicants.");
    }
  };

  const updateApplicationStatus = async (id, status) => {
    try {
      await api.put(
        `/applications/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setApplications((previous) =>
        previous.map((app) =>
          app.id === id ? { ...app, status } : app
        )
      );
      setMessage("Application status updated.");
    } catch {
      setMessage("Unable to update application status.");
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const text =
      `${job.title} ${job.company} ${job.location}`.toLowerCase();
    return (
      text.includes(search.toLowerCase()) &&
      (typeFilter === "All" || job.type === typeFilter)
    );
  });

  const goToJobs = () => {
    setPage("jobs");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app">
      <header className="navbar">
        <button className="brand" onClick={() => setPage("home")}>
          <span className="brand-icon">C</span>
          CareerConnect
        </button>

        <nav>
          <button onClick={() => setPage("home")}>Home</button>
          <button onClick={goToJobs}>Find Jobs</button>
          {user && (
            <button onClick={() => setPage("dashboard")}>
              Dashboard
            </button>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <button className="primary-btn" onClick={logout}>Logout</button>
          ) : (
            <>
              <button className="text-btn" onClick={() => {
                setAuthPage("login");
                setPage("auth");
                setMessage("");
              }}>Login</button>
              <button className="primary-btn" onClick={() => {
                setAuthPage("register");
                setPage("auth");
                setMessage("");
              }}>Get Started</button>
            </>
          )}
        </div>
      </header>

      {page === "home" && (
        <>
          <section className="hero">
            <div className="hero-content">
              <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
              <h1>Find work that<br /><span>moves you forward.</span></h1>
              <p>
                Discover jobs and internships, connect with employers,
                and take the next step in your career.
              </p>
              <div className="hero-search">
                <input
                  placeholder="Job title, company or location"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="primary-btn" onClick={goToJobs}>
                  Search Jobs
                </button>
              </div>
              <div className="hero-note">
                <span>✓</span> Opportunities for students and graduates
              </div>
            </div>

            <div className="hero-art">
              <div className="art-card art-main">
                <div className="art-symbol">✦</div>
                <p>YOUR CAREER, YOUR FUTURE</p>
                <h2>Make your next move count.</h2>
                <div className="art-line" />
                <div className="art-line short" />
                <div className="art-pill">Explore opportunities ↗</div>
              </div>
              <div className="floating-card">
                <span className="floating-icon">↗</span>
                <div>
                  <strong>{jobs.length} opportunities</strong>
                  <p>Explore available jobs</p>
                </div>
              </div>
            </div>
          </section>

          <section className="stats">
            <div><strong>{jobs.length}+</strong><span>Listed opportunities</span></div>
            <div><strong>2</strong><span>Account types</span></div>
            <div><strong>1</strong><span>Place to get started</span></div>
          </section>

          <section className="section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">HANDPICKED FOR YOUR JOURNEY</span>
                <h2>Explore opportunities</h2>
                <p>Discover roles that fit your goals and interests.</p>
              </div>
              <button className="outline-btn" onClick={goToJobs}>View all jobs →</button>
            </div>
            <JobList
              jobs={jobs.slice(0, 3)}
              user={user}
              applyForJob={applyForJob}
              appliedIds={applications.map((app) => app.jobId)}
            />
          </section>

          <section className="features-section">
            <div className="section-heading centered">
              <span className="eyebrow">BUILT FOR YOUR NEXT STEP</span>
              <h2>Everything you need to get moving</h2>
            </div>
            <div className="feature-grid">
              <Feature icon="⌕" title="Discover jobs" text="Search job and internship listings in one place." />
              <Feature icon="↗" title="Grow your career" text="Find opportunities that help you build real skills." />
              <Feature icon="◎" title="Connect with employers" text="Recruiters can share openings and manage listings." />
            </div>
          </section>
        </>
      )}

      {page === "jobs" && (
        <section className="section page-section">
          <span className="eyebrow">YOUR NEXT OPPORTUNITY</span>
          <h1>Find your next role</h1>
          <p>Search available jobs and internships.</p>
          <div className="filter-bar">
            <input
              placeholder="Search by title, company or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option>All</option>
              <option>Internship</option>
              <option>Full-time</option>
              <option>Part-time</option>
            </select>
          </div>
          <JobList
            jobs={filteredJobs}
            user={user}
            applyForJob={applyForJob}
            appliedIds={applications.map((app) => app.jobId)}
          />
          {filteredJobs.length === 0 && (
            <p className="empty-state">No matching jobs found.</p>
          )}
          {message && <p className="status-message">{message}</p>}
          {user?.role === "STUDENT" && (
            <div className="resume-box">
              <label>Resume link (optional)</label>
              <input
                placeholder="Paste a link to your resume"
                value={resumeLink}
                onChange={(e) => setResumeLink(e.target.value)}
              />
              <p>Provide a shareable link if you want to include your resume.</p>
            </div>
          )}
        </section>
      )}

      {page === "auth" && (
        <section className="auth-layout">
          <div className="auth-intro">
            <span className="eyebrow">WELCOME TO CAREERCONNECT</span>
            <h1>Your future is closer than you think.</h1>
            <p>Sign in or create an account to explore career opportunities.</p>
          </div>
          <div className="auth-card">
            <div className="auth-tabs">
              <button className={authPage === "login" ? "active" : ""} onClick={() => {
                setAuthPage("login");
                setMessage("");
              }}>Login</button>
              <button className={authPage === "register" ? "active" : ""} onClick={() => {
                setAuthPage("register");
                setMessage("");
              }}>Register</button>
            </div>
            <h2>{authPage === "login" ? "Welcome back" : "Create your account"}</h2>
            <p className="muted">Enter your details to continue.</p>
            <form onSubmit={handleAuth}>
              {authPage === "register" && (
                <>
                  <label>Full name</label>
                  <input placeholder="Your full name" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  <label>Account type</label>
                  <select value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="STUDENT">Student</option>
                    <option value="RECRUITER">Recruiter</option>
                  </select>
                </>
              )}
              <label>Email address</label>
              <input type="email" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <label>Password</label>
              <input type="password" placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={authPage === "register" ? 8 : undefined} required />
              <button className="primary-btn full-btn" type="submit">
                {authPage === "login" ? "Login to account" : "Create account"}
              </button>
            </form>
            {message && <p className="status-message">{message}</p>}
          </div>
        </section>
      )}

      {page === "dashboard" && user && (
        <section className="section page-section">
          <span className="eyebrow">YOUR CAREER SPACE</span>
          <h1>Welcome, {user.name}</h1>
          <p>{user.email} · {user.role}</p>
          <div className="dashboard-summary">
            <div><span>Account type</span><strong>{user.role}</strong></div>
            <div><span>Available jobs</span><strong>{jobs.length}</strong></div>
          </div>

          {user.role === "RECRUITER" && (
            <>
              <div className="auth-card recruiter-form">
                <h2>Post a job or internship</h2>
                <form onSubmit={postJob}>
                  <label>Job title</label>
                  <input placeholder="Software Developer Intern" value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required />
                  <label>Company</label>
                  <input placeholder="Company name" value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })} required />
                  <label>Location</label>
                  <input placeholder="Hyderabad" value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} required />
                  <label>Employment type</label>
                  <select value={jobForm.type}
                    onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}>
                    <option>Internship</option>
                    <option>Full-time</option>
                    <option>Part-time</option>
                  </select>
                  <label>Salary / stipend</label>
                  <input placeholder="₹15,000/month" value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })} />
                  <label>Description</label>
                  <textarea placeholder="Describe the role and requirements"
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} required />
                  <button className="primary-btn" type="submit">Publish job</button>
                </form>
                {message && <p className="status-message">{message}</p>}
              </div>

              <h2>Your job listings</h2>
              <div className="job-grid">
                {jobs.map((job) => (
                  <article className="job-card" key={job.id}>
                    <h3>{job.title}</h3>
                    <p>{job.company} · {job.location}</p>
                    <button className="outline-btn" onClick={() => loadJobApplications(job.id)}>
                      View applicants
                    </button>
                  </article>
                ))}
              </div>

              <h2>Applicants</h2>
              {applications.length === 0 && (
                <p className="empty-state">Choose a job above to view its applicants.</p>
              )}
              {applications.map((app) => (
                <article className="job-card" key={app.id}>
                  <h3>{app.studentName}</h3>
                  <p>{app.studentEmail}</p>
                  <p>Applied for: {app.jobTitle}</p>
                  {app.resumeLink && (
                    <p><a href={app.resumeLink} target="_blank" rel="noreferrer">View resume</a></p>
                  )}
                  <p>Status: {app.status}</p>
                  <select value={app.status}
                    onChange={(e) => updateApplicationStatus(app.id, e.target.value)}>
                    <option value="PENDING">Pending</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </article>
              ))}
            </>
          )}

          {user.role === "STUDENT" && (
            <>
              <div className="resume-box">
                <label>Resume link (optional)</label>
                <input placeholder="Paste a shareable resume link"
                  value={resumeLink} onChange={(e) => setResumeLink(e.target.value)} />
              </div>
              <h2>Your applications</h2>
              {applications.length === 0 && (
                <p className="empty-state">You haven't applied to any jobs yet.</p>
              )}
              {applications.map((app) => (
                <article className="job-card" key={app.id}>
                  <h3>{app.jobTitle}</h3>
                  <p>{app.company}</p>
                  <p>Application status: <strong>{app.status}</strong></p>
                </article>
              ))}
              <h2>Explore jobs</h2>
              <JobList jobs={jobs} user={user} applyForJob={applyForJob}
                appliedIds={applications.map((app) => app.jobId)} />
            </>
          )}
          {message && <p className="status-message">{message}</p>}
        </section>
      )}

      <footer className="footer">
        <button className="brand footer-brand" onClick={() => setPage("home")}>
          <span className="brand-icon">C</span> CareerConnect
        </button>
        <p>Helping you take the next step in your career.</p>
        <span>© 2026 CareerConnect</span>
      </footer>
    </div>
  );
}

function JobList({ jobs, user, applyForJob, appliedIds = [] }) {
  if (!jobs.length) {
    return <div className="empty-state">No jobs available yet. Check back soon!</div>;
  }

  return (
    <div className="job-grid">
      {jobs.map((job) => {
        const alreadyApplied = appliedIds.includes(job.id);
        return (
          <article className="job-card" key={job.id}>
            <div className="job-icon">✦</div>
            <span className="job-type">{job.type || "Opportunity"}</span>
            <h3>{job.title}</h3>
            <p className="company-name">{job.company}</p>
            <p className="job-meta">⌖ {job.location || "Location not specified"}</p>
            <p className="job-description">{job.description}</p>
            <div className="job-bottom">
              <strong>{job.salary || "Salary not specified"}</strong>
              {user?.role === "STUDENT" ? (
                <button disabled={alreadyApplied}
                  onClick={() => applyForJob(job)}>
                  {alreadyApplied ? "Applied ✓" : "Apply →"}
                </button>
              ) : (
                <span>{user ? "Recruiter account" : "Sign in to apply"}</span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <article className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}
