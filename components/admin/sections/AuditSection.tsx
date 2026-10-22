'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageHeader,
  SearchInput,
  Button,
  Table,
  THead,
  Th,
  TR,
  TD,
  Badge,
  Dialog,
  useToast,
  Field,
  Input
} from '../ui';
import { useNavigation } from '../../../contexts/NavigationContext';

export type AuditSectionProps = Record<string, never>;

export default function AuditSection(_props: AuditSectionProps) {
  const { user } = useNavigation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [entityType, setEntityType] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [actorId, setActorId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [debouncedAction, setDebouncedAction] = useState('');

  const [selectedMeta, setSelectedMeta] = useState<any | null>(null);

  const toast = useToast();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedAction(actionFilter), 300);
    return () => clearTimeout(handler);
  }, [actionFilter]);

  const fetchLogs = useCallback(async (cursor?: string) => {
    if (user?.role !== 'SUPER_ADMIN') return;

    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (debouncedAction) params.append('action', debouncedAction);
    if (actorId) params.append('actorId', actorId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (cursor) params.append('cursor', cursor);

    try {
      if (cursor) setLoadingMore(true);
      else setLoading(true);

      const res = await fetch(`/api/audit?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();

      if (cursor) {
        setItems(prev => [...prev, ...(json.data.items || [])]);
      } else {
        setItems(json.data.items || []);
      }
      setNextCursor(json.data.nextCursor);
    } catch {
      toast('Erreur lors du chargement de l\'audit', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [entityType, debouncedAction, actorId, from, to, toast, user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const loadMore = () => {
    if (nextCursor) fetchLogs(nextCursor);
  };

  if (user?.role !== 'SUPER_ADMIN') {
     return <div className="p-6 text-center text-text-muted">Accès non autorisé.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'audit"
        description="Toutes les actions sensibles : qui, quoi, quand"
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-48">
           <SearchInput value={actionFilter} onChange={setActionFilter} placeholder="Action (ex: user.create)" label="Action" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-text-muted">Type d&apos;entité</label>
          <select
            className="h-10 rounded-xl border border-ink-200 bg-white px-3 text-sm focus:ring-2 focus:ring-primary/60 outline-none"
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
          >
            <option value="">Tous</option>
            <option value="User">User</option>
            <option value="Booking">Booking</option>
            <option value="City">City</option>
            <option value="Departure">Departure</option>
            <option value="Agency">Agency</option>
            <option value="Company">Company</option>
          </select>
        </div>
        <div className="w-48">
           <Field label="ID Acteur">
             <Input value={actorId} onChange={e => setActorId(e.target.value)} placeholder="ID de l'utilisateur" />
           </Field>
        </div>
        <div className="flex items-end gap-2">
           <Field label="Du" className="w-40">
             <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
           </Field>
           <Field label="Au" className="w-40">
             <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
           </Field>
        </div>
      </div>

      <Table>
         <THead>
           <Th>Date</Th>
           <Th>Acteur + Rôle</Th>
           <Th>Action</Th>
           <Th>Entité + ID</Th>
           <Th>IP</Th>
         </THead>
         <tbody>
           {items.map(log => (
             <TR key={log.id} onClick={() => log.metadata && setSelectedMeta(log.metadata)} className={log.metadata ? "cursor-pointer hover:bg-ink-50" : ""}>
                <TD className="text-sm">{new Date(log.createdAt).toLocaleString()}</TD>
                <TD>
                  {log.actor ? (
                    <div>
                      <div className="font-semibold">{log.actor.name}</div>
                      <div className="text-xs text-text-muted">{log.actorRole}</div>
                    </div>
                  ) : <span className="text-text-muted">Système</span>}
                </TD>
                <TD><Badge tone="neutral">{log.action}</Badge></TD>
                <TD>
                  <div className="font-semibold">{log.entityType}</div>
                  <div className="text-xs font-mono text-text-muted">{log.entityId}</div>
                </TD>
                <TD className="text-sm font-mono text-text-muted">{log.ip || '—'}</TD>
             </TR>
           ))}
           {items.length === 0 && !loading && (
             <TR><TD colSpan={5} className="text-center py-4">Aucun journal trouvé.</TD></TR>
           )}
         </tbody>
      </Table>

      {nextCursor && (
        <div className="flex justify-center mt-4">
           <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
             Charger plus
           </Button>
        </div>
      )}

      {selectedMeta && (
         <Dialog
           size="md"
           title="Métadonnées"
           onClose={() => setSelectedMeta(null)}
           footer={<Button onClick={() => setSelectedMeta(null)}>Fermer</Button>}
         >
           <pre className="bg-ink-950 text-white p-4 rounded-xl text-xs overflow-auto max-h-96">
             {JSON.stringify(selectedMeta, null, 2)}
           </pre>
         </Dialog>
      )}
    </div>
  );
}
