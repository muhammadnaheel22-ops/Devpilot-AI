export const formatJson = (value, indent = 2) => JSON.stringify(JSON.parse(value), null, indent);
export const minifyJson = (value) => JSON.stringify(JSON.parse(value));
export const encodeBase64 = (value) => btoa(unescape(encodeURIComponent(value)));
export const decodeBase64 = (value) => decodeURIComponent(escape(atob(value)));
export const uuid = () => crypto.randomUUID();

export const generatePassword = (length = 20) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(values, (value) => chars[value % chars.length]).join('');
};

export const decodeJwt = (token) =>
  JSON.parse(decodeBase64(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

export const timestampInfo = (value) => {
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(String(Math.trunc(numeric)).length <= 10 ? numeric * 1000 : numeric)
    : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date or Unix timestamp.');
  return {
    iso: date.toISOString(),
    local: date.toLocaleString(),
    unixSeconds: Math.floor(date.getTime() / 1000),
    unixMilliseconds: date.getTime(),
  };
};

export const hexToRgb = (hex) => {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) throw new Error('Use a six-digit hex color.');
  const value = Number.parseInt(normalized, 16);
  return {
    hex: `#${normalized.toUpperCase()}`,
    rgb: `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`,
  };
};

const loremSentence =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
export const generateLorem = (paragraphs = 3) =>
  Array.from({ length: Math.max(1, Math.min(20, Number(paragraphs) || 3)) }, (_, index) =>
    Array.from({ length: 3 + (index % 3) }, () => loremSentence).join(' '),
  ).join('\n\n');

export const minifyCss = (value) =>
  value
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();

export const beautifyCss = (value) => {
  let indent = 0;
  return minifyCss(value)
    .replace(/\{/g, ' {\n')
    .replace(/;/g, ';\n')
    .replace(/\}/g, '\n}\n')
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('}')) indent = Math.max(0, indent - 1);
      const result = `${'  '.repeat(indent)}${trimmed}`;
      if (trimmed.endsWith('{')) indent += 1;
      return result;
    })
    .filter(Boolean)
    .join('\n');
};

// Conservative whitespace minification. It intentionally does not remove comments inside strings.
export const minifyJavaScript = (value) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');

export const diffLines = (before, after) => {
  const left = before.split('\n');
  const right = after.split('\n');
  const length = Math.max(left.length, right.length);
  return Array.from({ length }, (_, index) => {
    if (left[index] === right[index]) return `  ${right[index] ?? ''}`;
    return `${left[index] !== undefined ? `- ${left[index]}\n` : ''}${
      right[index] !== undefined ? `+ ${right[index]}` : ''
    }`;
  }).join('\n');
};

export const parseEnv = (value) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .reduce((result, line) => {
      const separator = line.indexOf('=');
      if (separator < 1) return result;
      const key = line.slice(0, separator).trim();
      const raw = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      const sensitive = /(key|secret|token|password|private)/i.test(key);
      result[key] = sensitive && raw ? `${raw.slice(0, 3)}${'*'.repeat(Math.min(12, raw.length))}` : raw;
      return result;
    }, {});
