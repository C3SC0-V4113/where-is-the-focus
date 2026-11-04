import { createCn } from 'cn/config';

// Register the transition-surface utility from global.css for class merging.
export const cn = createCn({
  extend: {
    classGroups: {
      transition: [{ transition: ['surface'] }],
    },
  },
});
