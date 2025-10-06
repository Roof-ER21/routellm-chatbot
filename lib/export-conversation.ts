/**
 * Export Conversation Utilities
 * Provides functions to export conversations in various formats
 *
 * Features:
 * - Export as JSON
 * - Export as plain text
 * - Export as Markdown
 * - Export with timestamps and metadata
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ExportOptions {
  format: 'json' | 'txt' | 'md';
  includeTimestamps?: boolean;
  includeMetadata?: boolean;
  repName?: string;
}

/**
 * Export conversation to JSON format
 */
export function exportToJSON(
  messages: Message[],
  options: { repName?: string; sessionId?: string } = {}
): string {
  const exportData = {
    exportedAt: new Date().toISOString(),
    repName: options.repName || 'Unknown',
    sessionId: options.sessionId || 'Unknown',
    messageCount: messages.length,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp.toISOString(),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export conversation to plain text format
 */
export function exportToText(
  messages: Message[],
  options: { repName?: string; includeTimestamps?: boolean } = {}
): string {
  let text = `Susan 21 Conversation\n`;
  if (options.repName) {
    text += `Rep: ${options.repName}\n`;
  }
  text += `Exported: ${new Date().toLocaleString()}\n`;
  text += `Messages: ${messages.length}\n`;
  text += `${'='.repeat(60)}\n\n`;

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? 'User' : 'Susan';
    const timestamp = options.includeTimestamps
      ? ` [${msg.timestamp.toLocaleTimeString()}]`
      : '';

    text += `${role}${timestamp}:\n`;
    text += `${msg.content}\n\n`;
    text += `${'-'.repeat(60)}\n\n`;
  });

  return text;
}

/**
 * Export conversation to Markdown format
 */
export function exportToMarkdown(
  messages: Message[],
  options: { repName?: string; includeTimestamps?: boolean } = {}
): string {
  let md = `# Susan 21 Conversation\n\n`;

  if (options.repName) {
    md += `**Rep:** ${options.repName}  \n`;
  }
  md += `**Exported:** ${new Date().toLocaleString()}  \n`;
  md += `**Messages:** ${messages.length}\n\n`;
  md += `---\n\n`;

  messages.forEach((msg, index) => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 Susan';
    const timestamp = options.includeTimestamps
      ? ` • *${msg.timestamp.toLocaleTimeString()}*`
      : '';

    md += `### ${role}${timestamp}\n\n`;
    md += `${msg.content}\n\n`;
  });

  return md;
}

/**
 * Download conversation as a file
 */
export function downloadConversation(
  messages: Message[],
  options: ExportOptions & { fileName?: string }
): void {
  let content: string;
  let mimeType: string;
  let extension: string;

  switch (options.format) {
    case 'json':
      content = exportToJSON(messages, options);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'md':
      content = exportToMarkdown(messages, options);
      mimeType = 'text/markdown';
      extension = 'md';
      break;
    case 'txt':
    default:
      content = exportToText(messages, options);
      mimeType = 'text/plain';
      extension = 'txt';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = options.fileName || `susan21-conversation-${Date.now()}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy conversation to clipboard
 */
export async function copyToClipboard(
  messages: Message[],
  format: 'txt' | 'md' = 'txt'
): Promise<void> {
  const content = format === 'md'
    ? exportToMarkdown(messages)
    : exportToText(messages);

  await navigator.clipboard.writeText(content);
}
