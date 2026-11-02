import {AppRegistry} from 'react-native';
import App from './src/App';

// Hardcode the app name to avoid JSON import issues during bundling
AppRegistry.registerComponent('safeopen', () => App);
