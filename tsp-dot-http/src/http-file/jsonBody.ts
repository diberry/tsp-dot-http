import { HttpContext } from "../borrowed/context.js";
import { HttpOperation } from "@typespec/http";
import { parseCase } from "../borrowed/case.js";
import { getAllProperties } from "../borrowed/extends.js";

export class JsonBodyGenerator {
  static processBody(context: HttpContext, operation: HttpOperation): string | undefined {
    const bodyModel = operation.parameters.body;
    if (!bodyModel) {
      return "// No body model found for this request";
    }
    if (bodyModel.bodyKind !== "single") {
      return "// File body or multipart body found, not supported yet";
    }
    const DEFAULT_CONTENT_TYPE = "application/json";
    const bodyFields = operation.parameters.body && operation.parameters.body.type.kind === "Model"
      ? getAllProperties(operation.parameters.body.type).map((p) => [p.name, p.type] as const)
      : [];
    if (operation.parameters.body) {
      const body = operation.parameters.body;
      const contentType: string = body.contentTypes[0] ?? DEFAULT_CONTENT_TYPE;
      const bodyContentTypes = [
        "application/json",
        "application/merge-patch+json"
      ];
      const fakeData = {
        "string": "example",
        "number": 123,
        "boolean": true,
        "array": [1, 2, 3],
        "object": { "key": "value" },
        "int8": 42,
        "int16": 42,
        "int32": 42,
        "int64": 42,
        "uint8": 42,
        "uint16": 42,
        "uint32": 42,
        "uint64": 42,
        "float32": 3.14,
        "float64": 3.14159,
        "decimal": 99.99,
        "safeint": 9007199254740991,
        "bytes": "aGVsbG8=",
        "date": "2024-01-01",
        "datetime": "2024-01-01T12:00:00Z",
        "duration": "P1DT2H3M4S",
        "guid": "123e4567-e89b-12d3-a456-426614174000",
      };
      if (bodyContentTypes.includes(contentType) || !contentType) {
        const lines: string[] = [];
        lines.push("// JSON body");
        lines.push("{");
        bodyFields.forEach(([name, type]) => {
          const nameCase = parseCase(name);
          const value = `null`;
          const isScalar = type.kind === "Scalar";
          const scalarType = type["kind"];
          const typeName = type["name"];

          // Handle union types (e.g., color: "red" | "blue")
          if (type.kind === "Union") {
            // Only include variants with a defined value (string literal unions)
            const unionValues = Array.from(type.variants)
              .map((variant: unknown) => {
                const v = variant as { type?: { value?: string; name?: string } };
                const variantItem = v[1];
                const variantItemValue = variantItem.type.value;
                return variantItemValue;
              })
            // Use the first value as a sample
            lines.push(` "${nameCase.camelCase}": ${JSON.stringify(unionValues[0])}, // Union type: ${unionValues.join(" | ")}`);
            return;
          }

          switch (isScalar && typeName) {
            case "string":
              lines.push(` "${nameCase.camelCase}": "${fakeData.string}", // ${scalarType} ${typeName}`);
              break;
            case "int8":
            case "int16":
            case "int32":
            case "int64":
            case "uint8":
            case "uint16":
            case "uint32":
            case "uint64":
            case "float32":
            case "float64":
            case "decimal":
            case "safeint":
            case "number":
              lines.push(` "${nameCase.camelCase}": ${fakeData[typeName] ?? fakeData.number}, // ${scalarType} ${typeName}`);
              break;
            case "boolean":
              lines.push(`  "${nameCase.camelCase}": ${fakeData.boolean}, // ${scalarType} ${typeName}`);
              break;
            case "bytes":
              lines.push(`  "${nameCase.camelCase}": "${fakeData.bytes}", // ${scalarType} ${typeName}`);
              break;
            case "date":
              lines.push(`  "${nameCase.camelCase}": "${fakeData.date}", // ${scalarType} ${typeName}`);
              break;
            case "datetime":
              lines.push(`  "${nameCase.camelCase}": "${fakeData.datetime}", // ${scalarType} ${typeName}`);
              break;
            case "duration":
              lines.push(`  "${nameCase.camelCase}": "${fakeData.duration}", // ${scalarType} ${typeName}`);
              break;
            case "guid":
              lines.push(`  "${nameCase.camelCase}": "${fakeData.guid}", // ${scalarType} ${typeName}`);
              break;
            case "array":
              lines.push(`  "${nameCase.camelCase}": [], // ${scalarType} ${typeName}`);
              break;
            case "object":
              lines.push(`  "${nameCase.camelCase}": {}, // ${scalarType} ${typeName}`);
              break;
            default:
              lines.push(`  "${nameCase.camelCase}": ${value}, // Unknown type: ${scalarType} ${typeName}`);
              break;
          }
        });
        lines.push("}");
        return lines.join("\n");
      }
    }
    return undefined;
  }
}
