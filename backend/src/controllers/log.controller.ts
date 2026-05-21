import { Request, Response } from 'express';
import { getLogs, clearLogs, addLog } from '../utils/logger';

export const getLogsJSON = (req: Request, res: Response) => {
  res.json(getLogs());
};

export const clearLogsHandler = (req: Request, res: Response) => {
  clearLogs();
  addLog('INFO', 'Log history cleared by administrator');
  res.json({ success: true, message: 'Logs cleared successfully' });
};

export const getLogsView = (req: Request, res: Response) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cassanova - Backend Log Monitor</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
    body {
      font-family: 'Inter', sans-serif;
    }
    .font-mono-logs {
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            slate: {
              850: '#1e293b',
              950: '#0f172a',
            }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col">

  <!-- Header -->
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center space-x-3">
        <!-- Logo -->
        <span class="text-xl font-bold tracking-tight bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
          Cassanova Engine 🛡️
        </span>
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse">
          Live Monitor
        </span>
      </div>
      
      <div class="flex items-center gap-3">
        <button id="clearBtn" onclick="clearAllLogs()" class="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear History
        </button>
        <button id="testApiBtn" onclick="openTestModal()" class="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-600 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Test API
        </button>
        <button id="refreshBtn" onclick="fetchLogs()" class="px-3.5 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 rounded-lg transition-all shadow-md shadow-blue-900/20 flex items-center gap-1.5">
          <svg id="refreshIcon" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 16.5m-5.49-16.5h5v5" /></svg>
          Refresh Now
        </button>
      </div>
    </div>
  </header>

  <!-- Shell Container -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 flex flex-col gap-6">
    <!-- Controls Section: Filter & Search -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
      <!-- Search Input -->
      <div class="md:col-span-6 relative">
        <label for="searchInput" class="sr-only">Search</label>
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        <input 
          id="searchInput" 
          type="text" 
          placeholder="Search logs (methods, paths, bodies, codes)..." 
          class="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-sm text-slate-100 pl-10 pr-4 py-2.5 outline-none transition-colors"
          oninput="applyFilters()"
        />
      </div>

      <!-- Quick Filter Tags -->
      <div class="md:col-span-6 flex flex-wrap items-center gap-2 md:justify-end">
        <span class="text-xs text-slate-400 font-medium mr-2">Filters:</span>
        <button onclick="setCategoryFilter('ALL')" id="filter-ALL" class="filter-btn px-3 py-1.5 text-xs rounded-full font-medium bg-indigo-500 text-white border border-indigo-400/20 shadow-lg shadow-indigo-500/15">
          All Logs
        </button>
        <button onclick="setCategoryFilter('HTTP')" id="filter-HTTP" class="filter-btn px-3 py-1.5 text-xs rounded-full font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors">
          HTTP
        </button>
        <button onclick="setCategoryFilter('INFO')" id="filter-INFO" class="filter-btn px-3 py-1.5 text-xs rounded-full font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors">
          Info
        </button>
        <button onclick="setCategoryFilter('WARN')" id="filter-WARN" class="filter-btn px-3 py-1.5 text-xs rounded-full font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors">
          Warn
        </button>
        <button onclick="setCategoryFilter('ERROR')" id="filter-ERROR" class="filter-btn px-3 py-1.5 text-xs rounded-full font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors">
          Error
        </button>
      </div>
    </div>

    <!-- Stats Panel -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Cached</div>
        <div id="stat-total" class="text-2xl font-bold mt-1 text-white">0</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">HTTP Requests</div>
        <div id="stat-http" class="text-2xl font-bold mt-1 text-cyan-400">0</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Trouble/Errors</div>
        <div id="stat-errors" class="text-2xl font-bold mt-1 text-red-400">0</div>
      </div>
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div class="text-xs text-slate-400 font-medium uppercase tracking-wider">Database URI</div>
        <div class="text-sm font-semibold mt-2.5 text-orange-400 truncate font-mono-logs">
          Connected
        </div>
      </div>
    </div>

    <!-- Log Table Area -->
    <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col">
      <div class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-850/40 border-b border-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider">
              <th class="py-3.5 px-4 w-40">Timestamp</th>
              <th class="py-3.5 px-4 w-24">Category</th>
              <th class="py-3.5 px-4">Message / Events</th>
              <th class="py-3.5 px-4 w-12 text-right">Details</th>
            </tr>
          </thead>
          <tbody id="logsTableBody" class="divide-y divide-slate-800/60 font-mono-logs text-xs">
            <tr>
              <td colspan="4" class="py-12 text-center text-slate-500">
                <div class="flex flex-col items-center justify-center gap-2">
                  <svg class="w-8 h-8 text-slate-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                  <span>Loading cassanova logs...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-800 py-4 bg-slate-900/40 text-center text-xs text-slate-500">
    Cassanova Server • Running Node.js Environment • In-Memory Buffer Cache
  </footer>

  <!-- Modal -->
  <div id="testApiModal" class="hidden fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div class="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg shadow-2xl">
      <h2 class="text-lg font-semibold text-white mb-4">Test API Configuration</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-xs text-slate-400 mb-1">API Key</label>
          <input type="text" id="apiTestKey" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100" placeholder="Enter API Key">
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1">Webhook URL</label>
          <input type="text" id="apiTestWebhook" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-100" placeholder="Enter Webhook URL">
        </div>
        <div class="flex gap-3 mt-6">
          <button onclick="runTest()" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-semibold">Run Test</button>
          <button onclick="closeTestModal()" class="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-lg text-sm font-semibold">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Scripts -->
  <script>
    function openTestModal() {
      document.getElementById('testApiModal').classList.remove('hidden');
    }
    
    function closeTestModal() {
      document.getElementById('testApiModal').classList.add('hidden');
    }

    function runTest() {
        const key = document.getElementById('apiTestKey').value;
        const webhook = document.getElementById('apiTestWebhook').value;
        alert('Test initiated with Key: ' + key + ' and Webhook: ' + webhook + '. (This is a placeholder action)');
        closeTestModal();
    }
    let allLogs = [];
    let activeFilter = 'ALL';
    let autoRefreshInterval = null;

    async function fetchLogs() {
      const refreshBtn = document.getElementById('refreshBtn');
      const refreshIcon = document.getElementById('refreshIcon');
      
      refreshIcon.classList.add('animate-spin');
      refreshBtn.disabled = true;

      try {
        const res = await fetch('/api/logs');
        if (res.ok) {
          allLogs = await res.json();
          // Sort reverse-chronologically so newest logs are always shown at the top!
          allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          updateStats();
          applyFilters();
        } else {
          console.error('Failed to retrieve logs:', res.statusText);
        }
      } catch (err) {
        console.error('Network error requesting logs:', err);
      } finally {
        setTimeout(() => {
          refreshIcon.classList.remove('animate-spin');
          refreshBtn.disabled = false;
        }, 400);
      }
    }

    function updateStats() {
      const total = allLogs.length;
      const http = allLogs.filter(l => l.category === 'HTTP').length;
      const errors = allLogs.filter(l => l.category === 'ERROR' || (l.statusCode && l.statusCode >= 400)).length;

      document.getElementById('stat-total').innerText = total;
      document.getElementById('stat-http').innerText = http;
      document.getElementById('stat-errors').innerText = errors;
    }

    function setCategoryFilter(category) {
      activeFilter = category;
      
      // Update visual active classes
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.className = 'filter-btn px-3 py-1.5 text-xs rounded-full font-medium bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors';
      });

      const activeBtn = document.getElementById('filter-' + category);
      if (activeBtn) {
        activeBtn.className = 'filter-btn px-3 py-1.5 text-xs rounded-full font-medium bg-indigo-500 text-white border border-indigo-400/20 shadow-lg shadow-indigo-500/15';
      }

      applyFilters();
    }

    function applyFilters() {
      const query = document.getElementById('searchInput').value.toLowerCase().trim();
      const body = document.getElementById('logsTableBody');
      body.innerHTML = '';

      let filtered = allLogs;

      // Category filter
      if (activeFilter !== 'ALL') {
        filtered = filtered.filter(l => l.category === activeFilter);
      }

      // Query filter
      if (query) {
        filtered = filtered.filter(l => {
          const msgMatch = (l.message || '').toLowerCase().includes(query);
          const methodMatch = (l.method || '').toLowerCase().includes(query);
          const urlMatch = (l.url || '').toLowerCase().includes(query);
          const codeMatch = String(l.statusCode || '').includes(query);
          const detailMatch = JSON.stringify(l.details || '').toLowerCase().includes(query);
          return msgMatch || methodMatch || urlMatch || codeMatch || detailMatch;
        });
      }

      if (filtered.length === 0) {
        body.innerHTML = \`
          <tr>
            <td colspan="4" class="py-12 text-center text-slate-500 font-sans">
              No matching log records found in cache.
            </td>
          </tr>
        \`;
        return;
      }

      filtered.forEach(log => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-850/30 transition-colors border-b border-slate-800/40 text-slate-300';
        
        // Timing
        const timingStr = formatTimestamp(log.timestamp);
        
        // Badge color class
        let badgeClass = 'text-slate-400 bg-slate-800/45';
        if (log.category === 'HTTP') badgeClass = 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/30';
        else if (log.category === 'INFO') badgeClass = 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/30';
        else if (log.category === 'WARN') badgeClass = 'text-yellow-400 bg-yellow-950/40 border border-yellow-800/30';
        else if (log.category === 'ERROR' || (log.statusCode && log.statusCode >= 400)) {
          badgeClass = 'text-red-400 bg-red-950/40 border border-red-800/30';
        }

        // Color coding status
        let statusBadge = '';
        if (log.statusCode) {
          const s = log.statusCode;
          const sColor = s >= 500 ? 'text-rose-400' : s >= 400 ? 'text-orange-400' : s >= 300 ? 'text-amber-400' : 'text-emerald-400';
          statusBadge = \`<span class="\${sColor} font-bold mr-1.5">[Status: \${s}]</span>\`;
        }

        // Toggle Details click
        const hasDetails = log.details && Object.keys(log.details).length > 0;
        const detailsButton = hasDetails 
          ? \`<button onclick="toggleRowDetails('\${log.id}')" class="text-indigo-400 hover:text-indigo-300 p-1 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 rounded">
              <svg id="arrow-\${log.id}" class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
             </button>\`
          : '<span class="text-slate-600">-</span>';

        tr.innerHTML = \`
          <td class="py-3 px-4 text-slate-400 whitespace-nowrap font-sans">\${timingStr}</td>
          <td class="py-3 px-4 whitespace-nowrap">
            <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider font-sans \${badgeClass}">
              \${log.category}
            </span>
          </td>
          <td class="py-3 px-4 break-all">
            \${statusBadge}
            <span>\${escapeHtml(log.message)}</span>
          </td>
          <td class="py-3 px-4 text-right">\${detailsButton}</td>
        \`;

        body.appendChild(tr);

        // Append collapsible details row if details exist
        if (hasDetails) {
          const detailTr = document.createElement('tr');
          detailTr.id = 'details-row-' + log.id;
          detailTr.className = 'hidden bg-slate-950/80 border-b border-slate-800/40';
          detailTr.innerHTML = \`
            <td colspan="4" class="p-4">
              <div class="bg-slate-900 border border-slate-800/80 rounded-lg p-3 text-[11px] text-slate-300 overflow-x-auto max-w-full">
                <div class="text-xs font-semibold text-slate-400 mb-2 border-b border-slate-800/60 pb-1.5 flex items-center justify-between">
                  <span>Inspection metadata payload for eventID: \${log.id}</span>
                  <span class="text-[10px] font-normal text-indigo-400">JSON block</span>
                </div>
                <pre class="whitespace-pre-wrap word-break-all text-slate-350">\${escapeHtml(JSON.stringify(log.details, null, 2))}</pre>
              </div>
            </td>
          \`;
          body.appendChild(detailTr);
        }
      });
    }

    function toggleRowDetails(id) {
      const row = document.getElementById('details-row-' + id);
      const arrow = document.getElementById('arrow-' + id);
      if (row.classList.contains('hidden')) {
        row.classList.remove('hidden');
        arrow.classList.add('rotate-180');
      } else {
        row.classList.add('hidden');
        arrow.classList.remove('rotate-180');
      }
    }

    function clearAllLogs() {
      if (!confirm('Are you absolutely sure you want to clear the backend log monitor history?')) return;
      
      fetch('/api/logs', { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            allLogs = [];
            updateStats();
            applyFilters();
          }
        })
        .catch(err => console.error('Error clearing log database:', err));
    }

    function formatTimestamp(isoString) {
      const date = new Date(isoString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Auto-refresh logic (every 2.5 seconds)
    function startAutoPolling() {
      autoRefreshInterval = setInterval(fetchLogs, 2500);
    }

    // Initial load
    fetchLogs();
    startAutoPolling();
  </script>
</body>
</html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
