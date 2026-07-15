'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { pledgesApi, membersApi, fundsApi } from '@/lib/api';
import { Plus, Edit2, Heart } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import Modal, { FField, FInput, FSelect, FTextarea, FGrid } from '@/components/ui/Modal';

const statusColors:Record<string,string>={active:'bg-green-100 text-green-700',fulfilled:'bg-blue-100 text-blue-700',cancelled:'bg-red-100 text-red-600'};

export default function PledgesPage() {
  const [pledges,setPledges]=useState<any[]>([]);
  const [members,setMembers]=useState<any[]>([]);
  const [funds,setFunds]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [editItem,setEditItem]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const [errors,setErrors]=useState<Record<string,string>>({});
  const [filterStatus,setFilterStatus]=useState('');
  const [form,setForm]=useState({member:'',fund:'',amount:'',frequency:'monthly',start_date:new Date().toISOString().split('T')[0],end_date:'',status:'active',notes:''});

  const fetchData=async()=>{ setLoading(true); try{ const [p,m,f]=await Promise.all([pledgesApi.list({status:filterStatus||undefined}),membersApi.list({page_size:200}),fundsApi.list()]); setPledges(p.data.results||p.data); setMembers(m.data.results||m.data); setFunds(f.data.results||f.data); }catch{} finally{setLoading(false);} };
  useEffect(()=>{fetchData();},[filterStatus]);

  const set=(k:string)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>{ setForm(f=>({...f,[k]:e.target.value})); setErrors(fe=>{const n={...fe};delete n[k];return n;}); };
  const openAdd=()=>{ setEditItem(null); setForm({member:'',fund:'',amount:'',frequency:'monthly',start_date:new Date().toISOString().split('T')[0],end_date:'',status:'active',notes:''}); setErrors({}); setShowModal(true); };
  const openEdit=(p:any)=>{ setEditItem(p); setForm({member:p.member||'',fund:p.fund||'',amount:p.amount||'',frequency:p.frequency||'monthly',start_date:p.start_date||'',end_date:p.end_date||'',status:p.status||'active',notes:p.notes||''}); setErrors({}); setShowModal(true); };

  const handleSubmit=async(e:React.FormEvent)=>{ e.preventDefault(); setSaving(true); setErrors({});
    try{ const payload={...form,fund:form.fund||null,end_date:form.end_date||null};
      if(editItem) await pledgesApi.update(editItem.id,payload); else await pledgesApi.create(payload);
      setShowModal(false); toast.success(editItem?'Pledge updated':'Pledge created'); fetchData();
    }catch(err:any){ const data=err.response?.data; if(data&&typeof data==='object'){const fe:Record<string,string>={};Object.entries(data).forEach(([k,v])=>{fe[k]=Array.isArray(v)?(v as string[]).join(' '):String(v);});setErrors(fe);toast.error('Validation error','Please fix the highlighted fields.');}else toast.error('Save failed');
    }finally{setSaving(false);}
  };

  const totalActive=pledges.filter(p=>p.status==='active').reduce((s,p)=>s+Number(p.amount),0);

  return (
    <DashboardLayout title="Pledges" subtitle="Track member giving pledges">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Pledges</h1><p className="text-gray-500 text-sm mt-1">{pledges.length} pledges total</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition-colors"><Plus size={14}/> Add Pledge</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-sm text-gray-500 mb-1">Active Pledges</p><p className="text-2xl font-bold text-indigo-600">{pledges.filter(p=>p.status==='active').length}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-sm text-gray-500 mb-1">Total Pledged (Active)</p><p className="text-2xl font-bold text-green-600">₹{totalActive.toLocaleString('en-IN')}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-5"><p className="text-sm text-gray-500 mb-1">Fulfilled</p><p className="text-2xl font-bold text-blue-600">{pledges.filter(p=>p.status==='fulfilled').length}</p></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
        <div className="p-4 border-b border-gray-100 flex gap-3">
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40">
            <option value="">All Status</option><option value="active">Active</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>{["Member","Fund","Amount","Frequency","Start Date","Status","Fulfillment","Actions"].map(h=>(
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading?<tr><td colSpan={8} className="text-center py-16 text-gray-400">Loading...</td></tr>
            :pledges.length===0?<tr><td colSpan={8} className="text-center py-16"><div className="flex flex-col items-center gap-2 text-gray-400"><Heart size={32} className="text-gray-200"/><p className="font-medium text-gray-500">No pledges found</p></div></td></tr>
            :pledges.map(p=>(
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.member_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{funds.find(f=>f.id===p.fund)?.name||'General'}</td>
                <td className="px-4 py-3 text-sm font-semibold text-green-600">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-gray-600 capitalize">{p.frequency.replace('_',' ')}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.start_date}</td>
                <td className="px-4 py-3"><span className={"px-2 py-0.5 rounded-full text-xs font-medium capitalize "+(statusColors[p.status]||'bg-gray-100 text-gray-600')}>{p.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5"><div className="bg-indigo-600 h-1.5 rounded-full" style={{width:Math.min(100,p.fulfillment_percent||0)+'%'}}/></div>
                    <span className="text-xs text-gray-500">{p.fulfillment_percent||0}%</span>
                  </div>
                </td>
                <td className="px-4 py-3"><button onClick={()=>openEdit(p)} className="text-indigo-500 hover:text-indigo-700 transition-colors"><Edit2 size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editItem?'Edit Pledge':'Add Pledge'} subtitle={editItem?'Update pledge details':'Record a new giving pledge'}
          icon={<Heart size={16} className="text-white"/>} formId="pledge-form"
          onClose={()=>setShowModal(false)} onSubmit={handleSubmit} saving={saving} saveLabel={editItem?'Update':'Add'}>
          <FField label="Member" required error={errors.member}>
            <FSelect required value={form.member} onChange={set('member')} error={errors.member}>
              <option value="">Select member</option>
              {members.map(m=><option key={m.id} value={m.id}>{m.full_name||`${m.first_name} ${m.last_name}`}</option>)}
            </FSelect>
          </FField>
          <FField label="Fund">
            <FSelect value={form.fund} onChange={set('fund')}>
              <option value="">General</option>
              {funds.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
            </FSelect>
          </FField>
          <FGrid>
            <FField label="Amount (₹)" required error={errors.amount}><FInput type="number" required value={form.amount} onChange={set('amount')} placeholder="5000" error={errors.amount}/></FField>
            <FField label="Frequency"><FSelect value={form.frequency} onChange={set('frequency')}><option value="one_time">One Time</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></FSelect></FField>
          </FGrid>
          <FGrid>
            <FField label="Start Date" required error={errors.start_date}><FInput type="date" required value={form.start_date} onChange={set('start_date')} error={errors.start_date}/></FField>
            <FField label="End Date"><FInput type="date" value={form.end_date} onChange={set('end_date')}/></FField>
          </FGrid>
          <FField label="Status"><FSelect value={form.status} onChange={set('status')}><option value="active">Active</option><option value="fulfilled">Fulfilled</option><option value="cancelled">Cancelled</option></FSelect></FField>
          <FField label="Notes"><FTextarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Optional notes..."/></FField>
        </Modal>
      )}
    </DashboardLayout>
  );
}