jest.mock('expo-crypto',()=>({randomUUID:(()=>{let i=0;return()=>String(++i)})()}));
import {createTransaction} from '../../domain/transaction';
import {calculateTotals} from '../../domain/reports';
import type {Transaction} from '../../domain/transaction';
const t=(type:Transaction['type'],amount_minor:number,extra:Partial<Transaction>={}):Transaction=>({transaction_id:'1',created_at:'now',updated_at:'now',date:'2026-10-01',type,amount_minor,currency:'EUR',category_id:'food',description:'',merchant:'',payment_method:'',account:'',notes:'',recurring_rule_id:'',transfer_group_id:'',deleted_at:'',revision:1,...extra});
test('pending local edits can be represented without database state',()=>{const expense=t('expense',1234);const changed={...expense,amount_minor:2000,revision:2};expect(calculateTotals([changed],'EUR','2026-10-01','2026-10-31').expenses).toBe(2000);expect(calculateTotals([{...changed,deleted_at:'now'}],'EUR','2026-10-01','2026-10-31').expenses).toBe(0);});
test('transaction factory keeps integer money and stable ID',()=>{const d=createTransaction({date:'2026-10-13',type:'expense',amount_minor:1250,currency:'EUR',category_id:'food'},'stable');expect(d.transaction_id).toBe('stable');expect(d.amount_minor).toBe(1250);});
