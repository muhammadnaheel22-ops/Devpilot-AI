function handleEvent(event, onChunk) {
  const serialized = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');
  if (!serialized) return;

  let data;
  try {
    data = JSON.parse(serialized);
  } catch {
    throw new Error('The AI server returned an invalid streamed response.');
  }
  if (data.error) throw new Error(data.error);
  if (typeof data.text === 'string' && data.text) onChunk(data.text);
}

export async function consumeSseStream(stream, onChunk) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      let match = /\r?\n\r?\n/.exec(buffer);
      while (match) {
        handleEvent(buffer.slice(0, match.index), onChunk);
        buffer = buffer.slice(match.index + match[0].length);
        match = /\r?\n\r?\n/.exec(buffer);
      }
      if (done) break;
    }
    if (buffer.trim()) handleEvent(buffer, onChunk);
  } catch (error) {
    await reader.cancel(error).catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
}
