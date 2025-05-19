import { EmitContext, emitFile, resolvePath } from "@typespec/compiler";
import { getAllHttpServices, HttpOperation, HttpService } from "@typespec/http";
import { TspDotHttpOptions } from "./lib.js";

import path from "node:path";

export async function $onEmit(context: EmitContext<TspDotHttpOptions>) {
  const [httpServices] = getAllHttpServices(context.program);

  if (!context.program.compilerOptions.noEmit) {
    for (const service of httpServices) {
      await emitService(context, service, context.emitterOutputDir);
    }
  }
}

/**
 * Emits the .http files for a single HTTP service.
 *
 * @param context - The context of the emitter.
 * @param service - The HTTP service to emit.
 * @param baseOutputDir - The base output directory where the HTTP files should be emitted.
 */
async function emitService(
  context: EmitContext<TspDotHttpOptions>,
  service: HttpService,
  baseOutputDir: string
) {
  // We probably want a reasonable default for this.
  const serviceName = service.namespace.name;

  const outputDir = resolvePath(baseOutputDir, serviceName);

  // We will need to handle `service.authentication` somehow. For simple auth schemes we can just include the related
  // headers in the .http files. For more complex schemes like OAuth2 or OIDC there is some more research to do on how
  // to represent that.

  for (const operation of service.operations) {
    // TODO: this is very primitive since we're assuming all operations in the service are at the same namespace/interface
    // level of organization. What we probably want to do instead is find the path of containers from the service namespace
    // to the operation and use those to create a path for the file.
    const fileName = `${operation.operation.name}.http`;

    emitFile(context.program, {
      content: getHttpFile(context, service, operation),
      path: path.join(outputDir, fileName),
    });
  }
}

/**
 * Generates the content of the .http file for a given HTTP operation.
 *
 * @param context - The context of the emitter.
 * @param service - The HTTP service we are emitting.
 * @param operation - The HTTP operation we are emitting.
 * @returns The string contents of the .http file.
 */
function getHttpFile(
  context: EmitContext<TspDotHttpOptions>,
  service: HttpService,
  operation: HttpOperation
): string {
  // Generate the HTTP file content here.
  return `### ${operation.operation.name}`;
}
