import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VideoDownload } from '../components/VideoDownload';
import { toast } from 'sonner';

vi.mock('sonner');

describe('VideoDownload Component', () => {
  const mockProps = {
    videoId: 1,
    videoTitle: 'Test Video',
    videoUrl: 'https://example.com/video.mp4',
    allowDownload: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.setItem('token', 'test-token');
  });

  it('renders download button when downloads are allowed', () => {
    render(<VideoDownload {...mockProps} />);
    
    expect(screen.getByText('Download Video')).toBeInTheDocument();
  });

  it('shows disabled state when downloads are not allowed', () => {
    render(<VideoDownload {...mockProps} allowDownload={false} />);
    
    expect(screen.getByText('Downloads Disabled')).toBeInTheDocument();
  });

  it('generates download token on button click', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ downloadUrl: 'https://download.url' })
    });

    render(<VideoDownload {...mockProps} />);
    
    const downloadButton = screen.getByText('Download Video');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/videos/1/download-token'),
        expect.any(Object)
      );
    });
  });

  it('shows error toast on download failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Failed'));

    render(<VideoDownload {...mockProps} />);
    
    const downloadButton = screen.getByText('Download Video');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to download video. Please try again.'
      );
    });
  });
});
