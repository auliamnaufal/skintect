// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/nxnJjW5l6/";

let model, webcam, labelContainer, maxPredictions;
const predictionBuffer = []; // Buffer for storing frame predictions
const numFrames = 10; // Number of frames to aggregate

document.addEventListener("DOMContentLoaded", (event) => {
  init();
});

// Load the image model and setup the webcam
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // or files from your local hard drive
  // Note: the pose library adds "tmImage" object to your window (window.tmImage)
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const flip = false; // whether to flip the webcam
  webcam = new tmImage.Webcam(255, 255, flip); // width, height, flip
  await webcam.setup({ facingMode: "environment" });
  await webcam.play();
  window.requestAnimationFrame(loop);

  // append elements to the DOM
  document.getElementById("webcam-container").appendChild(webcam.canvas);
  // webcam.canvas.style.transform = "scaleX(-1)";
  webcam.canvas.style.maxWidth = "100%";
  labelContainer = document.getElementById("label-container");
}

async function loop() {
  webcam.update(); // update the webcam frame
  window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
  const numFramesToCapture = 10; // Number of frames to process
  predictionBuffer.length = 0; // Clear the buffer before capturing new frames

  // Capture 10 frames in sequence
  for (let i = 0; i < numFramesToCapture; i++) {
    const currentPrediction = await model.predict(webcam.canvas);
    predictionBuffer.push(currentPrediction);
    await new Promise((resolve) => setTimeout(resolve, 100)); // Add delay (~100ms/frame)
  }

  // Aggregate probabilities across frames
  const aggregatedProbabilities = {};
  predictionBuffer.forEach((framePrediction) => {
    framePrediction.forEach((p) => {
      if (!aggregatedProbabilities[p.className]) {
        aggregatedProbabilities[p.className] = 0;
      }
      aggregatedProbabilities[p.className] += p.probability;
    });
  });

  // Average probabilities
  for (const disease in aggregatedProbabilities) {
    aggregatedProbabilities[disease] /= predictionBuffer.length;
  }

  // Find the disease with the highest probability
  let highestPercentage = 0;
  let predictedDisease = "";

  for (const [disease, probability] of Object.entries(
    aggregatedProbabilities
  )) {
    if (probability > highestPercentage) {
      highestPercentage = probability;
      predictedDisease = disease;
    }
  }

  // Display the prediction result
  const classPrediction = `
		  <h3 id="label-container" class="text-lg font-regular tracking-tight text-gray-900">
			Kulitmu kemungkinan memiliki penyakit <span class="font-semibold">${predictedDisease}</span> 
			dengan persentase <span class="font-semibold">${(
        highestPercentage * 100
      ).toFixed(2)}%</span>
		  </h3>
		`;
  labelContainer.innerHTML = classPrediction;

  // Pause the webcam
  webcam.pause();
  document.getElementById("shutterBtn").style.display = "none";
  document.getElementById("cameraBtn").style.display = "block";
}

async function openCamera() {
  webcam.play(); // update the webcam frame
  window.requestAnimationFrame(loop);
  document.getElementById("webcam-container").innerHTML = "";
  document.getElementById("webcam-container").appendChild(webcam.canvas);
  document.getElementById("shutterBtn").style.display = "block";
  document.getElementById("cameraBtn").style.display = "none";
}
