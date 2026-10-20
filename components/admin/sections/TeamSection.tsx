'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  Button,
  Table,
  THead,
  Th,
  TR,
  TD,
  Dialog,
  useConfirm,
  useToast,
  Field,
  Input,
  IconButton,
  Badge,
  cx
} from '../ui';
import { useNavigation } from '../../../contexts/NavigationContext';

const ROLE_TONE: Record<string, "danger" | "warning" | "brand" | "info" | "neutral" | "success"> = {
  SUPER_ADMIN: 'danger',
  COMPANY_ADMIN: 'warning',
  AGENCY_ADMIN: 'brand',
  STATION_MANAGER: 'info',
  USER: 'neutral',
};

function generatePassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let p = '';
  for(let i = 0; i < 12; i++) {
    p += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return p;
}

export type TeamSectionProps = Record<string, never>;

export default function TeamSection(_props: TeamSectionProps) {
  const { user } = useNavigation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);

  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const [formData, setFormData] = useState({
     name: '',
     email: '',
     role: '',
     companyId: '',
     agencyId: '',
     stationId: '',
     password: ''
  });

  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setItems(json.data || []);
    } catch {
      toast('Erreur de chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchMeta = useCallback(async () => {
    if (user?.role === 'SUPER_ADMIN') {
      fetch('/api/companies').then(r => r.json()).then(j => setCompanies(j.data || []));
    }
    const params = new URLSearchParams();
    if (user?.role === 'COMPANY_ADMIN' && user.companyId) {
       params.append('companyId', user.companyId);
    }
    fetch(`/api/agencies?${params.toString()}`).then(r => r.json()).then(j => setAgencies(j.data || []));
  }, [user]);

  useEffect(() => {
    fetchUsers();
    fetchMeta();
  }, [fetchUsers, fetchMeta]);

  const handleDelete = async (u: any) => {
     const ok = await confirm({
        title: 'Supprimer ce membre ?',
        message: `Êtes-vous sûr de vouloir supprimer ${u.name} ?`,
        tone: 'danger',
        confirmLabel: 'Supprimer'
     });
     if (!ok) return;

     try {
       const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
       if (!res.ok) {
         const err = await res.json();
         throw new Error(err.error || 'Erreur');
       }
       toast('Membre supprimé avec succès', 'success');
       fetchUsers();
     } catch(e: any) {
       toast(e.message, 'error');
     }
  };

  const openCreate = () => {
     setFormData({ name: '', email: '', role: '', companyId: '', agencyId: '', stationId: '', password: generatePassword() });
     setEditingUser(null);
     setEditMode(true);
  };

  const openEdit = (u: any) => {
     setFormData({
       name: u.name,
       email: u.email,
       role: u.role,
       companyId: u.companyId || '',
       agencyId: u.agencyId || '',
       stationId: u.stationId || '',
       password: ''
     });
     setEditingUser(u);
     setEditMode(true);
  };

  const save = async () => {
    const isNew = !editingUser;
    const url = isNew ? '/api/admin/users' : `/api/admin/users/${editingUser.id}`;
    const method = isNew ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
         method,
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');

      toast(isNew ? 'Membre ajouté' : 'Membre mis à jour', 'success');
      if (formData.password) {
        toast(`Le mot de passe généré a été enregistré. Assurez-vous de l'avoir copié !`, 'info');
      }

      setEditMode(false);
      fetchUsers();
    } catch(e: any) {
      toast(e.message, 'error');
    }
  };

  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN' || user?.role === 'AGENCY_ADMIN';

  const roleOptions = [];
  if (user?.role === 'SUPER_ADMIN') {
     roleOptions.push('COMPANY_ADMIN', 'AGENCY_ADMIN', 'STATION_MANAGER', 'SUPER_ADMIN');
  } else if (user?.role === 'COMPANY_ADMIN') {
     roleOptions.push('AGENCY_ADMIN', 'STATION_MANAGER');
  } else if (user?.role === 'AGENCY_ADMIN') {
     roleOptions.push('STATION_MANAGER');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Équipe"
        description="Gérez les membres de l'équipe et leurs accès."
        actions={canCreate ? <Button icon="add" onClick={openCreate}>Ajouter un membre</Button> : undefined}
      />

      <Table>
         <THead>
           <Th>Membre</Th>
           <Th>Rôle</Th>
           <Th>Organisation</Th>
           <Th className="text-right">Actions</Th>
         </THead>
         <tbody>
           {items.map(u => (
             <TR key={u.id}>
               <TD>
                 <div className="flex items-center gap-3">
                   <div className="size-8 bg-ink-100 rounded-full flex items-center justify-center font-bold text-ink-500">
                     {u.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <div className="font-semibold">{u.name}</div>
                     <div className="text-xs text-text-muted">{u.email}</div>
                   </div>
                 </div>
               </TD>
               <TD>
                 <Badge tone={ROLE_TONE[u.role] || 'neutral'}>{u.role}</Badge>
               </TD>
               <TD>
                  {u.company?.name && <div className="text-sm">{u.company.name}</div>}
                  {u.agency?.name && <div className="text-xs text-text-muted">{u.agency.name}</div>}
                  {!u.company?.name && !u.agency?.name && <span className="text-text-muted">—</span>}
               </TD>
               <TD className="text-right">
                  <div className="flex justify-end gap-1">
                    <IconButton icon="edit" label="Modifier" onClick={() => openEdit(u)} />
                    <IconButton icon="delete" label="Supprimer" onClick={() => handleDelete(u)} className="text-red-500 hover:bg-red-50" />
                  </div>
               </TD>
             </TR>
           ))}
           {items.length === 0 && !loading && (
             <TR><TD colSpan={4} className="text-center py-4">Aucun membre trouvé.</TD></TR>
           )}
         </tbody>
      </Table>

      {editMode && (
         <Dialog
           size="sm"
           title={editingUser ? "Modifier le membre" : "Ajouter un membre"}
           onClose={() => setEditMode(false)}
           footer={
             <>
               <Button variant="ghost" onClick={() => setEditMode(false)}>Annuler</Button>
               <Button onClick={save}>Enregistrer</Button>
             </>
           }
         >
           <div className="space-y-4">
             <Field label="Nom">
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
             </Field>
             <Field label="Email">
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingUser} />
             </Field>
             <Field label="Rôle">
                <select
                  className="w-full h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm focus:ring-2 focus:ring-primary/60 outline-none"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="" disabled>Sélectionner un rôle</option>
                  {roleOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </Field>

             {formData.role === 'COMPANY_ADMIN' && user?.role === 'SUPER_ADMIN' && (
                <Field label="Compagnie">
                  <select
                    className="w-full h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none"
                    value={formData.companyId}
                    onChange={e => setFormData({ ...formData, companyId: e.target.value })}
                  >
                     <option value="">Sélectionner...</option>
                     {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
             )}

             {(formData.role === 'AGENCY_ADMIN' || formData.role === 'STATION_MANAGER') && (
                <Field label="Agence">
                  <select
                    className="w-full h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none"
                    value={formData.agencyId}
                    onChange={e => setFormData({ ...formData, agencyId: e.target.value })}
                  >
                     <option value="">Sélectionner...</option>
                     {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </Field>
             )}

             <Field label="Mot de passe">
                <div className="flex gap-2">
                  <Input value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="flex-1 font-mono" />
                  <Button variant="secondary" icon="refresh" onClick={() => setFormData({ ...formData, password: generatePassword() })}>Générer</Button>
                  <Button variant="secondary" icon="content_copy" onClick={() => navigator.clipboard.writeText(formData.password)}>Copier</Button>
                </div>
                <div className="text-xs text-text-muted mt-1">Copiez le mot de passe avant d&apos;enregistrer.</div>
             </Field>

           </div>
         </Dialog>
      )}

      {dialog}
    </div>
  );
}
