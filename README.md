# tsp-dot-http

This is a sample TypeSpec emitter that demonstrates how to build a custom emitter for TypeSpec. It generates `.http` files from TypeSpec service definitions, which can be used with IDE REST Client extensions (such as the built-in HTTP client in VS Code).

## Purpose

This project serves as a **learning example** that shows:
- How to structure a TypeSpec emitter
- How to read and process TypeSpec definitions 
- How to generate output files based on TypeSpec models and operations
- How to handle JSON body generation for HTTP requests

## Architecture

The emitter uses a standard TypeSpec emitter structure with boilerplate code to read TSP definitions. The real "work" happens in the `http-file` directory:

- **`src/emitter/`** - Contains the main emitter logic and boilerplate code for processing TypeSpec definitions
- **`src/http-file/`** - **The core implementation** where HTTP files are constructed:
  - `fileGenerator.ts` - Main logic for generating `.http` files from TypeSpec operations
  - `jsonBody.ts` - Handles generation of sample JSON request bodies based on TypeSpec models
- **`src/borrowed/`** - Utility functions borrowed from other TypeSpec projects for common operations

## What it does

Given a TypeSpec service definition, this emitter will:
1. Parse TypeSpec operations and models
2. Generate individual `.http` request files for each operation
3. Create sample JSON bodies for POST/PUT/PATCH requests
4. Include proper HTTP headers and URL structure

The generated files can be opened and executed directly in editors that support REST client features.

## Usage

Install the package locally or globally, then reference it in your `tspconfig.yaml`:

```yaml
emit:
  - "tsp-dot-http"
```

Run the TypeSpec compiler:

```bash
tsp compile .
```

Output will be written to the specified `output-path` (default is `./http`).

## License

MIT
