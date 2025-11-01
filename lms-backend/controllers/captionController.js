const Caption = require('../models/Caption');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

// Configure multer for caption uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/captions';
    fs.mkdir(dir, { recursive: true }).then(() => cb(null, dir));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.srt', '.vtt', '.sub'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .srt, .vtt, and .sub files are allowed'));
    }
  }
});

exports.uploadMiddleware = upload.single('caption');

exports.uploadCaption = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { language, label } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Caption file is required' });
    }

    const format = path.extname(file.originalname).toLowerCase().replace('.', '');

    const caption = await Caption.create({
      videoId,
      language,
      label,
      fileName: file.originalname,
      filePath: file.path,
      format
    });

    res.status(201).json({
      message: 'Caption uploaded successfully',
      caption: {
        id: caption.id,
        language: caption.language,
        label: caption.label,
        fileName: caption.fileName,
        url: `/api/videos/${videoId}/captions/${caption.id}/file`
      }
    });
  } catch (error) {
    logger.error('Caption upload error:', error);
    res.status(500).json({ message: 'Failed to upload caption' });
  }
};

exports.getCaptions = async (req, res) => {
  try {
    const { videoId } = req.params;

    const captions = await Caption.findAll({
      where: { videoId },
      attributes: ['id', 'language', 'label', 'fileName']
    });

    const captionsWithUrls = captions.map(c => ({
      ...c.toJSON(),
      url: `/api/videos/${videoId}/captions/${c.id}/file`
    }));

    res.json({ captions: captionsWithUrls });
  } catch (error) {
    logger.error('Get captions error:', error);
    res.status(500).json({ message: 'Failed to get captions' });
  }
};

exports.deleteCaption = async (req, res) => {
  try {
    const { captionId } = req.params;

    const caption = await Caption.findByPk(captionId);

    if (!caption) {
      return res.status(404).json({ message: 'Caption not found' });
    }

    // Delete file
    await fs.unlink(caption.filePath);

    // Delete record
    await caption.destroy();

    res.json({ message: 'Caption deleted successfully' });
  } catch (error) {
    logger.error('Delete caption error:', error);
    res.status(500).json({ message: 'Failed to delete caption' });
  }
};

exports.serveCaptionFile = async (req, res) => {
  try {
    const { captionId } = req.params;

    const caption = await Caption.findByPk(captionId);

    if (!caption) {
      return res.status(404).json({ message: 'Caption not found' });
    }

    res.sendFile(path.resolve(caption.filePath));
  } catch (error) {
    logger.error('Serve caption error:', error);
    res.status(500).json({ message: 'Failed to serve caption' });
  }
};
