/**
 * Protocol utilities for desktop app
 * Local message type definitions
 */

export interface Message {
  content: string;
}

export function createMessage(content: string): Message {
  return { content };
}

export function formatMessage(msg: Message): string {
  return `Message: ${msg.content}`;
}
