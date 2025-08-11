/**
 * Better syllable splitting using vowel counting method
 * @param {string} word - The word to split
 * @returns {string[]} - Array of syllables
 */

// Configuration
const BASE_URL = 'http://localhost:3000';

// make an AJAX request to a rhyme API for getSyllables and getRhymes
async function getSyllables(word) {
    if (!word || typeof word !== 'string') {
        return [];
    }
    try {
        const response = await fetch(`${BASE_URL}/getSyllables?word=${encodeURIComponent(word)}`);
        const data = await response.json();
        if (data && Array.isArray(data.syllables)) {
            return data.syllables;
        }
    } catch (error) {
        console.error('Error fetching syllables:', error);
    }
    return [];
}

async function getRhymes(word) {
    if (!word || typeof word !== 'string') {
        return [];
    }
    try {
        const response = await fetch(`${BASE_URL}/getRhymes?word=${encodeURIComponent(word)}`);
        const data = await response.json();
        if (data && Array.isArray(data.rhymes)) {
            return data.rhymes;
        }
    } catch (error) {
        console.error('Error fetching rhymes:', error);
    }
    return [];
}

async function getSynonyms(word) {
    if (!word || typeof word !== 'string') {
        return [];
    }
    try {
        const response = await fetch(`${BASE_URL}/getSynonyms?word=${encodeURIComponent(word)}`);
        const data = await response.json();
        if (data && Array.isArray(data.synonyms)) {
            return data.synonyms;
        }
    } catch (error) {
        console.error('Error fetching synonyms:', error);
    }
    return [];
}

function betterSyllableSplit(word) {
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

/**
 * Advanced syllable splitting with common English patterns
 * @param {string} word - The word to split
 * @returns {string[]} - Array of syllables with original formatting preserved
 */
function advancedSyllableSplit(word) {
  if (!word || typeof word !== 'string') {
    return [];
  }

  const originalWord = word;
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  
  if (cleanWord.length === 0) return [originalWord];
  
  // Handle common prefixes and suffixes
  const prefixes = ['un', 're', 'pre', 'dis', 'mis', 'over', 'under', 'out', 'up'];
  const suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'tion', 'sion', 'ness', 'ment', 'ful'];
  
  let workingWord = cleanWord;
  const parts = [];
  
  // Check for prefixes
  for (const prefix of prefixes) {
    if (workingWord.startsWith(prefix) && workingWord.length > prefix.length) {
      parts.push(prefix);
      workingWord = workingWord.slice(prefix.length);
      break;
    }
  }
  
  // Check for suffixes
  let suffix = '';
  for (const suf of suffixes) {
    if (workingWord.endsWith(suf) && workingWord.length > suf.length) {
      suffix = suf;
      workingWord = workingWord.slice(0, -suf.length);
      break;
    }
  }
  
  // Split the remaining word
  const middleSyllables = betterSyllableSplit(workingWord);
  
  // Combine all parts
  const result = [...parts, ...middleSyllables];
  if (suffix) {
    result.push(suffix);
  }
  
  // Restore original capitalization and punctuation
  if (result.length > 0) {
    // Find prefix punctuation
    let prefix = '';
    for (let char of originalWord) {
      if (/[a-zA-Z]/.test(char)) break;
      prefix += char;
    }
    
    // Find suffix punctuation
    let suffixPunct = '';
    for (let i = originalWord.length - 1; i >= 0; i--) {
      if (/[a-zA-Z]/.test(originalWord[i])) break;
      suffixPunct = originalWord[i] + suffixPunct;
    }
    
    // Apply original case pattern
    let letterIndex = 0;
    for (let i = 0; i < result.length; i++) {
      let newSyllable = '';
      for (let j = 0; j < result[i].length; j++) {
        while (letterIndex < originalWord.length && !/[a-zA-Z]/.test(originalWord[letterIndex])) {
          letterIndex++;
        }
        if (letterIndex < originalWord.length) {
          newSyllable += originalWord[letterIndex];
          letterIndex++;
        } else {
          newSyllable += result[i][j];
        }
      }
      result[i] = newSyllable;
    }
    
    // Add punctuation
    if (prefix) result[0] = prefix + result[0];
    if (suffixPunct) result[result.length - 1] += suffixPunct;
  }
  
  return result;
}

// Function to split a word into syllables - now using the advanced method
function splitWordIntoSyllables(word) {
    return advancedSyllableSplit(word);
}


