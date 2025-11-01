import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Play, RotateCcw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Migration {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  executedAt: string | null;
  rolledBackAt: string | null;
  error: string | null;
}

export const MigrationRunner: React.FC = () => {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMigrations();
  }, []);

  const fetchMigrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/migrations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch migrations');

      const data = await response.json();
      setMigrations(data.migrations);
    } catch (error) {
      toast.error('Failed to load migrations');
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async (migrationName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/migrations/run`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ migrationName })
        }
      );

      if (!response.ok) throw new Error('Migration failed');

      toast.success('Migration completed successfully!');
      fetchMigrations();
    } catch (error) {
      toast.error('Migration failed. Check logs for details.');
    }
  };

  const rollbackMigration = async (migrationName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/migrations/rollback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ migrationName })
        }
      );

      if (!response.ok) throw new Error('Rollback failed');

      toast.success('Migration rolled back successfully!');
      fetchMigrations();
    } catch (error) {
      toast.error('Rollback failed. Check logs for details.');
    }
  };

  const getStatusBadge = (status: Migration['status']) => {
    const variants: Record<Migration['status'], { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { icon: <Clock className='h-3 w-3' />, variant: 'outline' },
      running: { icon: <Play className='h-3 w-3' />, variant: 'default' },
      completed: { icon: <CheckCircle className='h-3 w-3' />, variant: 'default' },
      failed: { icon: <XCircle className='h-3 w-3' />, variant: 'destructive' },
      rolled_back: { icon: <RotateCcw className='h-3 w-3' />, variant: 'secondary' }
    };

    const { icon, variant } = variants[status];

    return (
      <Badge variant={variant} className='flex items-center gap-1'>
        {icon}
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return <div>Loading migrations...</div>;
  }

  return (
    <div className='container mx-auto p-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Database className='h-6 w-6' />
            Database Migration Runner
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {migrations.length === 0 ? (
            <div className='text-center p-8 text-muted-foreground'>
              No migrations found
            </div>
          ) : (
            migrations.map(migration => (
              <div
                key={migration.id}
                className='border rounded-lg p-4 space-y-3'
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <h3 className='font-semibold'>{migration.name}</h3>
                    {migration.description && (
                      <p className='text-sm text-muted-foreground'>
                        {migration.description}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(migration.status)}
                </div>

                {migration.executedAt && (
                  <p className='text-xs text-muted-foreground'>
                    Executed: {new Date(migration.executedAt).toLocaleString()}
                  </p>
                )}

                {migration.error && (
                  <div className='flex items-start gap-2 p-2 bg-destructive/10 rounded'>
                    <AlertCircle className='h-4 w-4 text-destructive mt-0.5' />
                    <p className='text-sm text-destructive'>{migration.error}</p>
                  </div>
                )}

                <div className='flex gap-2'>
                  {migration.status === 'pending' && (
                    <Button
                      size='sm'
                      onClick={() => runMigration(migration.name)}
                    >
                      <Play className='h-4 w-4 mr-2' />
                      Run Migration
                    </Button>
                  )}

                  {migration.status === 'completed' && (
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => rollbackMigration(migration.name)}
                    >
                      <RotateCcw className='h-4 w-4 mr-2' />
                      Rollback
                    </Button>
                  )}

                  {migration.status === 'failed' && (
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => runMigration(migration.name)}
                    >
                      <Play className='h-4 w-4 mr-2' />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
