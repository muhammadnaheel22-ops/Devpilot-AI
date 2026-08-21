import { jsPDF } from 'jspdf';
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
export const exportText = (content, filename = 'devpilot-output.txt', type = 'text/plain') =>
  downloadBlob(new Blob([content], { type }), filename);
export const exportJson = (data, filename = 'devpilot-output.json') =>
  exportText(JSON.stringify(data, null, 2), filename, 'application/json');
export const exportPdf = (content, filename = 'devpilot-output.pdf') => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  const lineHeight = 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  const lines = doc.splitTextToSize(content, doc.internal.pageSize.getWidth() - margin * 2);
  const linesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);
  for (let index = 0; index < lines.length; index += linesPerPage) {
    if (index > 0) doc.addPage();
    doc.text(lines.slice(index, index + linesPerPage), margin, margin, {
      lineHeightFactor: 1,
    });
  }
  doc.save(filename);
};
