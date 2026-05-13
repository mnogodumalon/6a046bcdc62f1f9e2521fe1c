import { useDashboardData } from '@/hooks/useDashboardData';
import type { Test } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { TestDialog } from '@/components/dialogs/TestDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import {
  IconAlertCircle, IconTool, IconRefresh, IconCheck,
  IconPlus, IconSearch, IconUsers, IconMail,
  IconPencil, IconTrash, IconUser, IconX,
} from '@tabler/icons-react';

const APPGROUP_ID = '6a046bcdc62f1f9e2521fe1c';
const REPAIR_ENDPOINT = '/claude/build/repair';

export default function DashboardOverview() {
  const { test, loading, error, fetchAll } = useDashboardData();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Test | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Test | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return test;
    return test.filter(r => {
      const f = r.fields;
      return (
        (f.vorname ?? '').toLowerCase().includes(q) ||
        (f.nachname ?? '').toLowerCase().includes(q) ||
        (f.email ?? '').toLowerCase().includes(q) ||
        (f.bemerkung ?? '').toLowerCase().includes(q)
      );
    });
  }, [test, search]);

  const withEmail = useMemo(() => test.filter(r => r.fields.email).length, [test]);

  const handleCreate = async (fields: Test['fields']) => {
    await LivingAppsService.createTestEntry(fields);
    fetchAll();
  };

  const handleEdit = async (fields: Test['fields']) => {
    if (!editRecord) return;
    await LivingAppsService.updateTestEntry(editRecord.record_id, fields);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteTestEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          title="Kontakte gesamt"
          value={String(test.length)}
          description="Einträge"
          icon={<IconUsers size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Mit E-Mail"
          value={String(withEmail)}
          description={`von ${test.length}`}
          icon={<IconMail size={18} className="text-muted-foreground" />}
        />
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Suchergebnisse"
            value={String(filtered.length)}
            description={search ? 'gefunden' : 'alle angezeigt'}
            icon={<IconSearch size={18} className="text-muted-foreground" />}
          />
        </div>
      </div>

      {/* Search + Add Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-0" style={{ minWidth: '200px' }}>
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
          <Input
            placeholder="Nach Name, E-Mail oder Bemerkung suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <IconX size={15} />
            </button>
          )}
        </div>
        <Button
          onClick={() => { setEditRecord(null); setDialogOpen(true); }}
          className="shrink-0"
        >
          <IconPlus size={16} className="mr-1.5 shrink-0" />
          <span>Neuer Kontakt</span>
        </Button>
      </div>

      {/* Contact Cards Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
            <IconUsers size={28} className="text-muted-foreground" stroke={1.5} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">
              {search ? 'Keine Treffer' : 'Noch keine Kontakte'}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {search
                ? `Für "${search}" wurden keine Einträge gefunden.`
                : 'Leg jetzt deinen ersten Kontakt an.'}
            </p>
          </div>
          {!search && (
            <Button onClick={() => { setEditRecord(null); setDialogOpen(true); }}>
              <IconPlus size={16} className="mr-1.5" />
              Kontakt hinzufügen
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(record => (
            <ContactCard
              key={record.record_id}
              record={record}
              onEdit={() => { setEditRecord(record); setDialogOpen(true); }}
              onDelete={() => setDeleteTarget(record)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <TestDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleEdit : handleCreate}
        defaultValues={editRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Test']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Test']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Kontakt löschen"
        description={`Soll "${deleteTarget?.fields.vorname ?? ''} ${deleteTarget?.fields.nachname ?? ''}".trim() wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Card
// ---------------------------------------------------------------------------
function ContactCard({
  record,
  onEdit,
  onDelete,
}: {
  record: Test;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { vorname, nachname, email, bemerkung } = record.fields;
  const fullName = [vorname, nachname].filter(Boolean).join(' ') || '(kein Name)';
  const initials = [vorname?.[0], nachname?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  return (
    <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          {initials !== '?' ? (
            <span className="text-sm font-bold text-primary">{initials}</span>
          ) : (
            <IconUser size={20} className="text-primary/60" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground truncate leading-tight">{fullName}</p>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="text-xs text-primary hover:underline truncate block mt-0.5"
              onClick={e => e.stopPropagation()}
            >
              {email}
            </a>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">Keine E-Mail</p>
          )}
        </div>
      </div>

      {/* Bemerkung */}
      {bemerkung && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground line-clamp-2">{bemerkung}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto flex border-t border-border">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <IconPencil size={14} className="shrink-0" />
          Bearbeiten
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
        >
          <IconTrash size={14} className="shrink-0" />
          Löschen
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton & Error
// ---------------------------------------------------------------------------
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const [repairing, setRepairing] = useState(false);
  const [repairStatus, setRepairStatus] = useState('');
  const [repairDone, setRepairDone] = useState(false);
  const [repairFailed, setRepairFailed] = useState(false);

  const handleRepair = async () => {
    setRepairing(true);
    setRepairStatus('Reparatur wird gestartet...');
    setRepairFailed(false);
    const errorContext = JSON.stringify({
      type: 'data_loading',
      message: error.message,
      stack: (error.stack ?? '').split('\n').slice(0, 10).join('\n'),
      url: window.location.href,
    });
    try {
      const resp = await fetch(REPAIR_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appgroup_id: APPGROUP_ID, error_context: errorContext }),
      });
      if (!resp.ok || !resp.body) { setRepairing(false); setRepairFailed(true); return; }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data: ')) continue;
          const content = line.slice(6);
          if (content.startsWith('[STATUS]')) setRepairStatus(content.replace(/^\[STATUS]\s*/, ''));
          if (content.startsWith('[DONE]')) { setRepairDone(true); setRepairing(false); }
          if (content.startsWith('[ERROR]') && !content.includes('Dashboard-Links')) setRepairFailed(true);
        }
      }
    } catch { setRepairing(false); setRepairFailed(true); }
  };

  if (repairDone) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
          <IconCheck size={22} className="text-green-500" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground mb-1">Dashboard repariert</h3>
          <p className="text-sm text-muted-foreground max-w-xs">Das Problem wurde behoben. Bitte laden Sie die Seite neu.</p>
        </div>
        <Button size="sm" onClick={() => window.location.reload()}>
          <IconRefresh size={14} className="mr-1" />Neu laden
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <IconAlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {repairing ? repairStatus : error.message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRetry} disabled={repairing}>Erneut versuchen</Button>
        <Button size="sm" onClick={handleRepair} disabled={repairing}>
          {repairing
            ? <span className="inline-block w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-1" />
            : <IconTool size={14} className="mr-1" />}
          {repairing ? 'Reparatur läuft...' : 'Dashboard reparieren'}
        </Button>
      </div>
      {repairFailed && <p className="text-sm text-destructive">Automatische Reparatur fehlgeschlagen. Bitte kontaktiere den Support.</p>}
    </div>
  );
}
