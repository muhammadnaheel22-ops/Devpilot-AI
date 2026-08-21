import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeSseStream } from '../src/utils/sse.js';

const chunkedStream = (text, breakpoints) => {
  const bytes = new TextEncoder().encode(text);
  const chunks = [];
  let start = 0;
  for (const end of breakpoints) {
    chunks.push(bytes.slice(start, end));
    start = end;
  }
  chunks.push(bytes.slice(start));
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
};

test('parses CRLF events, split UTF-8 bytes, and a final event without a blank line', async () => {
  const text = 'data: {"text":"Hi 👋"}\r\n\r\ndata: {"text":" there"}';
  const chunks = [];
  await consumeSseStream(chunkedStream(text, [3, 20, 24, 31]), (chunk) => chunks.push(chunk));
  assert.deepEqual(chunks, ['Hi 👋', ' there']);
});

test('surfaces streamed server errors', async () => {
  const stream = chunkedStream('data: {"error":"Quota exceeded"}\n\n', [8]);
  await assert.rejects(() => consumeSseStream(stream, () => {}), /Quota exceeded/);
});

test('reports malformed streamed JSON clearly', async () => {
  const stream = chunkedStream('data: not-json\n\n', [4]);
  await assert.rejects(() => consumeSseStream(stream, () => {}), /invalid streamed response/);
});

test('reports completion routing metadata without treating it as text', async () => {
  const stream = chunkedStream(
    'data: {"text":"Done"}\n\ndata: {"done":true,"model":"anthropic/claude-sonnet-4","routingMode":"auto"}\n\n',
    [12, 37],
  );
  const chunks = [];
  const events = [];
  await consumeSseStream(
    stream,
    (chunk) => chunks.push(chunk),
    (event) => events.push(event),
  );
  assert.deepEqual(chunks, ['Done']);
  assert.equal(events.at(-1).model, 'anthropic/claude-sonnet-4');
  assert.equal(events.at(-1).routingMode, 'auto');
});
