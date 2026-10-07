'use strict'

const testClient = require('../data/clients/test-client')
const secondClient = require('../data/clients/second-client')

const clients = {
  'test-client': testClient,
  'second-client': secondClient
}

/**
 * Register or update a client at runtime
 */
function registerClient(clientId, clientData) {
  clients[clientId] = {
    id: clientId,
    ...clientData
  }
  return clients[clientId]
}

/**
 * Get client by ID
 */
function getClient(clientId) {
  return clients[clientId] || null
}

/**
 * List all client IDs
 */
function listClientIds() {
  return Object.keys(clients)
}

module.exports = {
  clients,
  registerClient,
  getClient,
  listClientIds
}