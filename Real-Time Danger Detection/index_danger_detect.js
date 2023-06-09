let mobilenet;
let model;
const webcam = new Webcam(document.getElementById('wc'));
const dataset = new DangerDetectDataset();
var angersamples=0, fearsamples=0, weaponsamples=0, fightingsamples=0, camobfsamples=0; nothingwrongsamples=0;
let isPredicting = false;

async function loadMobilenet() {
  const mobilenet = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json');
  const layer = mobilenet.getLayer('conv_pw_13_relu');
  return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
}

async function train() {
  dataset.ys = null;
  dataset.encodeLabels(6);
    
  model = tf.sequential({
    layers: [
        
      tf.layers.flatten({inputShape: mobilenet.outputs[0].shape.slice(1)}),
      tf.layers.dense({ units: 100, activation: 'relu'}),
      tf.layers.dense({ units: 6, activation: 'softmax'})

    ]
  });
    
   
  const optimizer = tf.train.adam(0.0001);
    
  model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});
 
  let loss = 0;
  model.fit(dataset.xs, dataset.ys, {
    epochs: 10,
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        loss = logs.loss.toFixed(6);
        console.log('LOSS: ' + loss);
        }
      }
   });
}


function handleButton(elem){
	switch(elem.id){
		case "0":
			angersamples++;
			document.getElementById("angersamples").innerText = "Anger samples:" + angersamples;
			break;
		case "1":
			fearsamples++;
			document.getElementById("fearsamples").innerText = "Fear samples:" + fearsamples;
			break;
		case "2":
			weaponsamples++;
			document.getElementById("weaponsamples").innerText = "Weapon samples:" + weaponsamples;
			break;  
		case "3":
			fightingsamples++;
			document.getElementById("fightingsamples").innerText = "Fighting samples:" + fightingsamples;
			break;
        case "4":
            camobfsamples++;
            document.getElementById("camobfsamples").innerText = "Camera View Obfiscated samples:" + camobfsamples;
            break;
        case "5":
			nothingwrongsamples++;
			document.getElementById("nothingwrongsamples").innerText = "Nothing Wrong:" + nothingwrongsamples;
			break;
		
            
	}
	label = parseInt(elem.id);
	const img = webcam.capture();
	dataset.addExample(mobilenet.predict(img), label);

}

async function predict() {
  while (isPredicting) {
    const predictedClass = tf.tidy(() => {
      const img = webcam.capture();
      const activation = mobilenet.predict(img);
      const predictions = model.predict(activation);
      return predictions.as1D().argMax();
    });
    const classId = (await predictedClass.data())[0];
    var predictionText = "";
    switch(classId){
		case 0:
			predictionText = "I see Anger";
			break;
		case 1:
			predictionText = "I see Fear";
			break;
		case 2:
			predictionText = "I see a Weapon";
			break;
		case 3:
			predictionText = "I see Fighting";
			break;
        case 4:
            predictionText = "Camera View Obfuscated";
            break;
        case 5:
            predictionText = "Nothing Wrong";
            break;
            
	}
	document.getElementById("prediction").innerText = predictionText;
			
    
    predictedClass.dispose();
    await tf.nextFrame();
  }
}


function doTraining(){
	train();
	alert("Training Done!")
}

function startPredicting(){
	isPredicting = true;
	predict();
}

function stopPredicting(){
	isPredicting = false;
	predict();
}


function saveModel(){
    model.save('downloads://my_model');
}


async function init(){
	await webcam.setup();
	mobilenet = await loadMobilenet();
	tf.tidy(() => mobilenet.predict(webcam.capture()));
		
}


init();