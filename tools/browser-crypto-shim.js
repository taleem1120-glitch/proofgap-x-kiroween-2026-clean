// Browser-only SHA-256 compatibility for the unchanged ProofGap analysis core.
// Uses audited @noble/hashes (MIT), bundled in the deterministic browser artifact.
import {sha256} from '@noble/hashes/sha256';
import {bytesToHex, utf8ToBytes} from '@noble/hashes/utils';
export function createHash(algorithm) {
 if (algorithm!=='sha256') throw new TypeError('Browser engine supports SHA-256 only');
 let chunks=[];
 return {
  update(data) {
   if (typeof data!=='string') throw new TypeError('Only UTF-8 string hashing is supported');
   chunks.push(data);
   return this;
  },
  digest(format) {
   if(format!=='hex') throw new TypeError('Expected hex digest');
   const bytes=utf8ToBytes(chunks.join(''));
   chunks=[];
   return bytesToHex(sha256(bytes));
  }
 };
}
