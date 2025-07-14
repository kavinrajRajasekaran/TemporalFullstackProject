import { Connection, Client } from '@temporalio/client';

let temporalClient: Client | null = null;

export async function getClient(): Promise<Client> {
  if (temporalClient) return temporalClient;
 // Connects to localhost:7233 by default
  const connection = await Connection.connect();
  temporalClient = new Client({ connection });
  return temporalClient;
}



