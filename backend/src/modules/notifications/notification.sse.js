const clientsByUser = new Map();

function writeEvent(res, event, data) {
  if (res.destroyed || res.writableEnded) {
    return false;
  }

  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch (error) {
    return false;
  }
}

function addClient(userId, req, res) {
  const clientId = `${userId}:${Date.now()}:${Math.random()}`;
  const client = { id: clientId, res };
  const userClients = clientsByUser.get(userId) || [];

  userClients.push(client);
  clientsByUser.set(userId, userClients);

  writeEvent(res, "connected", {
    user_id: userId,
    connected: true,
  });

  const heartbeat = setInterval(() => {
    const ok = writeEvent(res, "ping", {
      timestamp: new Date().toISOString(),
    });

    if (!ok) {
      clearInterval(heartbeat);
      removeClient(userId, clientId);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient(userId, clientId);
  });
}

function removeClient(userId, clientId) {
  const userClients = clientsByUser.get(userId) || [];
  const nextClients = userClients.filter((client) => client.id !== clientId);

  if (nextClients.length === 0) {
    clientsByUser.delete(userId);
    return;
  }

  clientsByUser.set(userId, nextClients);
}

function sendToUser(userId, event, data) {
  const userClients = clientsByUser.get(userId) || [];
  let sentCount = 0;
  const nextClients = [];

  for (const client of userClients) {
    if (writeEvent(client.res, event, data)) {
      nextClients.push(client);
      sentCount += 1;
    }
  }

  if (nextClients.length === 0) {
    clientsByUser.delete(userId);
  } else {
    clientsByUser.set(userId, nextClients);
  }

  return sentCount;
}

function getOnlineUserIds() {
  return Array.from(clientsByUser.keys());
}

module.exports = {
  addClient,
  sendToUser,
  getOnlineUserIds,
};
