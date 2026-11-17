export function intakeReply(input: string) {
  const text = input.trim();
  if (!text) return null;
  const greeting = /^(?:hi+|hey+|hello|namaste)[.!?\s]*(?:(?:how are you|can you help(?: me)?)[.!?\s]*)?$/i.test(text);
  if (greeting) return 'Hi! I can help you create an assignment, report, research draft or worked solutions. What topic are we working on, and are there any requirements?';
  if (text.length < 10) return 'Tell me a little more: what topic or questions should the document cover, and which format do you need? Your current document and history are preserved.';
  return null;
}
