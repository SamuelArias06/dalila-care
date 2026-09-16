import { render } from 'preact';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './app/App.js';
import { installUploadTriggers, processUploadQueue } from './data/media.js';
import { registerSW } from './sw-register.js';

const root = document.getElementById('app');
if (root) {
  root.innerHTML = '';
  render(<App />, root);
}

installUploadTriggers();
void processUploadQueue();
registerSW();
