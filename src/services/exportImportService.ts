import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { db } from '../database/db';
import { Member, Payment, BackupData, ImportSummary, GymSettings } from '../types';

/**
 * EXPORT FUNCTIONS
 */

export async function exportAllJSON(settings: GymSettings): Promise<string> {
  const members = await db.members.toArray();
  const payments = await db.payments.toArray();
  const expenses = await db.expenses.toArray();

  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings,
    members,
    payments,
    expenses,
  };

  return JSON.stringify(backup, null, 2);
}

export async function exportToExcel(): Promise<Blob> {
  const members = await db.members.toArray();
  const payments = await db.payments.toArray();

  const wb = XLSX.utils.book_new();

  // Members Sheet
  const memberSheet = XLSX.utils.json_to_sheet(
    members.map(m => ({
      ID: m.id,
      'Member ID': m.memberId,
      Name: m.name,
      Phone: m.phone,
      Address: m.address,
      'Joining Date': m.joiningDate,
      'Monthly Fee': m.monthlyFee,
      'Weight (kg)': m.weight,
      'Height (cm)': m.height,
      Gender: m.gender,
      'DOB': m.dob || '',
      'Emergency Contact': m.emergencyContact || '',
      Status: m.status,
      Notes: m.notes || '',
    }))
  );
  XLSX.utils.book_append_sheet(wb, memberSheet, 'Members');

  // Payments Sheet
  const paymentSheet = XLSX.utils.json_to_sheet(
    payments.map(p => ({
      'Payment ID': p.id,
      'Member ID': p.memberId,
      Month: p.month,
      Year: p.year,
      'Monthly Fee': p.monthlyFee,
      'Collected Amount': p.collectedAmount,
      'Remaining Due': p.remainingDue,
      Status: p.status,
      'Payment Date': p.paymentDate || '',
      'Payment Method': p.paymentMethod,
      Notes: p.notes || '',
    }))
  );
  XLSX.utils.book_append_sheet(wb, paymentSheet, 'Payments');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function exportMembersCSV(): Promise<string> {
  const members = await db.members.toArray();
  return Papa.unparse(members);
}

export async function exportPaymentsCSV(): Promise<string> {
  const payments = await db.payments.toArray();
  return Papa.unparse(payments);
}

export async function exportToXML(settings: GymSettings): Promise<string> {
  const members = await db.members.toArray();
  const payments = await db.payments.toArray();

  const escapeXml = (str: any) =>
    String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<GymBackup>\n';
  xml += `  <ExportedAt>${new Date().toISOString()}</ExportedAt>\n`;
  xml += `  <GymName>${escapeXml(settings.gymName)}</GymName>\n`;

  xml += '  <Members>\n';
  for (const m of members) {
    xml += '    <Member>\n';
    xml += `      <Id>${m.id}</Id>\n`;
    xml += `      <MemberId>${m.memberId}</MemberId>\n`;
    xml += `      <Name>${escapeXml(m.name)}</Name>\n`;
    xml += `      <Phone>${escapeXml(m.phone)}</Phone>\n`;
    xml += `      <Address>${escapeXml(m.address)}</Address>\n`;
    xml += `      <JoiningDate>${m.joiningDate}</JoiningDate>\n`;
    xml += `      <MonthlyFee>${m.monthlyFee}</MonthlyFee>\n`;
    xml += `      <Weight>${m.weight}</Weight>\n`;
    xml += `      <Height>${m.height}</Height>\n`;
    xml += `      <Gender>${m.gender}</Gender>\n`;
    xml += `      <Status>${m.status}</Status>\n`;
    xml += `      <Notes>${escapeXml(m.notes)}</Notes>\n`;
    xml += '    </Member>\n';
  }
  xml += '  </Members>\n';

  xml += '  <Payments>\n';
  for (const p of payments) {
    xml += '    <Payment>\n';
    xml += `      <Id>${p.id}</Id>\n`;
    xml += `      <MemberId>${p.memberId}</MemberId>\n`;
    xml += `      <Month>${p.month}</Month>\n`;
    xml += `      <Year>${p.year}</Year>\n`;
    xml += `      <MonthlyFee>${p.monthlyFee}</MonthlyFee>\n`;
    xml += `      <CollectedAmount>${p.collectedAmount}</CollectedAmount>\n`;
    xml += `      <RemainingDue>${p.remainingDue}</RemainingDue>\n`;
    xml += `      <Status>${p.status}</Status>\n`;
    xml += `      <PaymentDate>${p.paymentDate || ''}</PaymentDate>\n`;
    xml += `      <PaymentMethod>${p.paymentMethod}</PaymentMethod>\n`;
    xml += `      <Notes>${escapeXml(p.notes)}</Notes>\n`;
    xml += '    </Payment>\n';
  }
  xml += '  </Payments>\n';

  xml += '</GymBackup>';
  return xml;
}

/**
 * IMPORT FUNCTIONS
 */

export async function importFromJSON(
  jsonContent: string,
  mode: 'merge' | 'replace'
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    importedMembersCount: 0,
    importedPaymentsCount: 0,
    skippedMembersCount: 0,
    skippedPaymentsCount: 0,
    errors: [],
  };

  try {
    const data: BackupData = JSON.parse(jsonContent);

    if (!data.members || !Array.isArray(data.members)) {
      summary.errors.push('Invalid JSON format: missing members array.');
      return summary;
    }

    if (mode === 'replace') {
      await db.members.clear();
      await db.payments.clear();
      await db.expenses.clear();
    }

    const existingMembers = new Set((await db.members.toArray()).map(m => m.id));
    const existingPayments = new Set((await db.payments.toArray()).map(p => p.id));
    const existingExpenses = new Set((await db.expenses.toArray()).map(e => e.id));

    // Import Members
    for (const m of data.members) {
      if (!m.id || !m.name || !m.memberId) {
        summary.skippedMembersCount++;
        continue;
      }

      if (existingMembers.has(m.id)) {
        if (mode === 'merge') {
          await db.members.put(m);
          summary.importedMembersCount++;
        } else {
          summary.skippedMembersCount++;
        }
      } else {
        await db.members.add(m);
        summary.importedMembersCount++;
      }
    }

    // Import Payments
    if (data.payments && Array.isArray(data.payments)) {
      for (const p of data.payments) {
        if (!p.id || !p.memberId) {
          summary.skippedPaymentsCount++;
          continue;
        }

        if (existingPayments.has(p.id)) {
          if (mode === 'merge') {
            await db.payments.put(p);
            summary.importedPaymentsCount++;
          } else {
            summary.skippedPaymentsCount++;
          }
        } else {
          await db.payments.add(p);
          summary.importedPaymentsCount++;
        }
      }
    }

    // Import Expenses
    if (data.expenses && Array.isArray(data.expenses)) {
      for (const e of data.expenses) {
        if (!e.id || !e.amount) continue;

        if (existingExpenses.has(e.id)) {
          if (mode === 'merge') {
            await db.expenses.put(e);
          }
        } else {
          await db.expenses.add(e);
        }
      }
    }
  } catch (err: any) {
    summary.errors.push(`JSON Parse Error: ${err?.message || 'Unknown error'}`);
  }

  return summary;
}

