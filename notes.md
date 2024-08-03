# Hypothesis:

a app that allows you to record your screen and your video at the same time with one audio and lets you save videos

10 hours

9 hours left

Basic goal (2 hours):

- Webcam video recording
  [X] webcam can start and stop recording
  [X] recording can be downloaded
  [X] recording can be previewed while recording
  [] recording can be previewed after recording

Basic Goal #2

- Screen Capture
  [] the user can record a portion of or all of the screen
  [] the user gets a visual indicator to show that recording is in progress
  []

End goal
Preview of screen recording and video
Record button that records screen section, webcam video, and microphone audio at the same time
Download/Save that allows you to access they system dialog for saving a video or downloads it to the browser

Core Idea:
Fetch Webcam Stream via getUserMedia()
Fetch Screen Share Stream via getDisplayMedia()
Merge Both Stream using some math & canvas operations
Use canvas.captureStream() to generate the composite video stream.
Use AudioContext to merge audio clips (especially needed if using both microphone & system audio).
Use MediaStream constructor to create a new stream using - the video from the new stream + audio from audioContext Destination Node as follows -

new MediaStream([...newStream.getVideoTracks(), ...audioDestination.stream.getTracks()]);

Use newly generated MediaStream as required (i.e. replace in RTCPeerConnection, etc.).
In this example - MediaRecorder API is used to record the resulting composite/picture-in-picture video. Recording begins when the "Record Resulting Stream" button is clicked. The final result can be downloaded upon clicking the "Stop Recording and Download Resulting Stream" button
