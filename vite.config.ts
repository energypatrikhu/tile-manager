import { resolve } from "path";
import { UserConfig } from "vite";

import { sveltekit } from "@sveltejs/kit/vite";

const config: UserConfig = {
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $components: resolve("./src/components"),
      $stores: resolve("./src/stores"),
      $types: resolve("./src/types"),
      $libs: resolve("./src/libs"),
      $css: resolve("./src/css"),
      $static: resolve("./static"),
    },
  },
};

export default config;
