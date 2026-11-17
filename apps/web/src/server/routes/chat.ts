import { Hono } from 'hono';
import { chatRequestSchema } from '@outline-studio/schemas';
import { isCandidateTextModel } from '@outline-studio/config';
import { owner, readBody } from '../http';
import { limit } from '../db/limits';
import { withinStageBudget, databaseBudget } from '../budget';
import { lookupDocumentation } from '../chat/context7';
import { attachmentImages, resolveAttachments } from '../chat/attachments';
import { streamChatResponse } from '../chat/streamResponse';
import { ApiError } from '../errors';

export const chatRoutes = new Hono();
chatRoutes.post('/chat', context => withinStageBudget(context.req.raw.signal, async () => {
  const id = await owner(context);
  const request = await readBody(context.req.raw, chatRequestSchema, 9000000);
  if (!isCandidateTextModel(request.connection.model)) throw new ApiError('model', 'Choose an authorized text/chat model.', 422);
  await limit(`chat:${id}`, 60); await limit(`chat-minute:${id}`, 8, 60);
  await limit(`chat-request:${id}:${request.requestId}`, 1, 86400);
  const signal = databaseBudget.getStore() ?? AbortSignal.timeout(45000);
  const docs = request.documentation ? await lookupDocumentation(request.documentation, signal) : { context: '', metadata: { sources: [] } };
  const attachments = await resolveAttachments(request.attachments, signal);
  return streamChatResponse(request, docs, signal, attachments, attachmentImages(attachments));
}));
