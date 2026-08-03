/**
 * IndexedDB 数据引擎
 * 所有数据本地存储，无需联网
 */
const DB_NAME = 'WorkbenchDB';
const DB_VERSION = 6;

class WorkbenchDB {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // 创建所有数据存储
        const stores = {
          settings: { keyPath: 'key' },
          todos: { keyPath: 'id', autoIncrement: true },
          exam_knowledge: { keyPath: 'id', autoIncrement: true },
          exam_errors: { keyPath: 'id', autoIncrement: true },
          exam_history: { keyPath: 'id', autoIncrement: true },
          exam_ebbinghaus: { keyPath: 'id', autoIncrement: true },
          exam_teaching: { keyPath: 'id', autoIncrement: true },
          exam_koujue: { keyPath: 'id', autoIncrement: true },
          exam_revite_log: { keyPath: 'id', autoIncrement: true },
          exam_quiz: { keyPath: 'id', autoIncrement: true },
          quiz_progress: { keyPath: 'key' },
          vocab: { keyPath: 'id', autoIncrement: true },
          reading_notes: { keyPath: 'id', autoIncrement: true },
          speaking_logs: { keyPath: 'id', autoIncrement: true },
          writing_patterns: { keyPath: 'id', autoIncrement: true },
          eng_course_progress: { keyPath: 'key' },
          eng_level_progress: { keyPath: 'id', autoIncrement: true },
          eng_streak: { keyPath: 'key' },
          accounting: { keyPath: 'id', autoIncrement: true },
          budgets: { keyPath: 'id', autoIncrement: true },
          diary_entries: { keyPath: 'id', autoIncrement: true },
          exercise_logs: { keyPath: 'id', autoIncrement: true },
          diet_logs: { keyPath: 'id', autoIncrement: true },
          water_logs: { keyPath: 'id', autoIncrement: true },
          weight_logs: { keyPath: 'id', autoIncrement: true },
          politics: { keyPath: 'id', autoIncrement: true },
          podcasts: { keyPath: 'id', autoIncrement: true },
          podcast_notes: { keyPath: 'id', autoIncrement: true },
          speech_questions: { keyPath: 'id', autoIncrement: true },
          speech_records: { keyPath: 'id', autoIncrement: true },
          task_plans: { keyPath: 'id', autoIncrement: true },
          task_pomodoros: { keyPath: 'id', autoIncrement: true },
          task_reviews: { keyPath: 'id', autoIncrement: true },
          memos: { keyPath: 'id', autoIncrement: true },
          memo_trash: { keyPath: 'id', autoIncrement: true },
          achievements: { keyPath: 'id' },
          coins: { keyPath: 'key' },
          garden_trees: { keyPath: 'id', autoIncrement: true },
          politics_bookmarks: { keyPath: 'itemId' }
        };

        for (const [name, opts] of Object.entries(stores)) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, opts);
          }
        }
      };

      req.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  async add(store, data) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const req = os.add(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put(store, data) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const req = os.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async get(store, id) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const os = tx.objectStore(store);
      const req = os.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(store) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const os = tx.objectStore(store);
      const req = os.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(store, id) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const req = os.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async bulkAdd(store, items) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      let count = 0;
      items.forEach(item => {
        const req = os.add(item);
        req.onsuccess = () => { count++; };
      });
      tx.oncomplete = () => resolve(count);
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(store) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite');
      const os = tx.objectStore(store);
      const req = os.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async count(store) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly');
      const os = tx.objectStore(store);
      const req = os.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async backupAll() {
    await this.ready;
    const backup = {
      version: DB_VERSION,
      timestamp: new Date().toISOString(),
      data: {}
    };
    const storeNames = Array.from(this.db.objectStoreNames);
    for (const name of storeNames) {
      backup.data[name] = await this.getAll(name);
    }
    return backup;
  }

  async restoreAll(backup) {
    await this.ready;
    const storeNames = Array.from(this.db.objectStoreNames);
    for (const name of storeNames) {
      await this.clear(name);
      if (backup.data[name]) {
        for (const item of backup.data[name]) {
          await this.put(name, item);
        }
      }
    }
  }
}

const DB = new WorkbenchDB();
