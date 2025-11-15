/**
 * Base Entity class for Local Storage operations
 * Provides a unified interface using IndexedDB via localForage
 */

import { stores, generateId, getAllItems, ensureInitialized } from './localClient';

export class BaseEntity {
  constructor(tableName) {
    this.tableName = tableName;
    this.store = stores[tableName];

    if (!this.store) {
      console.warn(`Store not found for table: ${tableName}`);
    }
  }

  /**
   * List all records with optional sorting
   * @param {string} orderBy - Column to order by (prefix with - for descending)
   * @returns {Promise<Array>}
   */
  async list(orderBy = null) {
    try {
      await ensureInitialized();
      const items = await getAllItems(this.store);

      if (orderBy) {
        const descending = orderBy.startsWith('-');
        const column = descending ? orderBy.slice(1) : orderBy;

        items.sort((a, b) => {
          const aVal = a[column];
          const bVal = b[column];

          if (aVal === bVal) return 0;
          const comparison = aVal > bVal ? 1 : -1;
          return descending ? -comparison : comparison;
        });
      }

      return items;
    } catch (error) {
      console.error(`Error listing ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Filter records with conditions
   * @param {Object} filters - Filter conditions
   * @param {string} orderBy - Optional ordering
   * @returns {Promise<Array>}
   */
  async filter(filters = {}, orderBy = null) {
    try {
      await ensureInitialized();
      let items = await getAllItems(this.store);

      // Apply filters
      items = items.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === null || value === undefined) return true;
          return item[key] === value;
        });
      });

      // Apply ordering
      if (orderBy) {
        const descending = orderBy.startsWith('-');
        const column = descending ? orderBy.slice(1) : orderBy;

        items.sort((a, b) => {
          const aVal = a[column];
          const bVal = b[column];

          if (aVal === bVal) return 0;
          const comparison = aVal > bVal ? 1 : -1;
          return descending ? -comparison : comparison;
        });
      }

      return items;
    } catch (error) {
      console.error(`Error filtering ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get a single record by ID
   * @param {string} id - Record ID
   * @returns {Promise<Object>}
   */
  async get(id) {
    try {
      await ensureInitialized();
      const item = await this.store.getItem(id);
      return item;
    } catch (error) {
      console.error(`Error getting ${this.tableName} by ID:`, error);
      throw error;
    }
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      await ensureInitialized();

      const id = data.id || generateId();
      const now = new Date().toISOString();

      const record = {
        ...data,
        id,
        created_at: data.created_at || now,
        updated_at: now
      };

      await this.store.setItem(id, record);
      return record;
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Bulk create multiple records
   * @param {Array<Object>} records - Array of records to create
   * @returns {Promise<Array>}
   */
  async bulkCreate(records) {
    try {
      await ensureInitialized();

      const createdRecords = await Promise.all(
        records.map(record => this.create(record))
      );

      return createdRecords;
    } catch (error) {
      console.error(`Error bulk creating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update a record by ID
   * @param {string} id - Record ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>}
   */
  async update(id, updates) {
    try {
      await ensureInitialized();

      const existing = await this.store.getItem(id);
      if (!existing) {
        throw new Error(`Record not found: ${id}`);
      }

      const updated = {
        ...existing,
        ...updates,
        id, // Preserve ID
        created_at: existing.created_at, // Preserve creation date
        updated_at: new Date().toISOString()
      };

      await this.store.setItem(id, updated);
      return updated;
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a record by ID
   * @param {string} id - Record ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      await ensureInitialized();
      await this.store.removeItem(id);
      return true;
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Count records with optional filters
   * @param {Object} filters - Filter conditions
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    try {
      const items = await this.filter(filters);
      return items.length;
    } catch (error) {
      console.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }
}

export default BaseEntity;
