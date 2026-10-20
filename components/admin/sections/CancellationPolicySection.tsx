'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  ErrorState,
  Field,
  IconButton,
  InlineAlert,
  Input,
  PageHeader,
  Skeleton,
  Textarea,
  cx,
  formatXAF,
  useConfirm,
  useToast,
} from '../ui';

export type CancellationPolicySectionProps = { companyId: string };

// Mirrors lib/cancellation-policy.ts (that module imports Prisma and cannot be bundled client-side).
const DEFAULT_TIERS = [
  { hours: '24', percent: '100' },
  { hours: '2', percent: '50' },
  { hours: '0', percent: '0' },
];
const DEFAULT_DEADLINE = '2';

interface Row {
  hours: string;
  percent: string;
}
interface ParsedTier {
  hours: number;
  percent: number;
}

const toNum = (v: string) => (v.trim() === '' ? NaN : Number(v));

function refundPercentFor(tiers: ParsedTier[], hoursBefore: number): number {
  const sorted = [...tiers].sort((a, b) => b.hours - a.hours);
  for (const t of sorted) if (hoursBefore >= t.hours) return Math.max(0, Math.min(100, Math.round(t.percent)));
  return 0;
}

const hLabel = (h: number) => `${h.toLocaleString('fr-FR')} h`;

