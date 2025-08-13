/**
 * Better syllable splitting using vowel counting method
 * @param {string} word - The word to split
 * @returns {string[]} - Array of syllables
 */

// Configuration
const BASE_URL = 'http://localhost:8080';


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

//https://api.dictionaryapi.dev/api/v2/entries/en/<word>
async function fetchWordDefinition(word) {
  const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
  if (response.ok) {
    const data = await response.json();
    // Process the data to extract the definition
    return data[0] || "No definition found.";
  }
  return "Error fetching definition.";
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
            txt = ' ';
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
            if (line.trim().length > 0) {
              syll += line.replace(/ /g,'&nbsp;')+txt+"<span class='syllable-total'>"+total+"</span><br/>";
            }
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
        
        console.log('Raw selected text:', JSON.stringify(selectedText));
        console.log('Cleaned words array:', words);
        
        if (words.length === 0 || words.length > 1) {
            return;
        }
        
        // If multiple words selected, focus on the first word
        const primaryWord = words[0].toLowerCase().trim();
        
        if (primaryWord.length < 1) {
            return;
        }
        
        console.log('Primary word being sent to API:', JSON.stringify(primaryWord));
        
        clearInfo();
        // Show loading message
        infoDiv.innerHTML = '<div class="loading-message">Loading word information...</div>';
      
          // Get complete word information from the server
          const response = await fetch(`data/${primaryWord}.json`);

          if (!response.ok) {
              if (response.status === 404) {
                  infoDiv.innerHTML = `<div class="not-found-message">Word "${primaryWord}" not found in database</div>`;
                  return;
              }
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const wordInfo = await response.json();
          wordInfo.relationships = wordInfo;
          
          // Create the info display
          let infoHTML = `<div class="word-info-container">`;
          
          // Selected text header
          infoHTML += `<h3 class="word-info-header">
              Selected: <span class="selected-word">"${selectedText}"</span>
          </h3>`;
          // Rhymes section
          infoHTML += `<div class="relationship-section">
              <h4 class="relationship-header">🎵 Rhymes:</h4>`;
          
          if (wordInfo.relationships.rhymes && wordInfo.relationships.rhymes.length > 0) {
            //I didn't ask you to truncate anything
              const displayRhymes = wordInfo.relationships.rhymes; // Limit to first 20
              const rhymeWords = displayRhymes.map(rhyme => 
                  typeof rhyme === 'object' ? rhyme.word : rhyme
              );
              infoHTML += `<div class="rhymes-list">
                  ${rhymeWords.join(', ')}
              </div>`;
          } else {
              infoHTML += `<div class="no-results">No rhymes found</div>`;
          }


          const dict = await fetchWordDefinition(primaryWord);

          // include meanings
          if (dict.meanings) {
              infoHTML += `<div class="meanings-section">
                  <h4 class="meanings-header">📖 Meanings:</h4>`;
              if (dict.origin) {
                  infoHTML += `<p>${dict.origin}</p>`;
              }  
              infoHTML +=`<ul class="meanings-list">`;
              dict.meanings.forEach(meaning => {
                  infoHTML += `<li><i>${meaning.partOfSpeech}</i><ul>`;
                  meaning.definitions.forEach(definition => {
                    infoHTML+= `<li>${definition.definition}</li>`;
                  });
                  infoHTML += `</ul></li>`;
              });
              infoHTML += `</ul>
              </div>`;
          }


          // Word details
          infoHTML += `<div class="word-details">`;
          infoHTML += `<strong>Word:</strong> ${wordInfo.word}<br>`;
          infoHTML += `<strong>Length:</strong> ${wordInfo.length} letters<br>`;
          if (wordInfo.pronunciation) {
              infoHTML += `<strong>Pronunciation:</strong> ${wordInfo.pronunciation}<br>`;
          }
          infoHTML += `</div>`;
          
          // Primary word analysis
          if (words.length > 1) {
              infoHTML += `<p class="primary-word-note">
                  Analyzing primary word: <strong>${primaryWord}</strong>
              </p>`;
          }

          infoHTML += `</div>`;
          
          // Synonyms section
          infoHTML += `<div class="relationship-section">
              <h4 class="relationship-header">📚 Synonyms:</h4>`;
          
          if (wordInfo.relationships.synonyms && wordInfo.relationships.synonyms.length > 0) {
              const displaySynonyms = wordInfo.relationships.synonyms
              const synonymWords = displaySynonyms.map(synonym => 
                  typeof synonym === 'object' ? synonym.word : synonym
              );
              infoHTML += `<div class="synonyms-list">
                  ${synonymWords.join(', ')}
              </div>`;
          } else {
              infoHTML += `<div class="no-results">No synonyms found</div>`;
          }
          infoHTML += `</div>`;
          
          // Antonyms section
          infoHTML += `<div class="relationship-section">
              <h4 class="relationship-header">🔄 Antonyms:</h4>`;
          
          if (wordInfo.relationships.antonyms && wordInfo.relationships.antonyms.length > 0) {
              const displayAntonyms = wordInfo.relationships.antonyms; // Limit to first 10
              infoHTML += `<div class="antonyms-list">
                  ${displayAntonyms.join(', ')}
              </div>`;
          } else {
              infoHTML += `<div class="no-results">No antonyms found</div>`;
          }
          infoHTML += `</div>`;
          
          // Homonyms section
          infoHTML += `<div class="relationship-section">
              <h4 class="relationship-header">🔊 Homonyms:</h4>`;
          
          if (wordInfo.relationships.homonyms && wordInfo.relationships.homonyms.length > 0) {
              const displayHomonyms = wordInfo.relationships.homonyms
              const homonymWords = displayHomonyms.map(homonym => 
                  typeof homonym === 'object' ? homonym.word : homonym
              );
              infoHTML += `<div class="homonyms-list">
                  ${homonymWords.join(', ')}
              </div>`;
          } else {
              infoHTML += `<div class="no-results">No homonyms found</div>`;
          }
          infoHTML += `</div>`;
          
          infoHTML += `</div>`;
          // Update the info div
          infoDiv.innerHTML = infoHTML;
          
    }
    
    function clearInfo() {
        infoDiv.innerHTML = '<div class="default-message">Select text to see syllables, rhymes, and synonyms</div>';
    }
    
    // Initialize with empty state and test
    clearInfo();
   });
