(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function e(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(a){if(a.ep)return;a.ep=!0;const n=e(a);fetch(a.href,n)}})();document.querySelector("#app").innerHTML=`
  <main>
	<div id="mediaWrapper"></div>
	<div id="buttonWrapper">
    <select id="recordOptions">
      <option value="screenOnly">
        Record Screen Only
      </option>
      <option value="webcamOnly">
        Record Webcam Only
      </option>
      <option value="both" selected>
        Record Both Webcam and Screen
      </option>
    </select>
    <button id="record">
      <div></div>
    </button>
		<button id="stopRecording" title="Stop Recording and Download Resulting Stream">Stop Recording and Download Resulting Stream</button>
		<button id="stopAllStreams" title="Stop All Streams">Stop All Streams</button>
	</div>
</main>
`;let d,u,s,S,c,v,f,m,h=document.getElementById("mediaWrapper"),L=document.getElementById("stopRecording"),T=document.getElementById("stopAllStreams"),g=document.createElement("canvas"),l=g.getContext("2d"),w={mimeType:"video/webm; codecs=vp9"},y=[];const A=document.getElementById("record"),D=function(o){return window.setTimeout(function(){o(Date.now())},1e3/60)},I=o=>{clearTimeout(o)},p=(o,t)=>{let e=document.createElement("video");return e.id=o,e.width=640,e.height=360,e.autoplay=!0,e.setAttribute("playsinline",!0),e.srcObject=new MediaStream(t.getTracks()),e},b=()=>navigator.mediaDevices.getUserMedia({video:!0,audio:{deviceId:{ideal:"communications"}}}),k=async()=>navigator.mediaDevices.getDisplayMedia({video:!0,audio:!0}),O=()=>{[...d?d.getTracks():[],...u?u.getTracks():[],...s?s.getTracks():[]].map(o=>o.stop()),d=null,u=null,s=null,I(S),h.innerHTML=""},R=(o,t)=>()=>{if(o&&t){console.log(t.videoHeight,t.videoWidth),l.save(),g.setAttribute("width","500px"),g.setAttribute("height","500px"),l.clearRect(0,0,500,500),l.drawImage(t,0,0,500,500),l.drawImage(o,0,Math.floor(500-500/4),Math.floor(500/4),Math.floor(500/4));let e=l.getImageData(0,0,500,500);l.putImageData(e,0,0),l.restore()}S=D(R(o,t))},E=async(o,t)=>{const e=p("camStream",o);e.style.display="hidden",e.volume=0,e.oncanplay=()=>{e.play()};const r=p("screenStream",t);r.style.display="hidden",r.volume=0,r.oncanplay=()=>{r.play()},R(e,r)(),v=new AudioContext,f=v.createMediaStreamDestination();let a=g.captureStream();[...o?o.getAudioTracks():[],...t?t.getAudioTracks():[]].map(i=>new MediaStream([i])).map(i=>v.createMediaStreamSource(i)).map(i=>i.connect(f)),s=new MediaStream([...a.getVideoTracks()]);let n=new MediaStream([...a.getVideoTracks(),...f.stream.getTracks()]);s&&(m=p("pipOverlayStream",s),h.appendChild(m),c=new MediaRecorder(n,w),c.ondataavailable=i=>{i.data.size>0&&(y.push(i.data),M(y))})},B=()=>{c.start()},M=o=>{var t=new Blob(o,{type:"video/webm"}),e=URL.createObjectURL(t),r=document.createElement("a");document.body.appendChild(r),r.style="display: none",r.href=e,r.download="result.webm",r.click(),window.URL.revokeObjectURL(e)},W=()=>{O(),c==null||c.stop()},C=async()=>{const o=document.getElementById("recordOptions").value;o==="both"?Promise.allSettled([b(),k()]).then(([t,e])=>{d=t.value,u=e.value,E(d,u).then(()=>B())}):o==="webcamOnly"&&b().then(t=>{d=t,console.log(t),m=p("pipOverlayStream",d),m.volume=0,h.appendChild(m),c=new MediaRecorder(d,w),c.ondataavailable=e=>{e.data.size>0&&(y.push(e.data),M(y))}})};T.addEventListener("click",O);L.addEventListener("click",W);A.addEventListener("click",C);
