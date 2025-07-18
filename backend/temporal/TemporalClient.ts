import { Connection, Client } from '@temporalio/client';

let temporalClient: Client | null = null;


export async function TemporalClient(): Promise<Client> {
  if (temporalClient) return temporalClient;

  const connection = await Connection.connect();
  temporalClient = new Client({ connection });
  return temporalClient;
}




 



