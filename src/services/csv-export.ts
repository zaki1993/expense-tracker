import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type {Transaction} from '../domain/transaction';
function cell(v:unknown){const s=String(v??'');return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
export function transactionsToCsv(rows:Transaction[]):string{const keys:(keyof Transaction)[]=['transaction_id','date','type','amount_minor','currency','category_id','description','merchant','payment_method','account','notes','created_at','updated_at','deleted_at','revision'];return [keys.join(','),...rows.map(t=>keys.map(k=>cell(t[k])).join(','))].join('\r\n');}
export async function exportTransactionsCsv(rows:Transaction[]){const path=FileSystem.cacheDirectory+'expense-transactions-'+new Date().toISOString().slice(0,10)+'.csv';await FileSystem.writeAsStringAsync(path,'\uFEFF'+transactionsToCsv(rows));if(await Sharing.isAvailableAsync())await Sharing.shareAsync(path,{mimeType:'text/csv',dialogTitle:'Export transactions'});return path;}
