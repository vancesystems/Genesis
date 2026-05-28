import string

class QueryAnalyzer:
    def __init__(self, stop_words, intent_terms, descriptor_terms):
        self.stop_words = stop_words
        self.intent_terms = intent_terms
        self.descriptor_terms = descriptor_terms 

    def analyze(self, query):
        tokens = []
        ignored_terms = []
        intent_terms = []
        descriptor_terms = []
        anchor_terms = []

        for word in query.split():
            # Future improvement add a better regex
            lower_word = word.lower().strip(string.punctuation)
            if lower_word == "":
                continue
            tokens.append(lower_word)
            if lower_word in self.stop_words:
                ignored_terms.append(lower_word)
            elif lower_word in self.intent_terms:
                intent_terms.append(lower_word)
            elif lower_word in self.descriptor_terms:
                descriptor_terms.append(lower_word)
            else:
                anchor_terms.append(lower_word)

        lexical_list = anchor_terms + descriptor_terms
        semantic_list = anchor_terms + descriptor_terms + intent_terms

        lexical_text = " ".join(lexical_list)
        semantic_text = " ".join(semantic_list)

        return QueryAnalysis(query, tokens, ignored_terms, intent_terms, descriptor_terms, anchor_terms, lexical_text, semantic_text)

class QueryAnalysis:
    def __init__(self, original_query, tokens, ignored_terms, intent_terms, descriptor_terms, anchor_terms, lexical_text, semantic_text):
        self.original_query = original_query
        self.tokens = tokens
        self.ignored_terms = ignored_terms
        self.intent_terms = intent_terms
        self.descriptor_terms = descriptor_terms
        self.anchor_terms = anchor_terms
        self.lexical_text = lexical_text
        self.semantic_text = semantic_text