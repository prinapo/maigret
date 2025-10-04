/**
 * Simple image utilities without OpenCV.js for maximum compatibility
 * Works with Quasar/Vue without external dependencies
 */

/**
 * Get image dimensions from data URL
 * @param {string} dataUrl - Image data URL
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export const getImageDimensions = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
};

/**
 * Simple image processing using Canvas API
 * @param {string} dataUrl - Input image data URL
 * @param {Array} corners - Corner points (not used in simple version)
 * @param {number} outputWidth - Desired output width
 * @param {number} outputHeight - Desired output height
 * @returns {Promise<string>} Processed image data URL
 */
export const applyCanvasCorrection = async (
  dataUrl,
  corners,
  outputWidth,
  outputHeight,
) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Enable high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw and scale the image
      ctx.drawImage(img, 0, 0, outputWidth, outputHeight);

      // Apply basic quality enhancements
      const imageData = ctx.getImageData(0, 0, outputWidth, outputHeight);
      for (let i = 0; i < imageData.data.length; i += 4) {
        // Slight contrast and brightness improvement
        imageData.data[i] = Math.min(255, imageData.data[i] * 1.05); // Red
        imageData.data[i + 1] = Math.min(255, imageData.data[i + 1] * 1.05); // Green
        imageData.data[i + 2] = Math.min(255, imageData.data[i + 2] * 1.05); // Blue
      }
      ctx.putImageData(imageData, 0, 0);

      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = dataUrl;
  });
};

/**
 * OpenCV.js integration for advanced image processing
 * Based on official OpenCV.js documentation and examples
 */

// OpenCV.js globals (will be available after loading)
let cv = null;

/**
 * Load OpenCV.js library correctly for browser usage
 */
export const loadOpenCV = async () => {
  console.log("🔄 loadOpenCV called");
  console.log("📊 Current cv status:", typeof cv);

  if (typeof cv !== "undefined" && cv !== null) {
    console.log("✅ OpenCV.js already cached");
    return cv;
  }

  console.log("🔄 Checking window.cv...");
  // Check if already loaded in window (from CDN)
  if (typeof window !== "undefined" && window.cv) {
    try {
      console.log("📦 Found window.cv, type:", typeof window.cv);
      console.log("📦 window.cv structure:", Object.keys(window.cv || {}));

      cv = window.cv;
      console.log("✅ OpenCV.js loaded from window.cv");
      // Temporarily remove the type check that might be causing issues
      return cv;
    } catch (error) {
      console.error("❌ Error accessing window.cv:", error);
      console.error("❌ window.cv type:", typeof window.cv);
      console.error("❌ Error details:", error.message);
      return null;
    }
  }

  console.log("🔄 OpenCV.js not found in window, checking Module...");
  if (typeof window !== "undefined" && window.Module) {
    console.log("📦 Module found, waiting for OpenCV.js to load...");
    return new Promise((resolve) => {
      window.Module.onload = () => {
        console.log("📦 Module.onload triggered");
        cv = window.cv;
        if (cv) {
          console.log("✅ OpenCV.js loaded via Module.onload");
          resolve(cv);
        } else {
          console.warn("⚠️ Module loaded but cv not available");
          resolve(null);
        }
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        console.log("⏰ loadOpenCV timeout reached");
        if (!cv) {
          console.warn("⚠️ OpenCV.js loading timeout");
          resolve(null);
        }
      }, 10000);
    });
  }

  try {
    console.log("ℹ️ OpenCV.js not available, needs script tag in index.html");
    return null;
  } catch (error) {
    console.warn("⚠️ OpenCV.js not available:", error.message);
    return null;
  }
};

/**
 * Convert data URL to OpenCV Mat (official method)
 */
export const dataUrlToMat = async (dataUrl) => {
  const cv = await loadOpenCV();
  if (!cv) {
    console.error("❌ OpenCV not available for Mat conversion");
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas with exact image dimensions
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        // Create OpenCV Mat with correct type (CV_8UC4 for RGBA)
        const mat = new cv.Mat(img.height, img.width, cv.CV_8UC4);

        // Copy image data to Mat
        mat.data.set(new Uint8Array(imageData.data));

        resolve(mat);
      } catch (error) {
        console.error("❌ Error in dataUrlToMat:", error);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.error("❌ Failed to load image");
      resolve(null);
    };
    img.src = dataUrl;
  });
};

/**
 * Convert OpenCV Mat to data URL (official method)
 */
export const matToDataUrl = async (
  mat,
  format = "image/jpeg",
  quality = 0.9,
) => {
  const cv = await loadOpenCV();
  if (!cv || !mat) return "";

  try {
    // For 4-channel images (RGBA), convert to RGB for JPEG
    let outputMat = mat;
    if (mat.channels() === 4) {
      const rgbaChannels = new cv.MatVector();
      cv.split(mat, rgbaChannels);

      const rgbChannels = new cv.MatVector();
      rgbChannels.push_back(rgbaChannels.get(0)); // R
      rgbChannels.push_back(rgbaChannels.get(1)); // G
      rgbChannels.push_back(rgbaChannels.get(2)); // B

      outputMat = new cv.Mat();
      cv.merge(rgbChannels, outputMat);

      // Cleanup temporary vectors
      rgbaChannels.delete();
      rgbChannels.delete();
    }

    // Convert OpenCV Mat to canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = outputMat.cols;
    canvas.height = outputMat.rows;

    const imageData = ctx.createImageData(outputMat.cols, outputMat.rows);
    const data = outputMat.data;

    // Convert BGR to RGB for canvas
    for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
      imageData.data[j] = data[i + 2]; // R
      imageData.data[j + 1] = data[i + 1]; // G
      imageData.data[j + 2] = data[i]; // B
      imageData.data[j + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);
    const result = canvas.toDataURL(format, quality);

    // Cleanup output matrix if it was converted
    if (outputMat !== mat) {
      outputMat.delete();
    }

    return result;
  } catch (error) {
    console.error("❌ Error in matToDataUrl:", error);
    return "";
  }
};

