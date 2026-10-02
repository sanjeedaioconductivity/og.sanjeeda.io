// swagger-ui-react ships no bundled type declarations, so tsc treats its
// default import as an implicit `any`. This ambient module gives it a minimal
// but accurate type for the props we use on the /api-docs page.
declare module "swagger-ui-react" {
  import type { ComponentType } from "react";

  interface SwaggerUIProps {
    /** URL to a served OpenAPI document (e.g. /openapi.yaml). */
    url?: string;
    /** Inline OpenAPI spec object, as an alternative to `url`. */
    spec?: object;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    [key: string]: unknown;
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
