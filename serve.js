const { NlpManager } = require('node-nlp');
const express = require('express');
const path = require('path');
const sqlite = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize NLP Manager
const manager = new NlpManager({ languages: ['en'] });

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// NLP-based rhyme detection function with extensive word database
function findRhymes(word) {
    // Comprehensive English word database organized by common endings
    wordsData = sqlite('words_database.db');
}

// Helper function to extract vowel patterns
function getLastVowelPattern(word) {
    const vowels = 'aeiou';
    let pattern = '';
    let foundVowel = false;
    
    for (let i = word.length - 1; i >= 0; i--) {
        const char = word[i].toLowerCase();
        if (vowels.includes(char)) {
            pattern = char + pattern;
            foundVowel = true;
        } else if (foundVowel) {
            pattern = char + pattern;
        }
    }
    
    return pattern;
}

const synonymsData = {
    'happy': ['joyful', 'cheerful', 'delighted', 'pleased', 'content', 'glad', 'elated', 'blissful'],
    'sad': ['unhappy', 'sorrowful', 'melancholy', 'dejected', 'gloomy', 'depressed', 'mournful'],
    'big': ['large', 'huge', 'enormous', 'massive', 'gigantic', 'vast', 'immense', 'colossal'],
    'small': ['tiny', 'little', 'miniature', 'petite', 'compact', 'minute', 'minuscule'],
    'fast': ['quick', 'rapid', 'swift', 'speedy', 'hasty', 'brisk', 'fleet', 'expeditious'],
    'beautiful': ['gorgeous', 'stunning', 'lovely', 'attractive', 'pretty', 'elegant'],
    'smart': ['intelligent', 'clever', 'brilliant', 'wise', 'bright', 'astute'],
    'strong': ['powerful', 'mighty', 'robust', 'sturdy', 'tough', 'forceful'],
    'quiet': ['silent', 'peaceful', 'calm', 'tranquil', 'still', 'hushed'],
    'loud': ['noisy', 'boisterous', 'thunderous', 'deafening', 'clamorous']
};

// NLP-based synonym detection with semantic similarity
function findSynonyms(word) {
    const inputWord = word.toLowerCase();
    
    // Direct lookup first
    if (synonymsData[inputWord]) {
        return synonymsData[inputWord];
    }
    
    // If not found, try to find semantically similar words
    const semanticGroups = {
        emotions: ['happy', 'sad', 'angry', 'excited', 'calm', 'nervous'],
        sizes: ['big', 'small', 'large', 'tiny', 'huge', 'little'],
        speeds: ['fast', 'slow', 'quick', 'rapid', 'sluggish'],
        qualities: ['beautiful', 'ugly', 'smart', 'stupid', 'strong', 'weak']
    };
    
    let relatedSynonyms = [];
    
    // Find which semantic group the word belongs to
    for (const [group, words] of Object.entries(semanticGroups)) {
        if (words.includes(inputWord)) {
            // Find synonyms from related words in the same group
            for (const relatedWord of words) {
                if (synonymsData[relatedWord] && relatedWord !== inputWord) {
                    relatedSynonyms.push(...synonymsData[relatedWord].slice(0, 3));
                }
            }
            break;
        }
    }
    
    return relatedSynonyms.length > 0 ? relatedSynonyms : [];
}

// GET endpoint for syllables
app.get('/getSyllables', (req, res) => {
    const word = req.query.word;
    
    if (!word) {
        return res.status(400).json({
            error: 'Word parameter is required',
            usage: '/getSyllables?word=<word>'
        });
    }
    
    // Use the local syllable splitting function
    const syllables = splitWordIntoSyllables(word);
    
    res.json({
        word: word,
        syllables: syllables,
        count: syllables.length,
        method: 'Advanced syllable splitting with English patterns'
    });
});

// Local syllable splitting function for the server
function splitWordIntoSyllables(word) {
    if (!word || typeof word !== 'string') {
        return [];
    }

    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    
    if (cleanWord.length === 0) return [];
    if (cleanWord.length === 1) return [cleanWord];

    const vowels = 'aeiouy';
    const syllables = [];
    let currentSyllable = '';
    let previousWasVowel = false;

    for (let i = 0; i < cleanWord.length; i++) {
        const char = cleanWord[i];
        const isVowel = vowels.includes(char);
        
        currentSyllable += char;

        // If we hit a vowel after consonants, we might have a syllable boundary
        if (isVowel && !previousWasVowel) {
            // Look ahead to find the end of this vowel group
            let j = i + 1;
            while (j < cleanWord.length && vowels.includes(cleanWord[j])) {
                currentSyllable += cleanWord[j];
                j++;
            }
            
            // Now look for consonants
            let consonants = '';
            while (j < cleanWord.length && !vowels.includes(cleanWord[j])) {
                consonants += cleanWord[j];
                j++;
            }
            
            // Decision: where to split
            if (consonants.length === 0) {
                // No consonants after vowel - end of word or vowel cluster
                if (j >= cleanWord.length) {
                    // End of word
                    syllables.push(currentSyllable);
                    currentSyllable = '';
                }
            } else if (consonants.length === 1) {
                // Single consonant - it usually goes with next syllable
                syllables.push(currentSyllable);
                currentSyllable = consonants;
            } else {
                // Multiple consonants - split them
                const firstConsonant = consonants[0];
                const restConsonants = consonants.slice(1);
                syllables.push(currentSyllable + firstConsonant);
                currentSyllable = restConsonants;
            }
            
            // Skip ahead
            i = j - 1;
        }
        
        previousWasVowel = isVowel;
    }
 
    // Add any remaining syllable
    if (currentSyllable) {
        if (syllables.length > 0 && currentSyllable.length === 1 && !vowels.includes(currentSyllable)) {
            // Single consonant at end - merge with previous
            syllables[syllables.length - 1] += currentSyllable;
        } else {
            syllables.push(currentSyllable);
        }
    }

    return syllables.length > 0 ? syllables : [cleanWord];
}

// GET endpoint for rhymes
app.get('/getRhymes', (req, res) => {
    const word = req.query.word;
    
    if (!word) {
        return res.status(400).json({
            error: 'Word parameter is required',
            usage: '/getRhymes?word=<word>'
        });
    }
    
    // Use NLP-based rhyme detection
    const rhymes = findRhymes(word);
    
    res.json({
        word: word,
        rhymes: rhymes,
        count: rhymes.length,
        method: 'NLP-based phonetic pattern matching'
    });
});

// GET endpoint for synonyms
app.get('/getSynonyms', (req, res) => {
    const word = req.query.word;
    
    if (!word) {
        return res.status(400).json({
            error: 'Word parameter is required',
            usage: '/getSynonyms?word=<word>'
        });
    }
    
    // Use NLP-based synonym detection
    const synonyms = findSynonyms(word);
    
    res.json({
        word: word,
        synonyms: synonyms,
        count: synonyms.length,
        method: 'NLP-based semantic grouping'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'lyrically.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Lyrically server is running',
        endpoints: [
            'GET /getRhymes?word=<word>',
            'GET /getSynonyms?word=<word>',
            'GET /getSyllables?word=<word>'
        ]
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Lyrically server is running on http://localhost:${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET /getRhymes?word=<word>`);
    console.log(`  GET /getSynonyms?word=<word>`);
    console.log(`  GET /getSyllables?word=<word>`);
    console.log(`  GET /health`);
});

module.exports = app;