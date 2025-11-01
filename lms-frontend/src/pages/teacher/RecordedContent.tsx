import React, { useEffect, useState, useRef } from 'react';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Download, Eye, Edit, Trash2, Plus, Calendar } from 'lucide-react';

type RecordedContentType = {
  id: number;
  title: string;
  description?: string;
  teacher?: { name?: string } | null;
  thumbnailUrl?: string | null;
  duration?: string | number;
  downloads?: number;
  views?: number;
  tags?: string[];
  transcript?: string | null;
  notes?: string | null;
  createdAt?: string;
  isPublic?: boolean;
  videoUrl?: string | null;
  filePath?: string | null;
  metadata?: any;
  quality?: string | null;
};

const RecordedContent: React.FC = () => {
  const [recordedContent, setRecordedContent] = useState<RecordedContentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    notes: '',
    tags: '',
    quality: '720p',
    isPublic: false,
    batchId: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [watching, setWatching] = useState<RecordedContentType | null>(null);
  const [editing, setEditing] = useState<RecordedContentType | null>(null);
  const [editForm, setEditForm] = useState<any>({ title: '', description: '', isPublic: false, thumbnailUrl: '', notes: '', tags: [], quality: '720p' });

  const fetchRecordedContent = async () => {
    try {
      setLoading(true);
      const resp: any = await apiService.getContentLibrary();
      if (resp && resp.success && resp.data && Array.isArray(resp.data.content)) setRecordedContent(resp.data.content);
      else setRecordedContent(resp.data || []);
    } catch {
      setRecordedContent([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await apiService.getMyTeacherBatches();
      if (response && response.data && Array.isArray(response.data)) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      setBatches([]);
    }
  };

  useEffect(() => { 
    void fetchRecordedContent();
    void fetchBatches();
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadForm({
      title: '',
      description: '',
      notes: '',
      tags: '',
      quality: '720p',
      isPublic: false,
      batchId: '',
    });
    setUploading(false);
    setUploadError(null);
    setShowUploadModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset everything first
    setUploading(false);
    setUploadError(null);
    
    // Set file and pre-fill title
    setUploadFile(file);
    setUploadForm({
      ...uploadForm,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
    });
    setShowUploadModal(true);
    
    console.log('📁 File selected:', file.name, 'Opening modal for details...');
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      setUploadError('No file selected');
      return;
    }

    if (!uploadForm.title.trim()) {
      setUploadError('Please enter a title');
      return;
    }

    if (!uploadForm.batchId) {
      setUploadError('Please select a batch');
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    
    try {
      const form = new FormData();
      form.append('file', uploadFile);
      form.append('title', uploadForm.title || uploadFile.name);
      form.append('description', uploadForm.description || '');
      form.append('notes', uploadForm.notes || '');
      form.append('tags', uploadForm.tags || '');
      form.append('quality', uploadForm.quality || '720p');
      form.append('isPublic', String(uploadForm.isPublic));
      if (uploadForm.batchId) {
        form.append('batchId', uploadForm.batchId);
      }
      
      console.log('📤 Uploading video with details:', {
        filename: uploadFile.name,
        title: uploadForm.title,
        description: uploadForm.description,
        batchId: uploadForm.batchId,
      });
      
      const res: any = await apiService.uploadContent(form);
      
      if (res?.success) {
        console.log('✅ Video uploaded successfully:', res);
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadForm({
          title: '',
          description: '',
          notes: '',
          tags: '',
          quality: '720p',
          isPublic: false,
          batchId: '',
        });
        await fetchRecordedContent();
      } else {
        console.error('❌ Upload failed:', res);
        setUploadError(res?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resolveMediaUrl = (path?: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${window.location.protocol}//${window.location.hostname}:5001${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const openEdit = (video: RecordedContentType) => {
    setEditing(video);
    setEditForm({ title: video.title || '', description: video.description || '', isPublic: !!video.isPublic, thumbnailUrl: video.thumbnailUrl || '', notes: (video.metadata && video.metadata.notes) || video.notes || '', tags: video.tags || [], quality: video.quality || '720p' });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const payload: any = { title: editForm.title, description: editForm.description, isPublic: editForm.isPublic };
    if (editForm.thumbnailUrl !== undefined) payload.thumbnailUrl = editForm.thumbnailUrl;
    if (editForm.notes !== undefined) payload.notes = editForm.notes;
    if (editForm.tags !== undefined) payload.tags = Array.isArray(editForm.tags) ? editForm.tags : String(editForm.tags).split(',').map((t: string) => t.trim()).filter(Boolean);
    if (editForm.quality) payload.quality = editForm.quality;
    try {
      const res: any = await apiService.updateContent(String(editing.id), payload);
      if (res?.success) { setEditing(null); await fetchRecordedContent(); }
    } catch (e) { /* ignore */ }
  };

  const handleDownload = (video: RecordedContentType) => {
    const url = resolveMediaUrl(video.videoUrl || video.filePath || '');
    if (url) window.open(url, '_blank');
  };

  const handleDelete = async (video: RecordedContentType) => {
    if (!confirm('Delete this content?')) return;
    try { const res: any = await apiService.deleteContent(String(video.id)); if (res?.success) await fetchRecordedContent(); } catch { /* ignore */ }
  };

  const titleRef = useRef<HTMLInputElement | null>(null);

  const WatchModal = () => {
    if (!watching) return null;
    const resolved = resolveMediaUrl(watching.videoUrl || watching.filePath || '');
    const [videoError, setVideoError] = useState(false);

    return (
      <div className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm' onClick={() => setWatching(null)}>
        <div className='bg-white rounded-2xl overflow-hidden w-11/12 md:w-3/4 lg:w-2/3 max-w-4xl shadow-2xl' onClick={(e) => e.stopPropagation()}>
          <div className='p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex justify-between items-center'>
            <h3 className='text-xl font-bold text-gray-900'>{watching.title}</h3>
            <button 
              onClick={() => setWatching(null)} 
              className='text-gray-600 hover:text-gray-900 hover:bg-gray-200 p-2 rounded-full transition-colors'
            >
              ✕
            </button>
          </div>
          <div className='p-6 bg-gray-50'>
            {!videoError ? (
              <>
                <video 
                  src={resolved} 
                  controls 
                  className='w-full h-auto rounded-lg shadow-lg bg-black'
                  onError={() => setVideoError(true)}
                  controlsList='nodownload'
                />
                {watching.description && (
                  <div className='mt-4 p-4 bg-white rounded-lg border'>
                    <h4 className='font-semibold mb-2 text-gray-900'>Description</h4>
                    <p className='text-gray-700'>{watching.description}</p>
                  </div>
                )}
                {watching.notes && (
                  <div className='mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                    <h4 className='font-semibold mb-2 text-blue-900'>Notes</h4>
                    <p className='text-blue-800'>{watching.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className='bg-red-50 border border-red-200 rounded-lg p-8 text-center'>
                <p className='text-red-700 font-semibold mb-2'>Unable to load video</p>
                <p className='text-sm text-red-600 mb-4'>The video file may be corrupted or the URL is invalid</p>
                <a className='text-blue-600 underline hover:text-blue-800 text-sm' href={resolved} target='_blank' rel='noreferrer'>
                  Try opening directly: {resolved}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EditModal = () => {
    if (!editing) return null;
    useEffect(() => { setTimeout(() => titleRef.current?.focus(), 0); }, []);
  const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); if ((e as any).nativeEvent?.stopImmediatePropagation) (e as any).nativeEvent.stopImmediatePropagation(); };
  const stopKey = (e: React.KeyboardEvent) => { e.stopPropagation(); if ((e as any).nativeEvent?.stopImmediatePropagation) (e as any).nativeEvent.stopImmediatePropagation(); };
    return (
      <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center' onMouseDown={stop} onKeyDown={stopKey} onKeyDownCapture={stopKey} onKeyPressCapture={stopKey} onPointerDown={stop}>
        <div className='bg-white rounded-lg overflow-hidden w-11/12 md:w-3/4 lg:w-2/3 shadow-xl' role='dialog' aria-modal='true' onMouseDown={stop} onKeyDownCapture={stopKey} onKeyPressCapture={stopKey}>
          <div className='p-4 border-b flex justify-between items-center'>
            <h3 className='font-semibold'>Edit Content</h3>
            <button onClick={() => setEditing(null)} className='text-gray-600'>Close</button>
          </div>
          <div className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Title</label>
                <input
                  ref={titleRef}
                  value={editForm.title}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  onFocus={stop}
                  onKeyDown={stopKey}
                  onKeyDownCapture={stopKey}
                  onKeyPress={stopKey}
                  onKeyPressCapture={stopKey}
                  onKeyUp={stopKey}
                  onKeyUpCapture={stopKey}
                  className='w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                  autoFocus
                />
              </div>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  onFocus={stop}
                  onKeyDown={stopKey}
                  onKeyDownCapture={stopKey}
                  onKeyPress={stopKey}
                  onKeyPressCapture={stopKey}
                  onKeyUp={stopKey}
                  onKeyUpCapture={stopKey}
                  className='w-full border p-3 rounded h-24 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Thumbnail URL</label>
                <input
                  value={editForm.thumbnailUrl}
                  onChange={e => setEditForm(prev => ({ ...prev, thumbnailUrl: e.target.value }))}
                  onFocus={stop}
                  onKeyDown={stopKey}
                  onKeyDownCapture={stopKey}
                  onKeyPress={stopKey}
                  onKeyPressCapture={stopKey}
                  onKeyUp={stopKey}
                  onKeyUpCapture={stopKey}
                  className='w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  onFocus={stop}
                  onKeyDown={stopKey}
                  onKeyDownCapture={stopKey}
                  onKeyPress={stopKey}
                  onKeyPressCapture={stopKey}
                  onKeyUp={stopKey}
                  onKeyUpCapture={stopKey}
                  className='w-full border p-3 rounded h-24 focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Tags</label>
                <input
                  value={Array.isArray(editForm.tags) ? editForm.tags.join(', ') : editForm.tags}
                  onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  onFocus={stop}
                  onKeyDown={stopKey}
                  onKeyDownCapture={stopKey}
                  onKeyPress={stopKey}
                  onKeyPressCapture={stopKey}
                  onKeyUp={stopKey}
                  onKeyUpCapture={stopKey}
                  className='w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Quality</label>
                <select
                  value={editForm.quality}
                  onChange={e => setEditForm(prev => ({ ...prev, quality: e.target.value }))}
                  onFocus={stop}
                  onKeyDown={stopKey}
                  onKeyDownCapture={stopKey}
                  onKeyPress={stopKey}
                  onKeyPressCapture={stopKey}
                  onKeyUp={stopKey}
                  onKeyUpCapture={stopKey}
                  className='w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='360p'>360p</option>
                  <option value='480p'>480p</option>
                  <option value='720p'>720p</option>
                  <option value='1080p'>1080p</option>
                </select>
              </div>
              <div className='flex items-center gap-3'>
                <label className='inline-flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={editForm.isPublic}
                    onChange={e => setEditForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    onFocus={stop}
                    onKeyDown={stopKey}
                    onKeyDownCapture={stopKey}
                  />
                  <span className='text-sm'>Public</span>
                </label>
              </div>
            </div>
            <div className='mt-6 flex justify-end gap-3'>
              <button className='px-4 py-2 bg-gray-100 border rounded' onClick={() => setEditing(null)}>Cancel</button>
              <button className='px-4 py-2 bg-blue-600 text-white rounded shadow' onClick={() => void handleSaveEdit()}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden'>
        <div className='absolute top-20 right-20 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse' />
        <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>
          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden'>
            <div className='bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center'><Play className='w-6 h-6 text-white' /></div>
                <Badge className='bg-white/20 text-white px-4 py-1'>Video Library</Badge>
              </div>
              <h1 className='text-4xl font-bold text-white mb-2'>Recorded Content</h1>
              <p className='text-blue-100 mb-4'>Manage your recorded classes and videos</p>
              <div className='flex items-center gap-4'>
                <Button size='lg' className='bg-white text-blue-600' onClick={handleUploadClick} disabled={uploading}><Plus className='w-5 h-5 mr-2' />{uploading ? 'Uploading...' : 'Upload Recording'}</Button>
                <input type='file' accept='video/*' style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                {uploadError && <div className='text-red-600'>{uploadError}</div>}
              </div>
            </div>
          </Card>

          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardContent className='p-6'>
              <div className='flex gap-4'>
                <div className='flex-1 relative'>
                  <Play className='absolute left-4 top-3 text-gray-400 w-5 h-5' />
                  <input placeholder='Search videos, topics, or tags...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='pl-12 py-3 border rounded-xl w-full' />
                </div>
                <div className='flex gap-3'>
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className='px-4 py-3 border rounded-xl bg-white'>
                    <option value='all'>All Subjects</option>
                    <option>Mathematics</option>
                    <option>Physics</option>
                  </select>
                  <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className='px-4 py-3 border rounded-xl bg-white'>
                    <option value='all'>All Content</option>
                    <option value='lecture'>Lectures</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-white/90 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden'>
            <CardHeader className='border-b'><div className='flex items-center justify-between'><div><CardTitle>Video Library</CardTitle><CardDescription>{recordedContent.length} video{recordedContent.length !== 1 ? 's' : ''} found</CardDescription></div><Badge className='bg-purple-100 text-purple-700'>{recordedContent.length} Total</Badge></div></CardHeader>
            <CardContent>
              {loading ? <div className='py-12 text-center'>Loading...</div> : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6'>
                  {recordedContent.filter(c => {
                    const s = searchTerm.toLowerCase();
                    return !s || (c.title||'').toLowerCase().includes(s) || (c.description||'').toLowerCase().includes(s) || (c.tags||[]).some(t => t.toLowerCase().includes(s));
                  }).map(video => (
                    <div key={video.id} className='bg-white rounded-2xl border p-4'>
                      <img src={video.thumbnailUrl || 'https://via.placeholder.com/400x225?text=No+Thumbnail'} alt={video.title} className='w-full h-48 object-cover rounded-md' />
                      <h3 className='font-semibold mt-3'>{video.title}</h3>
                      <p className='text-sm text-gray-600'>{video.description}</p>
                      <div className='flex items-center justify-between mt-4'>
                        <div className='flex gap-2'>
                          <Button size='sm' onClick={() => setWatching(video)} className='bg-gradient-to-r from-blue-500 to-purple-500'><Play className='w-4 h-4 mr-2' />Watch</Button>
                          <Button size='sm' variant='outline' onClick={() => handleDownload(video)}><Download className='w-4 h-4 mr-2' />Download</Button>
                        </div>
                        <div className='flex gap-2'>
                          <Button size='sm' variant='ghost' onClick={() => openEdit(video)}><Edit className='w-4 h-4' /></Button>
                          <Button size='sm' variant='ghost' onClick={() => handleDelete(video)}><Trash2 className='w-4 h-4 text-red-600' /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <WatchModal />
      <EditModal />
      
      {/* Upload Modal with Details Form */}
      {showUploadModal && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' onClick={resetUploadForm}>
          <div className='bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden' onClick={e => e.stopPropagation()}>
            {/* Header - Fixed */}
            <div className='flex items-center justify-between p-6 border-b'>
              <div>
                <h2 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>Upload Video</h2>
                <p className='text-gray-600 mt-1'>Add details for your recorded class</p>
              </div>
              <button 
                onClick={resetUploadForm}
                className='text-gray-400 hover:text-gray-600 text-2xl font-bold px-3 py-1 hover:bg-gray-100 rounded-full'
              >
                ✕
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className='flex-1 overflow-y-auto p-6'>
              {uploadFile && (
                <div className='mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                  <p className='text-sm text-gray-600'>Selected File:</p>
                  <p className='font-semibold text-gray-900'>{uploadFile.name}</p>
                  <p className='text-xs text-gray-500 mt-1'>{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
              
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Title <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={uploadForm.title}
                    onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder='Enter video title'
                    disabled={uploading}
                    className='w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                  />
                </div>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Description</label>
                  <textarea
                    value={uploadForm.description}
                    onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder='Brief description of the class content'
                    rows={3}
                    disabled={uploading}
                    className='w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                  />
                </div>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Notes</label>
                  <textarea
                    value={uploadForm.notes}
                    onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    placeholder='Additional notes for students'
                    rows={3}
                    disabled={uploading}
                    className='w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                  />
                </div>
                
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Tags</label>
                  <input
                    type='text'
                    value={uploadForm.tags}
                    onChange={e => setUploadForm({ ...uploadForm, tags: e.target.value })}
                    placeholder='Enter tags separated by commas (e.g., Math, Algebra, Chapter 5)'
                    disabled={uploading}
                    className='w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                  />
                </div>
                
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Quality</label>
                    <select
                      value={uploadForm.quality}
                      onChange={e => setUploadForm({ ...uploadForm, quality: e.target.value })}
                      disabled={uploading}
                      className='w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                    >
                      <option value='360p'>360p</option>
                      <option value='480p'>480p</option>
                      <option value='720p'>720p (Recommended)</option>
                      <option value='1080p'>1080p</option>
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Batch <span className='text-red-500'>*</span>
                    </label>
                    <select
                      value={uploadForm.batchId}
                      onChange={e => setUploadForm({ ...uploadForm, batchId: e.target.value })}
                      disabled={uploading}
                      className='w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
                    >
                      <option value=''>Select a batch</option>
                      {batches.map((batch: any) => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className='flex items-center gap-3 p-4 bg-gray-50 rounded-lg'>
                  <input
                    type='checkbox'
                    id='isPublic'
                    checked={uploadForm.isPublic}
                    onChange={e => setUploadForm({ ...uploadForm, isPublic: e.target.checked })}
                    disabled={uploading}
                    className='w-4 h-4 disabled:cursor-not-allowed'
                  />
                  <label htmlFor='isPublic' className='text-sm font-medium text-gray-700 cursor-pointer'>
                    Make this video public to all enrolled students
                  </label>
                </div>

                {uploading && (
                  <div className='p-4 bg-blue-50 rounded-lg border border-blue-300'>
                    <div className='flex items-center gap-3'>
                      <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600'></div>
                      <div>
                        <p className='text-blue-700 font-semibold'>Uploading...</p>
                        <p className='text-sm text-blue-600'>Processing your video. Please wait.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {uploadError && (
                <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm'>
                  {uploadError}
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className='flex gap-3 p-6 border-t bg-gray-50'>
              <button
                onClick={resetUploadForm}
                className='flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition-colors'
                disabled={uploading}
              >
                {uploading ? 'Please wait...' : 'Cancel'}
              </button>
              <button
                onClick={handleUploadSubmit}
                disabled={uploading || !uploadForm.title.trim() || !uploadForm.batchId}
                className='flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all'
              >
                {uploading ? '📤 Uploading...' : '✅ Upload Video'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RecordedContent;

