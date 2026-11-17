import { describe, it, expect } from 'vitest';
import { intakeReply } from '@/domain/pipeline/intake';

describe('document conversation intake without unnecessary model requests', () => {
  it('responds to greetings and longer social help requests', () => {
    expect(intakeReply('Hii')).toContain('Hi!');
    expect(intakeReply('Hello, create a report about forests')).toBeNull();
    expect(intakeReply('Hello can you help me?')).toContain('What topic');
  });
  it('asks for details for short messages without changing accepted work', () => {
    expect(intakeReply('Hii can')).toContain('current document and history are preserved');
    expect(intakeReply('Forest')).toContain('topic or questions');
  });
  it('leaves blank input and detailed document requests to their existing guards', () => {
    expect(intakeReply('  ')).toBeNull();
    expect(intakeReply('Create a report on urban cooling with two sections.')).toBeNull();
  });
});
