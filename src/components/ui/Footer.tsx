import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full text-center p-4">
      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} GUIDEWAY Operações Inteligentes - Diagnóstico de Governança. Todos os direitos reservados.
      </p>
    </footer>
  );
};

export default Footer;
