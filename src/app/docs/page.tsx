"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

// The contract's canonical location, per the Sprint 8 handoff §3 ("/docs mounts
// swagger-ui-react"). /api-docs stays mounted alongside it so links handed out
// during Sprints 5–7 don't break.
export default function Docs() {
  return <SwaggerUI url="/openapi.yaml" />;
}