const CancellationPolicySection: React.FC<CancellationPolicySectionProps> = ({ companyId }) => {
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [rows, setRows] = useState<Row[]>(DEFAULT_TIERS);
  const [deadline, setDeadline] = useState(DEFAULT_DEADLINE);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [exAmount, setExAmount] = useState('5000');
  const [exHours, setExHours] = useState('10');

  const snapshot = (r: Row[], d: string, n: string) => JSON.stringify({ r, d, n });

  const apply = useCallback((data: { tiers: Array<{ minHoursBeforeDeparture: number; refundPercent: number }>; deadlineHours: number; notes?: string | null; isDefault?: boolean }) => {
    const r = [...data.tiers]
      .sort((a, b) => b.minHoursBeforeDeparture - a.minHoursBeforeDeparture)
      .map((t) => ({ hours: String(t.minHoursBeforeDeparture), percent: String(t.refundPercent) }));
    setRows(r);
    setDeadline(String(data.deadlineHours));
    setNotes(data.notes ?? '');
    setIsDefault(!!data.isDefault);
    setSaved(snapshot(r, String(data.deadlineHours), data.notes ?? ''));
  }, []);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/companies/${companyId}/cancellation-policy`, { signal });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Impossible de charger la politique.');
        apply(json.data);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Impossible de charger la politique.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [companyId, apply],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Validation
  const validation = useMemo(() => {
    const rowErrors: Array<{ hours?: string; percent?: string }> = rows.map(() => ({}));
    const global: string[] = [];
    const warnings: string[] = [];
    const seen = new Map<number, number>();
    rows.forEach((r, i) => {
      const h = toNum(r.hours);
      const p = toNum(r.percent);
      if (!Number.isFinite(h) || h < 0) rowErrors[i].hours = 'Nombre d’heures ≥ 0';
      else if (seen.has(h)) {
        rowErrors[i].hours = 'Seuil en double';
        rowErrors[seen.get(h)!].hours = 'Seuil en double';
      } else seen.set(h, i);
      if (!Number.isFinite(p) || p < 0 || p > 100) rowErrors[i].percent = 'Entre 0 et 100';
    });
    if (rows.length === 0) global.push('Ajoutez au moins un palier.');
    const d = toNum(deadline);
    let deadlineErr: string | undefined;
    if (!Number.isInteger(d) || d < 0 || d > 720) deadlineErr = 'Entier entre 0 et 720';
    const hasRowErr = rowErrors.some((e) => e.hours || e.percent);

    const parsed: ParsedTier[] = hasRowErr
      ? []
      : rows.map((r) => ({ hours: Number(r.hours), percent: Number(r.percent) })).sort((a, b) => b.hours - a.hours);
    if (!hasRowErr && parsed.length > 0) {
      if (!parsed.some((t) => t.hours === 0)) warnings.push('Aucun palier à 0 h : une annulation plus tardive que le dernier seuil ne donnera aucun remboursement.');
      for (let i = 1; i < parsed.length; i++) {
        if (parsed[i].percent > parsed[i - 1].percent)
          warnings.push(`Le remboursement augmente à l’approche du départ (${hLabel(parsed[i].hours)} → ${parsed[i].percent} %). Vérifiez vos paliers.`);
      }
    }
    return { rowErrors, global, warnings, deadlineErr, parsed, valid: !hasRowErr && global.length === 0 && !deadlineErr };
  }, [rows, deadline]);

  const dirty = snapshot(rows, deadline, notes) !== saved;

  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const sortRows = () =>
    setRows((rs) => {
      if (rs.some((r) => !Number.isFinite(toNum(r.hours)))) return rs;
      return [...rs].sort((a, b) => Number(b.hours) - Number(a.hours));
    });
  const addRow = () => setRows((rs) => [...rs, { hours: '', percent: '' }]);

  const put = async (payload: { tiers: Array<{ minHoursBeforeDeparture: number; refundPercent: number }>; deadlineHours: number; notes: string | null }) => {
    const res = await fetch(`/api/companies/${companyId}/cancellation-policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || 'Enregistrement impossible.');
  };

  const save = async () => {
    if (!validation.valid) {
      toast('Corrigez les erreurs avant d’enregistrer.', 'error');
      return;
    }
    setSaving(true);
    try {
      await put({
        deadlineHours: Number(deadline),
        notes: notes.trim() || null,
        tiers: validation.parsed.map((t) => ({ minHoursBeforeDeparture: t.hours, refundPercent: t.percent })),
      });
      toast('Politique d’annulation enregistrée.');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Enregistrement impossible.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetDefault = async () => {
    const ok = await confirm({
      title: 'Rétablir la politique par défaut ?',
      message: 'Vos paliers actuels seront remplacés par la politique standard (100 % à 24 h, 50 % à 2 h, puis 0 %). Cette action est enregistrée immédiatement.',
      confirmLabel: 'Rétablir',
      tone: 'primary',
    });
    if (!ok) return;
    setSaving(true);
    try {
      await put({
        deadlineHours: Number(DEFAULT_DEADLINE),
        notes: null,
        tiers: DEFAULT_TIERS.map((t) => ({ minHoursBeforeDeparture: Number(t.hours), refundPercent: Number(t.percent) })),
      });
      toast('Politique par défaut rétablie.');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action impossible.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Preview lines
  const preview = useMemo(() => {
    const t = validation.parsed;
    if (!validation.valid || t.length === 0) return [];
    const lines: Array<{ label: string; percent: number }> = t.map((x) => ({
      label: x.hours === 0 ? 'Jusqu’au départ' : `${hLabel(x.hours)} avant ou plus`,
      percent: x.percent,
    }));
    const last = t[t.length - 1];
    if (last.hours > 0) lines.push({ label: `Moins de ${hLabel(last.hours)} avant`, percent: 0 });
    return lines;
  }, [validation]);

  const deadlineNum = Number(deadline);
  const exH = toNum(exHours);
  const exA = toNum(exAmount);
  const example = useMemo(() => {
    if (!validation.valid || !Number.isFinite(exH) || !Number.isFinite(exA) || exH < 0 || exA < 0) return null;
    if (exH < deadlineNum) return { blocked: true as const };
    const pct = refundPercentFor(validation.parsed, exH);
    return { blocked: false as const, pct, refund: Math.round((exA * pct) / 100) };
  }, [validation, exH, exA, deadlineNum]);

  if (loading)
    return (
      <div>
        <PageHeader eyebrow="Paramètres" title="Politique d’annulation" />
        <div className="space-y-3" aria-busy="true" aria-label="Chargement">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );

  return (
    <div>
      <PageHeader
        eyebrow="Paramètres"
        title="Politique d’annulation"
        description="Définissez la part du billet remboursée au client selon le délai entre son annulation et l’heure de départ."
        actions={
          <>
            <Button variant="ghost" icon="restart_alt" onClick={resetDefault} disabled={saving || !!error}>
              Rétablir la politique par défaut
            </Button>
            <Button variant="primary" icon="save" onClick={save} loading={saving} disabled={!!error || !dirty || !validation.valid}>
              Enregistrer
            </Button>
          </>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={() => load()} />
      ) : (
        <div className="space-y-5">
          {isDefault && (
            <InlineAlert tone="info">
              Votre compagnie utilise actuellement la politique par défaut. Modifiez les paliers puis enregistrez pour définir la vôtre.
            </InlineAlert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <Card className="lg:col-span-3">
              <CardHeader icon="tune" title="Paliers de remboursement" subtitle="Le premier palier atteint (du plus grand seuil au plus petit) s’applique." />

              <div className="space-y-3">
                <div className="hidden sm:grid grid-cols-[1fr_1fr_auto] gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
                  <span>Annulation au moins… (heures avant)</span>
                  <span>Remboursement (%)</span>
                  <span className="w-9" />
                </div>
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-start">
                    <Field label={`Palier ${i + 1} — heures avant le départ`} error={validation.rowErrors[i]?.hours} className="sm:[&>span:first-child]:sr-only">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        value={r.hours}
                        onChange={(e) => setRow(i, { hours: e.target.value })}
                        onBlur={sortRows}
                        className={cx('tabular-nums', validation.rowErrors[i]?.hours && 'border-red-400')}
                      />
                    </Field>
                    <Field label={`Palier ${i + 1} — remboursement %`} error={validation.rowErrors[i]?.percent} className="sm:[&>span:first-child]:sr-only">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={100}
                        step={1}
                        value={r.percent}
                        onChange={(e) => setRow(i, { percent: e.target.value })}
                        className={cx('tabular-nums', validation.rowErrors[i]?.percent && 'border-red-400')}
                      />
                    </Field>
                    <IconButton
                      icon="delete"
                      label={`Supprimer le palier ${i + 1}`}
                      tone="danger"
                      className="sm:mt-0 mt-6"
                      onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                    />
                  </div>
                ))}
                {validation.global.map((g) => (
                  <InlineAlert key={g}>{g}</InlineAlert>
                ))}
                {validation.warnings.map((w) => (
                  <InlineAlert key={w} tone="warning">
                    {w}
                  </InlineAlert>
                ))}
                <Button variant="secondary" size="sm" icon="add" onClick={addRow}>
                  Ajouter un palier
                </Button>
              </div>

              <div className="mt-6 pt-5 border-t border-ink-100 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Délai limite d’annulation (heures)"
                  hint="Aucune annulation possible en deçà de ce délai avant le départ (0 = jusqu’au départ)."
                  error={validation.deadlineErr}
                >
                  <Input type="number" inputMode="numeric" min={0} max={720} step={1} value={deadline} onChange={(e) => setDeadline(e.target.value)} className="tabular-nums" />
                </Field>
                <Field label="Note pour les clients (optionnel)">
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
                </Field>
              </div>
            </Card>

            <div className="lg:col-span-2 space-y-5">
              <Card>
                <CardHeader icon="timeline" title="Aperçu client" subtitle="Ce que le client récupère selon son délai." />
                {preview.length === 0 ? (
                  <p className="text-sm text-text-muted">Corrigez les paliers pour voir l’aperçu.</p>
                ) : (
                  <>
                    <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-white/10 mb-4" aria-hidden>
                      {preview.map((l, i) => (
                        <div
                          key={i}
                          className="h-full border-r border-white/70 dark:border-ink-950 last:border-r-0 bg-primary"
                          style={{ flex: 1, opacity: 0.15 + (l.percent / 100) * 0.85 }}
                        />
                      ))}
                    </div>
                    <ul className="divide-y divide-ink-100 dark:divide-white/10 text-sm">
                      {preview.map((l, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 py-2">
                          <span>{l.label}</span>
                          <span className={cx('font-semibold tabular-nums', l.percent === 0 ? 'text-text-muted' : 'text-teal-accent dark:text-primary')}>
                            {l.percent} %
                          </span>
                        </li>
                      ))}
                      {deadlineNum > 0 && Number.isInteger(deadlineNum) && (
                        <li className="flex items-center justify-between gap-3 py-2 text-red-700 dark:text-red-300">
                          <span>Moins de {hLabel(deadlineNum)} avant</span>
                          <span className="font-semibold">Annulation impossible</span>
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </Card>

              <Card>
                <CardHeader icon="calculate" title="Exemple chiffré" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <Field label="Prix du billet (FCFA)">
                    <Input type="number" min={0} step={500} value={exAmount} onChange={(e) => setExAmount(e.target.value)} className="tabular-nums" />
                  </Field>
                  <Field label="Annulé (h avant)">
                    <Input type="number" min={0} step={1} value={exHours} onChange={(e) => setExHours(e.target.value)} className="tabular-nums" />
                  </Field>
                </div>
                {example === null ? (
                  <p className="text-sm text-text-muted">Renseignez des valeurs valides pour calculer le remboursement.</p>
                ) : example.blocked ? (
                  <InlineAlert tone="warning">
                    Un billet annulé {hLabel(exH)} avant le départ ne peut pas être annulé : le délai limite est de {hLabel(deadlineNum)}.
                  </InlineAlert>
                ) : (
                  <p className="text-sm leading-relaxed">
                    Billet de <strong className="tabular-nums">{formatXAF(exA)}</strong> annulé <strong>{hLabel(exH)}</strong> avant le départ
                    {' → '}remboursement de <strong className="tabular-nums text-teal-accent dark:text-primary">{formatXAF(example.refund)}</strong>{' '}
                    <span className="text-text-muted">({example.pct} %)</span>.
                  </p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
};

export default CancellationPolicySection;
