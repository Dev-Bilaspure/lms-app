import { Client, Connection } from '@temporalio/client';

async function getTemporalClient(): Promise<Client> {
  const connection =
    process.env.NODE_ENV === 'development'
      ? undefined
      : await Connection.connect({
          address: process.env.TEMPORAL_ADDRESS,
          tls: {
            clientCertPair: {
              crt: Buffer.from(process.env.TEMPORAL_CLOUD_CERT!, 'utf-8'),
              key: Buffer.from(process.env.TEMPORAL_CLOUD_KEY!, 'utf-8'),
            },
          },
        });

  const client =
    process.env.NODE_ENV === 'development'
      ? new Client()
      : new Client({
          connection,
          namespace: process.env.TEMPORAL_NAMESPACE || 'default',
        });

  return client;
}

export default getTemporalClient;
