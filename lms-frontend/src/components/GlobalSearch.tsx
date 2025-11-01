import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  id: string;
  title: string;
  type: 'course' | 'user' | 'batch' | 'content';
  description?: string;
  category?: string;
  rating?: number;
  students?: number;
}

interface SearchFilters {
  type: string;
  category: string;
  difficulty: string;
  duration: string;
}

const GlobalSearch: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    category: 'all',
    difficulty: 'all',
    duration: 'all',
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      // Search courses
      const courses = await apiService.getCourses();
      const courseResults = courses
        .filter(
          course =>
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.description?.toLowerCase().includes(query.toLowerCase()) ||
            course.category?.toLowerCase().includes(query.toLowerCase())
        )
        .map(course => ({
          id: course._id,
          title: course.title,
          type: 'course' as const,
          description: course.description,
          category: course.category,
          rating: course.rating,
          students: course.studentsEnrolled,
        }));

      // Search batches
  const batches = await apiService.getAllBatches();
      const batchResults = batches
        .filter(
          batch =>
            batch.name.toLowerCase().includes(query.toLowerCase()) ||
            batch.course.title.toLowerCase().includes(query.toLowerCase())
        )
        .map(batch => ({
          id: batch._id,
          title: batch.name,
          type: 'batch' as const,
          description: `Batch for ${batch.course.title}`,
          category: batch.course.category,
          rating: batch.course.rating,
          students: batch.students?.length || 0,
        }));

      // Search users (admin only)
      let userResults: SearchResult[] = [];
      if (user?.role === 'admin') {
        const users = await apiService.getAllUsers();
        userResults = users
          .filter(
            u =>
              u.name.toLowerCase().includes(query.toLowerCase()) ||
              u.email.toLowerCase().includes(query.toLowerCase())
          )
          .map(u => ({
            id: u._id,
            title: u.name,
            type: 'user' as const,
            description: u.role.charAt(0).toUpperCase() + u.role.slice(1),
            category: u.role,
          }));
      }

      // Combine and filter results
      let allResults = [...courseResults, ...batchResults, ...userResults];

      // Apply filters
      if (filters.type !== 'all') {
        allResults = allResults.filter(r => r.type === filters.type);
      }
      if (filters.category !== 'all') {
        allResults = allResults.filter(
          r => r.category?.toLowerCase() === filters.category.toLowerCase()
        );
      }

      setResults(allResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
      setQuery(searchQuery);
      setIsOpen(true);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  const applyFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    if (query.length > 2) {
      performSearch();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return '📚';
      case 'user':
        return '👤';
      case 'batch':
        return '👥';
      case 'content':
        return '📄';
      default:
        return '🔍';
    }
  };

  return (
    <div className='relative' ref={searchRef}>
      {/* Search Input */}
      <div className='relative flex items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            type='text'
            placeholder='Search courses, users, batches...'
            value={query}
            onChange={e => {
              setQuery(e.target.value);
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            className='pl-10 pr-10 w-64 md:w-80 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
          />
          {query && (
            <Button
              variant='ghost'
              size='sm'
              onClick={clearSearch}
              className='absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white'
            >
              <X className='h-4 w-4' />
            </Button>
          )}
        </div>

        {/* Search Button */}
        <Button
          onClick={() => {
            handleSearch(query);
          }}
          className='ml-2 bg-blue-600 hover:bg-blue-700'
        >
          Search
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className='absolute top-full left-0 right-0 mt-2 bg-gray-800 border-gray-600 shadow-xl z-50 max-h-96 overflow-y-auto'>
          <CardContent className='p-4'>
            {/* Filters */}
            <div className='flex flex-wrap gap-2 mb-4 pb-2 border-b border-gray-600'>
              <select
                value={filters.type}
                onChange={e => {
                  applyFilters({ type: e.target.value });
                }}
                className='bg-gray-700 text-white border-gray-600 rounded px-2 py-1 text-sm'
              >
                <option value='all'>All Types</option>
                <option value='course'>Courses</option>
                <option value='user'>Users</option>
                <option value='batch'>Batches</option>
                <option value='content'>Content</option>
              </select>

              <select
                value={filters.category}
                onChange={e => {
                  applyFilters({ category: e.target.value });
                }}
                className='bg-gray-700 text-white border-gray-600 rounded px-2 py-1 text-sm'
              >
                <option value='all'>All Categories</option>
                <option value='mathematics'>Mathematics</option>
                <option value='physics'>Physics</option>
                <option value='chemistry'>Chemistry</option>
                <option value='programming'>Programming</option>
                <option value='business'>Business</option>
              </select>

              <Button variant='outline' size='sm' className='border-gray-600 text-gray-300'>
                <Filter className='h-4 w-4 mr-1' />
                More Filters
              </Button>
            </div>

            {/* Loading State */}
            {loading && (
              <div className='flex items-center justify-center py-4'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
                <span className='ml-2 text-gray-400'>Searching...</span>
              </div>
            )}

            {/* No Results */}
            {!loading && results.length === 0 && query.length > 2 && (
              <div className='text-center py-4 text-gray-400'>No results found for "{query}"</div>
            )}

            {/* Recent Searches */}
            {results.length === 0 && query.length <= 2 && recentSearches.length > 0 && (
              <div>
                <h4 className='text-sm font-medium text-gray-300 mb-2 flex items-center'>
                  <Clock className='h-4 w-4 mr-1' />
                  Recent Searches
                </h4>
                <div className='space-y-1'>
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant='ghost'
                      className='w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700'
                      onClick={() => {
                        handleSearch(search);
                      }}
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {!loading && results.length > 0 && (
              <div className='space-y-2'>
                {results.map(result => (
                  <div
                    key={result.id}
                    className='flex items-center justify-between p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors'
                  >
                    <div className='flex items-center space-x-3'>
                      <span className='text-lg'>{getTypeIcon(result.type)}</span>
                      <div>
                        <h4 className='font-medium text-white'>{result.title}</h4>
                        {result.description && (
                          <p className='text-sm text-gray-400'>{result.description}</p>
                        )}
                        <div className='flex items-center space-x-2 mt-1'>
                          <Badge
                            variant='outline'
                            className='text-xs border-gray-600 text-gray-300'
                          >
                            {result.type}
                          </Badge>
                          {result.category && (
                            <Badge
                              variant='outline'
                              className='text-xs border-gray-600 text-gray-300'
                            >
                              {result.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      {result.rating && (
                        <div className='flex items-center text-sm text-gray-300'>
                          <TrendingUp className='h-4 w-4 mr-1' />
                          {result.rating.toFixed(1)}
                        </div>
                      )}
                      {result.students && (
                        <div className='text-sm text-gray-400'>{result.students} students</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalSearch;
