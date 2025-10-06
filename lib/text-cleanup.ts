/**
 * Text Cleanup Utilities
 * Removes markdown formatting and symbols for clean text-to-speech
 */

/**
 * Clean markdown and symbols from text for speech synthesis
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove markdown bold (**text** or __text__)
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');

  // Remove markdown italic (*text* or _text_)
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  cleaned = cleaned.replace(/_(.+?)_/g, '$1');

  // Remove markdown headers (### Header or ## Header or # Header)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Remove markdown links [text](url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Remove markdown code blocks ```code```
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');

  // Remove common emojis (basic set)
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Symbols & Pictographs
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport & Map
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');   // Miscellaneous Symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');   // Dingbats

  // Remove markdown bullet points
  cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, '');

  // Remove markdown numbered lists
  cleaned = cleaned.replace(/^\d+\.\s+/gm, '');

  // Remove horizontal rules
  cleaned = cleaned.replace(/^[\-\*\_]{3,}$/gm, '');

  // Remove blockquotes
  cleaned = cleaned.replace(/^>\s+/gm, '');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();

  return cleaned;
}

/**
 * Clean markdown from text for display (keeps some formatting)
 */
export function cleanTextForDisplay(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // Remove excessive markdown formatting but keep line breaks
  cleaned = cleaned.replace(/\*\*\*(.+?)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');
  cleaned = cleaned.replace(/_(.+?)_/g, '$1');

  // Clean up headers but keep the text
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  return cleaned;
}
