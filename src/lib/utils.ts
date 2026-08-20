import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatMbps(mbps: number, decimals = 1) {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(decimals)} Gbps`;
  }
  if (mbps >= 1) {
    return `${mbps.toFixed(decimals)} Mbps`;
  }
  if (mbps >= 0.001) {
    return `${(mbps * 1000).toFixed(decimals)} kbps`;
  }
  if (mbps > 0) {
    return `${Math.round(mbps * 1000000)} bps`;
  }
  return '0 bps';
}

export function formatThroughput(
  rateInMbps: number,
  mode: 'auto' | 'mbps' | 'kbps' | 'bps' = 'auto',
  decimals = 1
): string {
  if (!rateInMbps || rateInMbps === 0) return '0 bps';

  const bps = rateInMbps * 1000 * 1000;
  const kbps = rateInMbps * 1000;

  if (mode === 'bps') {
    return `${Math.round(bps).toLocaleString()} bps`;
  }
  if (mode === 'kbps') {
    return `${kbps.toFixed(decimals)} kbps`;
  }
  if (mode === 'mbps') {
    return `${rateInMbps.toFixed(decimals)} Mbps`;
  }

  // Auto format (Like Winbox: bps / kbps / Mbps / Gbps)
  if (rateInMbps >= 1000) {
    return `${(rateInMbps / 1000).toFixed(decimals)} Gbps`;
  }
  if (rateInMbps >= 1) {
    return `${rateInMbps.toFixed(decimals)} Mbps`;
  }
  if (rateInMbps >= 0.001) {
    return `${kbps.toFixed(decimals)} kbps`;
  }
  return `${Math.round(bps)} bps`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  if (d > 0) return `${d}h ${h}j ${m}m`;
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatTimeAgo(isoString: string): string {
  try {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)} detik lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  } catch {
    return isoString;
  }
}

export function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
