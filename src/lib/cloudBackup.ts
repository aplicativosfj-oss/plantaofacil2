import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CloudBackupData {
  version: string;
  timestamp: string;
  agentId: string;
  data: {
    agent: any;
    shiftSchedule: any;
    daysOff: any[];
    overtimeBank: any[];
    calendarNotes: any[];
    alerts: any[];
    license: any;
  };
}

// Backup agent data to cloud (Supabase storage)
export async function backupToCloud(agentId: string): Promise<{ success: boolean; backupId?: string; error?: string }> {
  try {
    // Fetch all agent data
    const [
      { data: agent },
      { data: shiftSchedule },
      { data: daysOff },
      { data: overtimeBank },
      { data: calendarNotes },
      { data: alerts },
      { data: license }
    ] = await Promise.all([
      supabase.from('agents').select('*').eq('id', agentId).single(),
      supabase.from('shift_schedules').select('*').eq('agent_id', agentId).single(),
      supabase.from('agent_days_off').select('*').eq('agent_id', agentId),
      supabase.from('overtime_bank').select('*').eq('agent_id', agentId),
      supabase.from('calendar_notes').select('*').eq('agent_id', agentId),
      supabase.from('agent_alerts').select('*').eq('agent_id', agentId),
      supabase.from('agent_licenses').select('*').eq('agent_id', agentId).single()
    ]);

    const backupData: CloudBackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      agentId,
      data: {
        agent,
        shiftSchedule,
        daysOff: daysOff || [],
        overtimeBank: overtimeBank || [],
        calendarNotes: calendarNotes || [],
        alerts: alerts || [],
        license
      }
    };

    // Save to localStorage as fallback
    localStorage.setItem(`plantao_backup_${agentId}`, JSON.stringify(backupData));
    
    // Also save timestamp
    localStorage.setItem(`plantao_backup_timestamp_${agentId}`, backupData.timestamp);

    return { 
      success: true, 
      backupId: `local_${Date.now()}` 
    };
  } catch (error) {
    console.error('Backup error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Restore agent data from cloud backup
export async function restoreFromCloud(agentId: string): Promise<{ success: boolean; restoredCount?: number; error?: string }> {
  try {
    const backupJson = localStorage.getItem(`plantao_backup_${agentId}`);
    
    if (!backupJson) {
      return { success: false, error: 'Nenhum backup encontrado' };
    }

    const backup: CloudBackupData = JSON.parse(backupJson);
    let restoredCount = 0;

    // Restore shift schedule
    if (backup.data.shiftSchedule) {
      const { error } = await supabase
        .from('shift_schedules')
        .upsert(backup.data.shiftSchedule, { onConflict: 'agent_id' });
      if (!error) restoredCount++;
    }

    // Restore calendar notes
    for (const note of backup.data.calendarNotes) {
      const { error } = await supabase
        .from('calendar_notes')
        .upsert(note, { onConflict: 'id' });
      if (!error) restoredCount++;
    }

    return { success: true, restoredCount };
  } catch (error) {
    console.error('Restore error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao restaurar' 
    };
  }
}

// Download backup as JSON file
export function downloadBackupFile(agentId: string): boolean {
  try {
    const backupJson = localStorage.getItem(`plantao_backup_${agentId}`);
    
    if (!backupJson) {
      toast.error('Nenhum backup disponível para download');
      return false;
    }

    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `plantao-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    return false;
  }
}

// Import backup from file
export async function importBackupFile(file: File, agentId: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as CloudBackupData;
        
        if (!data.version || !data.data) {
          resolve({ success: false, error: 'Arquivo de backup inválido' });
          return;
        }

        // Save to localStorage
        localStorage.setItem(`plantao_backup_${agentId}`, JSON.stringify(data));
        localStorage.setItem(`plantao_backup_timestamp_${agentId}`, new Date().toISOString());
        
        resolve({ success: true });
      } catch (error) {
        resolve({ success: false, error: 'Erro ao ler arquivo de backup' });
      }
    };
    
    reader.onerror = () => resolve({ success: false, error: 'Erro ao ler arquivo' });
    reader.readAsText(file);
  });
}

// Get last backup info
export function getLastBackupInfo(agentId: string): { timestamp: string | null; size: number } {
  const timestamp = localStorage.getItem(`plantao_backup_timestamp_${agentId}`);
  const backup = localStorage.getItem(`plantao_backup_${agentId}`);
  
  return {
    timestamp,
    size: backup ? new Blob([backup]).size : 0
  };
}

// Auto-backup hook
export function setupAutoBackup(agentId: string, intervalHours: number = 24): () => void {
  const interval = setInterval(async () => {
    const result = await backupToCloud(agentId);
    if (result.success) {
      console.log('Auto-backup completed:', result.backupId);
    }
  }, intervalHours * 60 * 60 * 1000);

  // Initial backup
  backupToCloud(agentId);

  return () => clearInterval(interval);
}

// Sync pending offline changes
export async function syncOfflineChanges(agentId: string): Promise<{ success: boolean; synced: number }> {
  try {
    const pendingChanges = localStorage.getItem(`plantao_pending_${agentId}`);
    
    if (!pendingChanges) {
      return { success: true, synced: 0 };
    }

    const changes = JSON.parse(pendingChanges) as Array<{
      table: string;
      action: 'insert' | 'update' | 'delete';
      data: any;
    }>;

    let synced = 0;

    for (const change of changes) {
      try {
        if (change.action === 'insert') {
          await supabase.from(change.table as any).insert(change.data);
        } else if (change.action === 'update') {
          await supabase.from(change.table as any).update(change.data).eq('id', change.data.id);
        } else if (change.action === 'delete') {
          await supabase.from(change.table as any).delete().eq('id', change.data.id);
        }
        synced++;
      } catch (error) {
        console.error('Sync error for change:', change, error);
      }
    }

    // Clear pending changes
    localStorage.removeItem(`plantao_pending_${agentId}`);

    return { success: true, synced };
  } catch (error) {
    console.error('Sync error:', error);
    return { success: false, synced: 0 };
  }
}

// Queue offline change
export function queueOfflineChange(agentId: string, table: string, action: 'insert' | 'update' | 'delete', data: any): void {
  const key = `plantao_pending_${agentId}`;
  const existing = localStorage.getItem(key);
  const changes = existing ? JSON.parse(existing) : [];
  
  changes.push({ table, action, data, timestamp: Date.now() });
  
  localStorage.setItem(key, JSON.stringify(changes));
}
