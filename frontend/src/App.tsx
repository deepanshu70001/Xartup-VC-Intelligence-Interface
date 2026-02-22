import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProviders } from './app/AppProviders';
import { AppRoutes } from './app/AppRoutes';

export default function App() {
  return (
    <AppProviders>
      <Router>
        <AppRoutes />
        <Toaster position="bottom-right" />
      </Router>
    </AppProviders>
  );
}
