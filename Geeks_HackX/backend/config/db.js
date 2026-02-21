const mongoose = require('mongoose');
const dns = require('dns');

const buildConnectOptions = () => {
  const family = Number(process.env.MONGO_DNS_FAMILY || 4);
  return {
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000),
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 10),
    // Only pass `family` if it is a valid value (4 = IPv4, 6 = IPv6)
    ...(family === 4 || family === 6 ? { family } : { family: 4 }),
  };
};

const connectWithUri = async (uri) => {
  const conn = await mongoose.connect(uri, buildConnectOptions());
  console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
};

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = process.env.MONGO_URI_FALLBACK;
  const dnsServers = process.env.MONGO_DNS_SERVERS;

  if (!primaryUri) {
    console.error('[DB] Connection failed: MONGO_URI is not set');
    process.exit(1);
  }

  if (dnsServers) {
    try {
      const servers = dnsServers.split(',').map((server) => server.trim()).filter(Boolean);
      if (servers.length) {
        dns.setServers(servers);
        console.log(`[DB] Using custom DNS servers: ${servers.join(', ')}`);
      }
    } catch (err) {
      console.warn(`[DB] Failed to set custom DNS servers: ${err.message}`);
    }
  }

  try {
    await connectWithUri(primaryUri);
  } catch (err) {
    const isSrvDnsFailure = /querySrv\s+ECONNREFUSED/i.test(err.message || '');

    if (isSrvDnsFailure && fallbackUri) {
      console.warn('[DB] SRV lookup failed. Retrying with MONGO_URI_FALLBACK...');
      try {
        await connectWithUri(fallbackUri);
        return;
      } catch (fallbackErr) {
        console.error(`[DB] Fallback connection failed: ${fallbackErr.message}`);
        process.exit(1);
      }
    }

    console.error(`[DB] Connection failed: ${err.message}`);

    if (isSrvDnsFailure) {
      console.error('[DB] Tip: Set MONGO_DNS_SERVERS=8.8.8.8,1.1.1.1 or provide MONGO_URI_FALLBACK (non-SRV URI).');
    }

    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () =>
  console.warn('[DB] MongoDB disconnected')
);

module.exports = connectDB;
