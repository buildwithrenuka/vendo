// invites.ts
import { Hono } from 'hono';
import { inviteSuppliers } from '../lib/invite';

const app = new Hono();

app.post('/invites', async (c) => {
  const csvFile = c.req.file('file');
  if (!csvFile) {
    return c.text('No file uploaded', 400);
  }
  const result = await inviteSuppliers(csvFile);
  return c.json(result);
});

export default app;
