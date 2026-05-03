'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Field, inputCls } from './SuperAdminDashboard';

interface PolicyTier {
  minHoursBeforeDeparture: number;
  refundPercent: number;
}

interface Policy {
  deadlineHours: number;
  tiers: PolicyTier[];
  notes?: string | null;
  isDefault?: boolean;
}

interface Props {
  companyId: string;
}

const CancellationPolicyPanel: React.FC<Props> = ({ companyId }) => {
  const [deadlineHours, setDeadlineHours] = useState(2);
  const [tiers, setTiers] = useState<PolicyTier[]>([]);
  const [notes, setNotes] = useState('');
  const [isDefault, setIsDefault] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/companies/${companyId}/cancellation-policy`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      const p = json.data as Policy;
      setDeadlineHours(p.deadlineHours);
      setTiers(p.tiers ?? []);
      setNotes(p.notes ?? '');
      setIsDefault(Boolean(p.isDefault));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { refetch(); }, [refetch]);

  const updateTier = (index: number, key: keyof PolicyTier, value: number) => {
    setTiers((arr) => arr.map((t, i) => (i === index ? { ...t, [key]: value } : t)));
  };
  const addTier = () => setTiers((arr) => [...arr, { minHoursBeforeDeparture: 0, refundPercent: 0 }]);
  const removeTier = (index: number) => setTiers((arr) => arr.filter((_, i) => i !== index));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(null);
    try {
      const sortedTiers = [...tiers].sort((a, b) => b.minHoursBeforeDeparture - a.minHoursBeforeDeparture);
      const res = await fetch(`/api/companies/${companyId}/cancellation-policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deadlineHours,
          tiers: sortedTiers,
          notes: notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      setSuccess('Politique enregistrée.');
      setIsDefault(false);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-black text-lg text-text-main dark:text-white">Politique d'annulation</h2>
        {isDefault && (
          <p className="text-xs text-text-muted mt-1">
            Aucune politique personnalisée. Les valeurs ci-dessous sont les valeurs par défaut. Enregistrez pour les rendre spécifiques à votre compagnie.
          </p>
        )}
      </div>

      <form onSubmit={submit} className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-subtle p-4 md:p-6 space-y-4">
        <Field label="Délai d'annulation (heures avant départ)">
          <input
            type="number"
            min={0}
            value={deadlineHours}
            onChange={(e) => setDeadlineHours(Number(e.target.value))}
            className={inputCls}
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="block text-xs font-black text-text-muted uppercase tracking-wider">Paliers de remboursement</span>
            <button type="button" onClick={addTier} className="px-3 py-1 rounded-lg text-xs font-black bg-primary/10 text-primary hover:bg-primary/20">
              + Palier
            </button>
          </div>
          <div className="space-y-2">
            {tiers.length === 0 && <p className="text-xs text-text-muted">Aucun palier. Ajoutez-en pour rembourser une partie selon le délai.</p>}
            {tiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <Field label="Heures avant">
                  <input type="number" min={0} value={tier.minHoursBeforeDeparture} onChange={(e) => updateTier(i, 'minHoursBeforeDeparture', Number(e.target.value))} className={inputCls} />
                </Field>
                <Field label="% remboursé">
                  <input type="number" min={0} max={100} value={tier.refundPercent} onChange={(e) => updateTier(i, 'refundPercent', Number(e.target.value))} className={inputCls} />
                </Field>
                <button type="button" onClick={() => removeTier(i)} className="h-10 px-3 rounded-lg text-xs font-black bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            Les paliers sont triés par seuil décroissant lors de l'enregistrement. Le premier palier dont le seuil est atteint s'applique.
          </p>
        </div>

        <Field label="Notes (affichées au passager)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls + ' h-auto py-2'} />
        </Field>

        {error && <div className="text-red-600 text-xs font-bold bg-red-50 p-2 rounded">{error}</div>}
        {success && <div className="text-green-700 text-xs font-bold bg-green-50 p-2 rounded">{success}</div>}

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-text-main font-black text-sm disabled:opacity-50">
            {saving ? 'Enregistrement…' : 'Enregistrer la politique'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CancellationPolicyPanel;
