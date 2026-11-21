export function crc(data:Uint8Array){let c=0;for(const b of data){c^=b;for(let i=0;i<8;i++)c=((c<<1)^((c&128)?7:0))&255;}return c;}
export function frame(data:Uint8Array){if(data.length>512)throw Error('Frame exceeds 512 bytes');const body=Uint8Array.of(data.length>>8,data.length&255,...data);return Uint8Array.of(...body,crc(body));}
export function verify(bytes:Uint8Array){if(bytes.length<3||bytes.length!==3+((bytes[0]<<8)|bytes[1])||crc(bytes.slice(0,-1))!==bytes.at(-1))throw Error('Frame checksum or length mismatch');return bytes.slice(2,-1);}
