import * as XLSX from "xlsx";

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  
  // Extract headers
  const headers = Object.keys(flattenObject(data[0]));
  
  // Create rows
  const rows = data.map(item => {
    const flatItem = flattenObject(item);
    return headers.map(header => {
      let cell = flatItem[header];
      if (cell === null || cell === undefined) cell = "";
      // Escape quotes
      const cellString = String(cell).replace(/"/g, '""');
      return `"${cellString}"`;
    }).join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: any[], filename: string) {
  if (!data || data.length === 0) return;

  // Flatten nested objects (like relations: department.name)
  const flattenedData = data.map(item => flattenObject(item));
  
  const worksheet = XLSX.utils.json_to_sheet(flattenedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

// Helper to flatten nested JSON relations into flat column names (e.g. { worker: { name: 'John' } } -> { "worker.name": 'John' })
function flattenObject(ob: any): any {
  let toReturn: any = {};
  for (let i in ob) {
    if (!ob.hasOwnProperty(i)) continue;

    // Ignore arrays (like nested lists) for flat reports
    if (Array.isArray(ob[i])) {
      continue;
    }

    if (typeof ob[i] == 'object' && ob[i] !== null && !(ob[i] instanceof Date)) {
      let flatObject = flattenObject(ob[i]);
      for (let x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;
        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}
