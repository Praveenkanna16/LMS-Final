const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../config/logger');

/**
 * Convert video to HLS format with multiple quality levels (ABR)
 * @param {string} inputPath - Path to input video file
 * @param {string} outputDir - Directory for HLS output
 * @returns {Promise<object>} Result with manifest URL
 */
exports.convertToHLS = async (inputPath, outputDir) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create output directory
      await fs.mkdir(outputDir, { recursive: true });

      const manifestPath = path.join(outputDir, 'master.m3u8');

      ffmpeg(inputPath)
        // 1080p
        .output(path.join(outputDir, '1080p.m3u8'))
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1920x1080')
        .videoBitrate('5000k')
        .audioBitrate('192k')
        .outputOptions([
          '-preset veryfast',
          '-g 48',
          '-sc_threshold 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename ' + path.join(outputDir, '1080p_%03d.ts')
        ])
        
        // 720p
        .output(path.join(outputDir, '720p.m3u8'))
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1280x720')
        .videoBitrate('2800k')
        .audioBitrate('128k')
        .outputOptions([
          '-preset veryfast',
          '-g 48',
          '-sc_threshold 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename ' + path.join(outputDir, '720p_%03d.ts')
        ])
        
        // 480p
        .output(path.join(outputDir, '480p.m3u8'))
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('854x480')
        .videoBitrate('1400k')
        .audioBitrate('128k')
        .outputOptions([
          '-preset veryfast',
          '-g 48',
          '-sc_threshold 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename ' + path.join(outputDir, '480p_%03d.ts')
        ])
        
        // 360p
        .output(path.join(outputDir, '360p.m3u8'))
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('640x360')
        .videoBitrate('800k')
        .audioBitrate('96k')
        .outputOptions([
          '-preset veryfast',
          '-g 48',
          '-sc_threshold 0',
          '-hls_time 10',
          '-hls_list_size 0',
          '-hls_segment_filename ' + path.join(outputDir, '360p_%03d.ts')
        ])

        .on('start', (cmd) => {
          logger.info('FFmpeg process started:', cmd);
        })
        .on('progress', (progress) => {
          logger.info(`Processing: ${progress.percent}% done`);
        })
        .on('end', async () => {
          // Create master playlist
          const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
`;
          
          await fs.writeFile(manifestPath, masterPlaylist);
          
          logger.info('HLS conversion completed');
          resolve({
            success: true,
            manifestPath: manifestPath,
            qualities: ['1080p', '720p', '480p', '360p']
          });
        })
        .on('error', (err) => {
          logger.error('FFmpeg error:', err);
          reject(err);
        })
        .run();

    } catch (error) {
      logger.error('HLS conversion error:', error);
      reject(error);
    }
  });
};

/**
 * Get video metadata
 */
exports.getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
};
