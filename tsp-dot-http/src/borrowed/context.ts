// @ts-nocheck 

import { HttpServer, HttpService } from "@typespec/http";
import {
  Namespace,
  Program,
  Enum,
  Interface,
  isArrayModelType,
  isRecordModelType,
  Model,
  Scalar,
  Type,
  Union,
  UnionVariant
} from "@typespec/compiler";
import { OnceQueue } from "./once-queue.js";

/**
 * A partial union with a name for the given variants.
 */
export interface PartialUnionSynthetic {
  kind: "partialUnion";
  name: string;
  variants: UnionVariant[];
}
/**
 * A cursor that assists in navigating the module tree and computing relative
 * paths between modules.
 */
export interface PathCursor {
  /**
   * The path to this cursor. This is an array of strings that represents the
   * path from the root module to another module.
   */
  readonly path: string[];

  /**
   * The parent cursor of this cursor (equivalent to moving up one level in the
   * module tree). If this cursor is the root cursor, this property is `undefined`.
   */
  readonly parent: PathCursor | undefined;

  /**
   * Returns a new cursor that includes the given path components appended to
   * this cursor's path.
   *
   * @param path - the path to append to this cursor
   */
  enter(...path: string[]): PathCursor;

  /**
   * Computes a relative path from this cursor to another cursor, using the string `up`
   * to navigate upwards one level in the path. This is similar to `path.relative` when
   * working with file paths, but operates over PathCursor objects.
   *
   * @param to - the cursor to compute the path to
   * @param up - the string to use to move up a level in the path (defaults to "..")
   */
  relativePath(to: PathCursor, up?: string): string[];
}
/**
 * The type of a binding for an import statement. Either:
 *
 * - A string beginning with `* as` followed by the name of the binding, which
 *   imports all exports from the module as a single object.
 * - A binding name, which imports the default export of the module.
 * - An array of strings, each of which is a named import from the module.
 */
export type ImportBinder = string | string[];
/**
 * An object representing a ECMAScript module import declaration.
 */
export interface Import {
  /**
   * The binder to define the import as.
   */
  binder: ImportBinder;
  /**
   * Where to import from. This is either a literal string (which will be used verbatim), or Module object, which will
   * be resolved to a relative file path.
   */
  from: Module | string;
}
/**
 * An output module within the module tree.
 */
export interface Module {
  /**
   * The name of the module, which should be suitable for use as the basename of
   * a file and as an identifier.
   */
  name: string;
  /**
   * The cursor for the module, which assists navigation and relative path
   * computation between modules.
   */
  readonly cursor: PathCursor;

  /**
   * An optional namespace for the module. This is not used by the code writer,
   * but is used to track dependencies between TypeSpec namespaces and create
   * imports between them.
   */
  namespace?: Namespace;

  /**
   * A list of imports that the module requires.
   */
  imports: Import[];

  /**
   * A list of declarations within the module.
   */
  declarations: ModuleBodyDeclaration[];
}
/**
 * Compute the common prefix of two paths.
 */
function getCommonPrefix(a: string[], b: string[]): string[] {
  const prefix:string[] = [];

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      break;
    }

    const result: string = a[i] as string;

    prefix.push(result);
  }

  return prefix;
}

/**
 * Create a new cursor with the given path.
 *
 * @param base - the base path of this cursor
 * @returns
 */
export function createPathCursor(...base: string[]): PathCursor {
  const self: PathCursor = {
    path: base,

    get parent() {
      return self.path.length === 0 ? undefined : createPathCursor(...self.path.slice(0, -1));
    },

    enter(...path: string[]) {
      return createPathCursor(...self.path, ...path);
    },

    relativePath(to: PathCursor, up: string = ".."): string[] {
      const commonPrefix = getCommonPrefix(self.path, to.path);

      const outputPath = [];

      for (let i = 0; i < self.path.length - commonPrefix.length; i++) {
        outputPath.push(up);
      }

      outputPath.push(...to.path.slice(commonPrefix.length));

      return outputPath;
    },
  };

  return self;
}


/**
 * Creates a new module with the given name and attaches it to the parent module.
 *
 * Optionally, a namespace may be associated with the module. This namespace is
 * _NOT_ stored in the context (this function does not use the HttpContext), and
 * is only stored as metadata within the module. To associate a module with a
 * namespace inside the context, use `createOrGetModuleForNamespace`.
 *
 * The module is automatically declared as a declaration within its parent
 * module.
 *
 * @param name - The name of the module.
 * @param parent - The parent module to attach the new module to.
 * @param namespace - an optional TypeSpec Namespace to associate with the module
 * @returns the newly created module
 */
export function createModule(name: string, parent: Module, namespace?: Namespace): Module {
  const self = {
    name,
    cursor: parent.cursor.enter(name),
    namespace,

    imports: [],
    declarations: [],
  };

  parent.declarations.push(self);

  return self;
}
/**
 * A module that does not exist and is not emitted. Use this for functions that require a module but you only
 * want to analyze the type and not emit any relative paths.
 *
 * For example, this is used internally to canonicalize operation types, because it calls some functions that
 * require a module, but canonicalizing the operation does not itself emit any code.
 */
export const NoModule: Module = {
  name: "",
  cursor: createPathCursor(),
  imports: [],
  declarations: [],
};
/**
 * A declaration within a module. This may be a string (i.e. a line), an array of
 * strings (emitted as multiple lines), or another module (emitted as a nested module).
 */
export type ModuleBodyDeclaration = string[] | string | Module;
/**
 * A synthetic type that is not directly represented with a name in the TypeSpec program.
 */
export type Synthetic = AnonymousSynthetic | PartialUnionSynthetic;
/**
 * An ordinary, anonymous type that is given a name.
 */
export interface AnonymousSynthetic {
  kind: "anonymous";
  name: string;
  underlying: DeclarationType;
}
export interface HttpContext  {
  /**
   * The TypeSpec Program that this emitter instance operates over.
  */
  program?: Program;

  /**
   * The HTTP-level representation of the service.
   */
  httpService?: HttpService;
  /**
   * The root module for HTTP-specific code.
   */
  httpModule?: Module;
  /**
   * The server definitions of the service (\@server decorator)
   */
  servers?: HttpServer[];
  /**
   * A list of synthetic types (anonymous types that are given names) that are
   * included in the emit tree.
   */
  synthetics?: Synthetic[];
  /**
   * A cache of names given to synthetic types. These names may be used to avoid
   * emitting the same synthetic type multiple times.
   */
  syntheticNames?: Map<DeclarationType, string>;
  /**
   * A queue of all types to be included in the emit tree. This queue
   * automatically deduplicates types, so if a type is added multiple times it
   * will only be visited once.
   */
  typeQueue?: OnceQueue<DeclarationType>;
}
export type DeclarationType = Model | Enum | Union | Interface | Scalar;

/**
 * Determines whether or not a type is importable into a JavaScript module.
 *
 * i.e. whether or not it is declared as a named symbol within the module.
 *
 * In TypeScript, unions are rendered inline, so they are not ordinarily
 * considered importable.
 *
 * @param ctx - The JS emitter context.
 * @param t - the type to test
 * @returns `true` if the type is an importable declaration, `false` otherwise.
 */
export function isImportableType(ctx: HttpContext, t: Type): t is DeclarationType {

  if (!ctx.program) {
    throw new Error("UNREACHABLE: isImportableType called without a program in context");
  }

  return (
    (t.kind === "Model" &&
      !isArrayModelType(ctx.program, t) &&
      !isRecordModelType(ctx.program, t)) ||
    t.kind === "Enum" ||
    t.kind === "Interface"
  );
}