export async function importFromExcel(
  fileBuffer: ArrayBuffer,
  mode: 'merge' | 'replace'
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    importedMembersCount: 0,
    importedPaymentsCount: 0,
    skippedMembersCount: 0,
    skippedPaymentsCount: 0,
    errors: [],
  };

  try {
    const wb = XLSX.read(fileBuffer, { type: 'array' });

    if (mode === 'replace') {
      await db.members.clear();
      await db.payments.clear();
    }

    // Process Members sheet
    const memberSheet = wb.Sheets['Members'] || wb.Sheets[wb.SheetNames[0]];
    if (memberSheet) {
      const rows: any[] = XLSX.utils.sheet_to_json(memberSheet);
      for (const row of rows) {
        const id = row.ID || row.id || `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        const memberId = row['Member ID'] || row.memberId || `GYM-${Math.floor(1000 + Math.random() * 9000)}`;
        const name = row.Name || row.name;

        if (!name) {
          summary.skippedMembersCount++;
          continue;
        }

        const member: Member = {
          id,
          memberId,
          name,
          phone: String(row.Phone || row.phone || ''),
          address: String(row.Address || row.address || ''),
          joiningDate: row['Joining Date'] || row.joiningDate || new Date().toISOString().split('T')[0],
          monthlyFee: Number(row['Monthly Fee'] || row.monthlyFee || 1000),
          weight: Number(row['Weight (kg)'] || row.weight || 70),
          height: Number(row['Height (cm)'] || row.height || 170),
          gender: (row.Gender || row.gender || 'male').toLowerCase() as any,
          dob: row.DOB || row.dob || '',
          emergencyContact: row['Emergency Contact'] || row.emergencyContact || '',
          notes: row.Notes || row.notes || '',
          status: ((row.Status || row.status || 'active').toLowerCase() === 'inactive' ? 'inactive' : 'active') as any,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.members.put(member);
        summary.importedMembersCount++;
      }
    }

    // Process Payments sheet
    const paymentSheet = wb.Sheets['Payments'];
    if (paymentSheet) {
      const rows: any[] = XLSX.utils.sheet_to_json(paymentSheet);
      for (const row of rows) {
        const id = row['Payment ID'] || row.id || `PAY-${row.memberId}-${row.Year || 2026}-${row.Month || 1}`;
        const memberId = row['Member ID'] || row.memberId;

        if (!memberId) {
          summary.skippedPaymentsCount++;
          continue;
        }

        const monthlyFee = Number(row['Monthly Fee'] || row.monthlyFee || 1000);
        const collectedAmount = Number(row['Collected Amount'] || row.collectedAmount || 0);

        const payment: Payment = {
          id,
          memberId,
          month: Number(row.Month || row.month || 1),
          year: Number(row.Year || row.year || 2026),
          monthlyFee,
          collectedAmount,
          remainingDue: monthlyFee - collectedAmount,
          status: (row.Status || row.status || (collectedAmount >= monthlyFee ? 'Paid' : collectedAmount > 0 ? 'Partial' : 'Unpaid')) as any,
          paymentDate: row['Payment Date'] || row.paymentDate || '',
          paymentMethod: row['Payment Method'] || row.paymentMethod || 'Cash',
          notes: row.Notes || row.notes || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await db.payments.put(payment);
        summary.importedPaymentsCount++;
      }
    }
  } catch (err: any) {
    summary.errors.push(`Excel Parse Error: ${err?.message || 'Failed to read file'}`);
  }

  return summary;
}
