const vision = require("@google-cloud/vision");

// Creates a client
const client = new vision.ImageAnnotatorClient();

/**
 * TODO(developer): Uncomment the following line before running the sample.
 */

async function runOcr(fileName) {
  try {
    // Performs text detection on the local file
    const [result] = await client.textDetection(fileName);
    const detections = await result.textAnnotations;
    // console.log("Text:");
    // detections.forEach((text) => console.log(text));
    return detections;
  } catch (error) {
    console.log(error);
  }
}

module.exports = runOcr;