document.addEventListener('DOMContentLoaded', function() {
    const lyrics = document.getElementById('lyrics');
    const shadowLyrics = document.getElementById('shadow_lyrics');
    const infoDiv = document.getElementById('info');
    
    shadowLyrics.innerHTML = lyrics.value.replace(/\n/g, '<br>');
    
    lyrics.addEventListener('input', function() {
        let total = 0;
        let syll = '';
        let txt = '';
        lyrics.value.split('\n').forEach(function(line) {
            txt = ' / ';
            total = 0;
            line = line.trim();
            line.split(' ').forEach(function(word) {
                word = word.trim();
                if (word.length > 0) {
                    const syllables = splitWordIntoSyllables(word);
                    txt += "<span class='append syllable-count pad'>"+syllables.length+"</span>";
                    total+= syllables.length;
                }
            });
            syll += line.replace(/ /g,'&nbsp;')+txt+"<span class='syllable-total'>"+total+"</span><br/>";
        });
        shadowLyrics.innerHTML = syll;
    });

    // Text selection functionality with more robust event handling
    lyrics.addEventListener('mouseup', handleTextSelection);
    lyrics.addEventListener('keyup', handleTextSelection);
    lyrics.addEventListener('select', handleTextSelection);
    
    // Also handle focus and blur to clear selection when needed
    // lyrics.addEventListener('blur', () => {
    //     setTimeout(clearInfo, 100); // Small delay to allow for selection handling
    // });
    
    async function handleTextSelection() {
        console.log('Selection event triggered');
        // Small delay to ensure selection has been processed
        setTimeout(async () => {
            const selectedText = getSelectedText();
            console.log('Selected text:', selectedText);
            if (selectedText && selectedText.trim().length > 0) {
                await displayWordInfo(selectedText.trim());
            } else {
                //clearInfo();
            }
        }, 10);
    }
    
    function getSelectedText() {
        const start = lyrics.selectionStart;
        const end = lyrics.selectionEnd;
        console.log('Selection start:', start, 'end:', end);
        if (start !== end) {
            const selected = lyrics.value.substring(start, end);
            console.log('Selected text found:', selected);
            return selected;
        }
        return '';
    }
    
    async function displayWordInfo(selectedText) {
        // Clean the selected text - extract just the word(s)
        const words = selectedText.replace(/[^\w\s]/g, '').split(/\s+/).filter(word => word.length > 0);
        
        if (words.length === 0 || words.length > 1  ) {
            return;
        }
        clearInfo();
        // Show loading message
        infoDiv.innerHTML = '<div style="color: #666; font-style: italic;">Loading word information...</div>';
        
        try {
            // If multiple words selected, focus on the first word
            const primaryWord = words[0].toLowerCase();
            
            // Get information in parallel
            const [syllables, rhymes, synonyms] = await Promise.all([
                getSyllables(primaryWord),
                getRhymes(primaryWord),
                getSynonyms(primaryWord)
            ]);
            
            // Create the info display
            let infoHTML = `<div style="padding: 10px; background-color: #f9f9f9; border-radius: 5px; font-family: Arial, sans-serif;">`;
            
            // Selected text header
            infoHTML += `<h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">
                Selected: <span style="color: #0066cc; font-weight: bold;">"${selectedText}"</span>
            </h3>`;
            
            // Primary word analysis
            if (words.length > 1) {
                infoHTML += `<p style="margin: 5px 0; color: #666; font-size: 12px;">
                    Analyzing primary word: <strong>${primaryWord}</strong>
                </p>`;
            }
            
            // Syllables section
            infoHTML += `<div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 5px 0; color: #444; font-size: 14px;">📝 Syllables:</h4>`;
            
            if (syllables && syllables.length > 0) {
                infoHTML += `<div style="color: #0066cc; font-weight: bold;">${syllables.join(' • ')}</div>
                <div style="color: #666; font-size: 12px;">Count: ${syllables.length}</div>`;
            } else {
                // Fallback to local syllable splitting
                const localSyllables = splitWordIntoSyllables(primaryWord);
                infoHTML += `<div style="color: #0066cc; font-weight: bold;">${localSyllables.join(' • ')}</div>
                <div style="color: #666; font-size: 12px;">Count: ${localSyllables.length} (local analysis)</div>`;
            }
            infoHTML += `</div>`;
            
            // Rhymes section
            infoHTML += `<div style="margin-bottom: 15px;">
                <h4 style="margin: 0 0 5px 0; color: #444; font-size: 14px;">🎵 Rhymes:</h4>`;
            
            if (rhymes && rhymes.length > 0) {
                const displayRhymes = rhymes; // Show all rhymes
                infoHTML += `<div style="color: #cc6600; font-size: 12px; line-height: 1.4;">
                    ${displayRhymes.join(', ')}
                </div>`;
                infoHTML += `<div style="color: #666; font-size: 11px; margin-top: 3px;">
                    Total: ${rhymes.length} rhymes found
                </div>`;
            } else {
                infoHTML += `<div style="color: #999; font-style: italic;">No rhymes found</div>`;
            }
            infoHTML += `</div>`;
            
            // Synonyms section
            infoHTML += `<div style="margin-bottom: 10px;">
                <h4 style="margin: 0 0 5px 0; color: #444; font-size: 14px;">📚 Synonyms:</h4>`;
            
            if (synonyms && synonyms.length > 0) {
                infoHTML += `<div style="color: #006600; font-size: 12px; line-height: 1.4;">
                    ${synonyms.join(', ')}
                </div>
                <div style="color: #666; font-size: 11px; margin-top: 3px;">
                    Total: ${synonyms.length} synonyms found
                </div>`;
            } else {
                infoHTML += `<div style="color: #999; font-style: italic;">No synonyms found</div>`;
            }
            infoHTML += `</div>`;
            
            infoHTML += `</div>`;
            
            // Update the info div
            infoDiv.innerHTML = infoHTML;
            
        } catch (error) {
            console.error('Error displaying word info:', error);
            infoDiv.innerHTML = `<div style="color: #cc0000; font-style: italic; padding: 10px;">
                Error loading word information. Try restarting the application.
            </div>`;
        }
    }
    
    function clearInfo() {
        infoDiv.innerHTML = '<div style="color: #999; font-style: italic; padding: 10px;">Select text to see syllables, rhymes, and synonyms</div>';
    }
    
    // Initialize with empty state and test
    clearInfo();
    
    // Add a simple test button for debugging
    const testButton = document.createElement('button');
    testButton.textContent = 'Test Selection (click then select text)';
    testButton.style.position = 'fixed';
    testButton.style.top = '10px';
    testButton.style.right = '10px';
    testButton.style.zIndex = '1000';
    testButton.onclick = () => {
        console.log('Test button clicked');
        const selectedText = getSelectedText();
        if (selectedText) {
            displayWordInfo(selectedText);
        } else {
            console.log('No text selected');
        }
    };
    document.body.appendChild(testButton);
});
