import { createCoverState } from './studio-state.js';
import { exportCoverPng } from './render-poster.js';

export function configureShotScene(params) {
  const state=createCoverState(params.get('cast')||'A');
  if(params.has('grade'))state.grade=params.get('grade');
  return {state,width:Number(params.get('w'))||1920,height:Number(params.get('h'))||1080};
}
export async function renderDeterministicShot(params,state,photos,width,height) {
  if(params.get('shot')!=='export')return;
  document.body.classList.add('export-scene');
  const data=exportCoverPng(state,photos,width,height);
  const image=new Image();image.id='shot-cover';image.src=data;await image.decode();document.body.append(image);
  window.__exportDataUrl=data;
}
