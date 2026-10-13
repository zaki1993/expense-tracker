import {AppState,AppStateStatus} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {getAccessToken} from './google-auth';
import {fileStorage} from './file-storage';
import {synchronize} from './sync-service';
let lastError:string|null=null;
export function getLastSyncError(){return lastError;}
export async function requestSync():Promise<void>{const m=await fileStorage.loadMetadata(),id=String(m.spreadsheetId??'');if(!id)throw new Error('Choose or create a Google spreadsheet in Settings first.');const token=await getAccessToken();try{await synchronize(token,id);lastError=null;}catch(e:any){lastError=String(e?.message??'Synchronization failed');throw e;}}
export function startSyncController(){let disposed=false,running=false;const attempt=async()=>{if(disposed||running)return;running=true;try{const q=await fileStorage.loadQueue();if(q.some(x=>x.state==='pending'))await requestSync();}catch(e:any){lastError=String(e?.message??'Synchronization failed');}finally{running=false;}};const net=NetInfo.addEventListener(s=>{if(s.isConnected)void attempt();});const sub=AppState.addEventListener('change',(s:AppStateStatus)=>{if(s==='active')void attempt();});void attempt();return()=>{disposed=true;net();sub.remove();};}
