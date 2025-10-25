import React from 'react';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  return (
    <header className="w-full bg-green-800 text-white shadow-lg">
      <div className="container mx-auto max-w-5xl flex justify-between items-center p-4">
        <h1 className="text-xl font-bold">Raio-X Empresarial</h1>
        <button
          onClick={onLogout}
          className="font-semibold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors duration-200 text-sm"
        >
          Sair
        </button>
      </div>
    </header>
  );
};

export default Header;
