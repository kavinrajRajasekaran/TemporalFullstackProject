import { Connection, Client } from '@temporalio/client';
import { ManagementClient } from 'auth0';
let temporalClient: Client | null = null;

export async function getClient(): Promise<Client> {
  if (temporalClient) return temporalClient;
 // Connects to localhost:7233 by default
  const connection = await Connection.connect();
  temporalClient = new Client({ connection });
  return temporalClient;
}

// let AuthClient:ManagementClient|null=null;

//  export async function getClientAuth() {
//   if(AuthClient)return AuthClient
  
//   const management = new ManagementClient({
//     clientId: process.env.AUTH0_CLIENT_ID!,
//     clientSecret: process.env.AUTH0_CLIENT_SECRET!,
//     domain: process.env.AUTH0_DOMAIN!,
//   });
//   return AuthClient


// }


 export async function deleter(id:string){
const management = new ManagementClient({
  clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    domain: process.env.AUTH0_DOMAIN!,
});

const result = await management.organizations.delete({
  id:id
});

}

export async function getAll(){
  const management = new ManagementClient({
   clientId: process.env.AUTH0_CLIENT_ID!,
    clientSecret: process.env.AUTH0_CLIENT_SECRET!,
    domain: process.env.AUTH0_DOMAIN!,
});

const result = await management.organizations.getAll();
return result
}

