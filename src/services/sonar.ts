/** Detect a distinct narrow-band reflection after the direct speaker-to-mic arrival. */
export function estimateEcho(samples:Float32Array,rate:number,temp:number){
 const window=Math.round(rate*.004),hop=Math.round(rate*.001),w=2*Math.PI*4000/rate;
 const sine=Float32Array.from({length:window},(_,i)=>Math.sin(w*i));
 const cosine=Float32Array.from({length:window},(_,i)=>Math.cos(w*i));
 const power:number[]=[];
 for(let i=0;i+window<samples.length;i+=hop){let re=0,im=0;for(let j=0;j<window;j++){re+=samples[i+j]*cosine[j];im+=samples[i+j]*sine[j];}power.push(Math.hypot(re,im)/window);}
 const baseline=power.slice(0,30).sort((a,b)=>a-b)[15]??0;
 const floor=Math.max(.0002,baseline*7);
 const direct=power.findIndex((p,i)=>i>30&&p>floor&&p>=power[i-1]&&p>power[i+1]);
 if(direct<0)throw Error('Direct pulse not detected. Check speaker and microphone.');
 let echo=-1;
 for(let i=direct+10;i<Math.min(power.length-1,direct+100);i++)if(power[i]>Math.max(floor,power[direct]*.055)&&power[i]>=power[i-1]&&power[i]>power[i+1]&&power.slice(i-5,i-2).some(p=>p<power[i]*.48)){echo=i;break;}
 if(echo<0)throw Error('No distinct echo detected.');
 const seconds=(echo-direct)*hop/rate;
 return {delayMs:seconds*1000,meters:seconds*(331.3+.606*temp)/2};
}
export async function ping(temp:number){
 const ctx=new AudioContext();let stream:MediaStream|undefined;
 try{
  await ctx.resume();stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  const analyser=ctx.createAnalyser();analyser.fftSize=32768;
  const mic=ctx.createMediaStreamSource(stream);mic.connect(analyser);
  const mute=ctx.createGain();mute.gain.value=0;analyser.connect(mute).connect(ctx.destination);
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=4000;osc.connect(gain).connect(ctx.destination);
  const t=ctx.currentTime+.25;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.18,t+.001);gain.gain.setValueAtTime(.18,t+.004);gain.gain.linearRampToValueAtTime(0,t+.005);osc.start(t);osc.stop(t+.006);
  await new Promise<void>(r=>setTimeout(r,440));
  const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);return estimateEcho(samples,ctx.sampleRate,temp);
 }finally{stream?.getTracks().forEach(track=>track.stop());await ctx.close();}
}
