// node_modules/@noble/hashes/esm/utils.js
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function isBytes(a) {
  return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
}
function abytes(b, ...lengths) {
  if (!isBytes(b))
    throw new Error("Uint8Array expected");
  if (lengths.length > 0 && !lengths.includes(b.length))
    throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out);
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function clean(...arrays) {
  for (let i = 0; i < arrays.length; i++) {
    arrays[i].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += hexes[bytes[i]];
  }
  return hex;
}
function utf8ToBytes(str) {
  if (typeof str !== "string")
    throw new Error("string expected");
  return new Uint8Array(new TextEncoder().encode(str));
}
function toBytes(data) {
  if (typeof data === "string")
    data = utf8ToBytes(data);
  abytes(data);
  return data;
}
var Hash = class {
};
function createHasher(hashCons) {
  const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
  const tmp = hashCons();
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = () => hashCons();
  return hashC;
}

// node_modules/@noble/hashes/esm/_md.js
function setBigUint64(view, byteOffset, value, isLE) {
  if (typeof view.setBigUint64 === "function")
    return view.setBigUint64(byteOffset, value, isLE);
  const _32n = BigInt(32);
  const _u32_max = BigInt(4294967295);
  const wh = Number(value >> _32n & _u32_max);
  const wl = Number(value & _u32_max);
  const h = isLE ? 4 : 0;
  const l = isLE ? 0 : 4;
  view.setUint32(byteOffset + h, wh, isLE);
  view.setUint32(byteOffset + l, wl, isLE);
}
function Chi(a, b, c) {
  return a & b ^ ~a & c;
}
function Maj(a, b, c) {
  return a & b ^ a & c ^ b & c;
}
var HashMD = class extends Hash {
  constructor(blockLen, outputLen, padOffset, isLE) {
    super();
    this.finished = false;
    this.length = 0;
    this.pos = 0;
    this.destroyed = false;
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    data = toBytes(data);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i = pos; i < blockLen; i++)
      buffer[i] = 0;
    setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen should be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i = 0; i < outLen; i++)
      oview.setUint32(4 * i, state[i], isLE);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to || (to = new this.constructor());
    to.set(...this.get());
    const { blockLen, buffer, length, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length;
    to.pos = pos;
    if (length % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);

// node_modules/@noble/hashes/esm/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA256 = class extends HashMD {
  constructor(outputLen = 32) {
    super(64, outputLen, 8, false);
    this.A = SHA256_IV[0] | 0;
    this.B = SHA256_IV[1] | 0;
    this.C = SHA256_IV[2] | 0;
    this.D = SHA256_IV[3] | 0;
    this.E = SHA256_IV[4] | 0;
    this.F = SHA256_IV[5] | 0;
    this.G = SHA256_IV[6] | 0;
    this.H = SHA256_IV[7] | 0;
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i = 0; i < 16; i++, offset += 4)
      SHA256_W[i] = view.getUint32(offset, false);
    for (let i = 16; i < 64; i++) {
      const W15 = SHA256_W[i - 15];
      const W2 = SHA256_W[i - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i = 0; i < 64; i++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var sha256 = /* @__PURE__ */ createHasher(() => new SHA256());

// node_modules/@noble/hashes/esm/sha256.js
var sha2562 = sha256;

// tools/browser-crypto-shim.js
function createHash(algorithm) {
  if (algorithm !== "sha256") throw new TypeError("Browser engine supports SHA-256 only");
  let chunks = [];
  return {
    update(data) {
      if (typeof data !== "string") throw new TypeError("Only UTF-8 string hashing is supported");
      chunks.push(data);
      return this;
    },
    digest(format) {
      if (format !== "hex") throw new TypeError("Expected hex digest");
      const bytes = utf8ToBytes(chunks.join(""));
      chunks = [];
      return bytesToHex(sha2562(bytes));
    }
  };
}

// src/canonical.js
function canonicalize(v) {
  if (Array.isArray(v)) return `[${v.map(canonicalize).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalize(v[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

// src/independence.js
function resolveRoots(sources, extraRoots = /* @__PURE__ */ new Map()) {
  const byId2 = new Map(sources.map((s) => [s.id, s]));
  const memo = /* @__PURE__ */ new Map();
  const visiting = /* @__PURE__ */ new Set();
  const roots = (id2) => {
    if (memo.has(id2)) return memo.get(id2);
    if (visiting.has(id2)) throw new Error(`derivation cycle at "${id2}" (input must be validated first)`);
    visiting.add(id2);
    const s = byId2.get(id2);
    const out = /* @__PURE__ */ new Set();
    const parents = s.derivedFrom ?? [];
    if (s.originGroup) out.add(`group:${s.originGroup}`);
    if (parents.length === 0 && !s.originGroup) out.add(`source:${id2}`);
    for (const r of extraRoots.get(id2) ?? []) out.add(r);
    for (const p of parents) for (const r of roots(p)) out.add(r);
    visiting.delete(id2);
    const arr = [...out].sort();
    memo.set(id2, arr);
    return arr;
  };
  const res = /* @__PURE__ */ new Map();
  for (const s of sources) res.set(s.id, roots(s.id));
  return res;
}
function describeSources(sources) {
  const byId2 = new Map(sources.map((s) => [s.id, s]));
  const memo = /* @__PURE__ */ new Map();
  const anc = (id2) => {
    if (memo.has(id2)) return memo.get(id2);
    const out = /* @__PURE__ */ new Set();
    for (const p of byId2.get(id2).derivedFrom ?? []) {
      out.add(p);
      for (const a of anc(p)) out.add(a);
    }
    memo.set(id2, out);
    return out;
  };
  const info = /* @__PURE__ */ new Map();
  for (const s of sources) {
    info.set(s.id, { name: s.name, originGroup: s.originGroup ?? null, directParents: [...s.derivedFrom ?? []].sort(), ancestors: [...anc(s.id)].sort() });
  }
  return info;
}
function explainCluster({ label, sourceIds, evidenceIds, mergedArtifacts, info }) {
  const reasons = [];
  for (const id2 of sourceIds) {
    const i = info.get(id2);
    if (i.directParents.length === 0 && !i.originGroup) reasons.push(`Source "${id2}" is declared as an original source (no declared parents).`);
    if (i.directParents.length) reasons.push(`Source "${id2}" is declared as derived from ${i.directParents.map((p) => `"${p}"`).join(", ")}${i.ancestors.length > i.directParents.length ? ` (transitively from ${i.ancestors.map((p) => `"${p}"`).join(", ")})` : ""}, so it cannot independently corroborate its upstream.`);
    if (i.originGroup) reasons.push(`Source "${id2}" declares shared origin group "${i.originGroup}"; sources in the same group are treated as one origin.`);
  }
  for (const a of mergedArtifacts) reasons.push(`Evidence ${a.members.map((m) => `"${m}"`).join(", ")} is the same artifact (${a.basis}); sources ${a.sources.map((s) => `"${s}"`).join(", ")} are therefore treated as one origin.`);
  if (label.includes("+")) reasons.push(`Origin roots ${label.split("+").map((r) => `"${r}"`).join(", ")} are linked by a declared derivation or shared artifact and are merged into one independence group.`);
  reasons.push(`${evidenceIds.length} evidence item(s) in this group count as 1 independent origin. This is based on DECLARED provenance, which has not been independently verified.`);
  return reasons;
}
var EXACT_LIMIT = 22;
function packOrigins(items, weightOf = () => 0) {
  const cmp3 = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  if (!Array.isArray(items)) throw new TypeError("items must be an array");
  const itemKeys = /* @__PURE__ */ new Set();
  for (const item of items) {
    if (item == null || !Array.isArray(item.roots) || item.roots.length === 0)
      throw new TypeError("each item must have a nonempty roots array");
    if (itemKeys.has(item.key)) throw new Error("duplicate evidence key");
    itemKeys.add(item.key);
    for (const root of item.roots)
      if (typeof root !== "string" || root.length === 0 || root.includes("+"))
        throw new TypeError("root must be a nonempty string without +");
  }
  const byLabel = /* @__PURE__ */ new Map();
  const labelOf = (it) => [...new Set(it.roots)].sort().join("+");
  for (const it of items) {
    const label = labelOf(it);
    if (!byLabel.has(label)) byLabel.set(label, new Set(label.split("+")));
  }
  const labels = [...byLabel.keys()].sort((a, b) => byLabel.get(a).size - byLabel.get(b).size || cmp3(a, b));
  const isSubset = (m, l) => [...byLabel.get(m)].every((r) => byLabel.get(l).has(r));
  const minimal = labels.filter((l) => !labels.some((m) => m !== l && byLabel.get(m).size < byLabel.get(l).size && isSubset(m, l)));
  const overlaps = (a, b) => {
    const A = byLabel.get(a), B = byLabel.get(b);
    for (const r of A) if (B.has(r)) return true;
    return false;
  };
  const logWeights = /* @__PURE__ */ new Map();
  for (const label of minimal) {
    const strength = weightOf(label);
    if (typeof strength !== "number" || !Number.isFinite(strength) || strength < 0 || strength > 1) {
      throw new TypeError("weightOf must return a finite strength in [0, 1]");
    }
    logWeights.set(label, -Math.log(1 - Math.min(strength, 0.999999)));
  }
  const logw = (l) => logWeights.get(l);
  const seen = /* @__PURE__ */ new Set(), comps = [];
  for (const l of minimal) {
    if (seen.has(l)) continue;
    const comp = [], stack = [l];
    seen.add(l);
    while (stack.length) {
      const x = stack.pop();
      comp.push(x);
      for (const y of minimal) if (!seen.has(y) && overlaps(x, y)) {
        seen.add(y);
        stack.push(y);
      }
    }
    comps.push(comp.sort((a, b) => logw(b) - logw(a) || cmp3(a, b)));
  }
  let approximate = false;
  const chosen = [];
  for (const comp of comps) {
    if (comp.length === 1) {
      chosen.push(comp[0]);
      continue;
    }
    if (comp.length <= EXACT_LIMIT) {
      const conflictMasks = comp.map((label, i) => {
        let mask = 0;
        for (let j = 0; j < comp.length; j++) if (i !== j && overlaps(label, comp[j])) mask |= 1 << j;
        return mask;
      });
      const weights = comp.map(logw);
      let best = [], bestW = -1;
      const rec = (i, picked, w, blocked) => {
        if (i === comp.length) {
          if (picked.length > best.length || picked.length === best.length && w > bestW + 1e-12) {
            best = [...picked];
            bestW = w;
          }
          return;
        }
        let available = 0, upperWeight = w;
        for (let j = i; j < comp.length; j++) {
          if ((blocked & 1 << j) === 0) {
            available++;
            upperWeight += Math.max(0, weights[j]);
          }
        }
        if (picked.length + available < best.length) return;
        if (picked.length + available === best.length && upperWeight <= bestW + 1e-12) return;
        const bit = 1 << i;
        if ((blocked & bit) === 0) {
          picked.push(comp[i]);
          rec(i + 1, picked, w + weights[i], blocked | conflictMasks[i] | bit);
          picked.pop();
        }
        rec(i + 1, picked, w, blocked);
      };
      rec(0, [], 0, 0);
      chosen.push(...best);
    } else {
      approximate = true;
      const picked = [];
      for (const l of [...comp].sort((a, b) => byLabel.get(a).size - byLabel.get(b).size || logw(b) - logw(a) || cmp3(a, b))) if (picked.every((p) => !overlaps(p, l))) picked.push(l);
      chosen.push(...picked);
    }
  }
  chosen.sort(cmp3);
  const assign = /* @__PURE__ */ new Map();
  for (const it of items) {
    const label = labelOf(it), set = byLabel.get(label);
    assign.set(it.key, chosen.includes(label) ? label : chosen.find((c) => [...byLabel.get(c)].some((r) => set.has(r))));
  }
  return { origins: chosen, assign, approximate, labelOf };
}

// src/graph.js
var cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;
function buildGraph({ c, classes, roots, integrityByEvidence, warnings, claims }) {
  const nodes = [], edges = [];
  const groups = [...new Set(c.sources.filter((s) => s.originGroup).map((s) => s.originGroup))].sort();
  for (const s of [...c.sources].sort((a, b) => cmp(a.id, b.id))) {
    nodes.push({
      id: `source:${s.id}`,
      type: "source",
      ref: s.id,
      label: s.name,
      role: s.derivedFrom?.length ? "derived" : s.originGroup ? "grouped" : "declared_original",
      roots: roots.get(s.id)
    });
  }
  for (const g of groups) nodes.push({ id: `group:${g}`, type: "origin_group", ref: g, label: g });
  for (const e of [...c.evidence].sort((a, b) => cmp(a.id, b.id))) {
    const i = integrityByEvidence.get(e.id);
    nodes.push({ id: `evidence:${e.id}`, type: "evidence", ref: e.id, label: e.description, integrity: i?.status ?? "NOT_CHECKED", hasDeclaredHash: Boolean(e.sha256) });
  }
  for (const cl of claims) nodes.push({ id: `claim:${cl.claimId}`, type: "claim", ref: cl.claimId, label: cl.statement, status: cl.status, decision: cl.decision });
  const add = (from, to, relation, basis, extra = {}) => edges.push({ from, to, relation, basis, ...extra });
  for (const s of c.sources) {
    for (const p of s.derivedFrom ?? []) add(`source:${s.id}`, `source:${p}`, "derived_from", "declared");
    if (s.originGroup) add(`source:${s.id}`, `group:${s.originGroup}`, "member_of_origin_group", "declared");
  }
  for (const e of c.evidence) {
    add(`evidence:${e.id}`, `source:${e.sourceId}`, "held_by", "declared");
    for (const l of e.links) add(`evidence:${e.id}`, `claim:${l.claimId}`, l.stance, "declared", { strength: l.strength });
  }
  for (const k of classes) {
    const [first, ...rest] = [...k.members].sort();
    for (const m of rest) {
      const o1 = integrityByEvidence.get(first), o2 = integrityByEvidence.get(m);
      const bothObserved = k.basis === "sha256" && o1?.observedSha256 && !o1.observedEmpty && o1.observedSha256 === o2?.observedSha256;
      const declaredBoth = Boolean(o1?.declaredSha256 && o2?.declaredSha256);
      add(
        `evidence:${m}`,
        `evidence:${first}`,
        k.basis === "sha256" ? "same_bytes" : "same_source_and_description",
        bothObserved ? "verified" : "declared",
        bothObserved && !declaredBoth ? { discoveredBy: "local_hashing" } : {}
      );
    }
  }
  for (const w of warnings) {
    const ids = w.sourceIds ? w.sourceIds.map((x) => `source:${x}`) : w.evidenceIds.map((x) => `evidence:${x}`);
    for (let i = 1; i < ids.length; i++) add(ids[i], ids[0], "possibly_same_origin", "suspected", { cue: w.code });
  }
  const originLabels = [...new Set(claims.flatMap((cl) => [...cl.independentSupportOrigins, ...cl.independentContradictOrigins].map((o) => o.origin)))].sort();
  for (const o of originLabels) nodes.push({ id: `origin:${o}`, type: "origin", ref: o, label: o, roots: o.split("+") });
  const MAX_UNKNOWN_VISUAL_EDGES = 2e3;
  let retainedUnknownEdges = 0, omittedUnknownEdges = 0;
  for (const cl of claims) {
    const origins = [...cl.independentSupportOrigins, ...cl.independentContradictOrigins].map((o) => o.origin);
    const uniq = [...new Set(origins)].sort();
    const pairs = uniq.length * (uniq.length - 1) / 2;
    const remaining = MAX_UNKNOWN_VISUAL_EDGES - retainedUnknownEdges;
    const retained = Math.min(pairs, remaining);
    let n = 0;
    for (let i = 0; i < uniq.length && n < retained; i++) for (let j = i + 1; j < uniq.length && n < retained; j++) {
      add(`origin:${uniq[i]}`, `origin:${uniq[j]}`, "independence_not_established", "unknown", { claimId: cl.claimId });
      n++;
    }
    retainedUnknownEdges += retained;
    omittedUnknownEdges += pairs - retained;
  }
  edges.sort((a, b) => cmp(JSON.stringify([a.basis, a.relation, a.from, a.to, a.claimId ?? "", a.strength ?? -1, a.cue ?? "", a.discoveredBy ?? ""]), JSON.stringify([b.basis, b.relation, b.from, b.to, b.claimId ?? "", b.strength ?? -1, b.cue ?? "", b.discoveredBy ?? ""])));
  const basisCounts = { verified: 0, declared: 0, suspected: 0, unknown: 0 };
  for (const e of edges) basisCounts[e.basis]++;
  return { nodes, edges, basisCounts, ...omittedUnknownEdges ? { omittedUnknownEdges } : {} };
}

// src/classify.js
function classify(supportOrigins, contradictOrigins, threshold) {
  if (supportOrigins === 0 && contradictOrigins === 0) return "no_evidence";
  if (supportOrigins > 0 && contradictOrigins > 0) return "conflicting";
  if (contradictOrigins > 0) return "contradicted";
  if (supportOrigins < threshold) return "insufficient_support";
  return "supported_by_independent_origins";
}

// src/planner.js
var scen = (outcome, supportOrigins, contradictOrigins, threshold, note) => ({
  hypothetical: true,
  outcome,
  resultingStatus: classify(supportOrigins, contradictOrigins, threshold),
  supportOrigins,
  contradictOrigins,
  ...note ? { note } : {}
});
function planClaim({ status, support, contradict, threshold: th, cues, supportItems, integrityByEvidence, excludedMismatch }) {
  const S = support.length, C = contradict.length;
  const steps = [];
  if (status === "no_evidence" || status === "insufficient_support") {
    const k = th - S;
    steps.push({
      id: "ADD_INDEPENDENT_ORIGINS",
      kind: "acquire",
      minimalCount: k,
      requirement: `${k} additional item(s), each from an origin that is not derived from, grouped with, or byte-identical to any existing origin of this claim${S ? ` (${support.map((o) => `"${o.origin}"`).join(", ")})` : ""}.`,
      outcomes: [
        scen(`all ${k} support the claim`, S + k, C, th),
        scen("at least one contradicts the claim", S + k - 1, C + 1, th),
        scen("none can be found", S, C, th, "absence of further evidence is not evidence against the claim")
      ]
    });
  }
  if (status === "contradicted") {
    steps.push({
      id: "ADD_INDEPENDENT_ORIGINS",
      kind: "acquire",
      minimalCount: 1,
      requirement: "At least 1 supporting item from an origin independent of the contradicting origin(s); reaching SUPPORTED additionally requires every contradiction to be withdrawn (see below).",
      outcomes: [scen("1 independent item supports the claim", 1, C, th), scen("none can be found", 0, C, th)]
    });
  }
  if (status === "conflicting" || status === "contradicted") {
    steps.push({
      id: "REASSESS_CONTRADICTIONS",
      kind: "reassess",
      minimalCount: C,
      requirement: `Re-examine the ${C} contradicting origin(s) (${contradict.map((o) => `"${o.origin}"`).join(", ")}): collection method, time and applicability to the claim as worded.`,
      outcomes: [
        scen(`all ${C} are shown not to apply to the claim`, S, 0, th, "under the policy a single remaining contradiction keeps the claim conflicting"),
        scen("at least one still applies", S, C, th)
      ]
    });
  }
  if (status === "supported_by_independent_origins") {
    const fragility = S - th + 1;
    steps.push({
      id: "ROBUSTNESS",
      kind: "stress_test",
      minimalCount: fragility,
      requirement: `Support survives unless ${fragility} of its ${S} independent origins are shown to share an undeclared source with another, or fail integrity checks.`,
      outcomes: [scen(`${fragility} origin(s) collapse into others`, S - fragility, C, th), scen("a single independent contradiction is found", S, C + 1, th)]
    });
  }
  if (cues.length) {
    const involved = /* @__PURE__ */ new Set();
    steps.push({
      id: "RESOLVE_DEPENDENCE_CUES",
      kind: "verify_provenance",
      minimalCount: cues.length,
      requirement: `Resolve ${cues.length} heuristic cue(s) (${cues.map((w) => w.code).join(", ")}) by checking whether the flagged sources/evidence share an origin.`,
      outcomes: [
        scen("cue(s) shown to be coincidence (declared independence holds)", S, C, th),
        scen("flagged items shown to share one origin", Math.max(S - cues.length, 1), C, th, "conservative: assumes each cue merges two origins into one")
      ]
    });
    void involved;
  }
  const unverified = supportItems.filter((id2) => {
    const r = integrityByEvidence.get(id2);
    return r?.declaredSha256 && r.status !== "VERIFIED" && r.status !== "MISMATCH";
  });
  if (unverified.length && S > 0) {
    const surviving = support.filter((o) => o.evidenceIds.some((id2) => !unverified.includes(id2))).length;
    steps.push({
      id: "VERIFY_DECLARED_HASHES",
      kind: "verify_integrity",
      minimalCount: unverified.length,
      requirement: `Verify ${unverified.length} declared SHA-256 value(s) against local files: ${unverified.map((x) => `"${x}"`).join(", ")}.`,
      outcomes: [scen("all VERIFIED", S, C, th, "byte equality only; does not establish authenticity"), scen("all MISMATCH (excluded from scoring)", surviving, C, th)]
    });
  }
  if (excludedMismatch.length) {
    steps.push({
      id: "EXPLAIN_MISMATCH",
      kind: "verify_integrity",
      minimalCount: excludedMismatch.length,
      requirement: `Explain the hash mismatch of ${excludedMismatch.map((x) => `"${x}"`).join(", ")} (already excluded from scoring).`,
      outcomes: [scen("mismatch remains unexplained", S, C, th)]
    });
  }
  const changing = steps.filter((st) => st.outcomes.some((o) => o.resultingStatus !== status));
  const smallest = changing.sort((a, b) => a.minimalCount - b.minimalCount || (a.id < b.id ? -1 : 1))[0] ?? null;
  return {
    basis: "outcomes are logical consequences of the fixed policy; which evidence to seek is a heuristic suggestion; no hypothetical item is asserted to exist",
    smallestChange: smallest ? { stepId: smallest.id, minimalCount: smallest.minimalCount } : null,
    steps
  };
}

// src/gaps.js
var REQUIREMENT_PRIORITY = Object.freeze({
  INTEGRITY_MISMATCH: 1,
  SELF_CONTRADICTORY_ORIGIN: 2,
  CONFLICT_UNRESOLVED: 3,
  NO_LINKED_EVIDENCE: 4,
  FALSE_CORROBORATION: 5,
  BELOW_INDEPENDENCE_THRESHOLD: 6,
  ONLY_CONTRADICTING_EVIDENCE: 7,
  INTEGRITY_UNVERIFIED: 8,
  INTEGRITY_UNAVAILABLE: 9,
  PROVENANCE_UNVERIFIED: 10
});
var SEVERITY = { high: 0, medium: 1, low: 2, info: 3 };
var q = (xs) => xs.map((x) => `"${x}"`).join(", ");
function analyzeGaps(c) {
  const findings = [];
  const reqs = [];
  const add = (f) => findings.push({ basis: "logical", ...f });
  const need = (code, action, wouldShow, wouldNotShow, addresses) => reqs.push({ code, basis: "heuristic", addresses, action, wouldShow, wouldNotShow });
  const supOrigins = c.support.map((x) => x.origin), conOrigins = c.contradict.map((x) => x.origin);
  const itemIds = c.supportItems;
  if (c.support.length === 0 && c.contradict.length === 0) {
    add({ code: "NO_LINKED_EVIDENCE", severity: "high", message: "No effective evidence is linked to this claim.", evidence: [], origins: [] });
    need(
      "NO_LINKED_EVIDENCE",
      "Identify and obtain evidence bearing on this claim from at least two origins that do not derive from one another, and record each one's provenance.",
      "Whether any documented support exists and from how many declared origins.",
      "That the claim is true, or that the new sources are truly independent (that needs separate provenance verification).",
      ["NO_LINKED_EVIDENCE"]
    );
  }
  if (c.support.length > 0 && itemIds.length > c.support.length && itemIds.length >= 2) {
    add({
      code: "FALSE_CORROBORATION",
      severity: c.support.length < c.threshold ? "high" : "medium",
      message: `${itemIds.length} supporting evidence items collapse to ${c.support.length} independent origin(s); the extra items are duplicates or derivatives and add no independent corroboration.`,
      evidence: itemIds,
      origins: supOrigins
    });
    need(
      "FALSE_CORROBORATION",
      `Trace the derived or duplicated items back to their upstream original(s) (${q(supOrigins)}) and compare each copy against its original.`,
      "Whether the copies faithfully reproduce the original, and what the original itself contains.",
      "That the original is accurate, or that the copies independently corroborate it.",
      ["FALSE_CORROBORATION"]
    );
  }
  if (c.support.length >= 1 && c.support.length < c.threshold && c.contradict.length === 0) {
    add({
      code: "BELOW_INDEPENDENCE_THRESHOLD",
      severity: "high",
      message: `Support comes from ${c.support.length} independent origin(s); policy requires at least ${c.threshold}.`,
      evidence: itemIds,
      origins: supOrigins
    });
    need(
      "BELOW_INDEPENDENCE_THRESHOLD",
      `Obtain evidence for this claim from an origin that is not ${q(supOrigins)}, not derived from them, and not in their origin groups.`,
      "Whether a second, separately declared origin also supports the claim.",
      "That the claim is true, or that the new origin is independent beyond what its declared provenance states.",
      ["BELOW_INDEPENDENCE_THRESHOLD"]
    );
  }
  if (c.support.length === 0 && c.contradict.length > 0) {
    add({ code: "ONLY_CONTRADICTING_EVIDENCE", severity: "high", message: `Only contradicting evidence from ${c.contradict.length} independent origin(s) is linked; nothing supports this claim.`, evidence: c.contradictItems, origins: conOrigins });
    need(
      "ONLY_CONTRADICTING_EVIDENCE",
      "Re-examine whether the claim as worded is still defensible; look for any evidence that supports it, or revise the claim.",
      "Whether any support exists at all.",
      "That the contradicting evidence is correct.",
      ["ONLY_CONTRADICTING_EVIDENCE"]
    );
  }
  if (c.support.length > 0 && c.contradict.length > 0) {
    add({
      code: "CONFLICT_UNRESOLVED",
      severity: "high",
      message: `${c.support.length} independent origin(s) support and ${c.contradict.length} contradict this claim. The conflict is not resolved by the case data.`,
      evidence: [.../* @__PURE__ */ new Set([...itemIds, ...c.contradictItems])].sort(),
      origins: [.../* @__PURE__ */ new Set([...supOrigins, ...conOrigins])].sort()
    });
    need(
      "CONFLICT_UNRESOLVED",
      "Document how each side was collected (method, time, access) and look for a further origin that is independent of both sides.",
      "Which side has better-documented collection and whether a third independent origin leans one way.",
      "Which side is correct; a third source does not settle the matter by majority.",
      ["CONFLICT_UNRESOLVED"]
    );
    const both = supOrigins.filter((o) => conOrigins.includes(o));
    if (both.length) {
      add({ code: "SELF_CONTRADICTORY_ORIGIN", severity: "high", message: `Origin(s) ${q(both)} both support and contradict this claim.`, evidence: [], origins: both });
      need(
        "SELF_CONTRADICTORY_ORIGIN",
        `Ask the holder of origin(s) ${q(both)} (or review its records) to explain the opposing items: different versions, different time points, or a data-entry error.`,
        "Whether the opposing items are reconcilable.",
        "Which of the opposing items is accurate.",
        ["SELF_CONTRADICTORY_ORIGIN"]
      );
    }
  }
  const allItems = [.../* @__PURE__ */ new Set([...itemIds, ...c.contradictItems])].sort();
  const by = (st) => allItems.filter((id2) => c.integrityByEvidence.get(id2)?.status === st);
  const withHash = allItems.filter((id2) => c.integrityByEvidence.get(id2)?.declaredSha256);
  const mismatch = by("MISMATCH");
  const notVerified = withHash.filter((id2) => c.integrityByEvidence.get(id2).status !== "VERIFIED" && !mismatch.includes(id2));
  const noHash = allItems.filter((id2) => !c.integrityByEvidence.get(id2)?.declaredSha256);
  if (c.excludedMismatch.length) {
    add({ code: "INTEGRITY_MISMATCH", severity: "high", message: `Evidence ${q(c.excludedMismatch)} failed SHA-256 verification (file differs from declared hash) and was EXCLUDED from scoring.`, evidence: c.excludedMismatch, origins: [] });
    need(
      "INTEGRITY_MISMATCH",
      `Investigate why the file for ${q(c.excludedMismatch)} differs from its declared hash (wrong file, modification, or wrong hash recorded) and re-acquire or correct the record.`,
      "Whether the discrepancy is a recording error or a changed file.",
      "Who changed it, when, or whether the content is otherwise reliable.",
      ["INTEGRITY_MISMATCH"]
    );
  }
  if (notVerified.length && c.integrityMode === "not_requested") {
    add({ code: "INTEGRITY_UNVERIFIED", severity: "medium", message: `Declared SHA-256 values for ${q(notVerified)} were NOT verified against local files. They must not be treated as verified.`, evidence: notVerified, origins: [] });
    need(
      "INTEGRITY_UNVERIFIED",
      "Place the evidence files in a local evidence directory and re-run with --evidence-dir to check declared hashes.",
      "That the local bytes match the hash recorded in the case.",
      "That the file is authentic, unaltered before the hash was taken, or that its content is true.",
      ["INTEGRITY_UNVERIFIED"]
    );
  } else if (notVerified.length) {
    add({ code: "INTEGRITY_UNAVAILABLE", severity: "medium", message: `Declared SHA-256 values for ${q(notVerified)} could not be verified (missing file, unsafe path, or limit reached); treated as unverified.`, evidence: notVerified, origins: [] });
    need(
      "INTEGRITY_UNAVAILABLE",
      `Supply a regular file (no symlinks) at the declared relative path for ${q(notVerified)} inside the evidence directory, or correct its path.`,
      "That the local bytes match the declared hash.",
      "Authenticity, provenance or truth of the content.",
      ["INTEGRITY_UNAVAILABLE"]
    );
  }
  if (noHash.length && c.support.length + c.contradict.length > 0) {
    add({ code: "NO_DECLARED_HASH", severity: "info", message: `Evidence ${q(noHash)} has no declared SHA-256, so its integrity cannot be checked.`, evidence: noHash, origins: [] });
  }
  if (c.status === "supported_by_independent_origins") {
    add({ code: "PROVENANCE_UNVERIFIED", severity: "low", message: `Independence of ${q(supOrigins)} rests on DECLARED provenance only; no independent provenance verification was performed.`, evidence: itemIds, origins: supOrigins });
    need(
      "PROVENANCE_UNVERIFIED",
      `Check custody or acquisition records for the origins ${q(supOrigins)} to determine whether any of them copied from another or shares an undeclared upstream.`,
      "Whether the declared independence is credible.",
      "That the evidence is true or complete.",
      ["PROVENANCE_UNVERIFIED"]
    );
  }
  findings.sort((a, b) => SEVERITY[a.severity] - SEVERITY[b.severity] || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  reqs.sort((a, b) => REQUIREMENT_PRIORITY[a.code] - REQUIREMENT_PRIORITY[b.code]);
  reqs.forEach((r, i) => {
    r.rank = i + 1;
  });
  return { findings, requirements: reqs };
}
function buildAssumptions({ hasEvidence, supportItems, integrityByEvidence, threshold }) {
  const a = [];
  if (!hasEvidence) return a;
  a.push("Provenance (derivedFrom, originGroup) is as declared by the case author and has not been independently verified.");
  a.push("Strength values are author-assigned judgments, not measurements.");
  a.push(`"${threshold} or more independent origins" is a policy threshold, not proof that a claim is true.`);
  if (supportItems.length) {
    const v = supportItems.filter((id2) => integrityByEvidence.get(id2)?.status === "VERIFIED").length;
    a.push(`${v} of ${supportItems.length} supporting evidence item(s) have a declared SHA-256 VERIFIED against a local file; the others are unverified. Verification confirms byte equality only, not authenticity.`);
  }
  return a;
}

// tools/browser-integrity-shim.js
var STATES = ["VERIFIED", "MISMATCH", "MISSING", "UNSAFE_PATH", "NOT_CHECKED"];
function integrityNotRequested(evidence) {
  const results = [...evidence].sort((a, b) => a.id < b.id ? -1 : 1).map((e) => ({
    evidenceId: e.id,
    status: "NOT_CHECKED",
    verified: false,
    declaredSha256: e.sha256 ?? null,
    file: e.file ?? null,
    reason: e.sha256 ? "verification_not_requested" : "no_declared_hash"
  }));
  const counts = Object.fromEntries(STATES.map((s) => [s, s === "NOT_CHECKED" ? results.length : 0]));
  return { mode: "not_requested", counts, results };
}

// src/analyze.js
var ANALYSIS_VERSION = "0.4.0";
var POLICY = Object.freeze({
  minIndependentOrigins: 2,
  scoring: "noisy-OR over per-independent-origin strength. Origin strength = max strength of non-derived evidence whose roots contain that root set; derived-only evidence takes the minimum of all derived-only evidence sharing any root, capped by the strongest non-derived evidence sharing any root (D7, D8, D11). If only derived evidence exists, the MINIMUM of its strengths is used so extra copies cannot raise it (D8)",
  independence: "declared provenance only, evaluated PER CLAIM and stance (D9). Count = maximum number of supporting items whose declared root sets (roots of all sources citing the same artifact, incl. originGroup) are pairwise disjoint (D10, replaces 0.2.0 union-find). Sources holding the same artifact share all of one another\u2019s roots plus an `artifact:` root, inherited by their derivatives (D11). Adding evidence never lowers the count; copies never raise it. Independence is never verified; absence of a declared link means UNKNOWN",
  abstention: "decision = abstain_possible_undeclared_dependence when the hard classification is SUPPORTED but a heuristic cue (same source name, identical description, or a shared artifact across different declared lineages) touches two of its independent support origins. The hard classification `status` is unchanged and reported separately",
  duplicates: "identical sha256, or same source + normalized description, are one artifact; their links are merged, not discarded (0.2.0 fixes D1-D2)",
  integrity: "when local verification is requested, MISMATCH evidence is excluded from scoring. Every safely readable non-empty file is hashed by the tool, also without a declared hash (0.4.0); evidence whose OBSERVED bytes are identical is one artifact. The byte identity is verified; that the holders share an origin is the same policy inference as for declared hashes"
});
var byId = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
var cmp2 = (a, b) => a < b ? -1 : a > b ? 1 : 0;
var norm = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");
var combine = (xs) => Math.round((1 - xs.reduce((p, x) => p * (1 - x), 1)) * 1e4) / 1e4;
var DEFAULT_PROFILE = Object.freeze({
  id: "proofgap-x",
  disclaimer: "Prototype analysis of declared evidence provenance. It does not establish forensic authenticity, intent, or guilt, and has not been independently validated.",
  claimCaveat: "This is a statistical-style confidence heuristic over declared provenance, not a finding of authenticity or guilt."
});
function analyzeCase(c, opts = {}) {
  const profile = { ...DEFAULT_PROFILE, ...opts.profile ?? {} };
  const integrity = opts.integrity ?? integrityNotRequested(c.evidence);
  const integrityByEvidence = new Map(integrity.results.map((r) => [r.evidenceId, r]));
  const verificationRan = integrity.mode !== "not_requested";
  const notes = [];
  const excludedByIntegrity = [];
  const classByKey = /* @__PURE__ */ new Map();
  for (const e of [...c.evidence].sort(byId)) {
    if (verificationRan && integrityByEvidence.get(e.id)?.status === "MISMATCH") {
      excludedByIntegrity.push(e.id);
      continue;
    }
    const ir = verificationRan ? integrityByEvidence.get(e.id) : null;
    const seen = ir?.observedSha256 && !ir.observedEmpty ? ir.observedSha256 : null;
    const key = seen ? `sha256:${seen}` : e.sha256 ? `sha256:${e.sha256}` : `src:${e.sourceId}|${norm(e.description)}`;
    let k = classByKey.get(key);
    if (!k) {
      k = { canonical: e.id, basis: key.startsWith("sha256:") ? "sha256" : "source+description", members: [], sources: /* @__PURE__ */ new Set(), links: /* @__PURE__ */ new Map() };
      classByKey.set(key, k);
    }
    k.members.push(e.id);
    k.sources.add(e.sourceId);
    for (const l of e.links) {
      const lk = `${l.claimId}\0${l.stance}`;
      const cur = k.links.get(lk) ?? { claimId: l.claimId, stance: l.stance, strength: 0, evidenceIds: /* @__PURE__ */ new Set() };
      cur.strength = Math.max(cur.strength, l.strength);
      cur.evidenceIds.add(e.id);
      k.links.set(lk, cur);
    }
  }
  const classes = [...classByKey.values()].sort((a, b) => cmp2(a.canonical, b.canonical));
  const duplicates = [];
  for (const k of classes) for (const m of k.members.slice(1)) duplicates.push({ evidenceId: m, duplicateOf: k.canonical, basis: k.basis });
  const mergedArtifacts = classes.filter((k) => k.sources.size > 1).map((k) => ({ canonical: k.canonical, members: [...k.members], basis: k.basis, sources: [...k.sources].sort() }));
  const extraRoots = /* @__PURE__ */ new Map();
  for (const a of mergedArtifacts) for (const sid of a.sources) extraRoots.set(sid, /* @__PURE__ */ new Set([...extraRoots.get(sid) ?? [], `artifact:${a.canonical}`]));
  let roots = resolveRoots(c.sources, extraRoots);
  for (let iter = 0; iter <= c.sources.length + 1 && mergedArtifacts.length; iter++) {
    let changed = false;
    for (const a of mergedArtifacts) {
      const union = new Set(a.sources.flatMap((sid) => roots.get(sid)));
      for (const sid of a.sources) {
        const cur = extraRoots.get(sid);
        const n = cur.size;
        for (const r of union) cur.add(r);
        if (cur.size !== n) changed = true;
      }
    }
    if (!changed) break;
    roots = resolveRoots(c.sources, extraRoots);
  }
  const info = describeSources(c.sources);
  const derivedSources = c.sources.filter((s) => s.derivedFrom?.length || s.originGroup).map((s) => ({ sourceId: s.id, originGroups: roots.get(s.id) })).sort((a, b) => cmp2(a.sourceId, b.sourceId));
  const footprint = (ids) => new Set(ids.flatMap((i) => roots.get(i)));
  const disjoint = (x, y) => ![...x].some((r) => y.has(r));
  const warnings = [];
  const nameGroups = /* @__PURE__ */ new Map();
  for (const s of c.sources) {
    const n = norm(s.name);
    nameGroups.set(n, [...nameGroups.get(n) ?? [], s.id]);
  }
  for (const [n, ids] of [...nameGroups].sort(([a], [b]) => cmp2(a, b))) {
    let independentPair = false;
    for (let i = 0; i < ids.length && !independentPair; i++) for (let j = i + 1; j < ids.length; j++) if (disjoint(footprint([ids[i]]), footprint([ids[j]]))) {
      independentPair = true;
      break;
    }
    if (ids.length > 1 && independentPair) warnings.push({ code: "SAME_NAME_DIFFERENT_ORIGINS", basis: "heuristic", sourceIds: [...ids].sort(), message: `Sources ${[...ids].sort().map((i) => `"${i}"`).join(", ")} share the name "${n}" but are declared independent; check for an undeclared common origin.` });
  }
  const evById = new Map(c.evidence.map((e) => [e.id, e]));
  const descGroups = /* @__PURE__ */ new Map();
  for (const k of classes) {
    const d = norm(evById.get(k.canonical).description);
    descGroups.set(d, [...descGroups.get(d) ?? [], k]);
  }
  for (const [, ks] of [...descGroups].sort(([a], [b]) => cmp2(a, b))) {
    let independentPair = false;
    for (let i = 0; i < ks.length && !independentPair; i++) for (let j = i + 1; j < ks.length; j++) if (disjoint(footprint([...ks[i].sources]), footprint([...ks[j].sources]))) {
      independentPair = true;
      break;
    }
    if (ks.length > 1 && independentPair) warnings.push({ code: "IDENTICAL_DESCRIPTION_ACROSS_ORIGINS", basis: "heuristic", evidenceIds: ks.map((k) => k.canonical).sort(), message: `Evidence ${ks.map((k) => `"${k.canonical}"`).join(", ")} have identical descriptions but are declared independent; check whether they are the same material.` });
  }
  const declaredRoots = resolveRoots(c.sources);
  for (const a of mergedArtifacts) {
    const lineages = [...new Set(a.sources.map((sid) => declaredRoots.get(sid).join("+")))].sort();
    if (lineages.length > 1) warnings.push({
      code: "SHARED_ARTIFACT_ACROSS_LINEAGES",
      basis: "heuristic",
      sourceIds: [...a.sources],
      evidenceIds: [...a.members].sort(),
      rootSets: lineages.map((l) => l.split("+")),
      message: `Evidence ${[...a.members].sort().map((x) => `"${x}"`).join(", ")} is the same artifact held by sources with different declared lineages (${a.sources.map((x) => `"${x}"`).join(", ")}); their upstream origins may share an undeclared source.`
    });
  }
  warnings.sort((a, b) => cmp2(a.code + (a.sourceIds ?? a.evidenceIds).join(), b.code + (b.sourceIds ?? b.evidenceIds).join()));
  if (warnings.length > 100) {
    notes.push(`${warnings.length - 100} additional warning(s) omitted.`);
    warnings.length = 100;
  }
  const claimLinks = new Map(c.claims.map((cl) => [cl.id, []]));
  for (const k of classes) for (const l of k.links.values()) claimLinks.get(l.claimId).push({ k, l });
  const summarize = (m) => [...m.entries()].sort(([a], [b]) => cmp2(a, b)).map(([origin, v]) => {
    const strength = v.strength, raw = v.raw;
    return {
      origin,
      strength,
      ...raw > strength ? { strengthCappedFromDerived: raw } : {},
      evidenceIds: [...v.evidenceIds].sort(),
      sourceIds: [...v.sourceIds].sort()
    };
  });
  const claims = [...c.claims].sort(byId).map((claim) => {
    const items = claimLinks.get(claim.id);
    const sideMaps = { supports: /* @__PURE__ */ new Map(), contradicts: /* @__PURE__ */ new Map() };
    let approximate = false;
    for (const side of ["supports", "contradicts"]) {
      const sideItems = items.filter(({ l }) => l.stance === "supports" === (side === "supports"));
      const keyed = sideItems.map(({ k, l }, i) => ({ key: i, k, l, roots: [...k.sources].flatMap((sid) => roots.get(sid)) }));
      const labelStats = /* @__PURE__ */ new Map();
      const labelOfItem = (it) => [...new Set(it.roots)].sort().join("+");
      for (const it of keyed) {
        const st = labelStats.get(labelOfItem(it)) ?? { orig: -1, dmin: Infinity, dmax: -1 };
        const derivedOnly = [...it.k.sources].every((sid) => info.get(sid).directParents.length > 0);
        if (derivedOnly) {
          st.dmin = Math.min(st.dmin, it.l.strength);
          st.dmax = Math.max(st.dmax, it.l.strength);
        } else st.orig = Math.max(st.orig, it.l.strength);
        labelStats.set(labelOfItem(it), st);
      }
      const nonDerived = keyed.filter((it) => ![...it.k.sources].every((sid) => info.get(sid).directParents.length > 0));
      for (const [label, st] of labelStats) {
        const set = label.split("+");
        for (const it of nonDerived) if (set.every((r) => it.roots.includes(r))) st.orig = Math.max(st.orig, it.l.strength);
      }
      const capOf = /* @__PURE__ */ new Map();
      for (const [label, st] of labelStats) {
        if (st.orig >= 0) continue;
        const set = new Set(label.split("+"));
        const ups = nonDerived.filter((it) => it.roots.some((r) => set.has(r))).map((it) => it.l.strength);
        if (ups.length) capOf.set(label, Math.max(...ups));
      }
      const derivedItems = keyed.filter((it) => [...it.k.sources].every((sid) => info.get(sid).directParents.length > 0));
      for (const [label, st] of labelStats) {
        if (st.orig >= 0) continue;
        const set = new Set(label.split("+"));
        for (const it of derivedItems) if (it.roots.some((r) => set.has(r))) st.dmin = Math.min(st.dmin, it.l.strength);
      }
      const strengthOf = (label) => {
        const st = labelStats.get(label);
        return st.orig >= 0 ? st.orig : Math.min(st.dmin, capOf.get(label) ?? 1);
      };
      const pack = packOrigins(keyed, strengthOf);
      approximate ||= pack.approximate;
      const m = sideMaps[side];
      for (const it of keyed) {
        const label = pack.assign.get(it.key);
        const cur = m.get(label) ?? { strength: strengthOf(label), raw: -1, evidenceIds: /* @__PURE__ */ new Set(), sourceIds: /* @__PURE__ */ new Set() };
        cur.raw = Math.max(cur.raw, it.l.strength);
        for (const id2 of it.l.evidenceIds) cur.evidenceIds.add(id2);
        for (const sid of it.k.sources) cur.sourceIds.add(sid);
        m.set(label, cur);
      }
    }
    const sup = summarize(sideMaps.supports), con = summarize(sideMaps.contradicts);
    const supportScore = combine(sup.map((x) => x.strength));
    const contradictScore = combine(con.map((x) => x.strength));
    const th = POLICY.minIndependentOrigins;
    const status = classify(sup.length, con.length, th);
    const why = [];
    if (status === "no_evidence") why.push("No effective evidence is linked to this claim.");
    else if (status === "conflicting") why.push(`${sup.length} independent origin(s) support and ${con.length} contradict this claim; review the conflict manually.`);
    else if (status === "contradicted") why.push(`Only contradicting evidence from ${con.length} independent origin(s) is linked.`);
    else if (status === "insufficient_support") why.push(`Support comes from ${sup.length} independent origin(s); at least ${th} are needed. Derived copies and duplicates do not add independence.`);
    else why.push(`Supported by ${sup.length} independent origins (combined score ${supportScore}).`);
    why.push(profile.claimCaveat);
    const supportItems = [...new Set(sup.flatMap((x) => x.evidenceIds))].sort();
    const contradictItems = [...new Set(con.flatMap((x) => x.evidenceIds))].sort();
    const excludedMismatch = excludedByIntegrity.filter((id2) => c.evidence.find((e) => e.id === id2).links.some((l) => l.claimId === claim.id)).sort();
    const clusterOf = (m) => [...m.entries()].sort(([a], [b]) => cmp2(a, b)).map(([label, v]) => {
      const ev = [...v.evidenceIds].sort();
      const sids = [...v.sourceIds].sort();
      const merged = mergedArtifacts.filter((a) => a.sources.some((s) => sids.includes(s)));
      return {
        origin: label,
        countsAs: "1 independent origin",
        evidenceIds: ev,
        sourceIds: sids,
        reasons: explainCluster({ label, sourceIds: sids, evidenceIds: ev, mergedArtifacts: merged, info })
      };
    });
    const originOfSource = new Map(sup.flatMap((o) => o.sourceIds.map((sid) => [sid, o.origin])));
    const originOfEvidence = new Map(sup.flatMap((o) => o.evidenceIds.map((eid) => [eid, o.origin])));
    const touches = (o, set) => o.origin.split("+").some((r) => set.includes(r));
    const cues = warnings.filter((w) => {
      if (w.rootSets) return w.rootSets.some((A, i) => w.rootSets.some((B, j) => i !== j && sup.some((o1) => touches(o1, A) && sup.some((o2) => o2 !== o1 && touches(o2, B)))));
      return new Set((w.sourceIds ?? []).map((x) => originOfSource.get(x)).concat((w.evidenceIds ?? []).map((x) => originOfEvidence.get(x))).filter(Boolean)).size >= 2;
    });
    const decision = status === "supported_by_independent_origins" && cues.length ? "abstain_possible_undeclared_dependence" : status;
    if (decision !== status) why.push(`ABSTAINING from "supported": heuristic cue(s) ${cues.map((w) => w.code).join(", ")} suggest that some of these origins may share an undeclared source. Hard classification remains "${status}"; resolve the cue before relying on it.`);
    const gaps = analyzeGaps({ claimId: claim.id, status, support: sup, contradict: con, supportItems, contradictItems, integrityByEvidence, integrityMode: integrity.mode, excludedMismatch, threshold: th });
    return {
      claimId: claim.id,
      statement: claim.statement,
      status,
      decision,
      abstentionCues: cues.map((w) => w.code),
      supportScore,
      contradictScore,
      independentSupportOrigins: sup,
      independentContradictOrigins: con,
      explanation: why,
      corroboration: {
        supportingEvidenceItems: supportItems.length,
        independentSupportOrigins: sup.length,
        apparentExcess: Math.max(0, supportItems.length - sup.length),
        falseCorroboration: supportItems.length >= 2 && supportItems.length > sup.length,
        independenceBasis: "declared_provenance_not_independently_verified",
        approximate,
        clusters: { supports: clusterOf(sideMaps.supports), contradicts: clusterOf(sideMaps.contradicts) }
      },
      findings: gaps.findings,
      requirements: gaps.requirements,
      assumptions: buildAssumptions({ hasEvidence: sup.length + con.length > 0, supportItems, integrityByEvidence, threshold: th }),
      plan: planClaim({ status, support: sup, contradict: con, threshold: th, cues, supportItems, integrityByEvidence, excludedMismatch, combine })
    };
  });
  const counts = {}, decisions = {};
  for (const cl of claims) {
    counts[cl.status] = (counts[cl.status] ?? 0) + 1;
    decisions[cl.decision] = (decisions[cl.decision] ?? 0) + 1;
  }
  if (duplicates.length) notes.push(`${duplicates.length} duplicate evidence item(s) were merged into their canonical artifact; their links are kept but count once.`);
  if (excludedByIntegrity.length) notes.push(`${excludedByIntegrity.length} evidence item(s) failed SHA-256 verification and were excluded from scoring.`);
  return {
    tool: "proofgap-x",
    analysisVersion: ANALYSIS_VERSION,
    schemaVersion: "1.0",
    caseId: c.caseId,
    title: c.title,
    inputSha256: createHash("sha256").update(canonicalize(c)).digest("hex"),
    disclaimer: profile.disclaimer,
    ...opts.profile ? { application: profile.id } : {},
    policy: POLICY,
    trust: {
      declaredOnly: ["derivedFrom", "originGroup", "strength", "stance", "sha256 values whose integrity status is not VERIFIED"],
      independentlyVerified: { sha256Matches: integrity.counts.VERIFIED ?? 0, provenance: 0, independence: 0 },
      note: "Only SHA-256 byte equality against local files can be verified by this tool. Provenance and independence are never verified."
    },
    summary: { claims: claims.length, evidence: c.evidence.length, effectiveEvidence: classes.length, statusCounts: Object.fromEntries(Object.entries(counts).sort()), decisionCounts: Object.fromEntries(Object.entries(decisions).sort()) },
    integrity,
    duplicates,
    artifacts: mergedArtifacts,
    excludedByIntegrity,
    derivedSources,
    claims,
    warnings,
    notes,
    graph: buildGraph({ c, classes, roots, integrityByEvidence, warnings, claims })
  };
}

// src/report.js
function serializeReport(report) {
  const sorted = JSON.parse(canonicalize(report));
  return JSON.stringify(sorted, null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + "\n";
}

// tools/case-builder-core.js
var safeId = /^[A-Za-z0-9_.-]{1,64}$/;
var forbidden = /[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/;
function id(x) {
  return typeof x === "string" && safeId.test(x);
}
var loneSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
function name(x) {
  return typeof x === "string" && x.trim().length > 0 && x.length <= 2e3 && !forbidden.test(x) && !loneSurrogate.test(x);
}
function reject(message) {
  throw new Error(message);
}
function unique(items, label) {
  const all = /* @__PURE__ */ new Set();
  for (const x of items) {
    if (!id(x.id)) reject(label + " ID must use Latin letters, numbers, period, dash or underscore");
    if (all.has(x.id)) reject("Duplicate " + label + " ID: " + x.id);
    all.add(x.id);
  }
  return all;
}
function buildCaseFromRows(input) {
  if (!input || typeof input !== "object") reject("Invalid form");
  const sources = input.sources || [], claims = input.claims || [], evidence = input.evidence || [];
  if (!id(input.caseId) || !name(input.title)) reject("Valid case ID and title are required");
  if (!Array.isArray(sources) || !Array.isArray(claims) || !Array.isArray(evidence) || sources.length < 1 || claims.length < 1 || evidence.length < 1) reject("At least one source, claim and evidence item required");
  if (sources.length > 40 || claims.length > 30 || evidence.length > 80) reject("Builder limits exceeded");
  const sourceIds = unique(sources, "source"), claimIds = unique(claims, "claim");
  unique(evidence, "evidence");
  const src = sources.map((s) => {
    if (!name(s.name)) reject("Source name required");
    const parents = String(s.derivedFrom || "").split(",").map((x) => x.trim()).filter(Boolean);
    if (parents.length > 20 || new Set(parents).size !== parents.length) reject("Duplicate or excessive parent references");
    for (const p of parents) if (!sourceIds.has(p) || p === s.id) reject("Invalid upstream source: " + p);
    const grp = String(s.originGroup || "").trim();
    if (grp && !id(grp)) reject("Invalid origin-group identifier");
    return { id: s.id, name: s.name.trim(), ...parents.length ? { derivedFrom: parents } : {}, ...grp ? { originGroup: grp } : {} };
  });
  const by = new Map(src.map((s) => [s.id, s]));
  const seen = /* @__PURE__ */ new Set(), active = /* @__PURE__ */ new Set();
  function visit(k, depth) {
    if (depth > 50 || active.has(k)) reject("Circular or too-deep source ancestry");
    if (seen.has(k)) return;
    active.add(k);
    for (const p of by.get(k).derivedFrom || []) visit(p, depth + 1);
    active.delete(k);
    seen.add(k);
  }
  for (const s of src) visit(s.id, 0);
  const cl = claims.map((c) => {
    if (!name(c.statement)) reject("Claim statement required");
    return { id: c.id, statement: c.statement.trim() };
  });
  const ev = evidence.map((e) => {
    if (!sourceIds.has(e.sourceId) || !claimIds.has(e.claimId)) reject("Evidence must reference an existing source and claim");
    if (!name(e.description)) reject("Evidence description required");
    const strength = Number(e.strength);
    if (String(e.strength).trim() === "" || !Number.isFinite(strength) || strength < 0 || strength > 1) reject("Strength must be a declared estimate in [0, 1]");
    if (!["supports", "contradicts"].includes(e.stance)) reject("Unsupported evidence stance");
    return { id: e.id, sourceId: e.sourceId, description: e.description.trim(), links: [{ claimId: e.claimId, stance: e.stance, strength }] };
  });
  return { schemaVersion: "1.0", caseId: input.caseId, title: input.title.trim(), sources: src, claims: cl, evidence: ev };
}

// tools/browser-engine-entry.js
function analyzeBuilderRows(input) {
  const validated = buildCaseFromRows(input);
  const report = analyzeCase(validated);
  return { caseData: validated, report, reportText: serializeReport(report) };
}
export {
  analyzeBuilderRows
};
