// ProofGap X offline report viewer.
// SECURITY: every untrusted string is inserted with textContent / createTextNode. HTML-string insertion APIs are never used; no eval,
// no network. Reports are read from embedded JSON data blocks or local files the user picks.
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var L = ProofGapLocale.t;
  var DECISION_KEYS = {
    supported_by_independent_origins:'supported',
    abstain_possible_undeclared_dependence:'abstainHidden',
    insufficient_support:'insufficient',
    conflicting:'conflicting', contradicted:'contradicted', no_evidence:'noEvidence',
    independently_corroborated:'corroborated', abstain_suspected_shared_origin:'abstainShared',
    origin_unresolved:'unresolved', single_origin:'singleOrigin',
    circular_reporting:'circular', unsupported:'unsupported'
  };

  var DECISION = {
    supported_by_independent_origins: ['Supported (declared assumptions)', 'ok'],
    abstain_possible_undeclared_dependence: ['Abstains: possible hidden shared source', 'warn'],
    insufficient_support: ['Insufficient independent support', 'bad'],
    conflicting: ['Conflicting evidence', 'warn'],
    contradicted: ['Contradicted', 'bad'],
    no_evidence: ['No evidence', 'bad'],
    // ProofGap Cite verdicts
    independently_corroborated: ['Independently corroborated (declared lineage)', 'ok'],
    abstain_suspected_shared_origin: ['Abstains: may be the same source', 'warn'],
    origin_unresolved: ['Origin unresolved', 'warn'],
    single_origin: ['Single origin', 'bad'],
    circular_reporting: ['Circular reporting', 'bad'],
    unsupported: ['Unsupported', 'bad'],
  };
  var BASIS_HELP = {
    verified: 'bytes hashed by this tool and identical (says nothing about who created them)',
    declared: 'stated by the case author, not verified',
    suspected: 'heuristic cue only; never changes scores',
    unknown: 'no declared link; independence assumed by policy, not established',
  };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, String(attrs[k])); });
    (children || []).forEach(function (c) { n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function svg(tag, attrs, children) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, String(attrs[k])); });
    (children || []).forEach(function (c) { n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function badge(decision) { var d = DECISION[decision] || [decision, 'warn']; return el('span', { class: 'badge ' + d[1] }, [DECISION_KEYS[decision] ? L(DECISION_KEYS[decision]) : d[0]]); }
  function ids(xs) { return xs.map(function (x) { return x; }).join(', '); }
  function clip(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '\u2026' : s; }

  // ---------- independence graph (deterministic layered layout) ----------
  function graphView(report, uid) {
    var g = report.graph;
    var observedOnly = {};
    report.integrity.results.forEach(function (x) { if (!x.declaredSha256 && x.observedSha256 && !x.observedEmpty) observedOnly[x.evidenceId] = true; });
    var cols = { source: [], evidence: [], claim: [] };
    g.nodes.forEach(function (n) { if (cols[n.type]) cols[n.type].push(n); });
    // sources: originals first, then by number of roots (deeper derivations later), then id
    cols.source.sort(function (a, b) { var ra = a.role === 'declared_original' ? 0 : 1, rb = b.role === 'declared_original' ? 0 : 1; return ra - rb || a.roots.length - b.roots.length || (a.ref < b.ref ? -1 : 1); });
    var X = { source: 120, evidence: 400, claim: 680 }, rowH = 46, top = 40;
    var pos = {};
    var rows = Math.max(cols.source.length, cols.evidence.length, cols.claim.length);
    ['source', 'evidence', 'claim'].forEach(function (t) {
      var list = cols[t], offset = top + ((rows - list.length) * rowH) / 2;
      list.forEach(function (n, i) { pos[n.id] = { x: X[t], y: offset + i * rowH }; });
    });
    var H = top + rows * rowH + 10;
    var root = svg('svg', { viewBox: '0 0 800 ' + H, class: 'graph', role: 'img', 'aria-labelledby': uid + '-gt ' + uid + '-gd' });
    root.appendChild(svg('title', { id: uid + '-gt' }, ['Evidence independence graph for ' + report.caseId]));
    root.appendChild(svg('desc', { id: uid + '-gd' }, ['Sources on the left, evidence in the middle, claims on the right. A text version of every relationship follows the graph.']));
    var defs = svg('defs', {});
    ['declared', 'verified', 'suspected'].forEach(function (b) {
      defs.appendChild(svg('marker', { id: uid + '-arrow-' + b, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, [svg('path', { d: 'M0,0 L10,5 L0,10 z', class: 'arrow ' + b })]));
    });
    root.appendChild(defs);
    [[L('sources'), X.source], [L('evidence'), X.evidence], [L('claims'), X.claim]].forEach(function (h) { root.appendChild(svg('text', { x: h[1], y: 18, class: 'colhead', 'text-anchor': 'middle' }, [h[0]])); });
    var edgeLayer = svg('g', {}), nodeLayer = svg('g', {});
    root.appendChild(edgeLayer); root.appendChild(nodeLayer);
    g.edges.forEach(function (e) {
      var a = pos[e.from], b = pos[e.to];
      if (!a || !b) return; // origin-level "unknown" edges are listed in the claim cards instead
      var cls = 'edge ' + e.basis + ' rel-' + e.relation;
      var d;
      if (a.x === b.x) { var bend = e.relation === 'same_bytes' || e.relation === 'same_source_and_description' ? 70 : -70; d = 'M' + (a.x + (bend > 0 ? 60 : -60)) + ',' + a.y + ' C' + (a.x + bend + 40 * Math.sign(bend)) + ',' + a.y + ' ' + (b.x + bend + 40 * Math.sign(bend)) + ',' + b.y + ' ' + (b.x + (bend > 0 ? 60 : -60)) + ',' + b.y; }
      else { var x1 = a.x + (a.x < b.x ? 62 : -62), x2 = b.x + (a.x < b.x ? -62 : 62); d = 'M' + x1 + ',' + a.y + ' C' + (x1 + x2) / 2 + ',' + a.y + ' ' + (x1 + x2) / 2 + ',' + b.y + ' ' + x2 + ',' + b.y; }
      var pa = { d: d, class: cls };
      if (e.relation === 'derived_from' || e.relation === 'held_by') pa['marker-end'] = 'url(#' + uid + '-arrow-' + (e.basis === 'suspected' || e.basis === 'verified' ? e.basis : 'declared') + ')';
      var p = svg('path', pa);
      p.appendChild(svg('title', {}, [e.relation + ' (' + e.basis + ')' + (e.cue ? ' — ' + e.cue : '') + (e.discoveredBy === 'local_hashing' ? ' — found by hashing local files; not declared by the case author' : '')]));
      edgeLayer.appendChild(p);
    });
    g.nodes.forEach(function (n) {
      var p = pos[n.id]; if (!p) return;
      var cls = 'node ' + n.type + (n.role ? ' ' + n.role : '') + (n.integrity ? ' int-' + n.integrity : '') + (n.decision ? ' dec-' + n.decision : '');
      var grp = svg('g', { class: cls, transform: 'translate(' + p.x + ',' + p.y + ')', tabindex: 0 });
      grp.appendChild(svg('title', {}, [n.type + ' ' + n.ref + ': ' + n.label + (n.integrity ? ' — integrity ' + n.integrity : '') + (n.decision ? ' — ' + n.decision : '') + (n.role ? ' — ' + n.role.replace(/_/g, ' ') : '')]));
      grp.appendChild(svg('rect', { x: -60, y: -16, width: 120, height: 32, rx: n.type === 'claim' ? 16 : 5 }));
      grp.appendChild(svg('text', { y: -2, 'text-anchor': 'middle', class: 'nid' }, [clip(n.ref, 18)]));
      var sub = n.type === 'evidence' ? (observedOnly[n.ref] ? 'HASHED LOCALLY' : n.integrity) : n.type === 'claim' ? (DECISION_KEYS[n.decision] ? L(DECISION_KEYS[n.decision]) : n.decision) : n.role.replace(/_/g, ' ');
      grp.appendChild(svg('text', { y: 11, 'text-anchor': 'middle', class: 'nlabel' }, [clip(sub, 24)]));
      nodeLayer.appendChild(grp);
    });
    var wrap = el('figure', { class: 'graphwrap' }, [root]);
    var legend = el('figcaption', { class: 'legend' }, Object.keys(BASIS_HELP).map(function (b) {
      return el('span', { class: 'lg' }, [el('span', { class: 'sw ' + b, 'aria-hidden': 'true' }), el('strong', {}, [b]), ' - ' + BASIS_HELP[b] + ' (' + g.basisCounts[b] + ')']);
    }));
    wrap.appendChild(legend);
    // text alternative
    var tbl = el('table', { class: 'edges' }, [el('caption', {}, ['All relationships (' + g.edges.length + ')']), el('thead', {}, [el('tr', {}, ['From', 'Relation', 'To', 'Basis'].map(function (h) { return el('th', { scope: 'col' }, [h]); }))])]);
    var tb = el('tbody');
    g.edges.forEach(function (e) { tb.appendChild(el('tr', { class: 'b-' + e.basis }, [el('td', {}, [e.from]), el('td', {}, [e.relation + (e.cue ? ' (' + e.cue + ')' : '') + (e.discoveredBy ? ' (found by local hashing)' : '')]), el('td', {}, [e.to]), el('td', {}, [e.basis])])); });
    tbl.appendChild(tb);
    var det = el('details', { class: 'edgelist' }, [el('summary', {}, [L('graphText')]), tbl]);
    return el('section', { class: 'card', 'aria-label': 'Independence graph' }, [el('h3', {}, [L('graphHeading')]), wrap, det]);
  }

  // ---------- claims ----------
  function claimCard(c) {
    var k = c.corroboration;
    var head = el('div', { class: 'claimhead' }, [el('h4', {}, [(c.line ? 'line ' + c.line + ' \u00b7 ' : '') + c.claimId + ': ' + c.statement]), badge(c.decision)]);
    var big = el('p', { class: 'collapse' }, [
      el('span', { class: 'n items' }, [String(k.supportingEvidenceItems)]), ' supporting item(s) collapse to ',
      el('span', { class: 'n origins' }, [String(k.independentSupportOrigins)]), ' independent origin(s)',
      k.falseCorroboration ? el('span', { class: 'flag' }, [' FALSE CORROBORATION']) : '',
    ]);
    var meta = el('p', { class: 'meta' }, [(c.coreDecision ? 'Core decision: ' + c.coreDecision + ' \u00b7 ' : '') + 'Hard classification: ' + c.status + ' \u00b7 support score ' + c.supportScore + ' \u00b7 contradict score ' + c.contradictScore + (k.approximate ? ' \u00b7 approximate grouping' : '')]);
    var why = el('ul', { class: 'why' }, c.explanation.map(function (t) { return el('li', {}, [t]); }));
    var card = el('article', { class: 'claim dec-' + c.decision }, [head, big, meta, why]);
    if (Array.isArray(c.missing) && c.missing.length) {
      card.appendChild(el('div', { class: 'missing' }, [el('h5', {}, [L('missing')]), el('ul', {}, c.missing.map(function (m) { return el('li', {}, [m]); }))]));
    }
    if (k.clusters.supports.length || k.clusters.contradicts.length) {
      var cl = el('details', { open: '' }, [el('summary', {}, ['Why these count as ' + k.independentSupportOrigins + ' origin(s)'])]);
      k.clusters.supports.concat(k.clusters.contradicts.map(function (x) { return Object.assign({ contra: true }, x); })).forEach(function (o) {
        cl.appendChild(el('div', { class: 'cluster' + (o.contra ? ' contra' : '') }, [
          el('p', {}, [el('strong', {}, [(o.contra ? 'Contradicting origin ' : 'Origin ') + o.origin]), ' \u2014 items ' + ids(o.evidenceIds)]),
          el('ul', {}, (o.reasons || []).map(function (r) { return el('li', {}, [r]); })),
        ]));
      });
      card.appendChild(cl);
    }
    if (c.findings.length) {
      card.appendChild(el('h5', {}, ['Proof gaps (logical: follow from the declared data and policy)']));
      card.appendChild(el('ul', { class: 'findings' }, c.findings.map(function (f) { return el('li', { class: 'sev-' + f.severity }, [el('span', { class: 'sev' }, [f.severity]), ' ' + f.code + ': ' + f.message]); })));
    }
    if (c.plan && c.plan.steps.length) {
      var plan = el('details', { class: 'plan', open: '' }, [el('summary', {}, [L('plan') + (c.plan.smallestChange ? ' \u2014 smallest change: ' + c.plan.smallestChange.minimalCount + ' \u00d7 ' + c.plan.smallestChange.stepId : '')])]);
      plan.appendChild(el('p', { class: 'note' }, ['Hypothetical only. Outcomes are what the same policy would decide; no listed item is claimed to exist.']));
      c.plan.steps.forEach(function (st) {
        var t = el('table', { class: 'outcomes' }, [el('caption', {}, [st.id + ' (' + st.kind + ', minimal ' + st.minimalCount + '): ' + st.requirement]),
          el('thead', {}, [el('tr', {}, ['If\u2026', 'Then status', 'Support / contra origins'].map(function (h) { return el('th', { scope: 'col' }, [h]); }))])]);
        var tb = el('tbody');
        st.outcomes.forEach(function (o) { tb.appendChild(el('tr', { class: o.resultingStatus === c.status ? 'same' : 'changes' }, [el('td', {}, [o.outcome + (o.note ? ' (' + o.note + ')' : '')]), el('td', {}, [o.resultingStatus]), el('td', {}, [o.supportOrigins + ' / ' + o.contradictOrigins])])); });
        t.appendChild(tb); plan.appendChild(t);
      });
      card.appendChild(plan);
    }
    if (c.requirements.length) {
      var rq = el('details', {}, [el('summary', {}, [L('next')])]);
      rq.appendChild(el('ol', {}, c.requirements.map(function (r) { return el('li', {}, [r.action, el('br'), el('small', {}, ['Would show: ' + r.wouldShow]), el('br'), el('small', { class: 'wouldnot' }, ['Would NOT show: ' + r.wouldNotShow])]); })));
      card.appendChild(rq);
    }
    if (c.assumptions.length) card.appendChild(el('details', {}, [el('summary', {}, [L('assumptions')]), el('ul', {}, c.assumptions.map(function (a) { return el('li', {}, [a]); }))]));
    return card;
  }

  function integrityCard(r) {
    var i = r.integrity;
    var rows = i.results.filter(function (x) { return x.declaredSha256 || x.observedSha256; });
    var t = el('table', { class: 'integrity' }, [el('caption', {}, ['Source verification: ' + (i.mode === 'not_requested' ? 'NOT REQUESTED \u2014 declared hashes are unverified' : 'checked against a local evidence directory')]),
      el('thead', {}, [el('tr', {}, ['Evidence', 'Status', 'Reason'].map(function (h) { return el('th', { scope: 'col' }, [h]); }))])]);
    var tb = el('tbody');
    rows.forEach(function (x) {
      var why = x.verified ? 'bytes match declared SHA-256 (not proof of authenticity)'
        : (!x.declaredSha256 && x.observedSha256) ? 'no declared hash; bytes hashed locally ' + x.observedSha256.slice(0, 12) + '\u2026' + (x.observedEmpty ? ' (empty file, not used for linking)' : '')
        : (x.reason || '');
      tb.appendChild(el('tr', { class: 'int-' + x.status }, [el('td', {}, [x.evidenceId]), el('td', {}, [x.status]), el('td', {}, [why])]));
    });
    if (!rows.length) tb.appendChild(el('tr', {}, [el('td', { colspan: 3 }, ['No evidence item declares a SHA-256 or names a local file.'])]));
    t.appendChild(tb);
    var counts = el('p', { class: 'meta' }, Object.keys(i.counts).map(function (k) { return k + ' ' + i.counts[k] + '  '; }));
    return el('section', { class: 'card' }, [el('h3', {}, [L('verifyHeading')]), counts, t]);
  }

  function panel(report, raw, idx) {
    var uid = 'r' + idx;
    var s = report.summary;
    var dl = el('button', { type: 'button', class: 'export' }, [L('export')]);
    dl.addEventListener('click', function () {
      var blob = new Blob([raw], { type: 'application/json' });
      var a = el('a', { href: URL.createObjectURL(blob), download: report.caseId + '.proofgap-report.json' });
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    });
    var hdr = el('header', { class: 'phead' }, [
      el('h2', {}, [report.title]),
      el('p', { class: 'meta' }, ['Case ' + report.caseId + ' \u00b7 analysis ' + report.analysisVersion + ' \u00b7 input SHA-256 ' + report.inputSha256.slice(0, 16) + '\u2026']),
      el('p', { class: 'disclaimer' }, [report.disclaimer]),
      el('p', { class: 'chips' }, Object.keys(s.decisionCounts || {}).map(function (d) { return el('span', { class: 'chip' }, [badge(d), ' \u00d7 ' + s.decisionCounts[d]]); })),
      dl,
    ]);
    var claims = el('section', { class: 'card' }, [el('h3', {}, [L('claimsHeading')])].concat(report.claims.map(claimCard)));
    var warn = report.warnings.length ? el('section', { class: 'card' }, [el('h3', {}, ['Suspected hidden dependence (heuristic warnings)']), el('ul', {}, report.warnings.map(function (w) { return el('li', {}, [w.code + ': ' + w.message]); }))]) : null;
    var kids = [hdr, claims, graphView(report, uid), integrityCard(report)];
    if (warn) kids.push(warn);
    return el('div', { class: 'panel', role: 'region', 'aria-label': 'Report ' + report.caseId }, kids);
  }

  function valid(r) { return r && r.tool === 'proofgap-x' && Array.isArray(r.claims) && r.graph && Array.isArray(r.graph.nodes) && r.integrity && r.summary; }

  var currentReports = [];
  function render(list) {
    currentReports = list;
    var main = document.getElementById('reports');
    while (main.firstChild) main.removeChild(main.firstChild);
    main.className = list.length > 1 ? 'grid two' : 'grid';
    list.forEach(function (x, i) { main.appendChild(panel(x.report, x.raw, i)); });
    var st = document.getElementById('status');
    st.textContent = list.length ? L('showing',{n:list.length}) : L('noReport');
  }

  function fromEmbedded() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll('script[type="application/json"].pgx-report'), function (s) {
      try { var r = JSON.parse(s.textContent); if (valid(r)) out.push({ report: r, raw: s.textContent.trim() + '\n' }); } catch (e) { /* ignore malformed block */ }
    });
    return out;
  }

  document.addEventListener('DOMContentLoaded', function () {
    ProofGapLocale.set(ProofGapLocale.detect());
    var language = document.getElementById('pg-language');
    if (language) language.addEventListener('change', function () { ProofGapLocale.set(language.value); render(currentReports); });
    render(fromEmbedded());
    var input = document.getElementById('file');
    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files, 0, 2), out = [], left = files.length, err = [];
      if (!left) return;
      files.forEach(function (f, i) {
        if (f.size > 60 * 1024 * 1024) { err.push(f.name + ': too large'); if (--left === 0) done(); return; }
        var rd = new FileReader();
        rd.onload = function () { try { var r = JSON.parse(rd.result); if (valid(r)) out[i] = { report: r, raw: rd.result }; else err.push(f.name + ': not a ProofGap X report'); } catch (e) { err.push(f.name + ': invalid JSON'); } if (--left === 0) done(); };
        rd.readAsText(f);
      });
      function done() { render(out.filter(Boolean)); if (err.length) document.getElementById('status').textContent += ' Skipped: ' + err.join('; '); }
    });
  });
})();
