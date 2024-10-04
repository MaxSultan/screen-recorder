import "./style.css";

{
  /* <option value="screenOnly">
        Record Screen Only
      </option>
      <option value="webcamOnly">
        Record Webcam Only
      </option> */
}

document.querySelector("#app").innerHTML = `
  <main>
	<div id="mediaWrapper"></div>
	<div id="buttonWrapper">
    <select id="recordOptions">
      <option value="both" selected>
        Record Both Webcam and Screen
      </option>
    </select>
    <button id="record">
      <div></div>
    </button>
		<button id="stopRecording" title="Stop Recording"><div></div></button>
	</div>
  <div id="history">
  </div>
</main>
`;

//#region constants
let localCamStream,
  localScreenStream,
  localOverlayStream,
  rafId,
  mediaRecorder,
  audioContext,
  audioDestination,
  overlay;
let mediaWrapperDiv = document.getElementById("mediaWrapper");
let stopRecordingBtn = document.getElementById("stopRecording");
let canvasElement = document.createElement("canvas");
let canvasCtx = canvasElement.getContext("2d");
let encoderOptions = { mimeType: "video/webm; codecs=vp9" };
let recordedChunks = [];

const historyElement = document.getElementById("history");
const recordButton = document.getElementById("record");

//#endregion constants

/**
 * Internal Polyfill to simulate
 * window.requestAnimationFrame
 * since the browser will kill canvas
 * drawing when tab is inactive
 */
const requestVideoFrame = function (callback) {
  return window.setTimeout(function () {
    callback(Date.now());
  }, 1000 / 60); // 60 fps - just like requestAnimationFrame
};

/**
 * Internal polyfill to simulate
 * window.cancelAnimationFrame
 */
const cancelVideoFrame = (id) => {
  clearTimeout(id);
};

const addLink = (blobData) => {
  var blob = new Blob(blobData, {
    type: "video/webm",
  });
  const date = new Date().toISOString();
  var url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `recording-${date}.webm`;
  link.innerText = date;
  historyElement.appendChild(link);
};

const createVideoElement = (id, stream) => {
  let videoElem = document.createElement("video");
  videoElem.id = id;
  videoElem.width = 640;
  videoElem.height = 360;
  videoElem.autoplay = true;
  videoElem.setAttribute("playsinline", true);
  videoElem.srcObject = new MediaStream(stream.getTracks());
  return videoElem;
};

const startWebcam = () =>
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: { deviceId: { ideal: "communications" } },
  });

const startScreenShare = async () =>
  navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });

const stopAllStreams = () => {
  [
    ...(localCamStream ? localCamStream.getTracks() : []),
    ...(localScreenStream ? localScreenStream.getTracks() : []),
    ...(localOverlayStream ? localOverlayStream.getTracks() : []),
  ].map((track) => track.stop());

  localCamStream = null;
  localScreenStream = null;
  localOverlayStream = null;
  cancelVideoFrame(rafId);
  mediaWrapperDiv.innerHTML = "";
};

const makeComposite = (videoCamElement, videoScreenElement) => () => {
  // Theres an issue in here where these videos have no width and height so the canvas has no width and height
  // get the aspect ratio of what we are recording
  if (videoCamElement && videoScreenElement) {
    console.log(videoScreenElement.videoHeight, videoScreenElement.videoWidth);
    canvasCtx.save();
    canvasElement.setAttribute("width", `${500}px`);
    canvasElement.setAttribute("height", `${500}px`);

    canvasCtx.clearRect(0, 0, 500, 500);
    canvasCtx.drawImage(videoScreenElement, 0, 0, 500, 500);

    canvasCtx.drawImage(
      videoCamElement,
      0,
      Math.floor(500 - 500 / 4),
      Math.floor(500 / 4),
      Math.floor(500 / 4)
    );

    let imageData = canvasCtx.getImageData(0, 0, 500, 500);

    canvasCtx.putImageData(imageData, 0, 0);
    canvasCtx.restore();
  }
  rafId = requestVideoFrame(makeComposite(videoCamElement, videoScreenElement));
};

const mergeStreams = async (localCamStream, localScreenStream) => {
  const videoCamElement = createVideoElement("camStream", localCamStream);
  videoCamElement.style.display = "hidden";
  videoCamElement.volume = 0;
  videoCamElement.oncanplay = () => {
    videoCamElement.play();
  };

  const videoScreenElement = createVideoElement(
    "screenStream",
    localScreenStream
  );
  videoScreenElement.style.display = "hidden";
  videoScreenElement.volume = 0;

  videoScreenElement.oncanplay = () => {
    videoScreenElement.play();
  };

  makeComposite(videoCamElement, videoScreenElement)();
  audioContext = new AudioContext();
  audioDestination = audioContext.createMediaStreamDestination();
  let fullVideoStream = canvasElement.captureStream();
  [
    ...(localCamStream ? localCamStream.getAudioTracks() : []),
    ...(localScreenStream ? localScreenStream.getAudioTracks() : []),
  ]
    .map((track) => new MediaStream([track]))
    .map((track) => audioContext.createMediaStreamSource(track))
    .map((track) => track.connect(audioDestination));

  localOverlayStream = new MediaStream([...fullVideoStream.getVideoTracks()]);
  let fullOverlayStream = new MediaStream([
    ...fullVideoStream.getVideoTracks(),
    ...audioDestination.stream.getTracks(),
  ]);

  if (localOverlayStream) {
    overlay = createVideoElement("pipOverlayStream", localOverlayStream);
    mediaWrapperDiv.appendChild(overlay);
    mediaRecorder = new MediaRecorder(fullOverlayStream, encoderOptions);
    mediaRecorder.ondataavailable = (event) => {
      console.log("data available");
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        // download(recordedChunks);
        addLink(recordedChunks);
        recordedChunks = [];
      }
    };
  }
};

const startRecording = () => {
  mediaRecorder.start();
};

const download = (blobData) => {
  var blob = new Blob(blobData, {
    type: "video/webm",
  });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = "result.webm";
  a.click();
  window.URL.revokeObjectURL(url);
};

const stopRecording = () => {
  stopAllStreams();
  mediaRecorder?.stop();
};

const handleRecord = async () => {
  const recordOption = document.getElementById("recordOptions").value;
  if (recordOption === "both") {
    Promise.allSettled([startWebcam(), startScreenShare()]).then(
      ([camStream, screenStream]) => {
        localCamStream = camStream.value;
        localScreenStream = screenStream.value;
        mergeStreams(localCamStream, localScreenStream).then(() =>
          startRecording()
        );
      }
    );
  } else if (recordOption === "webcamOnly") {
    startWebcam().then((camStream) => {
      localCamStream = camStream;

      console.log(camStream);

      overlay = createVideoElement("pipOverlayStream", localCamStream);
      overlay.volume = 0;
      mediaWrapperDiv.appendChild(overlay);
      mediaRecorder = new MediaRecorder(localCamStream, encoderOptions);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
          download(recordedChunks);
        }
      };
    });
  } else {
  }
};

stopRecordingBtn.addEventListener("click", stopRecording);

recordButton.addEventListener("click", handleRecord);
