import { Message } from "@openstaff/protocol";

/**
 * Protocol utilities for desktop app
 * Uses @openstaff/protocol for type-safe message handling
 */

export function createMessage(content: string): Message {
  return { content };
}

export function formatMessage(msg: Message): string {
  return `Message: ${msg.content}`;
}
