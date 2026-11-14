import { readFileSync } from 'node:fs';

/**
 * Minimal, dependency-free validator for the JSON Schema (2020-12) subset used
 * by schemas/case.v1.schema.json. It is STRICT about the schema itself: any
 * keyword outside SUPPORTED throws, so the schema can never silently contain
 * constraints this validator ignores. The schema file is standard, so a full
 * validator (e.g. Ajv) can replace this module without schema changes.
 *
 * Semantic rules JSON Schema cannot express (unique ids, reference integrity,
 * derivation cycles/depth) live in validate.js.
 */
const ANNOTATIONS = new Set(['$schema', '$id', 'title', '$defs']);
const SUPPORTED = new Set([...ANNOTATIONS, 'type', 'const', 'enum', 'required', 'properties',
  'additionalProperties', 'items', 'maxItems', 'minItems', 'minLength', 'maxLength',
  'minimum', 'maximum', 'pattern', '$ref']);

export const SCHEMA_URL = new URL('../schemas/case.v1.schema.json', import.meta.url);
export const caseSchema = Object.freeze(JSON.parse(readFileSync(SCHEMA_URL, 'utf8')));

const compiled = new Map();
const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function checkSchemaNode(node, where) {
  if (!isPlain(node)) throw new Error(`schema ${where}: must be an object`);
  for (const k of Object.keys(node)) {
    if (!SUPPORTED.has(k)) throw new Error(`schema ${where}: unsupported keyword "${k}"`);
  }
}

function resolveRef(root, ref) {
  const m = /^#\/\$defs\/([A-Za-z0-9_-]+)$/.exec(ref);
  if (!m || !root.$defs || !own(root.$defs, m[1])) throw new Error(`schema: unresolvable $ref "${ref}"`);
  return root.$defs[m[1]];
}

function regexFor(pattern) {
  let re = compiled.get(pattern);
  if (!re) { re = new RegExp(pattern, 'u'); compiled.set(pattern, re); }
  return re;
}

const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

/**
 * Validate `data` against `schema`. Returns [{path, message}] (capped by maxIssues).
 * Recursion depth is bounded by the schema's nesting, not by the data.
 */
export function validateSchema(data, schema = caseSchema, { maxIssues = 100 } = {}) {
  const issues = [];
  const add = (path, message) => { if (issues.length < maxIssues) issues.push({ path, message }); };

  const visit = (node0, value, path) => {
    if (issues.length >= maxIssues) return;
    let node = node0;
    checkSchemaNode(node, path);
    if (own(node, '$ref')) { node = resolveRef(schema, node.$ref); checkSchemaNode(node, path); }

    if (own(node, 'const') && value !== node.const) return add(path, `must equal ${JSON.stringify(node.const)}`);
    if (own(node, 'enum') && !node.enum.includes(value)) return add(path, `must be one of ${node.enum.map((x) => JSON.stringify(x)).join(', ')}`);
    if (own(node, 'type')) {
      const t = typeOf(value);
      const ok = node.type === 'number' ? t === 'number' && Number.isFinite(value) : t === node.type;
      if (!ok) return add(path, `must be of type ${node.type}`);
    }
    const t = typeOf(value);
    if (t === 'string') {
      if (own(node, 'minLength') && value.length < node.minLength) add(path, node.minLength === 1 ? 'must be a non-empty string' : `must have at least ${node.minLength} characters`);
      if (own(node, 'maxLength') && value.length > node.maxLength) add(path, `exceeds ${node.maxLength} characters`);
      if (own(node, 'pattern') && !regexFor(node.pattern).test(value)) add(path, `does not match required pattern ${node.pattern}`);
    } else if (t === 'number') {
      if (own(node, 'minimum') && value < node.minimum) add(path, `must be >= ${node.minimum}`);
      if (own(node, 'maximum') && value > node.maximum) add(path, `must be <= ${node.maximum}`);
    } else if (t === 'array') {
      if (own(node, 'maxItems') && value.length > node.maxItems) return add(path, `exceeds limit of ${node.maxItems} items`);
      if (own(node, 'minItems') && value.length < node.minItems) add(path, `needs at least ${node.minItems} items`);
      if (own(node, 'items')) value.forEach((v, i) => visit(node.items, v, `${path}[${i}]`));
    } else if (t === 'object') {
      const keys = Object.keys(value);
      for (const r of node.required ?? []) if (!own(value, r)) add(`${path}.${r}`, 'is required');
      const props = node.properties ?? {};
      for (const k of keys) {
        if (own(props, k)) visit(props[k], value[k], `${path}.${k}`);
        else if (node.additionalProperties === false) add(`${path}.${k}`, 'unsupported property');
      }
    }
  };
  visit(schema, data, '$');
  return issues;
}
