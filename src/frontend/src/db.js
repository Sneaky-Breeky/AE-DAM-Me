import Dexie from 'dexie';

export const db = new Dexie('UserUploadsDB');
db.version(1).stores({
  files: '++id, name, blob, metadata, date, location, projectId'
});