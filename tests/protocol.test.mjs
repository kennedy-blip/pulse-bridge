import {test} from 'node:test';
import assert from 'node:assert/strict';
import {crc,frame,verify} from '../src/services/frame.ts';
import {symbols,unpack,bands,peak} from '../src/services/acousticModem.ts';
import {opticalEncode,opticalDecode,cameraDecoder,halfMs} from '../src/services/opticalLifi.ts';
import {seal,open} from '../src/services/cryptoEngine.ts';
const payload = Uint8Array.of(0,...new TextEncoder().encode('Signal clear · 試験'));
test('CRC-8 check vector and corrupt frames',()=>{assert.equal(crc(new TextEncoder().encode('123456789')),0xf4);const b=frame(payload);assert.deepEqual(verify(b),payload);b[3]^=1;assert.throws(()=>verify(b));});
test('acoustic symbols preserve repeated nibbles and UTF-8',()=>{assert.deepEqual(unpack(symbols(payload)),payload);assert.throws(()=>unpack(symbols(payload).slice(0,-1)));});
test('FFT gates map every symbol for all bands at 48 kHz',()=>{for(const band of bands)for(let s=0;s<18;s++){const bins=new Float32Array(2048).fill(-95);bins[Math.round((band.base+s*band.gap)*4096/48000)]=-34;assert.equal(peak(bins,48000,band).s,s);}});
test('optical protocol rejects malformed Manchester data and recovers timed luma samples',()=>{const p=opticalEncode(payload);assert.deepEqual(opticalDecode(p),payload);let read;const decode=cameraDecoder(v=>read=v);decode(0,0);for(let t=100;t<100+p.length*halfMs;t+=16){decode(p[Math.floor((t-100)/halfMs)],t);}assert.deepEqual(read,payload);p[6]=p[7];assert.throws(()=>opticalDecode(p));});
test('AES-GCM authenticates and rejects tampering and wrong passphrase',async()=>{const b=await seal(payload,'a sufficiently long test phrase');assert.deepEqual(await open(b,'a sufficiently long test phrase'),payload);await assert.rejects(open(b,'wrong'));b[b.length-1]^=1;await assert.rejects(open(b,'a sufficiently long test phrase'));});

import {calibrate} from '../src/services/acousticModem.ts';
import {estimateEcho} from '../src/services/sonar.ts';
test('custom tone calibration validates frequency and baud bounds',()=>{assert.equal(calibrate(1200,140,8).slot,.125);assert.throws(()=>calibrate(19000,140,8));assert.throws(()=>calibrate(1200,140,12));});
test('echo estimate uses relative delay and rejects a direct-only pulse',()=>{const rate=48000,a=new Float32Array(rate/2);const pulse=(ms,amp)=>{for(let j=0;j<240;j++)a[ms*48+j]=amp*Math.sin(2*Math.PI*4000*j/rate);};pulse(100,.18);assert.throws(()=>estimateEcho(a,rate,20),/No distinct echo/);pulse(120,.045);const r=estimateEcho(a,rate,20);assert.ok(Math.abs(r.meters-3.4342)<.35);});
