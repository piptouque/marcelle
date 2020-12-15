/* eslint-disable import/extensions */
import {
  batchPrediction,
  browser,
  button,
  confusion,
  dashboard,
  dataset,
  dataStore,
  imageUpload,
  mobilenet,
  predictionPlot,
  text,
  toggle,
} from '../../dist/marcelle.bundle.esm.js';

// -----------------------------------------------------------
// INPUT PIPELINE & CLASSIFICATION
// -----------------------------------------------------------

const source = imageUpload();
const classifier = mobilenet();

// -----------------------------------------------------------
// CAPTURE TO DATASET
// -----------------------------------------------------------

const instances = source.$thumbnails.map((thumbnail) => ({
  type: 'image',
  data: source.$images.value,
  label: 'unlabeled',
  thumbnail,
}));

const store = dataStore({ location: 'memory' });
const trainingSet = dataset({ name: 'TrainingSet', dataStore: store });

const tog = toggle({ text: 'Capture to dataset' });
tog.$checked.skipRepeats().subscribe((x) => {
  if (x) {
    trainingSet.capture(instances);
  } else {
    trainingSet.capture(null);
  }
});

const trainingSetBrowser = browser(trainingSet);

// -----------------------------------------------------------
// BATCH PREDICTION
// -----------------------------------------------------------

const batchTesting = batchPrediction({ name: 'mobilenet', dataStore: store });
const predictButton = button({ text: 'Update predictions' });
const predictionAccuracy = text({ text: 'Waiting for predictions...' });
const confusionMatrix = confusion(batchTesting);
confusionMatrix.name = 'Mobilenet: Confusion Matrix';

predictButton.$click.subscribe(async () => {
  await batchTesting.clear();
  await batchTesting.predict(classifier, trainingSet, 'data');
});

batchTesting.$predictions.subscribe(async () => {
  if (!batchTesting.predictionService) return;
  const { data } = await batchTesting.predictionService.find();
  const accuracy =
    data.map(({ label, trueLabel }) => (label === trueLabel ? 1 : 0)).reduce((x, y) => x + y, 0) /
    data.length;
  predictionAccuracy.$text.set(`Global Accuracy (Mobilenet): ${accuracy}`);
});

// -----------------------------------------------------------
// REAL-TIME PREDICTION
// -----------------------------------------------------------

const predictionStream = source.$images.map(async (img) => classifier.predict(img)).awaitPromises();
const plotResults = predictionPlot(predictionStream);

const instanceViewer = {
  id: 'my-instance-viewer',
  mount(target) {
    const t = target || document.querySelector('#my-instance-viewer');
    const instanceCanvas = document.createElement('canvas');
    instanceCanvas.classList.add('w-full', 'max-w-full');
    const instanceCtx = instanceCanvas.getContext('2d');
    t.appendChild(instanceCanvas);
    const unSub = source.$images.subscribe((img) => {
      instanceCanvas.width = img.width;
      instanceCanvas.height = img.height;
      instanceCtx.putImageData(img, 0, 0);
    });
    this.destroy = () => {
      t.removeChild(instanceCanvas);
      unSub();
    };
  },
};

const buttonCorrect = button({ text: 'Yes! 😛' });
buttonCorrect.name = '';
const buttonIncorrect = button({ text: 'No... 🤔' });
buttonIncorrect.name = '';

let numCorrect = 0;
let numIncorrect = 0;
const quality = text({ text: 'Waiting for predictions...' });
function updateQuality() {
  const percent = (100 * numCorrect) / (numCorrect + numIncorrect);
  quality.$text.set(
    `You evaluated ${percent.toFixed(0)}% of tested images as correct. ${
      percent > 50 ? '😛' : '🤔'
    }`,
  );
}
buttonCorrect.$click.subscribe(() => {
  numCorrect += 1;
  updateQuality();
});
buttonIncorrect.$click.subscribe(() => {
  numIncorrect += 1;
  updateQuality();
});

// -----------------------------------------------------------
// DASHBOARDS
// -----------------------------------------------------------

const dash = dashboard({
  title: 'Marcelle: Interactive Model Testing',
  author: 'Marcelle Pirates Crew',
});

const help = text({
  text:
    'In this example, you can test an existing trained model (mobilenet), by uploading your own images to assess the quality of the predictions.',
});
help.name = 'Test Mobilenet with your images!';

dash
  .page('Real-time Testing')
  .useLeft(source, classifier)
  .use(
    help,
    [instanceViewer, plotResults],
    'Is this prediction Correct?',
    [buttonCorrect, buttonIncorrect],
    quality,
  );
dash
  .page('Batch Testing')
  .useLeft(source, classifier)
  .use(tog, trainingSetBrowser, predictButton, predictionAccuracy, confusionMatrix);
dash.settings.dataStores(store).datasets(trainingSet).models(classifier);

dash.start();
