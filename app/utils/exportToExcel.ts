import * as XLSX from 'xlsx';

export interface ExpenseExportData {
  account: string;
  category: string;
  currency: string;
  amount: number;
  ref_currency_amount: number;
  type: string;
  payment_type: string;
  note: string;
  date: string;
  transfer: string;
  payee: string;
  labels: string;
}

export function exportExpensesToExcel(
  expenses: any[], 
  filename: string = 'gastos.xlsx',
  onExportComplete?: (expenseIds: number[]) => void
) {
  // Transform expenses data to match the required columns
  const exportData: ExpenseExportData[] = expenses.map(expense => {
    // Combine product name with expense notes
    const productName = expense.item?.name || '';
    const expenseNotes = expense.notes || '';
    const combinedNote = expenseNotes 
      ? `${productName} - ${expenseNotes}` 
      : productName;

    return {
      account: 'Casa', // Always "Casa" as specified
      category: 'Maintenance, repairs', // Always "Maintenance, repairs" as specified
      currency: 'CLP',
      amount: (expense.item?.unitPrice || 0) * (expense.quantity || 0),
      ref_currency_amount: (expense.item?.unitPrice || 0) * (expense.quantity || 0),
      type: 'Gasto',
      payment_type: expense.paid ? 'Pagado' : 'Pendiente',
      note: combinedNote,
      date: expense.date || '',
      transfer: '',
      payee: expense.paidBy || '',
      labels: `Piso ${expense.floor || 0}`,
    };
  });

  // Create worksheet from data
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 15 }, // account
    { wch: 20 }, // category
    { wch: 10 }, // currency
    { wch: 12 }, // amount
    { wch: 18 }, // ref_currency_amount
    { wch: 10 }, // type
    { wch: 15 }, // payment_type
    { wch: 50 }, // note (wider for product name + notes)
    { wch: 12 }, // date
    { wch: 10 }, // transfer
    { wch: 15 }, // payee
    { wch: 15 }, // labels
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Gastos');

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, filename);

  // Call callback with exported expense IDs
  if (onExportComplete) {
    const expenseIds = expenses.map(e => e.id).filter(id => id != null);
    onExportComplete(expenseIds);
  }
}
