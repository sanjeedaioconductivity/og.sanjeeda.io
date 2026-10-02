import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray package-lock.json in the
  // home directory otherwise makes Next infer the wrong root.
  turbopack: {
    root: import.meta.dirname,
  },
  async redirects() {
    return [
      // The PGP "Management Portal" became the PGP admin area, gated on the
      // portal role. Old bookmarks land on the new gate, which sends anyone
      // without the role to sign-in.
      { source: "/management", destination: "/pgp-admin", permanent: true },
      // The dashboard moved up to the area's index (there is no login page to
      // sit in front of it any more); its sub-pages keep their segments.
      { source: "/management/dashboard", destination: "/pgp-admin", permanent: true },
      { source: "/management/:path*", destination: "/pgp-admin/:path*", permanent: true },
      // The separate candidate and mentor sign-in pages merged into one form
      // at /pgp-access that asks which portal you want; the role is carried
      // over so old links land on the right one.
      { source: "/candidate", destination: "/pgp-access?role=candidate", permanent: true },
      { source: "/mentor", destination: "/pgp-access?role=mentor", permanent: true },
    ];
  },
};

export default nextConfig;
