import React, { useState } from 'react';
import Button from './ui/Button';
import Logo from './ui/Logo';
import { authService } from '../auth/authService';

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const user = await authService.login(email, password);
    setLoading(false);
    if (user) {
      onLogin();
    } else {
      setError('Email ou senha inválidos.');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex justify-center mb-6">
          <Logo />
      </div>
      <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Raio-X Empresarial</h1>
          <p className="text-sm text-gray-500 mt-1">Acesso ao Diagnóstico de Governança Corporativa.</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Usuário
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 sm:text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div>
          <Button type="submit" size="lg" className="w-full flex justify-center mt-2" variant="primary" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginScreen;
