// invite.ts
import { parse } from 'csv-parse/sync';
import { sendInvitation } from './email';
import { db } from './db';

export async function inviteSuppliers(file) {
  const csvData = await file.text();
  const records = parse(csvData, { columns: true });
  const results = [];

  for (const record of records) {
    const { email, name } = record;
    const result = await sendInvitation(email, name);
    results.push({ email, status: result ? 'sent' : 'failed' });
    // Store invitation status in the database
    await db.run('INSERT INTO invitations (email, status) VALUES (?, ?)', [email, result ? 'sent' : 'failed']);
  }
  return results;
}
