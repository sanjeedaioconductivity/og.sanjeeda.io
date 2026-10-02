"use client";

import { useEffect, useState } from "react";

/**
 * Portal profile photo (candidate or mentor).
 *
 * The image is stored once in GridFS — see
 * src/app/api/pgp-candidate/profile-image/route.ts and
 * src/app/api/pgp-mentor/profile-image/route.ts — and addressed purely by the
 * person's email, so no schema change is needed to surface it anywhere an email
 * is already known. If there is no photo (or it fails to load) it falls back to
 * the person's initials.
 *
 * `CandidateAvatar` (default export) and `MentorAvatar` are thin wrappers that
 * point at their respective upload endpoints.
 */

function initials(name?: string, email?: string) {
  const source = (name || email || "").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

type BaseProps = {
  email?: string;
  name?: string;
  size?: number;
  className?: string;
  /** Bump to force a re-fetch after a new photo is uploaded. */
  version?: number | string;
};

function PortalAvatar({
  endpoint,
  email,
  name,
  size = 32,
  className = "",
  version,
}: BaseProps & { endpoint: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [email, version]);

  const dimension = { width: size, height: size } as const;
  const showImage = Boolean(email) && !failed;

  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-200 ${className}`}
      style={dimension}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${endpoint}?email=${encodeURIComponent(email as string)}${
            version ? `&v=${encodeURIComponent(String(version))}` : ""
          }`}
          alt={name || "Profile"}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-black leading-none"
          style={{ fontSize: Math.max(10, Math.round(size * 0.4)) }}
        >
          {initials(name, email)}
        </span>
      )}
    </span>
  );
}

export default function CandidateAvatar(props: BaseProps) {
  return (
    <PortalAvatar endpoint="/api/pgp-candidate/profile-image" {...props} />
  );
}

export function MentorAvatar(props: BaseProps) {
  return <PortalAvatar endpoint="/api/pgp-mentor/profile-image" {...props} />;
}
