export function toBase64(arrayBuffer) {
  return Buffer.from(arrayBuffer).toString('base64');
}

export function detectLanguage(text) {
  const t = text.toLowerCase().trim();
  if (t.match(/[^\x00-\x7F]+/)) return 'non-english';
  return 'english';
}
