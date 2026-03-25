import { PluginSummary } from '../types';

interface PluginTableProps {
  plugins: PluginSummary[];
  limit?: number;
}

const statusStyles = {
  healthy: 'bg-green-100 text-green-800',
  'needs-attention': 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
};

const statusLabels = {
  healthy: 'Healthy',
  'needs-attention': 'Needs Attention',
  critical: 'Critical',
};

export function PluginTable({ plugins, limit = 20 }: PluginTableProps) {
  const displayPlugins = plugins.slice(0, limit);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Plugins Overview</h2>
        <p className="text-sm text-slate-500 mt-1">
          Showing {displayPlugins.length} of {plugins.length} plugins
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Plugin Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Migrations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Success
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                PRs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {displayPlugins.map((plugin) => (
              <tr key={plugin.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900 font-mono">
                    {plugin.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[plugin.status]}`}>
                    {statusLabels[plugin.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                  {plugin.totalMigrations}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-slate-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ 
                          width: `${plugin.totalMigrations > 0 
                            ? (plugin.successfulMigrations / plugin.totalMigrations) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 font-mono">
                      {plugin.successfulMigrations}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  <span className="text-green-600 font-mono">{plugin.mergedPRs}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-orange-600 font-mono">{plugin.openPRs}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {plugin.lastMigration ? (
                    <span className="font-mono text-xs">
                      {new Date(plugin.lastMigration).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {plugins.length > limit && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center">
            + {plugins.length - limit} more plugins
          </p>
        </div>
      )}
    </div>
  );
}