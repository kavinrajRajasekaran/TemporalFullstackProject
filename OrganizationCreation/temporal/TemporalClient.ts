import { Connection, Client } from '@temporalio/client';

let temporalClient: Client | null = null;

//to get the temporal client
export async function TemporalClient(): Promise<Client> {
  if (temporalClient) return temporalClient;

  const connection = await Connection.connect();
  temporalClient = new Client({ connection });
  return temporalClient;
}




 



