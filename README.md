# tsp-dot-http

This is an example emitter for TypeSpec that generates `.http` files, which can be used with IDE REST Client extensions (such as the built-in HTTP client in VS Code).

The goal of this project is to serve as a minimal example of how to implement a custom emitter for TypeSpec.

## What it does

Given a TypeSpec service definition, this emitter will generate basic `.http` request files for each operation. These files can be opened and executed directly in an editor that supports REST client features.

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
