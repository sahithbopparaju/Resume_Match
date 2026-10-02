import { Download } from "lucide-react";

function TailoredResume({ tailoredResume }) {
  if (!tailoredResume) return null;

  const skills = tailoredResume.skills ?? [];
  const experience = tailoredResume.experience ?? [];
  const projects = tailoredResume.projects ?? [];
  const education = tailoredResume.education ?? [];
  const certifications = tailoredResume.certifications ?? [];
  const achievements = tailoredResume.achievements ?? [];

  const handleDownload = () => {
    window.print();
  };

  return (
    <section className="mt-8">
      {/* Preview controls - hidden when printing */}
      <div className="no-print mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Generated Resume
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            ATS-optimized resume based on your profile and target job.
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Download className="size-4" />
          Download PDF
        </button>
      </div>

      {/* Resume */}
      <div id="tailored-resume" className="resume-page">
        {/* Candidate Header */}
        <header className="resume-header">
          <h1>{tailoredResume.name || "Candidate Name"}</h1>

          {tailoredResume.contact && (
            <p className="resume-contact">
              {tailoredResume.contact}
            </p>
          )}
        </header>

        {/* Summary */}
        {tailoredResume.summary && (
          <ResumeSection title="PROFESSIONAL SUMMARY">
            <p className="resume-summary">
              {tailoredResume.summary}
            </p>
          </ResumeSection>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <ResumeSection title="SKILLS">
            <div className="skills-list">
              {skills.map((skill, index) => (
                <span key={index} className="skill-item">
                  {skill}
                </span>
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <ResumeSection title="EXPERIENCE">
            <div className="resume-items">
              {experience.map((item, index) => (
                <ResumeItem key={index} item={item} />
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <ResumeSection title="PROJECTS">
            <div className="resume-items">
              {projects.map((item, index) => (
                <ResumeItem key={index} item={item} />
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Education */}
        {education.length > 0 && (
          <ResumeSection title="EDUCATION">
            <div className="resume-items">
              {education.map((item, index) => (
                <ResumeItem key={index} item={item} />
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <ResumeSection title="CERTIFICATIONS">
            <div className="resume-items">
              {certifications.map((item, index) => (
                <ResumeItem key={index} item={item} />
              ))}
            </div>
          </ResumeSection>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <ResumeSection title="ACHIEVEMENTS">
            <div className="resume-items">
              {achievements.map((item, index) => (
                <ResumeItem key={index} item={item} />
              ))}
            </div>
          </ResumeSection>
        )}
      </div>
    </section>
  );
}

function ResumeSection({ title, children }) {
  return (
    <section className="resume-section">
      <div className="resume-section-heading">
        <h2>{title}</h2>
        <div />
      </div>

      {children}
    </section>
  );
}

function ResumeItem({ item }) {
  if (typeof item === "string") {
    return (
      <div className="resume-text-item">
        <span className="resume-bullet">•</span>
        <span>{item}</span>
      </div>
    );
  }

  const entries = Object.entries(item);

  return (
    <div className="resume-entry">
      {entries.map(([key, value], index) => {
        const formattedKey = key
          .replaceAll("_", " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase());

        const isTitle =
          index === 0 ||
          key.toLowerCase().includes("title") ||
          key.toLowerCase().includes("role") ||
          key.toLowerCase().includes("position") ||
          key.toLowerCase().includes("company");

        if (Array.isArray(value)) {
          return (
            <div key={key} className="resume-array">
              {value.map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="resume-text-item">
                  <span className="resume-bullet">•</span>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          );
        }

        return (
          <div
            key={key}
            className={isTitle ? "resume-entry-title" : "resume-entry-detail"}
          >
            {isTitle ? (
              <strong>{String(value)}</strong>
            ) : (
              <>
                <strong>{formattedKey}:</strong>{" "}
                {String(value)}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TailoredResume;