import { Connection, Client } from '@temporalio/client';

let temporalClient: Client | null = null;

export async function TemporalClient(): Promise<Client> {
  if (temporalClient) return temporalClient;

  
  const address = process.env.TEMPORAL_ADDRESS || 'temporal:7233';
  const connection = await Connection.connect({ address });
  temporalClient = new Client({ connection });
  return temporalClient;
}




 



