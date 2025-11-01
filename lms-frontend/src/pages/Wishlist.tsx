import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Plus,
  Star,
  Calendar,
  Users,
  Tag,
  Share2,
  Filter,
  Search,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Clock,
  TrendingDown,
  ExternalLink,
  Eye,
} from 'lucide-react';

const Wishlist: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date_added');
  const [showOnSale, setShowOnSale] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const wishlistData = await apiService.getWishlist();
      setWishlist(wishlistData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load wishlist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await apiService.removeFromWishlist(itemId);
      await loadWishlist();
      toast({
        title: 'Success',
        description: 'Item removed from wishlist',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item',
        variant: 'destructive',
      });
    }
  };

  const handleAddToCart = async (item: any) => {
    try {
      await apiService.addToCart(
        item.type === 'course' ? item.course : undefined,
        item.type === 'batch' ? item.batch : undefined,
        1
      );
      toast({
        title: 'Success',
        description: 'Item added to cart!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to cart',
        variant: 'destructive',
      });
    }
  };

  const handleShareWishlist = async () => {
    try {
      setShareLoading(true);
      const shareData = await apiService.generateWishlistShareToken();

      // Copy share URL to clipboard
      await navigator.clipboard.writeText(shareData.publicUrl);

      toast({
        title: 'Success',
        description: 'Wishlist shared! Link copied to clipboard.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to share wishlist',
        variant: 'destructive',
      });
    } finally {
      setShareLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const filteredItems =
    wishlist?.items.filter((item: any) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.teacherName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesPriority = selectedPriority === 'all' || item.priority === selectedPriority;

      const matchesSale =
        !showOnSale || item.discount > 0 || (item.originalPrice && item.originalPrice > item.price);

      return matchesSearch && matchesCategory && matchesPriority && matchesSale;
    }) || [];

  const sortedItems = [...filteredItems].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'category':
        return a.category.localeCompare(b.category);
      case 'date_added':
      default:
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
  });

  const categories = wishlist?.categories?.map((cat: any) => cat.name) || [];
  const uniqueCategories = ['all', ...new Set(categories)];

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-purple-500' />
          <p className='text-gray-600'>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Header */}
          <div className='mb-8'>
            <Button
              variant='ghost'
              onClick={() => {
                navigate(-1);
              }}
              className='mb-4'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back
            </Button>

            <div className='text-center'>
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>Your Wishlist</h1>
              <p className='text-xl text-gray-600'>Save courses and batches for later</p>
            </div>
          </div>

          {/* Empty Wishlist */}
          <div className='text-center py-16'>
            <Heart className='w-16 h-16 text-gray-400 mx-auto mb-6' />
            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Your wishlist is empty</h2>
            <p className='text-gray-600 mb-8 max-w-md mx-auto'>
              Start adding courses and batches to your wishlist so you can easily find them later!
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Button
                onClick={() => {
                  navigate('/courses');
                }}
                className='bg-gradient-to-r from-purple-500 to-pink-500'
              >
                Browse Courses
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  navigate('/');
                }}
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            onClick={() => {
              navigate(-1);
            }}
            className='mb-4'
          >
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back
          </Button>

          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-4xl font-bold text-gray-900 mb-2'>Your Wishlist</h1>
              <p className='text-xl text-gray-600'>
                {wishlist.stats.totalItems} {wishlist.stats.totalItems === 1 ? 'item' : 'items'}{' '}
                saved
              </p>
            </div>

            <div className='flex gap-2'>
              <Button variant='outline' onClick={handleShareWishlist} disabled={shareLoading}>
                {shareLoading ? (
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                ) : (
                  <Share2 className='w-4 h-4 mr-2' />
                )}
                Share Wishlist
              </Button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm mb-8'>
          <CardContent className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
              {/* Search */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  placeholder='Search wishlist...'
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                  }}
                  className='pl-10'
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCategories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder='Priority' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Priorities</SelectItem>
                  <SelectItem value='urgent'>Urgent</SelectItem>
                  <SelectItem value='high'>High</SelectItem>
                  <SelectItem value='medium'>Medium</SelectItem>
                  <SelectItem value='low'>Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='date_added'>Date Added</SelectItem>
                  <SelectItem value='price_low'>Price: Low to High</SelectItem>
                  <SelectItem value='price_high'>Price: High to Low</SelectItem>
                  <SelectItem value='rating'>Highest Rated</SelectItem>
                  <SelectItem value='priority'>Priority</SelectItem>
                  <SelectItem value='category'>Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Filters */}
            <div className='flex flex-wrap gap-2 mt-4'>
              <Button
                variant={showOnSale ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setShowOnSale(!showOnSale);
                }}
              >
                <TrendingDown className='w-4 h-4 mr-1' />
                On Sale Only
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Items</p>
                  <p className='text-2xl font-bold text-gray-900'>{wishlist.stats.totalItems}</p>
                </div>
                <Heart className='w-8 h-8 text-red-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Value</p>
                  <p className='text-2xl font-bold text-gray-900'>
                    ₹{wishlist.stats.totalValue.toLocaleString()}
                  </p>
                </div>
                <Tag className='w-8 h-8 text-green-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Potential Savings</p>
                  <p className='text-2xl font-bold text-green-600'>
                    ₹{wishlist.stats.potentialSavings.toLocaleString()}
                  </p>
                </div>
                <TrendingDown className='w-8 h-8 text-green-500' />
              </div>
            </CardContent>
          </Card>

          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>On Sale</p>
                  <p className='text-2xl font-bold text-orange-600'>
                    {
                      wishlist.items.filter(
                        (item: any) =>
                          item.discount > 0 ||
                          (item.originalPrice && item.originalPrice > item.price)
                      ).length
                    }
                  </p>
                </div>
                <AlertCircle className='w-8 h-8 text-orange-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Wishlist Items */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {sortedItems.map((item: any) => (
            <Card
              key={item._id}
              className='group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden'
            >
              <div className='relative'>
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

                {/* Priority Badge */}
                <div
                  className={`absolute top-2 left-2 px-2 py-1 rounded-full text-white text-xs font-medium ${getPriorityColor(item.priority)}`}
                >
                  {getPriorityText(item.priority)}
                </div>

                {/* Discount Badge */}
                {item.discount > 0 && (
                  <Badge className='absolute top-2 right-2 bg-red-500 text-white'>
                    {item.discount}% OFF
                  </Badge>
                )}

                {/* Quick Actions */}
                <div className='absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                  <Button
                    size='sm'
                    onClick={() => handleAddToCart(item)}
                    className='bg-white/90 text-gray-900 hover:bg-white'
                  >
                    <ShoppingCart className='w-4 h-4' />
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleRemoveItem(item._id)}
                    className='bg-white/90 text-gray-900 hover:bg-white border-white/50'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              </div>

              <CardContent className='p-6'>
                <div className='mb-3'>
                  <h3 className='font-semibold text-lg mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors'>
                    {item.title}
                  </h3>
                  <p className='text-sm text-gray-600 line-clamp-2 mb-3'>{item.description}</p>
                </div>

                {/* Teacher and Rating */}
                <div className='flex items-center gap-2 mb-3'>
                  <img
                    src={
                      item.teacherAvatar ||
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher'
                    }
                    alt={item.teacherName}
                    className='w-6 h-6 rounded-full'
                  />
                  <span className='text-sm text-gray-600'>{item.teacherName}</span>
                </div>

                <div className='flex items-center gap-4 text-sm text-gray-600 mb-3'>
                  <div className='flex items-center gap-1'>
                    <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                    <span>{item.rating || 0}</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Users className='w-4 h-4' />
                    <span>{item.studentsEnrolled || 0} students</span>
                  </div>
                  <Badge variant='outline' className='text-xs'>
                    {item.type}
                  </Badge>
                </div>

                {/* Price */}
                <div className='mb-4'>
                  <div className='flex items-center gap-2'>
                    {item.originalPrice && item.originalPrice > item.price ? (
                      <>
                        <span className='text-lg font-bold'>₹{item.price}</span>
                        <span className='text-sm text-gray-500 line-through'>
                          ₹{item.originalPrice}
                        </span>
                        <Badge className='bg-green-500 text-white text-xs'>
                          Save ₹{item.originalPrice - item.price}
                        </Badge>
                      </>
                    ) : (
                      <span className='text-lg font-bold'>₹{item.price}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-2'>
                  <Button
                    onClick={() => handleAddToCart(item)}
                    className='flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  >
                    <ShoppingCart className='w-4 h-4 mr-2' />
                    Add to Cart
                  </Button>
                  <Button
                    variant='outline'
                    onClick={() => handleRemoveItem(item._id)}
                    className='border-red-300 text-red-600 hover:bg-red-50'
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty Filtered Results */}
        {sortedItems.length === 0 && (
          <div className='text-center py-12'>
            <Search className='w-16 h-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-xl font-semibold mb-2'>No items found</h3>
            <p className='text-gray-600'>Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
