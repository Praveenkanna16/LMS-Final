import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, FileText, Plus, Edit, Trash2, File, Video, Link as LinkIcon, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface Material {
  _id: string;
  title: string;
  description: string;
  type: string;
  url: string;
  fileSize: number;
  duration: number;
  uploadedBy: string;
  uploadedAt: string;
  views: number;
  downloads: number;
}

const BatchContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document',
    url: '',
    fileSize: 0,
    duration: 0,
  });

  useEffect(() => {
    void fetchMaterials();
  }, [id]);

  const fetchMaterials = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await apiService.getBatchMaterials(id);
      setMaterials(response.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load materials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (material?: Material) => {
    if (material) {
      setIsEditing(true);
      setCurrentMaterial(material);
      setFormData({
        title: material.title,
        description: material.description,
        type: material.type,
        url: material.url,
        fileSize: material.fileSize,
        duration: material.duration,
      });
    } else {
      setIsEditing(false);
      setCurrentMaterial(null);
      setFormData({
        title: '',
        description: '',
        type: 'document',
        url: '',
        fileSize: 0,
        duration: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setIsEditing(false);
    setCurrentMaterial(null);
  };

  const handleSubmit = async () => {
    if (!id || !formData.title || !formData.url) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isEditing && currentMaterial) {
        await apiService.updateBatchMaterial(id, currentMaterial._id, formData);
        toast({
          title: 'Success',
          description: 'Material updated successfully',
        });
      } else {
        await apiService.addBatchMaterial(id, formData);
        toast({
          title: 'Success',
          description: 'Material added successfully',
        });
      }
      await fetchMaterials();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving material:', error);
      toast({
        title: 'Error',
        description: 'Failed to save material',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (materialId: string) => {
    if (!id || !confirm('Are you sure you want to delete this material?')) return;

    try {
      await apiService.deleteBatchMaterial(id, materialId);
      toast({
        title: 'Success',
        description: 'Material deleted successfully',
      });
      await fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete material',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className='h-5 w-5 text-purple-600' />;
      case 'link':
        return <LinkIcon className='h-5 w-5 text-blue-600' />;
      case 'assignment':
        return <FileText className='h-5 w-5 text-orange-600' />;
      default:
        return <File className='h-5 w-5 text-gray-600' />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-purple-100 text-purple-700';
      case 'link':
        return 'bg-blue-100 text-blue-700';
      case 'assignment':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='mb-6'>
        <Button
          variant='outline'
          onClick={() => navigate(`/teacher/batches/${id}/manage`)}
          className='mb-4'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Batch Management
        </Button>

        <div className='bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-2xl'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold mb-2'>Content Management</h1>
              <p className='text-green-100 text-lg'>Assign lessons and materials to your batch</p>
            </div>
            <BookOpen className='w-16 h-16 opacity-50' />
          </div>
        </div>
      </div>

      <Card className='border-0 shadow-xl bg-white'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-green-600'>Learning Materials</CardTitle>
              <CardDescription>Manage lessons, assignments, and resources</CardDescription>
            </div>
            <Button
              className='bg-gradient-to-r from-green-600 to-emerald-600'
              onClick={() => handleOpenDialog()}
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Content
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='text-center py-12'>
              <p className='text-gray-500'>Loading materials...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className='text-center py-12'>
              <FileText className='w-16 h-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-lg font-semibold mb-2'>No Materials Yet</h3>
              <p className='text-gray-600 mb-4'>Start by adding learning materials for your students</p>
              <Button onClick={() => handleOpenDialog()} variant='outline'>
                <Plus className='h-4 w-4 mr-2' />
                Add First Material
              </Button>
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {materials.map((material) => (
                <Card key={material._id} className='border border-gray-200 hover:shadow-md transition-shadow'>
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-center gap-2'>
                        {getTypeIcon(material.type)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(material.type)}`}>
                          {material.type}
                        </span>
                      </div>
                      <div className='flex gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleOpenDialog(material)}
                          className='h-7 w-7 p-0'
                        >
                          <Edit className='h-3 w-3' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(material._id)}
                          className='h-7 w-7 p-0 text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='h-3 w-3' />
                        </Button>
                      </div>
                    </div>
                    <h3 className='font-semibold text-base mb-2 line-clamp-2'>{material.title}</h3>
                    {material.description && (
                      <p className='text-gray-600 text-sm mb-3 line-clamp-2'>{material.description}</p>
                    )}
                    <div className='space-y-1 text-xs text-gray-500 mb-3'>
                      {material.fileSize > 0 && (
                        <div className='flex items-center gap-1'>
                          <File className='h-3 w-3' />
                          <span>{formatFileSize(material.fileSize)}</span>
                        </div>
                      )}
                      {material.duration > 0 && (
                        <div className='flex items-center gap-1'>
                          <Video className='h-3 w-3' />
                          <span>{material.duration} minutes</span>
                        </div>
                      )}
                      <div className='flex items-center gap-3'>
                        <div className='flex items-center gap-1'>
                          <Eye className='h-3 w-3' />
                          <span>{material.views} views</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Download className='h-3 w-3' />
                          <span>{material.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <div className='text-xs text-gray-400'>
                      Added {formatDate(material.uploadedAt)}
                    </div>
                    <a
                      href={material.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-sm mt-2'
                    >
                      <LinkIcon className='h-3 w-3' />
                      Open Resource
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Material' : 'Add New Material'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the material details' : 'Add a new learning resource'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div>
              <Label htmlFor='title'>Title *</Label>
              <Input
                id='title'
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder='Enter material title'
              />
            </div>
            <div>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder='Enter material description'
                rows={3}
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='type'>Type *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='document'>Document</SelectItem>
                    <SelectItem value='video'>Video</SelectItem>
                    <SelectItem value='link'>External Link</SelectItem>
                    <SelectItem value='assignment'>Assignment</SelectItem>
                    <SelectItem value='pdf'>PDF</SelectItem>
                    <SelectItem value='presentation'>Presentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor='url'>Resource URL *</Label>
                <Input
                  id='url'
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder='https://...'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='fileSize'>File Size (bytes)</Label>
                <Input
                  id='fileSize'
                  type='number'
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: parseInt(e.target.value) || 0 })}
                  min='0'
                />
              </div>
              <div>
                <Label htmlFor='duration'>Duration (minutes)</Label>
                <Input
                  id='duration'
                  type='number'
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  min='0'
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? 'Update Material' : 'Add Material'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchContent;
