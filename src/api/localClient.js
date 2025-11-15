/**
 * Local Storage Client - 100% Free, No Backend Required!
 * Uses IndexedDB (via localForage) + LocalStorage for a complete local-first app
 */

import localforage from 'localforage';

// Configure localForage
localforage.config({
  name: 'ShiftWise',
  version: 1.0,
  storeName: 'shiftwise_store',
  description: 'ShiftWise local database'
});

// Create separate stores for each entity type
const createStore = (name) => {
  return localforage.createInstance({
    name: 'ShiftWise',
    storeName: name
  });
};

// Entity stores
export const stores = {
  employees: createStore('employees'),
  shifts: createStore('shifts'),
  organizations: createStore('organizations'),
  job_roles: createStore('job_roles'),
  employee_constraints: createStore('employee_constraints'),
  sms_automations: createStore('sms_automations'),
  subscriptions: createStore('subscriptions'),
  payments: createStore('payments'),
  users: createStore('users'),
  sessions: createStore('sessions')
};

/**
 * Generate a unique ID
 */
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all keys from a store
 */
export async function getAllKeys(store) {
  return await store.keys();
}

/**
 * Get all items from a store
 */
export async function getAllItems(store) {
  const keys = await store.keys();
  const items = await Promise.all(
    keys.map(key => store.getItem(key))
  );
  return items.filter(item => item !== null);
}

/**
 * Clear all data (for development/testing)
 */
export async function clearAllData() {
  const storeNames = Object.keys(stores);
  await Promise.all(
    storeNames.map(name => stores[name].clear())
  );
  console.log('All local data cleared');
}

/**
 * Initialize default data
 */
export async function initializeDefaultData() {
  try {
    // Check if organization already exists
    const existingOrgs = await getAllItems(stores.organizations);

    if (existingOrgs.length === 0) {
      // Create default organization
      const defaultOrg = {
        id: generateId(),
        name: 'החברה שלי',
        created_at: new Date().toISOString(),
        timezone: 'Asia/Jerusalem',
        currency: 'ILS'
      };
      await stores.organizations.setItem(defaultOrg.id, defaultOrg);
      console.log('Created default organization:', defaultOrg.name);

      // Create default job roles
      const defaultRoles = [
        { id: generateId(), name: 'מנהל', organization_id: defaultOrg.id, created_at: new Date().toISOString() },
        { id: generateId(), name: 'טבח', organization_id: defaultOrg.id, created_at: new Date().toISOString() },
        { id: generateId(), name: 'מלצר', organization_id: defaultOrg.id, created_at: new Date().toISOString() },
        { id: generateId(), name: 'קופאי', organization_id: defaultOrg.id, created_at: new Date().toISOString() },
        { id: generateId(), name: 'ניקיון', organization_id: defaultOrg.id, created_at: new Date().toISOString() }
      ];

      for (const role of defaultRoles) {
        await stores.job_roles.setItem(role.id, role);
      }
      console.log('Created default job roles');
    }

    // Check if demo user exists
    const existingUsers = await getAllItems(stores.users);
    if (existingUsers.length === 0) {
      const demoUser = {
        id: generateId(),
        email: 'demo@shiftwise.local',
        full_name: 'משתמש דמו',
        role: 'admin',
        created_at: new Date().toISOString(),
        // Note: In a real app, you'd hash this password
        password: 'demo123'
      };
      await stores.users.setItem(demoUser.id, demoUser);
      console.log('Created demo user: demo@shiftwise.local / demo123');
    }

    return true;
  } catch (error) {
    console.error('Error initializing default data:', error);
    return false;
  }
}

// Auto-initialize on first load
let initialized = false;
export async function ensureInitialized() {
  if (!initialized) {
    await initializeDefaultData();
    initialized = true;
  }
}

// Session management
export async function saveSession(user) {
  const session = {
    user,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  };
  await stores.sessions.setItem('current_session', session);
  return session;
}

export async function getSession() {
  const session = await stores.sessions.getItem('current_session');
  if (!session) return null;

  // Check if expired
  if (session.expiresAt < Date.now()) {
    await stores.sessions.removeItem('current_session');
    return null;
  }

  return session;
}

export async function clearSession() {
  await stores.sessions.removeItem('current_session');
}

// Export default client object
export default {
  stores,
  generateId,
  getAllKeys,
  getAllItems,
  clearAllData,
  initializeDefaultData,
  ensureInitialized,
  saveSession,
  getSession,
  clearSession
};
