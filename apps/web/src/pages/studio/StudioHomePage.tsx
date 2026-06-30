import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { JalProjectPublic } from "@vendo/shared";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { GoogleIcon, googleAuthStartUrl } from "../../lib/google-auth";
import { StudioNexus } from "../../components/studio/StudioNexus";
import {
  StudioLoading,
  StudioMain,
  StudioPageHeader,
  StudioShell,
} from "../../components/studio/StudioUI";

export function StudioHomePage() {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<JalProjectPublic[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      setFetching(false);
      return;
    }
    api.studioListProjects()
      .then(({ projects: list }) => setProjects(list))
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || fetching) {
    return (
      <StudioShell>
        <StudioLoading label="Waking the river…" />
      </StudioShell>
    );
  }

  if (!user) {
    return (
      <StudioShell>
        <StudioMain wide>
          <StudioNexus projects={[]} />
          <div className="mt-8 text-center">
            <a
              href={googleAuthStartUrl({ redirect: "/studio" })}
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-bold"
            >
              <GoogleIcon size={18} />
              Sign in to pour your repo
            </a>
          </div>
        </StudioMain>
      </StudioShell>
    );
  }

  return (
    <StudioShell>
      <StudioMain wide>
        {projects.length > 0 && (
          <StudioPageHeader
            eyebrow="Command center"
            title="Feedback river"
            subtitle="Every project is a tributary — customer droplets in, merged PRs out."
            action={
              <Link to="/studio/onboard" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold">
                + New tributary
              </Link>
            }
          />
        )}
        <StudioNexus projects={projects} />
      </StudioMain>
    </StudioShell>
  );
}

export function StudioAuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <StudioShell>
        <StudioLoading />
      </StudioShell>
    );
  }
  if (!user) return <Navigate to="/studio" replace />;
  return children;
}
