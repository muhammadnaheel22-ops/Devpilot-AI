import { jsPDF } from 'jspdf';
const downloadBlob = (blob, filename) => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); };
export const exportText = (content, filename = 'devpilot-output.txt', type = 'text/plain') => downloadBlob(new Blob([content], { type }), filename);
export const exportJson = (data, filename = 'devpilot-output.json') => exportText(JSON.stringify(data, null, 2), filename, 'application/json');
export const exportPdf = (content, filename = 'devpilot-output.pdf') => { const doc = new jsPDF({ unit: 'pt', format: 'a4' }); const lines = doc.splitTextToSize(content, 515); doc.text(lines, 40, 50); doc.save(filename); };
