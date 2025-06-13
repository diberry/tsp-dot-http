import { HttpOperation, HttpService } from "@typespec/http";
import { HttpContext } from "../borrowed/context.js";
import { JsonBodyGenerator } from "./jsonBody.js";

export class HttpFileGenerator {
  private variables: string[] = [];
  private headers: string[] = [];
  private body: string[] = [];
  private requestLine: string = "";

  constructor() {
    this.initializeDefaultVariables();
  }

  private initializeDefaultVariables() {
    this.variables.push(
      "// Variables section - defines variables to use in the request",
      "@host = localhost",
      "@port = 8080",
      "@baseUrl = http://{{host}}{{#if port}}:{{port}}{{/if}}"
    );
  }

  public addPathParams(pathParams: string[]) {
    if (pathParams.length > 0) {
      this.variables.push("", "// Path parameters");
      pathParams.forEach(param => {
        this.variables.push(`@${param} = REPLACE_WITH_${param.toUpperCase()}_VALUE`);
      });
    }
  }

  public addQueryParams(parameters: HttpOperation["parameters"] | undefined) {
    if (!parameters || !("query" in parameters)) return;

    const queryParams = parameters.query as { name: string }[];
    if (queryParams.length > 0) {
      this.variables.push("", "// Query parameters");
      queryParams.forEach((param: { name: string }) => {
        this.variables.push(`@${param.name} = REPLACE_WITH_${param.name.toUpperCase()}_VALUE`);
      });
    }
  }

  public setRequestLine(verb: string, path: string) {
    let requestUrl = path;
    const pathParams = this.variables
      .filter(v => v.startsWith("@") && v.includes("REPLACE_WITH"))
      .map(v => v.match(/@(\w+)/)?.[1])
      .filter(Boolean) as string[];

    pathParams.forEach(param => {
      requestUrl = requestUrl.replace(`{${param}}`, `{{${param}}}`);
    });

    const queryParams = this.variables
      .filter(v => v.startsWith("@") && v.includes("REPLACE_WITH") && !pathParams.includes(v.match(/@(\w+)/)?.[1] || ""))
      .map(v => v.match(/@(\w+)/)?.[1])
      .filter(Boolean) as string[];

    if (queryParams.length > 0) {
      requestUrl += "?";
      requestUrl += queryParams.map(p => `${p}={{${p}}}`).join("&");
    }

    this.requestLine = `${verb} {{baseUrl}}${requestUrl}`;
  }

  public addHeaders(verb: string, service: HttpService) {
    const acceptsBody = ["POST", "PUT", "PATCH"].includes(verb);
    if (acceptsBody) {
      this.headers.push("Content-Type: application/json");
    }

    if (service.authentication) {
      this.headers.push("Authorization: Bearer {{authToken}}");
      this.variables.push("", "// Authentication", "@authToken = REPLACE_WITH_YOUR_AUTH_TOKEN");
    }
  }

  /// Set the body of the request based on the operation
  /// and the HTTP verb.
  public setBody(context: HttpContext, verb: string, operation: HttpOperation): unknown {
    const acceptsBody = ["POST", "PUT", "PATCH"].includes(verb);

    if (!acceptsBody) {
      this.body.push("// No body allowed for this request method");
      return;
    }

    if (operation.parameters.body) {
      const bodyResult = JsonBodyGenerator.processBody(context, operation);
      this.body.push(bodyResult || '');
    } else {
      this.body.push("// No body model found for this request");
    }
  }

  public generateFile(operationName: string): string {
    return [
      `### ${operationName}`,
      "",
      ...this.variables,
      "",
      this.requestLine,
      ...this.headers,
      "",
      ...this.body
    ].join("\n");
  }
}

export function extractPathParams(path: string): string[] {
  const paramRegex = /{([^}]+)}/g;
  const params: string[] = [];
  let match;

  while ((match = paramRegex.exec(path)) !== null) {
    params.push(match[1]);
  }

  return params;
}
