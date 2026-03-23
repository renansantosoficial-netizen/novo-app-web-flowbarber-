import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { FirebaseProvider } from './context/FirebaseProvider';
import { FlowBarberProvider } from './context/FlowBarberContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseProvider>
      <FlowBarberProvider>
        <App />
      </FlowBarberProvider>
    </FirebaseProvider>
  </StrictMode>,
);
