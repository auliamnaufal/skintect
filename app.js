// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/nxnJjW5l6/";

let model, webcam, labelContainer, maxPredictions;

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
  webcam.pause(); // Pause the webcam

  const numPredictions = 10; // Number of predictions to average
  const aggregateProbabilities = {}; // Key-value store for disease names and probabilities

  // Initialize the aggregateProbabilities object with class names
  const initialPrediction = await model.predict(webcam.canvas);
  initialPrediction.forEach((p) => {
    aggregateProbabilities[p.className] = 0;
  });

  // Run multiple predictions and sum probabilities
  for (let i = 0; i < numPredictions; i++) {
    const prediction = await model.predict(webcam.canvas);
    prediction.forEach((p) => {
      aggregateProbabilities[p.className] += p.probability;
    });
  }

  // Calculate average probabilities
  for (const disease in aggregateProbabilities) {
    aggregateProbabilities[disease] /= numPredictions;
  }

  // Find the disease with the highest average probability
  let highestPercentage = 0;
  let predictedDisease = "";

  for (const [disease, probability] of Object.entries(aggregateProbabilities)) {
    if (probability > highestPercentage) {
      highestPercentage = probability;
      predictedDisease = disease;
    }
  }

  // Display the prediction result
  const classPrediction = `
		  <h3 id="label-container" class="text-lg font-regular tracking-tight text-gray-900">
			Kulitmu kemungkinan memiliki penyakit <span class="font-semibold">${predictedDisease}</span> dengan persentase <span class="font-semibold">${(
    highestPercentage * 100
  ).toFixed(2)}%</span>
		  </h3>
		  `;

  labelContainer.innerHTML = classPrediction;

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
