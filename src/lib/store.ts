import { useState } from 'react';
function matchesShape(value:unknown, template:unknown):boolean {
 if(template===null)return value===null;
 if(Array.isArray(template))return Array.isArray(value)&&(template.length===0||value.every(item=>matchesShape(item,template[0])));
 if(typeof template==='object')return typeof value==='object'&&value!==null&&!Array.isArray(value)&&Object.entries(template).every(([key,example])=>matchesShape((value as Record<string,unknown>)[key],example));
 return typeof value===typeof template&&(typeof value!=='number'||Number.isFinite(value));
}
export function useStoredState<T>(key:string, fallback:T) {
 const [value,setValue] = useState<T>(()=>{try {const raw=localStorage.getItem(key);if(!raw)return fallback;const parsed:unknown=JSON.parse(raw);return matchesShape(parsed,fallback)?parsed as T:fallback;}catch{return fallback;}});
 const update = (next:T|((prev:T)=>T)) => setValue(prev=>{const result=typeof next==='function'?(next as (prev:T)=>T)(prev):next;try{localStorage.setItem(key,JSON.stringify(result));}catch{console.warn('Local persistence is unavailable in this browser.');}return result;});
 return [value,update] as const;
}
