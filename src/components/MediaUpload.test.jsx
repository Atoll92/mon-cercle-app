import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaUpload from './MediaUpload';
import { uploadMedia } from '../utils/mediaUpload';

// Mock media upload utility
vi.mock('../utils/mediaUpload');

describe('MediaUpload Component', () => {
  const mockOnUpload = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload button', () => {
    render(<MediaUpload onUpload={mockOnUpload} />);
    
    expect(screen.getByRole('button', { name: /upload/i })).toBeInTheDocument();
  });

  it('should show file input on button click', async () => {
    const user = userEvent.setup();
    render(<MediaUpload onUpload={mockOnUpload} />);
    
    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);
    
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('should accept multiple files', () => {
    render(<MediaUpload onUpload={mockOnUpload} multiple />);
    
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('should restrict accepted file types', () => {
    render(
      <MediaUpload 
        onUpload={mockOnUpload} 
        acceptedTypes={['image/jpeg', 'image/png']} 
      />
    );
    
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png');
  });

  it('should handle successful file upload', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockUploadResult = {
      url: 'https://example.com/test.jpg',
      type: 'image',
      metadata: { size: 1024, width: 800, height: 600 }
    };

    uploadMedia.mockResolvedValue(mockUploadResult);
    
    render(<MediaUpload onUpload={mockOnUpload} />);
    
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(uploadMedia).toHaveBeenCalledWith(mockFile, expect.any(String), expect.any(String));
      expect(mockOnUpload).toHaveBeenCalledWith([mockUploadResult]);
    });
  });

  it('should show progress during upload', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    uploadMedia.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ url: 'test.jpg' }), 100);
    }));
    
    render(<MediaUpload onUpload={mockOnUpload} />);
    
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, mockFile);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
  });

  it('should handle upload errors', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockError = new Error('Upload failed');
    
    uploadMedia.mockRejectedValue(mockError);
    
    render(<MediaUpload onUpload={mockOnUpload} />);
    
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  it('should validate file size', async () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
      type: 'image/jpeg' 
    });
    
    render(<MediaUpload onUpload={mockOnUpload} maxSizeMB={10} />);
    
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, largeFile);

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    expect(uploadMedia).not.toHaveBeenCalled();
  });

  it('should show preview for images', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockUrl = 'blob:http://localhost/test';
    
    URL.createObjectURL = vi.fn(() => mockUrl);
    
    render(<MediaUpload onUpload={mockOnUpload} showPreview />);
    
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, mockFile);

    expect(screen.getByRole('img')).toHaveAttribute('src', mockUrl);
  });

  it('should handle multiple file uploads', async () => {
    const mockFiles = [
      new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
      new File(['test2'], 'test2.jpg', { type: 'image/jpeg' })
    ];
    
    const mockResults = [
      { url: 'https://example.com/test1.jpg' },
      { url: 'https://example.com/test2.jpg' }
    ];

    uploadMedia
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1]);
    
    render(<MediaUpload onUpload={mockOnUpload} multiple />);
    
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, mockFiles);

    await waitFor(() => {
      expect(uploadMedia).toHaveBeenCalledTimes(2);
      expect(mockOnUpload).toHaveBeenCalledWith(mockResults);
    });
  });

  it('should call onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    render(<MediaUpload onUpload={mockOnUpload} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should disable upload during processing', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    uploadMedia.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<MediaUpload onUpload={mockOnUpload} />);
    
    const fileInput = screen.getByTestId('file-input');
    await userEvent.upload(fileInput, mockFile);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    expect(uploadButton).toBeDisabled();
  });
});