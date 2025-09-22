import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizService } from '../../api/quiz.service';
import { categoryService } from '../../features/category';
import { TagService } from '../../api/tag.service';
import { 
  QuizDto, 
  QuizSearchCriteria, 
  Difficulty 
} from '@/types';
import { CategoryDto } from '@/types';
import { TagDto } from '@/types';
import api from '../../api/axiosInstance';

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
          <input
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
            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            aria-label="Search"
          />
          
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Clear Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-10 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            aria-label="Toggle filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </button>
        </div>

        {/* Loading Indicator */}
        {isSearching && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </form>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {categories.map(category => (
                  <label key={category.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {tags.map(tag => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => handleTagChange(tag.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty | '')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
              <input
                type="text"
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                placeholder="Search by author..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="relevance">Relevance</option>
              <option value="title,asc">Title A-Z</option>
              <option value="title,desc">Title Z-A</option>
              <option value="createdDate,desc">Newest First</option>
              <option value="createdDate,asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {showResults && suggestions.length > 0 && !searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2">Recent Searches</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm text-gray-600">
                {totalResults} result{totalResults !== 1 ? 's' : ''} found
              </div>
              <button
                onClick={() => setShowResults(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {searchResults.map((quiz) => {
                const formattedQuiz = formatSearchResult(quiz);
                return (
                  <div
                    key={quiz.id}
                    onClick={() => handleResultClick(quiz)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{quiz.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 text-xs">
                          {formattedQuiz.categoryName && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {formattedQuiz.categoryName}
                            </span>
                          )}
                          {formattedQuiz.tagNames.map((tagName, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                              {tagName}
                            </span>
                          ))}
                          <span className={`px-2 py-1 rounded ${
                            quiz.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                            quiz.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {quiz.difficulty}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {quiz.estimatedTime} min
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* No Results */}
      {showResults && searchResults.length === 0 && !isSearching && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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