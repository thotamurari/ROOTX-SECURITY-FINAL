import { getDefaultConfig, mergeConfig } from '@react-native/metro-config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = {};

export default mergeConfig(getDefaultConfig(__dirname), config);
