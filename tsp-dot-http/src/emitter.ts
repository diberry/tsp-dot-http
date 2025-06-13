import { EmitContext, emitFile, resolvePath } from "@typespec/compiler";
import { getAllHttpServices, HttpOperation, HttpService } from "@typespec/http";
import { TspDotHttpOptions } from "./tspDotHttpLib.js";
import { HttpFileGenerator, extractPathParams } from "../http-file/fileGenerator.js";
import { HttpContext } from "../borrowed/context.js";

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
    const fileName = `${operation.container.name.toLowerCase()}_${operation.operation.name}_${operation.verb}.http`;

    emitFile(context.program, {
      content: await getHttpFile(context, service, operation),
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
async function getHttpFile(
  context: EmitContext<TspDotHttpOptions>,
  service: HttpService,
  operation: HttpOperation
): Promise<string> {

  const httpContext: HttpContext = {};

  const operationName = operation.operation.name;
  const verb = operation.verb?.toUpperCase() || "GET";
  const path = operation.path || "/";

  const generator = new HttpFileGenerator();

  // Extract parameters from the path and query parameters
  const pathParams = extractPathParams(path);

  // Add path and query parameters
  generator.addPathParams(pathParams);
  generator.addQueryParams(operation.parameters);

  // Set request line
  generator.setRequestLine(verb, path);

  // Add headers
  generator.addHeaders(verb, service);

  // Set body
  generator.setBody(httpContext, verb, operation);

  // Generate the final file content
  return generator.generateFile(operationName);
}