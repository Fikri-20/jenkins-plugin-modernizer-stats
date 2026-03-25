import { MigrationBreakdownProps } from '../types';

export function MigrationBreakdown({ migrations }: MigrationBreakdownProps) {
  const sortedMigrations = Object.entries(migrations)
    .map(([id, stats]) => ({ id, ...stats }))
    .sort((a, b) => b.total - a.total);

  if (sortedMigrations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Migration Types</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedMigrations.slice(0, 12).map((migration) => {
          const successRate = migration.total > 0 
            ? ((migration.success / migration.total) * 100).toFixed(0)
            : 0;
          
          return (
            <div key={migration.id} className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700 line-clamp-2">
                  {migration.id.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <span className="text-xs font-mono text-slate-500">#{migration.total}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-slate-600">{successRate}%</span>
              </div>
              
              <div className="flex justify-between text-xs text-slate-500">
                <span className="text-green-600">{migration.success} success</span>
                {migration.fail > 0 && (
                  <span className="text-red-600">{migration.fail} failed</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {sortedMigrations.length > 12 && (
        <p className="text-sm text-slate-500 text-center mt-4">
          + {sortedMigrations.length - 12} more migration types
        </p>
      )}
    </div>
  );
}