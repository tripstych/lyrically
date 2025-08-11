const { NlpManager } = require('node-nlp');
const express = require('express');
const path = require('path');

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
    const wordDatabase = {
        // -oon endings (for words like moon, soon, tune)
        'oon': ['moon', 'soon', 'noon', 'spoon', 'croon', 'swoon', 'balloon', 'cartoon', 'raccoon', 'monsoon', 'lagoon', 'baboon', 'typhoon', 'bassoon', 'platoon', 'maroon', 'cocoon', 'harpoon'],
        'une': ['tune', 'dune', 'june', 'prune', 'immune', 'commune', 'fortune', 'neptune', 'tribune', 'opportune'],
        'oom': ['room', 'boom', 'zoom', 'doom', 'bloom', 'gloom', 'broom', 'groom', 'mushroom', 'bathroom', 'bedroom', 'classroom', 'restroom', 'ballroom', 'storeroom'],
        
        // Common rhyme patterns
        'at': ['cat', 'bat', 'hat', 'mat', 'rat', 'fat', 'sat', 'pat', 'chat', 'flat', 'that', 'what', 'combat', 'format', 'habitat', 'diplomat', 'democrat', 'aristocrat', 'acrobat', 'thermostat'],
        'ight': ['light', 'night', 'bright', 'sight', 'right', 'flight', 'might', 'fight', 'tight', 'white', 'bite', 'kite', 'quite', 'write', 'height', 'weight', 'freight', 'delight', 'insight', 'midnight', 'sunlight', 'daylight', 'spotlight', 'moonlight', 'starlight', 'twilight', 'highlight', 'copyright', 'outright', 'upright'],
        'ay': ['day', 'way', 'say', 'play', 'stay', 'pay', 'may', 'lay', 'pray', 'gray', 'hey', 'they', 'bay', 'ray', 'clay', 'spray', 'array', 'display', 'delay', 'replay', 'essay', 'decay', 'relay', 'today', 'away', 'okay', 'holiday', 'birthday', 'subway', 'highway', 'runway', 'gateway', 'doorway', 'hallway', 'pathway', 'freeway', 'railway'],
        'ove': ['love', 'dove', 'above', 'shove', 'glove', 'grove', 'stove', 'clove', 'trove'],
        'art': ['heart', 'start', 'part', 'art', 'cart', 'smart', 'dart', 'chart', 'apart', 'depart', 'restart', 'upstart', 'sweetheart', 'counterpart'],
        'ime': ['time', 'rhyme', 'chime', 'lime', 'climb', 'prime', 'crime', 'mime', 'dime', 'grime', 'slime', 'thyme', 'sometime', 'anytime', 'bedtime', 'halftime', 'overtime', 'lifetime', 'pastime', 'wartime', 'playtime', 'daytime', 'nighttime'],
        'ound': ['sound', 'found', 'ground', 'round', 'bound', 'wound', 'pound', 'mound', 'hound', 'compound', 'background', 'playground', 'underground', 'surround', 'profound', 'astound', 'rebound', 'unbound', 'inbound', 'outbound'],
        'ind': ['mind', 'find', 'kind', 'bind', 'wind', 'blind', 'behind', 'remind', 'mankind', 'grind', 'signed', 'designed', 'refined', 'combined', 'defined', 'confined', 'assigned', 'aligned', 'resigned'],
        'ee': ['tree', 'free', 'sea', 'bee', 'key', 'see', 'flee', 'knee', 'agree', 'three', 'coffee', 'degree', 'referee', 'employee', 'guarantee', 'committee', 'trustee', 'debris', 'decree', 'jamboree'],
        'un': ['run', 'fun', 'sun', 'gun', 'done', 'one', 'won', 'son', 'ton', 'begun', 'someone', 'everyone', 'anyone', 'stun', 'spun', 'bun', 'nun', 'pun', 'outrun', 'rerun', 'homerun', 'shotgun'],
        'ue': ['blue', 'true', 'clue', 'glue', 'due', 'sue', 'new', 'few', 'crew', 'drew', 'flew', 'grew', 'knew', 'threw', 'view', 'review', 'preview', 'interview', 'revenue', 'rescue', 'value', 'issue', 'tissue', 'virtue', 'statue', 'continue', 'pursue', 'argue', 'barbecue'],
        'ore': ['more', 'store', 'before', 'door', 'floor', 'poor', 'four', 'war', 'for', 'or', 'core', 'score', 'shore', 'bore', 'wore', 'tore', 'explore', 'ignore', 'restore', 'adore', 'therefore', 'furthermore', 'evermore', 'outdoor', 'indoor', 'hardcore'],
        'ake': ['make', 'take', 'lake', 'cake', 'wake', 'brake', 'shake', 'snake', 'break', 'fake', 'bake', 'rake', 'stake', 'mistake', 'earthquake', 'handshake', 'pancake', 'cupcake', 'awake', 'remake', 'forsake', 'partake'],
        'ame': ['same', 'name', 'game', 'came', 'fame', 'frame', 'shame', 'blame', 'flame', 'claim', 'aim', 'tame', 'lame', 'became', 'nickname', 'surname', 'filename', 'ballgame'],
        'ead': ['head', 'read', 'bread', 'dead', 'lead', 'spread', 'thread', 'dread', 'shed', 'fed', 'red', 'bed', 'said', 'ahead', 'instead', 'widespread', 'overhead', 'thoroughbred'],
        'ell': ['tell', 'well', 'sell', 'bell', 'cell', 'spell', 'shell', 'smell', 'fell', 'hell', 'yell', 'dwell', 'swell', 'hotel', 'rebel', 'excel', 'farewell', 'doorbell', 'seashell', 'eggshell'],
        'old': ['old', 'cold', 'gold', 'hold', 'told', 'sold', 'bold', 'fold', 'mold', 'behold', 'unfold', 'household', 'threshold', 'foothold', 'stronghold', 'manifold', 'scaffold', 'blindfold'],
        'ive': ['live', 'give', 'five', 'drive', 'alive', 'arrive', 'derive', 'survive', 'archive', 'forgive', 'active', 'native', 'otive', 'otive', 'creative', 'negative', 'positive', 'relative', 'objective', 'effective', 'detective', 'selective', 'protective', 'collective', 'attractive', 'expensive', 'extensive', 'exclusive', 'executive', 'alternative', 'conservative', 'progressive', 'competitive', 'comprehensive'],
        'ase': ['case', 'base', 'face', 'place', 'race', 'space', 'chase', 'phase', 'grace', 'trace', 'embrace', 'replace', 'database', 'suitcase', 'briefcase', 'staircase', 'showcase', 'lowercase', 'uppercase', 'marketplace', 'workplace', 'fireplace'],
        'ice': ['nice', 'price', 'twice', 'dice', 'rice', 'mice', 'vice', 'slice', 'spice', 'advice', 'device', 'service', 'office', 'notice', 'practice', 'justice', 'sacrifice', 'prejudice'],
        'ose': ['rose', 'close', 'chose', 'nose', 'pose', 'those', 'whose', 'lose', 'dose', 'hose', 'compose', 'propose', 'suppose', 'oppose', 'expose', 'dispose', 'impose', 'decompose'],
        'use': ['use', 'choose', 'lose', 'news', 'views', 'blues', 'clues', 'shoes', 'cruise', 'abuse', 'excuse', 'refuse', 'confuse', 'accuse', 'amuse', 'diffuse', 'peruse', 'reuse'],
        'ack': ['back', 'pack', 'track', 'black', 'crack', 'lack', 'stack', 'attack', 'snack', 'quack', 'hack', 'jack', 'rack', 'sack', 'feedback', 'comeback', 'backpack', 'soundtrack', 'paperback', 'quarterback'],
        'ock': ['rock', 'clock', 'block', 'lock', 'sock', 'dock', 'shock', 'knock', 'stock', 'flock', 'mock', 'unlock', 'padlock', 'deadlock', 'woodblock', 'roadblock', 'hemlock', 'shamrock', 'livestock'],
        'ook': ['book', 'look', 'took', 'cook', 'hook', 'brook', 'shook', 'crook', 'notebook', 'handbook', 'textbook', 'cookbook', 'workbook', 'facebook', 'outlook', 'overlook', 'undertook'],
        'alk': ['walk', 'talk', 'chalk', 'stalk', 'sidewalk', 'catwalk', 'crosswalk', 'boardwalk'],
        'all': ['all', 'call', 'fall', 'ball', 'wall', 'hall', 'small', 'tall', 'mall', 'recall', 'install', 'overall', 'baseball', 'football', 'basketball', 'volleyball', 'softball', 'downfall', 'waterfall', 'rainfall', 'snowfall'],
        'ill': ['will', 'fill', 'kill', 'still', 'hill', 'bill', 'mill', 'till', 'skill', 'grill', 'drill', 'chill', 'spill', 'thrill', 'fulfill', 'instill', 'windmill', 'treadmill', 'downhill', 'uphill', 'anthill'],
        'est': ['best', 'test', 'rest', 'west', 'nest', 'guest', 'chest', 'quest', 'invest', 'protest', 'contest', 'request', 'suggest', 'arrest', 'fastest', 'biggest', 'longest', 'shortest', 'highest', 'lowest']
    };
    
    const inputWord = word.toLowerCase();
    let allRhymes = [];
    
    // Function to get phonetic ending patterns
    function getPhoneticPatterns(word) {
        const patterns = [];
        const len = word.length;
        
        // Get various ending patterns
        if (len >= 2) patterns.push(word.slice(-2));
        if (len >= 3) patterns.push(word.slice(-3));
        if (len >= 4) patterns.push(word.slice(-4));
        
        return patterns;
    }
    
    // Function to check if two words rhyme based on multiple criteria
    function isRhyme(word1, word2) {
        if (word1 === word2) return false;
        
        const patterns1 = getPhoneticPatterns(word1);
        const patterns2 = getPhoneticPatterns(word2);
        
        // Check for exact pattern matches
        for (const p1 of patterns1) {
            for (const p2 of patterns2) {
                if (p1 === p2 && p1.length >= 2) return true;
            }
        }
        
        // Check for vowel sound similarity
        const vowelPattern1 = getLastVowelPattern(word1);
        const vowelPattern2 = getLastVowelPattern(word2);
        
        if (vowelPattern1 && vowelPattern2 && vowelPattern1 === vowelPattern2) {
            return true;
        }
        
        return false;
    }
    
    // First, find direct matches from organized database
    for (const [pattern, words] of Object.entries(wordDatabase)) {
        if (inputWord.includes(pattern) || inputWord.endsWith(pattern)) {
            allRhymes.push(...words.filter(w => w !== inputWord));
        }
    }
    
    // Then search all words for phonetic matches
    const allWords = Object.values(wordDatabase).flat();
    for (const testWord of allWords) {
        if (!allRhymes.includes(testWord) && isRhyme(inputWord, testWord)) {
            allRhymes.push(testWord);
        }
    }
    
    // Generate additional rhymes based on common patterns
    const commonSuffixes = ['ed', 'ing', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 'ful', 'less'];
    const generatedRhymes = [];
    
    for (const rhyme of allRhymes.slice(0, 20)) { // Limit base words to prevent explosion
        for (const suffix of commonSuffixes) {
            const generated = rhyme + suffix;
            if (!allRhymes.includes(generated) && !generatedRhymes.includes(generated)) {
                generatedRhymes.push(generated);
            }
        }
    }
    
    // Combine all rhymes and remove duplicates
    const combinedRhymes = [...new Set([...allRhymes, ...generatedRhymes])];
    
    // Sort by relevance (shorter words first, then alphabetically)
    combinedRhymes.sort((a, b) => {
        const lenDiff = a.length - b.length;
        return lenDiff !== 0 ? lenDiff : a.localeCompare(b);
    });
    
    return combinedRhymes.slice(0, 100); // Return up to 100 rhymes
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