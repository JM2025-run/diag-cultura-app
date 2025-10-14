

import React, { useState } from 'react';
import Button from './ui/Button';
import { type UserDetails } from '../types';

interface RegistrationScreenProps {
  onRegister: (details: UserDetails) => void;
}

const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onRegister }) => {
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !position.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setError('');
    onRegister({ fullName, position });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Identificação</h1>
        <p className="text-gray-600">Para continuar, por favor, informe seus dados.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Nome Completo
          </label>
          <div className="mt-1">
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700">
            Cargo
          </label>
          <div className="mt-1">
            <input
              id="position"
              name="position"
              type="text"
              autoComplete="organization-title"
              required
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div>
          <Button type="submit" size="lg" className="w-full flex justify-center">
            Salvar e Continuar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationScreen;