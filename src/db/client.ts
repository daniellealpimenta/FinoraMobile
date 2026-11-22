// O "ModelContainer": um arquivo SQLite no aparelho. enableChangeListener faz o useLiveQuery
// (o "@Query" do app) atualizar as telas sozinho a cada insert/update.
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const expoDb = openDatabaseSync('finora.db', { enableChangeListener: true });
export const db = drizzle(expoDb, { schema });
export type DB = typeof db;
