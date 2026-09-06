import { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';

import { DRIZZLE } from './database.constants';
import * as schema from './schema';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  useFactory: (): Database => {
    return drizzle(process.env.DATABASE_URL!, { schema });
  },
};