/**
 * Apply perspective correction using OpenCV.js
 */
/**
 * Apply perspective correction using OpenCV.js (clean implementation)
 */
export const applyPerspectiveCorrection = async (
  dataUrl,
  corners,
  outputWidth,
  outputHeight,
) => {
  console.log("🎯 Starting OpenCV perspective correction...");

  const cv = await loadOpenCV();
  if (!cv) {
    throw new Error("OpenCV.js not available");
  }

  console.log("✅ OpenCV.js ready, applying transformation...");
  return await applyOpenCVPerspectiveCorrection(
    cv,
    dataUrl,
    corners,
    outputWidth,
    outputHeight,
  );
};

/**
 * Apply perspective correction using OpenCV.js (official implementation)
 */
const applyOpenCVPerspectiveCorrection = async (
  cv,
  dataUrl,
  corners,
  outputWidth,
  outputHeight,
) => {
  console.log("🔄 Converting image to OpenCV Mat (official method)...");

  // Convert data URL to OpenCV Mat using official method
  const srcMat = await dataUrlToMat(dataUrl);
  if (!srcMat) {
    throw new Error("Failed to convert image to OpenCV Mat");
  }
  console.log(
    "✅ Image converted to Mat, size:",
    srcMat.cols,
    "x",
    srcMat.rows,
  );

  // Define source points (4 corners from user input)
  const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners[0].x,
    corners[0].y, // top-left
    corners[1].x,
    corners[1].y, // top-right
    corners[2].x,
    corners[2].y, // bottom-right
    corners[3].x,
    corners[3].y, // bottom-left
  ]);

  // Define destination points (output rectangle)
  const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0, // top-left
    outputWidth,
    0, // top-right
    outputWidth,
    outputHeight, // bottom-right
    0,
    outputHeight, // bottom-left
  ]);

  console.log("✅ Points matrices created");

  // Calculate homography matrix using RANSAC for robustness
  const homography = cv.findHomography(srcPoints, dstPoints, cv.RANSAC, 5);
  console.log("✅ Homography calculated");

  // Create output matrix
  const dstMat = new cv.Mat(outputHeight, outputWidth, cv.CV_8UC4);
  const dsize = new cv.Size(outputWidth, outputHeight);

  console.log("✅ Output matrix created");

  // Apply perspective transformation with proper border handling
  cv.warpPerspective(
    srcMat,
    dstMat,
    homography,
    dsize,
    cv.INTER_CUBIC, // Better quality interpolation
    cv.BORDER_REPLICATE,
    new cv.Scalar(0, 0, 0, 255),
  );

  console.log("✅ Perspective transformation applied");

  // Convert back to data URL
  const result = await matToDataUrl(dstMat);
  console.log("✅ Result converted to data URL, length:", result.length);

  // Proper cleanup in reverse order
  console.log("🔄 Cleaning up resources...");
  srcMat.delete();
  dstMat.delete();
  srcPoints.delete();
  dstPoints.delete();
  homography.delete();

  console.log("✅ OpenCV cleanup completed");
  return result;
};

/**
 * Detect document corners automatically (optional)
 */
export const detectDocumentCorners = async (dataUrl) => {
  const cv = await loadOpenCV();
  if (!cv) return [];

  try {
    const srcMat = await dataUrlToMat(dataUrl);
    if (!srcMat) return [];

    // Convert to grayscale
    const grayMat = new cv.Mat();
    cv.cvtColor(srcMat, grayMat, cv.COLOR_RGBA2GRAY);

    // Apply edge detection
    const edgesMat = new cv.Mat();
    cv.Canny(grayMat, edgesMat, 50, 150);

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      edgesMat,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE,
    );

    // Find the largest contour (assumed to be the document)
    let maxArea = 0;
    let bestContour = null;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > maxArea) {
        maxArea = area;
        bestContour = contour;
      }
    }

    let corners = [];
    if (bestContour) {
      // Approximate contour to polygon
      const approx = new cv.Mat();
      cv.approxPolyDP(
        bestContour,
        approx,
        0.02 * cv.arcLength(bestContour, true),
        true,
      );

      // Extract corner points
      if (approx.rows >= 4) {
        corners = [
          { x: approx.data32F[0], y: approx.data32F[1] },
          { x: approx.data32F[2], y: approx.data32F[3] },
          { x: approx.data32F[4], y: approx.data32F[5] },
          { x: approx.data32F[6], y: approx.data32F[7] },
        ];
      }

      approx.delete();
    }

    // Cleanup
    srcMat.delete();
    grayMat.delete();
    edgesMat.delete();
    contours.delete();
    hierarchy.delete();

    console.log("✅ Detected document corners:", corners);
    return corners;
  } catch (error) {
    console.error("❌ Document corner detection failed:", error);
    return [];
  }
};

/**
 * Initialize OpenCV (for compatibility)
 */
export const initializeOpenCV = async () => {
  try {
    await loadOpenCV();
    return true;
  } catch {
    return false;
  }
};

export const processImageWithPerspectiveCorrection = applyPerspectiveCorrection;
