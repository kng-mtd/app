// CRUD for Object
// This is a simple key-value store class that allows you to perform CRUD operations on indexDB.

import { openDB } from "https://cdn.jsdelivr.net/npm/idb@7/+esm";

export class KVStoreIDB {
  constructor(dbName = "kv-db", storeName = "kv-store") {
    this.dbName = dbName;
    this.storeName = storeName;
    this.dbPromise = this.initDB();
  }

  async initDB() {
    return openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("kv-store")) {
          db.createObjectStore("kv-store");
        }
      },
    });
  }

  async set(key, value) {
    const db = await this.dbPromise;
    await db.put(this.storeName, value, key);
  }

  async get(key) {
    const db = await this.dbPromise;
    const value = await db.get(this.storeName, key);
    return value === undefined ? null : value;
  }

  async delete(key) {
    const db = await this.dbPromise;
    const hasKey = await this.has(key);
    if (hasKey) {
      await db.delete(this.storeName, key);
      return true;
    }
    return false;
  }

  async has(key) {
    const db = await this.dbPromise;
    const value = await db.get(this.storeName, key);
    return value !== undefined;
  }

  async list() {
    const db = await this.dbPromise;
    return db.getAllKeys(this.storeName);
  }

  async findKeysByValueField(fieldName) {
    const db = await this.dbPromise;
    const allKeys = await db.getAllKeys(this.storeName);
    const result = [];
    for (const key of allKeys) {
      const value = await db.get(this.storeName, key);
      if (typeof value === "object" && value !== null && fieldName in value) {
        result.push(key);
      }
    }
    return result;
  }

  async getKeyValueMapByField(fieldName) {
    const db = await this.dbPromise;
    const allKeys = await db.getAllKeys(this.storeName);
    const result = {};
    for (const key of allKeys) {
      const value = await db.get(this.storeName, key);
      if (typeof value === "object" && value !== null && fieldName in value) {
        result[key] = value[fieldName];
      }
    }
    return result;
  }

  async findKeysBySubstringInValue(substring, { caseSensitive = false } = {}) {
    const db = await this.dbPromise;
    const allKeys = await db.getAllKeys(this.storeName);
    const result = [];
    for (const key of allKeys) {
      const value = await db.get(this.storeName, key);
      if (typeof value === "string") {
        const haystack = caseSensitive ? value : value.toLowerCase();
        const needle = caseSensitive ? substring : substring.toLowerCase();
        if (haystack.includes(needle)) {
          result.push(key);
        }
      }
    }
    return result;
  }

  async clear() {
    const db = await this.dbPromise;
    await db.clear(this.storeName);
  }

  async getAll() {
    const db = await this.dbPromise;
    const keys = await db.getAllKeys(this.storeName);
    const result = {};
    for (const key of keys) {
      result[key] = await db.get(this.storeName, key);
    }
    return result;
  }

  async getAllDeep() {
    const shallow = await this.getAll();
    return JSON.parse(JSON.stringify(shallow));
  }

  async export() {
    const data = await this.getAll();
    return JSON.stringify(data);
  }

  async import(jsonString, { merge = true } = {}) {
    try {
      const db = await this.dbPromise;
      const data = JSON.parse(jsonString);
      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid JSON data");
      }
      if (!merge) {
        await db.clear(this.storeName);
      }
      for (const [key, value] of Object.entries(data)) {
        await db.put(this.storeName, value, key);
      }
      return true;
    } catch (e) {
      console.error("Failed to import:", e.message);
      return false;
    }
  }
}
