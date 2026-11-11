import sharp from 'sharp';

const WEBP_QUALITY = 85;

export async function encodePostImage(input) {
  const { format } = await sharp(input).metadata();
  return sharp(input)
    .rotate()
    .webp({ quality: WEBP_QUALITY, lossless: format === 'png' })
    .toBuffer();
}
