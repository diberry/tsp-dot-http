import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const TspDotHttpTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "tsp-dot-http",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
