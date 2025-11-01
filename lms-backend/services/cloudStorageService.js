const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

/**
 * Cloud Storage Service for Video Content
 * Supports AWS S3 and Cloudflare Stream
 */

// ==================== CLOUDFLARE STREAM ====================

/**
 * Upload video to Cloudflare Stream
 * @param {string} filePath - Local file path
 * @param {object} metadata - Video metadata
 * @returns {Promise<object>} Upload result with video ID and streaming URLs
 */
const uploadToCloudflareStream = async (filePath, metadata = {}) => {
  try {
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiToken || !accountId) {
      throw new Error('Cloudflare credentials not configured');
    }

    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('file', fs.createReadStream(filePath));
    
    // Add metadata
    if (metadata.title) form.append('meta[name]', metadata.title);
    if (metadata.description) form.append('meta[description]', metadata.description);
    
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${apiToken}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const videoData = response.data.result;
    
    logger.info(`Video uploaded to Cloudflare Stream: ${videoData.uid}`);
    
    return {
      success: true,
      videoId: videoData.uid,
      streamingUrl: `https://customer-${accountId}.cloudflarestream.com/${videoData.uid}/manifest/video.m3u8`,
      embedUrl: `https://customer-${accountId}.cloudflarestream.com/${videoData.uid}/iframe`,
      thumbnailUrl: `https://customer-${accountId}.cloudflarestream.com/${videoData.uid}/thumbnails/thumbnail.jpg`,
      duration: videoData.duration,
      status: videoData.status.state,
      metadata: videoData
    };
  } catch (error) {
    logger.error('Cloudflare Stream upload failed:', error);
    throw new Error(`Cloudflare upload failed: ${error.message}`);
  }
};

/**
 * Get video status from Cloudflare Stream
 */
const getCloudflareVideoStatus = async (videoId) => {
  try {
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      }
    );

    return response.data.result;
  } catch (error) {
    logger.error('Failed to get Cloudflare video status:', error);
    throw error;
  }
};

/**
 * Delete video from Cloudflare Stream
 */
const deleteFromCloudflareStream = async (videoId) => {
  try {
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`
        }
      }
    );

    logger.info(`Video deleted from Cloudflare Stream: ${videoId}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete from Cloudflare Stream:', error);
    throw error;
  }
};

// ==================== AWS S3 ====================

/**
 * Upload video to AWS S3 using v3 SDK
 */
const uploadToS3 = async (filePath, fileName, bucketName = null) => {
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

    const bucket = bucketName || process.env.AWS_S3_BUCKET;
    
    if (!bucket) {
      throw new Error('AWS S3 bucket not configured');
    }

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    const fileContent = fs.readFileSync(filePath);
    const key = `videos/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileContent,
      ContentType: 'video/mp4',
      ACL: 'private'
    });

    await s3Client.send(command);
    
    logger.info(`Video uploaded to S3: ${key}`);
    
    // Generate signed URL for streaming (valid for 1 hour)
    const { GetObjectCommand } = require('@aws-sdk/client-s3');
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

    return {
      success: true,
      key,
      url: `https://${bucket}.s3.amazonaws.com/${key}`,
      signedUrl,
      bucket
    };
  } catch (error) {
    logger.error('S3 upload failed:', error);
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

/**
 * Generate signed URL for S3 video using v3 SDK
 */
const getS3SignedUrl = async (key, expiresIn = 3600) => {
  try {
    const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    const bucket = process.env.AWS_S3_BUCKET;

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    logger.error('Failed to generate S3 signed URL:', error);
    throw error;
  }
};

/**
 * Delete video from S3 using v3 SDK
 */
const deleteFromS3 = async (key) => {
  try {
    const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const bucket = process.env.AWS_S3_BUCKET;

    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await s3Client.send(command);

    logger.info(`Video deleted from S3: ${key}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to delete from S3:', error);
    throw error;
  }
};

// ==================== MAIN UPLOAD FUNCTION ====================

/**
 * Upload video to configured cloud storage
 * Automatically selects Cloudflare Stream or AWS S3 based on env config
 */
const uploadVideo = async (filePath, metadata = {}) => {
  const storageProvider = process.env.VIDEO_STORAGE_PROVIDER || 'cloudflare';

  if (storageProvider === 'cloudflare') {
    return await uploadToCloudflareStream(filePath, metadata);
  } else if (storageProvider === 's3') {
    const fileName = path.basename(filePath);
    return await uploadToS3(filePath, fileName);
  } else {
    throw new Error(`Unsupported storage provider: ${storageProvider}`);
  }
};

/**
 * Delete video from configured cloud storage
 */
const deleteVideo = async (videoId, storageProvider = null) => {
  const provider = storageProvider || process.env.VIDEO_STORAGE_PROVIDER || 'cloudflare';

  if (provider === 'cloudflare') {
    return await deleteFromCloudflareStream(videoId);
  } else if (provider === 's3') {
    return await deleteFromS3(videoId);
  } else {
    throw new Error(`Unsupported storage provider: ${provider}`);
  }
};

module.exports = {
  // Cloudflare Stream
  uploadToCloudflareStream,
  getCloudflareVideoStatus,
  deleteFromCloudflareStream,
  
  // AWS S3
  uploadToS3,
  getS3SignedUrl,
  deleteFromS3,
  
  // Generic functions
  uploadVideo,
  deleteVideo
};
