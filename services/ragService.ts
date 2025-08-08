import { LORE_LIBRARY } from '../data/loreData';
import { LoreEntry } from '../types';

/**
 * A very simple keyword-based retriever to simulate RAG.
 * In a real-world, large-scale application, this would be replaced
 * by a proper vector-based semantic search against a vector database.
 * @param text The context string to search for keywords in.
 * @param count The maximum number of entries to return.
 * @returns An array of relevant lore entries.
 */
function simpleKeywordSearch(text: string, count: number): LoreEntry[] {
    const lowercasedText = text.toLowerCase();
    const relevantEntries: { entry: LoreEntry; score: number }[] = [];

    LORE_LIBRARY.forEach(entry => {
        let score = 0;
        entry.keywords.forEach(keyword => {
            if (lowercasedText.includes(keyword.toLowerCase())) {
                score++;
            }
        });
        if (score > 0) {
            relevantEntries.push({ entry, score });
        }
    });

    // Sort by score (most relevant first)
    relevantEntries.sort((a, b) => b.score - a.score);

    // Return the top 'count' entries
    return relevantEntries.slice(0, count).map(item => item.entry);
}


/**
 * Retrieves relevant lore snippets based on the current context.
 * This function simulates a RAG (Retrieval-Augmented Generation) system.
 * @param context - A string containing the player's action and other relevant info.
 * @param maxResults - The maximum number of lore entries to return.
 * @returns An array of relevant lore entries.
 */
export function retrieveRelevantLore(context: string, maxResults: number = 2): LoreEntry[] {
    // In a real app, this could also search through the character's journal entries.
    // For now, we'll just search the static lore library.
    return simpleKeywordSearch(context, maxResults);
}