'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ministriesApi, membersApi } from '@/lib/api';
import { Church } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import {
  FField,
  FInput,
  FSelect,
  FTextarea,
  FGrid
} from '@/components/ui/Modal';

const days = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export default function AddMinistryPage() {
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});

  const [form, setForm] = useState({
    name:'',
    description:'',
    leader:'',
    meeting_day:'',
    meeting_time:'',
    is_active:true
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const res = await membersApi.list({ page_size: 200 });
    setMembers(res.data.results || res.data);
  };

  const set =
    (k:string)=>
    (e:any)=>
      setForm(f=>({...f,[k]:e.target.value}));

  const handleSubmit = async (e:any) => {
    e.preventDefault();

    try {
      setSaving(true);

      await ministriesApi.create({
        ...form,
        leader: form.leader || null,
        meeting_time: form.meeting_time || null
      });

      toast.success('Ministry created');
      router.push('/ministries');
    } catch (err:any) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Add Ministry"
      subtitle="Create a new ministry"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-xl border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

         <FField label="Ministry Name" required error={errors.name}>
                     <FInput required value={form.name} onChange={set('name')} placeholder="e.g. Youth Group" error={errors.name}/>
                   </FField>
                   <FField label="Description">
                     <FTextarea value={form.description} onChange={set('description')} rows={3} placeholder="Describe this ministry..."/>
                   </FField>
                   <FField label="Ministry Leader">
                     <FSelect value={form.leader} onChange={set('leader')}>
                       <option value="">Select leader</option>
                       {members.map(m=><option key={m.id} value={m.id}>{m.full_name||`${m.first_name} ${m.last_name}`}</option>)}
                     </FSelect>
                   </FField>
                   <FGrid>
                     <FField label="Meeting Day">
                       <FSelect value={form.meeting_day} onChange={set('meeting_day')}>
                         <option value="">Select day</option>
                         {days.map(d=><option key={d} value={d}>{d}</option>)}
                       </FSelect>
                     </FField>
                     <FField label="Meeting Time">
                       <FInput type="time" value={form.meeting_time} onChange={set('meeting_time')}/>
                     </FField>
                   </FGrid>
                   <div className="flex items-center gap-2 pt-1">
                     <input type="checkbox" id="is_active" checked={form.is_active} onChange={e=>setForm(f=>({...f,is_active:e.target.checked}))} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                     <label htmlFor="is_active" className="text-sm text-gray-700 cursor-pointer">Active ministry</label>
                   </div>

        </form>
      </div>
    </DashboardLayout>
  );
}