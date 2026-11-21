import Dexie,{type Table} from 'dexie';
export type Packet={id:string;at:number;channel:string;direction:'TX'|'RX';bytes:number[];relay:'local'|'pending'|'sent';};
export const db=new Dexie('pulsebridge') as Dexie & {packets:Table<Packet,string>};
db.version(1).stores({packets:'id,at,relay'});
export async function relay(endpoint:string){const url=new URL(endpoint);if(url.protocol!=='https:')throw Error('Relay endpoint must use HTTPS');let count=0;for(const p of await db.packets.where('relay').equals('pending').toArray()){const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});if(!r.ok)throw Error(`Relay responded with HTTP ${r.status}`);await db.packets.update(p.id,{relay:'sent'});count++;}return count;}
