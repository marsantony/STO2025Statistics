/**
 * Pure utility functions for card data processing.
 * No DOM or Chart.js dependencies.
 */

/**
 * Filter and sort cards based on selected class.
 * @param {Array} cardData - All card data
 * @param {string} selectedClass - The selected class key ('all', 'neutral', 'elf', etc.)
 * @param {boolean} includeNeutral - Whether to include neutral cards with byclass data
 * @param {Object} classMap - Mapping from class number to class key (e.g. {0: 'neutral', 1: 'elf'})
 * @returns {Array} Filtered and sorted cards (descending by count)
 */
export function getFilteredCards(cardData, selectedClass, includeNeutral, classMap) {
    let filteredCards = cardData;
    if (selectedClass !== 'all') {
        filteredCards = cardData.filter(card => card.class === selectedClass);
        if (includeNeutral && selectedClass !== 'neutral') {
            const classNum = String(Object.entries(classMap).find(([, v]) => v === selectedClass)?.[0]);
            const neutralCards = cardData
                .filter(card => card.class === 'neutral' && card.byclass && card.byclass[classNum])
                .map(card => {
                    const by = card.byclass[classNum];
                    return {
                        ...card,
                        數量: by.count || 0,
                        帶3: by.帶3 || 0,
                        帶2: by.帶2 || 0,
                        帶1: by.帶1 || 0,
                        帶0: by.帶0 || 0,
                        _isNeutralByClass: true,
                        byclass: selectedClass
                    };
                })
                .filter(card => card.數量 > 0);
            filteredCards = filteredCards.concat(neutralCards);
        }
    }
    filteredCards = filteredCards.slice().sort((a, b) => b.數量 - a.數量);
    return filteredCards;
}

/**
 * Compare two arrays for shallow equality.
 * @param {Array} a
 * @param {Array} b
 * @returns {boolean}
 */
export function arraysEqual(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * Normalize raw card data from JSON into the app's internal format.
 * @param {Array} rawCards - Raw card objects from cards_data.json
 * @param {Object} classMap - Mapping from class number to class key
 * @returns {Array} Normalized card objects sorted by count descending
 */
export function normalizeCardData(rawCards, classMap) {
    const normalized = rawCards.map(card => ({
        代碼: card.code || card.代碼,
        class: classMap[card.class] || card.class,
        名稱: card.name || card.名稱,
        數量: card.count || card.數量,
        imagehash: card.image_hash || card.imagehash,
        帶3: card.帶3 || 0,
        帶2: card.帶2 || 0,
        帶1: card.帶1 || 0,
        byclass: card.byclass || undefined
    }));
    normalized.sort((a, b) => b.數量 - a.數量);
    return normalized;
}

/**
 * Calculate the number of decks carrying 0 copies of a card.
 * @param {number} total - Total number of decks
 * @param {number} c1 - Decks carrying 1 copy
 * @param {number} c2 - Decks carrying 2 copies
 * @param {number} c3 - Decks carrying 3 copies
 * @returns {number} Decks carrying 0 copies (never negative)
 */
export function calculateC0(total, c1, c2, c3) {
    return Math.max(0, total - c1 - c2 - c3);
}

/**
 * Extract chart-ready data from filtered cards.
 * @param {Array} filteredCards - Filtered card data
 * @param {Array} chartColors - Array of color strings to cycle through
 * @returns {{ labels: string[], data: number[], colors: string[] }}
 */
export function extractChartData(filteredCards, chartColors) {
    const labels = filteredCards.map(card => card.名稱);
    const data = filteredCards.map(card => card.數量);
    const colors = filteredCards.map((_, i) => chartColors[i % chartColors.length]);
    return { labels, data, colors };
}
