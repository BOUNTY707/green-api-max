import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Messenger } from './components/Messenger';
import type { Credentials } from './types';
import { storage } from './utils/storage';

const CREDENTIALS_KEY = 'max-chat:credentials';

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(() =>
    storage.get<Credentials>(CREDENTIALS_KEY),
  );

  function handleLogin(next: Credentials) {
    storage.set(CREDENTIALS_KEY, next);
    setCredentials(next);
  }

  function handleLogout() {
    storage.remove(CREDENTIALS_KEY);
    setCredentials(null);
  }

  if (!credentials) return <LoginPage onLogin={handleLogin} />;

  // key: re-mount everything (store, polling) when the instance changes
  return (
    <Messenger key={credentials.idInstance} credentials={credentials} onLogout={handleLogout} />
  );
}
