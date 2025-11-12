import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService, TagService, api } from '@/services';
import { categoryService } from '@/services';
import { Button, Input, Dropdown, Checkbox } from '@/components';
import { 
  QuizDto, 
  QuizSearchCriteria, 
  Difficulty,
  CategoryDto,
  TagDto
} from '@/types';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (results: QuizDto[]) => void;
  onSearchChange?: (criteria: QuizSearchCriteria) => void;
}

interface SearchResult {
  content: QuizDto[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  };
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  className = '', 
  placeholder = 'Search quizzes, questions, categories...',
  onSearch,
  onSearchChange
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<QuizSearchCriteria>({});
  const [searchResults, setSearchResults] = useState<QuizDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | ''>('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  const searchTimeoutRef = useRef<number | undefined>(undefined);
  const searchCache = useRef<Map<string, SearchResult>>(new Map());
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  // Load categories and tags on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          categoryService.getCategories({ size: 100 }),
          new TagService(api).getTags({ size: 100 })
        ]);
        setCategories(categoriesResponse.content);
        setTags(tagsResponse.content);
      } catch (err) {
        console.error('Failed to load filters:', err);
      }
    };

    loadFilters();
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to parse search history:', err);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    setSearchHistory(prev => {
      const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  // Generate search suggestions
  const generateSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSuggestions(searchHistory.slice(0, 5));
      return;
    }

    const allSuggestions = [
      ...searchHistory.filter(item => item.toLowerCase().includes(query.toLowerCase())),
      ...categories.filter(cat => cat.name.toLowerCase().includes(query.toLowerCase())).map(cat => cat.name),
      ...tags.filter(tag => tag.name.toLowerCase().includes(query.toLowerCase())).map(tag => tag.name)
    ];

    setSuggestions([...new Set(allSuggestions)].slice(0, 8));
  }, [searchHistory, categories, tags]);

  // Debounced search function
  const performSearch = useCallback(async (criteria: QuizSearchCriteria, page: number = 0) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Create cache key
    const cacheKey = JSON.stringify({ ...criteria, page });
    
    // Check cache first
    if (searchCache.current.has(cacheKey)) {
      const cachedResult = searchCache.current.get(cacheKey)!;
      setSearchResults(cachedResult.content);
      setTotalPages(cachedResult.pageable.totalPages);
      setTotalResults(cachedResult.pageable.totalElements);
      setCurrentPage(page);
      return;
    }

    setIsSearching(true);
    setError(null);

    // Convert arrays to single values for API compatibility
    const apiParams = {
      ...criteria,
      category: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
      tag: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    };

    try {
      const quizService = new QuizService(api);
      const result = await quizService.getQuizzes({
        ...apiParams,
        page,
        size: 12,
        sort: sortBy === 'relevance' ? undefined : sortBy
      });

      // Cache the result
      searchCache.current.set(cacheKey, result);

      setSearchResults(result.content);
      setTotalPages(result.pageable.totalPages);
      setTotalResults(result.pageable.totalElements);
      setCurrentPage(page);
      setShowResults(true);

      // Call callback if provided
      if (onSearch) {
        onSearch(result.content);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      setError(err.message || 'Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  }, [sortBy, onSearch]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const hasSearchCriteria = searchQuery.trim() || 
      selectedCategories.length > 0 || 
      selectedTags.length > 0 || 
      selectedDifficulty || 
      selectedAuthor;

    if (!hasSearchCriteria) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    const criteria: QuizSearchCriteria = {
      search: searchQuery.trim() || undefined,
      category: selectedCategories.length > 0 ? selectedCategories : undefined,
      tag: selectedTags.length > 0 ? selectedTags : undefined,
      difficulty: selectedDifficulty || undefined,
      authorName: selectedAuthor || undefined
    };

    // Convert arrays to single values for API compatibility
    const apiParams = {
      ...criteria,
      category: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
      tag: selectedTags.length > 0 ? selectedTags.join(',') : undefined,
    };

    setSearchCriteria(criteria);

    // Call callback if provided
    if (onSearchChange) {
      onSearchChange(criteria);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(criteria, 0);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedCategories, selectedTags, selectedDifficulty, selectedAuthor, performSearch, onSearchChange]);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    generateSuggestions(value);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowResults(false);
    saveSearchHistory(suggestion);
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveSearchHistory(searchQuery);
      setShowResults(false);
      performSearch(searchCriteria, 0);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchCriteria({});
    setSearchResults([]);
    setShowResults(false);
    setSelectedCategories([]);
    setSelectedTags([]);
    setSelectedDifficulty('');
    setSelectedAuthor('');
    setCurrentPage(0);
    setError(null);
  };

  // Handle filter changes
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTagChange = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    performSearch(searchCriteria, page);
  };

  // Handle result click
  const handleResultClick = (quiz: QuizDto) => {
    navigate(`/quizzes/${quiz.id}`);
    setShowResults(false);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown Category';
  };

  // Get tag names by IDs
  const getTagNames = (tagIds: string[]) => {
    return tagIds.map(id => tags.find(tag => tag.id === id)?.name || 'Unknown Tag');
  };

  // Format search result
  const formatSearchResult = (quiz: QuizDto) => {
    const categoryName = quiz.categoryId ? getCategoryName(quiz.categoryId) : null;
    const tagNames = getTagNames(quiz.tagIds);

    return {
      ...quiz,
      categoryName,
      tagNames
    };
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.trim()) {
                setShowResults(true);
              }
              generateSuggestions(searchQuery);
            }}
            onBlur={() => {
              // Delay hiding results to allow for clicks
              setTimeout(() => setShowResults(false), 200);
            }}
            placeholder={placeholder}
            className="w-full pl-10"
            aria-label="Search"
          />
          
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-theme-text-tertiary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Clear Button */}
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 !p-0 !min-w-0 !w-auto text-theme-text-tertiary hover:text-theme-text-secondary"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}

          {/* Filters Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-10 top-1/2 transform -translate-y-1/2 !p-1 !min-w-0 !w-auto rounded transition-colors ${
              showFilters ? 'bg-theme-bg-info text-theme-interactive-primary' : 'text-theme-text-tertiary hover:text-theme-text-secondary'
            }`}
            aria-label="Toggle filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </Button>
        </div>

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 animate-spin text-theme-interactive-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </form>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg z-50 p-4 bg-theme-bg-primary text-theme-text-primary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">Categories</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map(category => (
                  <Checkbox
                    key={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                    label={category.name}
                  />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">Tags</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {tags.map(tag => (
                  <Checkbox
                    key={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onChange={() => handleTagChange(tag.id)}
                    label={tag.name}
                  />
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">Difficulty</label>
              <Dropdown
                value={selectedDifficulty}
                onChange={(value) => setSelectedDifficulty((typeof value === 'string' ? value : value[0]) as Difficulty | '')}
                options={[
                  { label: 'All Difficulties', value: '' },
                  { label: 'Easy', value: 'EASY' },
                  { label: 'Medium', value: 'MEDIUM' },
                  { label: 'Hard', value: 'HARD' }
                ]}
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-theme-text-secondary mb-2">Author</label>
              <Input
                type="text"
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                placeholder="Search by author..."
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-theme-border-primary">
            <label className="block text-sm font-medium text-theme-text-secondary mb-2">Sort By</label>
            <Dropdown
              value={sortBy}
              onChange={(value) => setSortBy(typeof value === 'string' ? value : value[0])}
              options={[
                { label: 'Relevance', value: 'relevance' },
                { label: 'Title A-Z', value: 'title,asc' },
                { label: 'Title Z-A', value: 'title,desc' },
                { label: 'Newest First', value: 'createdDate,desc' },
                { label: 'Oldest First', value: 'createdDate,asc' }
              ]}
            />
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {showResults && suggestions.length > 0 && !searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg z-50 bg-theme-bg-primary text-theme-text-primary">
          <div className="p-2">
            <div className="text-xs font-medium text-theme-text-tertiary mb-2">Recent Searches</div>
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full !justify-start px-3 py-2 text-sm text-theme-text-secondary hover:bg-theme-bg-tertiary rounded"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto bg-theme-bg-primary text-theme-text-primary">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-theme-text-secondary">
                {totalResults} result{totalResults !== 1 ? 's' : ''} found
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResults(false)}
                className="!p-0 !min-w-0 !w-auto text-theme-text-tertiary hover:text-theme-text-secondary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div className="space-y-3">
              {searchResults.map((quiz) => {
                const formattedQuiz = formatSearchResult(quiz);
                return (
                  <div
                    key={quiz.id}
                    onClick={() => handleResultClick(quiz)}
                    className="p-3 border border-theme-border-primary rounded-lg hover:bg-theme-bg-secondary cursor-pointer transition-colors bg-theme-bg-primary text-theme-text-primary"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-theme-text-primary mb-1">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-sm text-theme-text-secondary mb-2 line-clamp-2">{quiz.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {formattedQuiz.categoryName && (
                            <span className="px-2 py-1 bg-theme-bg-info text-theme-interactive-info rounded">
                              {formattedQuiz.categoryName}
                            </span>
                          )}
                          {formattedQuiz.tagNames.map((tagName, index) => (
                            <span key={index} className="px-2 py-1 bg-theme-bg-tertiary text-theme-text-secondary rounded">
                              {tagName}
                            </span>
                          ))}
                          <span className={`px-2 py-1 rounded ${
                            quiz.difficulty === 'EASY' ? 'bg-theme-bg-success text-theme-interactive-success' :
                            quiz.difficulty === 'MEDIUM' ? 'bg-theme-bg-warning text-theme-interactive-warning' :
                            'bg-theme-bg-danger text-theme-interactive-danger'
                          }`}>
                            {quiz.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-theme-text-tertiary ml-4">
                        {quiz.estimatedTime} min
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
                <div className="flex justify-between items-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-theme-text-secondary">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-theme-bg-danger border border-theme-border-danger rounded-lg p-3 text-sm text-theme-interactive-danger">
          {error}
        </div>
      )}

      {/* No Results */}
      {showResults && searchResults.length === 0 && !isSearching && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-lg z-50 p-4 bg-theme-bg-primary text-theme-text-primary">
          <div className="text-center text-theme-text-tertiary">
            <svg className="w-12 h-12 mx-auto mb-2 text-theme-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No results found for "{searchQuery}"</p>
            <p className="text-sm">Try adjusting your search terms or filters</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar; 