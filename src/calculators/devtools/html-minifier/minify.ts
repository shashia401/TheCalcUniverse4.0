// Conservative, semantics-preserving minifiers. Regex-only minifiers silently corrupt code (collapsing "a  b" inside a
// <textarea>, deleting "//" inside the string "http://x", turning "a + +b" into "a++b"), so these protect the regions
// whose whitespace or text is significant and only remove what is provably redundant.

const BLOCK = new Set(
  ('html head body title meta link base script style noscript template div p ul ol li dl dt dd table caption colgroup col thead tbody tfoot tr td th ' +
    'h1 h2 h3 h4 h5 h6 section article header footer nav main aside form fieldset legend blockquote hr br pre figure figcaption details summary ' +
    'select option optgroup address menu dialog').split(' '),
);
const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
const TAG_RE = /<\/?[A-Za-z](?:"[^"]*"|'[^']*'|[^>"'])*>|<![^>]*>/g;
const PROTECTED_RE = /<(pre|textarea|script|style)\b(?:"[^"]*"|'[^']*'|[^>"'])*>[\s\S]*?<\/\1\s*>/gi;

/** Collapse whitespace and drop optional quotes inside ONE tag, never touching quoted attribute values. */
function minifyTag(tag: string): string {
  if (tag.startsWith('<!')) return tag;
  // "<path d=M0/>" would parse as d="M0/" and SVG needs the self-closing slash, so quotes stay in self-closing tags
  const selfClosing = /\/\s*>$/.test(tag);
  let out = '';
  let i = 0;
  while (i < tag.length) {
    const c = tag[i];
    if (c === '"' || c === "'") {
      const end = tag.indexOf(c, i + 1);
      const stop = end === -1 ? tag.length : end + 1;
      const value = tag.slice(i + 1, end === -1 ? tag.length : end);
      out += !selfClosing && end !== -1 && /^[A-Za-z0-9_.\-:]+$/.test(value) && out.endsWith('=') ? value : tag.slice(i, stop);
      i = stop;
    } else if (/\s/.test(c)) {
      while (i < tag.length && /\s/.test(tag[i])) i++;
      const next = tag[i];
      const prev = out[out.length - 1];
      if (next === '>' || next === '=' || prev === '=' || (next === '/' && tag[i + 1] === '>')) continue; // whitespace around = and before > is redundant
      out += ' ';
    } else {
      out += c;
      i++;
    }
  }
  const name = /^<\/?([A-Za-z][A-Za-z0-9-]*)/.exec(out)?.[1]?.toLowerCase();
  if (name && VOID.has(name)) out = out.replace(/\s*\/>$/, '>');
  return out;
}

export function minifyHtml(code: string): string {
  const kept: string[] = [];
  let src = code.replace(PROTECTED_RE, (m) => {
    kept.push(m);
    return `\x00${kept.length - 1}\x00`;
  });
  // Comments are removed, except IE conditional comments, which are kept whole: the hidden form
  // "<!--[if IE]> ... <![endif]-->" and the revealed form "<!--[if !IE]><!--> ... <!--<![endif]-->". The revealed start
  // is listed first so its "<!-->" cannot be mistaken for the start of an ordinary comment that swallows the content.
  src = src.replace(
    /<!--\[if\b[^\]]*\]><!-->|<!--\[if\b[\s\S]*?<!\[endif\]-->|<!--<!\[endif\]-->|<!---?>|<!--[\s\S]*?-->/g,
    (m) => (m.startsWith('<!--[if') || m === '<!--<![endif]-->' ? m : ''),
  );

  const tokens: { tag: boolean; s: string }[] = [];
  let last = 0;
  for (const m of src.matchAll(TAG_RE)) {
    if (m.index! > last) tokens.push({ tag: false, s: src.slice(last, m.index) });
    tokens.push({ tag: true, s: minifyTag(m[0]) });
    last = m.index! + m[0].length;
  }
  if (last < src.length) tokens.push({ tag: false, s: src.slice(last) });

  const tagName = (t: string) => /^<\/?([A-Za-z][A-Za-z0-9-]*)/.exec(t)?.[1]?.toLowerCase() ?? '';
  // whitespace next to a block-level tag (or the document edge) is insignificant; next to inline tags it separates words
  const isBlockTag = (t?: { tag: boolean; s: string }) => !t || (t.tag && (t.s.startsWith('<!') || BLOCK.has(tagName(t.s))));
  let out = '';
  tokens.forEach((t, i) => {
    if (t.tag) {
      out += t.s;
      return;
    }
    let text = t.s.replace(/\s+/g, ' ');
    if (isBlockTag(tokens[i - 1])) text = text.replace(/^ /, '');
    if (isBlockTag(tokens[i + 1])) text = text.replace(/ $/, '');
    out += text;
  });
  out = out.replace(/\x00(\d+)\x00/g, (_, i) => kept[Number(i)]);
  return out.trim();
}

