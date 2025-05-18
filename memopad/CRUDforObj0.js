// CRUD for Object
// This is a simple key-value store class that allows you to perform CRUD operations on an object.

export class KVStore {
  constructor(initialData = {}) {
    this.store = { ...initialData };
  }

  // Set (Add or Update)
  set(key, value) {
    this.store[key] = value;
  }

  // Get (Read)
  get(key) {
    return this.has(key) ? this.store[key] : null;
  }

  // Delete
  delete(key) {
    if (this.has(key)) {
      delete this.store[key];
      return true;
    }
    return false;
  }

  // Check if key exists
  has(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key);
  }

  // List all keys
  list() {
    return Object.keys(this.store);
  }

  // Find keys where value has a specific field
  findKeysByValueField(fieldName) {
    return Object.entries(this.store)
      .filter(
        ([_, value]) =>
          typeof value === "object" && value !== null && fieldName in value
      )
      .map(([key]) => key);
  }

  // Get list of {key, value[fieldName]} pairs as object
  getKeyValueMapByField(fieldName) {
    const result = {};
    for (const [key, value] of Object.entries(this.store)) {
      if (typeof value === "object" && value !== null && fieldName in value) {
        result[key] = value[fieldName];
      }
    }
    return result;
  }

  // Find keys where the value is a string and includes the given substring
  findKeysBySubstringInValue(substring, { caseSensitive = false } = {}) {
    return Object.entries(this.store)
      .filter(
        ([_, value]) =>
          typeof value === "string" &&
          (caseSensitive
            ? value.includes(substring)
            : value.toLowerCase().includes(substring.toLowerCase()))
      )
      .map(([key]) => key);
  }

  // Clear all
  clear() {
    for (const key in this.store) {
      delete this.store[key];
    }
  }

  // Get shallow copy
  getAll() {
    return { ...this.store };
  }

  // Get deep copy
  getAllDeep() {
    return JSON.parse(JSON.stringify(this.store));
  }

  // Export store as JSON string
  export() {
    return JSON.stringify(this.store);
  }

  // Import JSON string (merge or replace)
  import(jsonString, { merge = true } = {}) {
    try {
      const data = JSON.parse(jsonString);
      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid JSON data");
      }
      if (merge) {
        Object.assign(this.store, data); // merge into existing store
      } else {
        this.store = { ...data }; // replace store
      }
      return true;
    } catch (e) {
      console.error("Failed to import:", e.message);
      return false;
    }
  }
}
