import sqlite3
import re
import nltk
from nltk.corpus import wordnet
from nltk.corpus import cmudict
import requests
import json
import time
from collections import defaultdict
import os

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

try:
    nltk.data.find('corpora/cmudict')
except LookupError:
    nltk.download('cmudict')

# Initialize pronunciation dictionary
pronunciations = cmudict.dict()

class WordDatabase:
    def __init__(self, db_path='words_database.db'):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.create_tables()
    
    def create_tables(self):
        """Create the database tables"""
        cursor = self.conn.cursor()
        
        # Main words table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT UNIQUE NOT NULL,
                word_lower TEXT NOT NULL,
                length INTEGER NOT NULL,
                first_letter TEXT NOT NULL,
                pronunciation TEXT,
                pos_tags TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Rhymes table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS rhymes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word_id INTEGER NOT NULL,
                rhyme_word TEXT NOT NULL,
                rhyme_strength REAL DEFAULT 1.0,
                FOREIGN KEY (word_id) REFERENCES words(id),
                UNIQUE(word_id, rhyme_word)
            )
        ''')
        
        # Synonyms table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS synonyms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word_id INTEGER NOT NULL,
                synonym_word TEXT NOT NULL,
                similarity_score REAL DEFAULT 1.0,
                FOREIGN KEY (word_id) REFERENCES words(id),
                UNIQUE(word_id, synonym_word)
            )
        ''')
        
        # Antonyms table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS antonyms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word_id INTEGER NOT NULL,
                antonym_word TEXT NOT NULL,
                FOREIGN KEY (word_id) REFERENCES words(id),
                UNIQUE(word_id, antonym_word)
            )
        ''')
        
        # Homonyms table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS homonyms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word_id INTEGER NOT NULL,
                homonym_word TEXT NOT NULL,
                homonym_type TEXT DEFAULT 'pronunciation',
                FOREIGN KEY (word_id) REFERENCES words(id),
                UNIQUE(word_id, homonym_word)
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_words_lower ON words(word_lower)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_rhymes_word ON rhymes(word_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_synonyms_word ON synonyms(word_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_antonyms_word ON antonyms(word_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_homonyms_word ON homonyms(word_id)')
        
        self.conn.commit()
    
    def clean_words_file(self, input_file='words'):
        """Clean the words file and return a set of unique alphabetical words"""
        print("Cleaning words file...")
        
        clean_words = set()
        
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    if line_num % 10000 == 0:
                        print(f"Processed {line_num} lines, found {len(clean_words)} unique words")
                    
                    word = line.strip()
                    if not word:
                        continue
                    
                    # Remove non-alphabetical characters and convert to lowercase
                    clean_word = re.sub(r'[^a-zA-Z]', '', word).lower()
                    
                    # Only keep words that are purely alphabetical and at least 2 characters
                    if len(clean_word) >= 2 and clean_word.isalpha():
                        clean_words.add(clean_word)
        
        except FileNotFoundError:
            print(f"Words file '{input_file}' not found!")
            return set()
        
        print(f"Cleaned words: {len(clean_words)} unique words")
        return clean_words
    
    def get_pronunciation(self, word):
        """Get pronunciation using CMU dictionary"""
        word_lower = word.lower()
        if word_lower in pronunciations:
            # Return the first pronunciation (most common)
            return ' '.join(pronunciations[word_lower][0])
        return None
    
    def get_rhymes(self, word):
        """Find rhymes for a word using pronunciation patterns"""
        rhymes = set()
        word_lower = word.lower()
        
        if word_lower not in pronunciations:
            return rhymes
        
        word_pronunciation = pronunciations[word_lower][0]
        
        # Get the rhyming part (usually last 2-3 phonemes)
        if len(word_pronunciation) >= 2:
            rhyme_pattern = word_pronunciation[-2:]  # Last 2 phonemes
            
            # Find words with similar ending pronunciation
            for other_word, other_pronunciations in pronunciations.items():
                if other_word != word_lower and len(other_word) >= 2:
                    for pronunciation in other_pronunciations:
                        if len(pronunciation) >= 2:
                            if pronunciation[-2:] == rhyme_pattern:
                                rhymes.add(other_word)
                                break
        
        return rhymes
    
    def get_synonyms_antonyms(self, word):
        """Get synonyms and antonyms using WordNet"""
        synonyms = set()
        antonyms = set()
        
        synsets = wordnet.synsets(word)
        
        for synset in synsets:
            # Get synonyms
            for lemma in synset.lemmas():
                synonym = lemma.name().replace('_', ' ').lower()
                if synonym != word.lower() and synonym.isalpha():
                    synonyms.add(synonym)
                
                # Get antonyms
                for antonym in lemma.antonyms():
                    antonym_word = antonym.name().replace('_', ' ').lower()
                    if antonym_word.isalpha():
                        antonyms.add(antonym_word)
        
        return synonyms, antonyms
    
    def get_homonyms(self, word):
        """Find homonyms (words with same pronunciation but different meaning)"""
        homonyms = set()
        word_lower = word.lower()
        
        if word_lower not in pronunciations:
            return homonyms
        
        word_pronunciations = pronunciations[word_lower]
        
        # Find words with exact same pronunciation
        for other_word, other_pronunciations in pronunciations.items():
            if other_word != word_lower:
                for word_pron in word_pronunciations:
                    for other_pron in other_pronunciations:
                        if word_pron == other_pron:
                            homonyms.add(other_word)
                            break
        
        return homonyms
    
    def insert_word(self, word):
        """Insert a word into the database and return its ID"""
        cursor = self.conn.cursor()
        
        word_lower = word.lower()
        pronunciation = self.get_pronunciation(word)
        
        try:
            cursor.execute('''
                INSERT OR IGNORE INTO words 
                (word, word_lower, length, first_letter, pronunciation)
                VALUES (?, ?, ?, ?, ?)
            ''', (word, word_lower, len(word), word_lower[0], pronunciation))
            
            # Get the word ID
            cursor.execute('SELECT id FROM words WHERE word_lower = ?', (word_lower,))
            result = cursor.fetchone()
            return result[0] if result else None
            
        except sqlite3.Error as e:
            print(f"Error inserting word '{word}': {e}")
            return None
    
    def insert_relationships(self, word_id, word):
        """Insert all relationships for a word"""
        cursor = self.conn.cursor()
        
        # Get rhymes
        rhymes = self.get_rhymes(word)
        for rhyme in rhymes:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO rhymes (word_id, rhyme_word)
                    VALUES (?, ?)
                ''', (word_id, rhyme))
            except sqlite3.Error:
                pass
        
        # Get synonyms and antonyms
        synonyms, antonyms = self.get_synonyms_antonyms(word)
        
        for synonym in synonyms:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO synonyms (word_id, synonym_word)
                    VALUES (?, ?)
                ''', (word_id, synonym))
            except sqlite3.Error:
                pass
        
        for antonym in antonyms:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO antonyms (word_id, antonym_word)
                    VALUES (?, ?)
                ''', (word_id, antonym))
            except sqlite3.Error:
                pass
        
        # Get homonyms
        homonyms = self.get_homonyms(word)
        for homonym in homonyms:
            try:
                cursor.execute('''
                    INSERT OR IGNORE INTO homonyms (word_id, homonym_word)
                    VALUES (?, ?)
                ''', (word_id, homonym))
            except sqlite3.Error:
                pass
    
    def build_database(self, words_file='words', batch_size=100):
        """Main function to build the complete database"""
        print("Starting database build process...")
        
        # Clean words file
        clean_words = self.clean_words_file(words_file)
        
        if not clean_words:
            print("No words to process!")
            return
        
        words_list = sorted(list(clean_words))
        total_words = len(words_list)
        
        print(f"Processing {total_words} unique words...")
        
        processed = 0
        batch_words = []
        
        for word in words_list:
            batch_words.append(word)
            
            if len(batch_words) >= batch_size:
                self.process_batch(batch_words, processed, total_words)
                processed += len(batch_words)
                batch_words = []
                
                # Commit every batch
                self.conn.commit()
        
        # Process remaining words
        if batch_words:
            self.process_batch(batch_words, processed, total_words)
            self.conn.commit()
        
        print(f"\nDatabase build complete! Processed {total_words} words.")
        self.print_statistics()
    
    def process_batch(self, words_batch, processed, total):
        """Process a batch of words"""
        for word in words_batch:
            # Insert word
            word_id = self.insert_word(word)
            
            if word_id:
                # Insert relationships
                self.insert_relationships(word_id, word)
        
        processed += len(words_batch)
        progress = (processed / total) * 100
        print(f"Progress: {processed}/{total} ({progress:.1f}%)")
    
    def print_statistics(self):
        """Print database statistics"""
        cursor = self.conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM words')
        word_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM rhymes')
        rhyme_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM synonyms')
        synonym_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM antonyms')
        antonym_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM homonyms')
        homonym_count = cursor.fetchone()[0]
        
        print("\n=== Database Statistics ===")
        print(f"Total words: {word_count:,}")
        print(f"Total rhymes: {rhyme_count:,}")
        print(f"Total synonyms: {synonym_count:,}")
        print(f"Total antonyms: {antonym_count:,}")
        print(f"Total homonyms: {homonym_count:,}")
        
        # Average relationships per word
        if word_count > 0:
            print(f"Average rhymes per word: {rhyme_count/word_count:.2f}")
            print(f"Average synonyms per word: {synonym_count/word_count:.2f}")
            print(f"Average antonyms per word: {antonym_count/word_count:.2f}")
            print(f"Average homonyms per word: {homonym_count/word_count:.2f}")
    
    def search_word(self, word):
        """Search for a word and return all its relationships"""
        cursor = self.conn.cursor()
        
        cursor.execute('SELECT id FROM words WHERE word_lower = ?', (word.lower(),))
        result = cursor.fetchone()
        
        if not result:
            return None
        
        word_id = result[0]
        
        # Get all relationships
        relationships = {
            'rhymes': [],
            'synonyms': [],
            'antonyms': [],
            'homonyms': []
        }
        
        cursor.execute('SELECT rhyme_word FROM rhymes WHERE word_id = ?', (word_id,))
        relationships['rhymes'] = [row[0] for row in cursor.fetchall()]
        
        cursor.execute('SELECT synonym_word FROM synonyms WHERE word_id = ?', (word_id,))
        relationships['synonyms'] = [row[0] for row in cursor.fetchall()]
        
        cursor.execute('SELECT antonym_word FROM antonyms WHERE word_id = ?', (word_id,))
        relationships['antonyms'] = [row[0] for row in cursor.fetchall()]
        
        cursor.execute('SELECT homonym_word FROM homonyms WHERE word_id = ?', (word_id,))
        relationships['homonyms'] = [row[0] for row in cursor.fetchall()]
        
        return relationships
    
    def close(self):
        """Close the database connection"""
        self.conn.close()

def main():
    """Main execution function"""
    print("Word Database Builder")
    print("=====================")
    
    # Create database instance
    db = WordDatabase()
    
    try:
        # Build the database
        db.build_database()
        
        # Test with a few words
        print("\n=== Testing Database ===")
        test_words = ['love', 'happy', 'run', 'beautiful']
        
        for word in test_words:
            if os.path.exists('words_database.db'):
                relationships = db.search_word(word)
                if relationships:
                    print(f"\nWord: {word}")
                    print(f"  Rhymes: {relationships['rhymes'][:5]}...")  # Show first 5
                    print(f"  Synonyms: {relationships['synonyms'][:5]}...")
                    print(f"  Antonyms: {relationships['antonyms'][:3]}...")
                    print(f"  Homonyms: {relationships['homonyms'][:3]}...")
    
    except KeyboardInterrupt:
        print("\nProcess interrupted by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()
        print("\nDatabase connection closed")

if __name__ == "__main__":
    main()
