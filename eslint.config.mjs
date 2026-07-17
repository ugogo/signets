// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// @ts-check
import { createSignetsEslintConfig } from '@signets/eslint-config';

export default createSignetsEslintConfig(import.meta.dirname);
