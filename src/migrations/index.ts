import * as migration_20250929_111647 from './20250929_111647';
import * as migration_20260530_050019 from './20260530_050019';
import * as migration_20260530_055659 from './20260530_055659';
import * as migration_20260530_113625 from './20260530_113625';

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260530_050019.up,
    down: migration_20260530_050019.down,
    name: '20260530_050019',
  },
  {
    up: migration_20260530_055659.up,
    down: migration_20260530_055659.down,
    name: '20260530_055659',
  },
  {
    up: migration_20260530_113625.up,
    down: migration_20260530_113625.down,
    name: '20260530_113625'
  },
];