export function minifyCss(code: string): string {
  const kept: string[] = [];
  // ONE pass over comments, strings and url(): a quote inside a comment must not start a string, and "/*" inside a string is text
  let r = code.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|url\(\s*[^)]*\)/gi, (m) => {
    if (m.startsWith('/*')) return '';
    kept.push(m);
    return `\x00${kept.length - 1}\x00`;
  });
  r = r.replace(/calc\((?:[^()]|\([^()]*\))*\)/gi, (m) => {
    kept.push(m); // operators inside calc() need their spaces
    return `\x00${kept.length - 1}\x00`;
  });
  r = r.replace(/\s+/g, ' ');
  r = r.replace(/\s*([{};,>~+])\s*/g, '$1');
  // "property: value" -> "property:value" only inside declarations (segments ending in ; or }), never in selectors ("a :hover" != "a:hover")
  r = r.replace(/([^{};]+)(?=[;}])/g, (seg) => seg.replace(/\s*:\s*/, ':'));
  r = r.replace(/;}/g, '}');
  // placeholders may nest (a calc() holding a kept string), so restore until none are left
  for (let k = 0; k < 3 && /\x00\d+\x00/.test(r); k++) r = r.replace(/\x00(\d+)\x00/g, (_, i) => kept[Number(i)]);
  return r.trim();
}

/**
 * Conservative JavaScript "minifier": removes comments, indentation, trailing spaces and blank lines. It keeps every line
 * break (so automatic semicolon insertion is unaffected) and never edits strings, template literals or regex literals.
 * It does NOT rename variables or remove spaces around operators: that needs a real parser (terser, esbuild).
 */
export function minifyJs(code: string): string {
  const parts: { s: string; code: boolean }[] = [];
  let buf = '';
  let tail = '';
  const push = (s: string, isCode: boolean) => {
    if (isCode) buf += s;
    else {
      if (buf) parts.push({ s: buf, code: true });
      buf = '';
      parts.push({ s, code: false });
    }
    tail = (tail + s).slice(-24);
  };
  const regexAllowedAfter = /[(,=:[!&|?{};+\-*%<>~^]$|(?:^|[^\w$])(?:return|typeof|case|in|of|delete|void|throw|new|else|do)$/;
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    const next = code[i + 1];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && code[j] !== c) j += code[j] === '\\' ? 2 : 1;
      push(code.slice(i, j + 1), false);
      i = j + 1;
    } else if (c === '/' && next === '/') {
      while (i < n && code[i] !== '\n') i++;
    } else if (c === '/' && next === '*') {
      const end = code.indexOf('*/', i + 2);
      const comment = code.slice(i, end === -1 ? n : end + 2);
      push(comment.includes('\n') ? '\n' : ' ', true);
      i = end === -1 ? n : end + 2;
    } else if (c === '/' && (tail.trim() === '' || regexAllowedAfter.test(tail.trimEnd()))) {
      let j = i + 1;
      let inClass = false;
      while (j < n && (code[j] !== '/' || inClass) && code[j] !== '\n') {
        if (code[j] === '\\') j++;
        else if (code[j] === '[') inClass = true;
        else if (code[j] === ']') inClass = false;
        j++;
      }
      j++;
      while (j < n && /[a-z]/i.test(code[j])) j++; // flags
      push(code.slice(i, j), false);
      i = j;
    } else {
      push(c, true);
      i++;
    }
  }
  if (buf) parts.push({ s: buf, code: true });
  // whitespace cleanup only in code pieces (never inside strings / template literals / regex literals)
  return parts
    .map((p) => (p.code ? p.s.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/\n{2,}/g, '\n').replace(/[ \t]{2,}/g, ' ') : p.s))
    .join('')
    .trim();
}
