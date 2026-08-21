export function createGeminiContents(messages) {
  const firstUserIndex = messages.findIndex((message) => message.role === 'user');
  if (firstUserIndex === -1) return [];

  return messages.slice(firstUserIndex).reduce((contents, message) => {
    const role = message.role === 'assistant' ? 'model' : 'user';
    const text = message.content.trim();
    if (!text) return contents;

    const previous = contents.at(-1);
    if (previous?.role === role) previous.parts[0].text += `\n\n${text}`;
    else contents.push({ role, parts: [{ text }] });
    return contents;
  }, []);
}
