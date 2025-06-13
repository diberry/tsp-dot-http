import { createTypeSpecLibrary, JSONSchemaType } from "@typespec/compiler";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TspDotHttpOptions {}

export const optionsSchema: JSONSchemaType<TspDotHttpOptions> = {
  type: "object",
};

export const $lib = createTypeSpecLibrary({
  name: "tsp-dot-http",
  diagnostics: {},
  emitter: {
    options: optionsSchema,
  },
});

export const { reportDiagnostic, createDiagnostic } = $lib;
