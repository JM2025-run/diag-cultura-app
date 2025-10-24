import React, { useState, useCallback, useEffect } from 'react';
import IntroScreen from './components/IntroScreen';
import CvfScreen from './components/CvfScreen';
import CvcqScreen from './components/CvcqScreen';
import ResultsScreen from './components/ResultsScreen';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';
import CompletionScreen from './components/CompletionScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import { type Scores, type User, type UserResponse, type Quadrant, type UserDetails } from './types';
import { authService } from './auth/authService';

type UserScreen = 'intro' | 'cvf' | 'cvcq' | 'completion';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userScreen, setUserScreen] = useState<UserScreen>('intro');
  const [cvfScores, setCvfScores] = useState<Scores | null>(null);
  const [cvcqScores, setCvcqScores] = useState<Scores | null>(null);
  
  const [selectedResponse, setSelectedResponse] = useState<UserResponse | null>(null);
  const [consolidatedCvfScores, setConsolidatedCvfScores] = useState<Scores | null>(null);
  const [consolidatedCvfAnalysis, setConsolidatedCvfAnalysis] = useState<string>('');


  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching current user:", error);
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    checkCurrentUser();
  }, []);

  const handleLogin = useCallback(async () => {
    // Após o login, o Supabase gerencia a sessão. Apenas precisamos buscar novamente o usuário.
    setIsLoadingUser(true);
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
    setUserScreen('intro'); // Reseta para a tela de introdução a cada login
    setIsLoadingUser(false);
  }, []);

  const handleRegister = useCallback(async (details: UserDetails) => {
    if (!currentUser) return;
    const updatedUser = await authService.saveUserDetails(currentUser.id, details);
    setCurrentUser(updatedUser);
  }, [currentUser]);

  const handleLogout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
    setUserScreen('intro');
    setCvfScores(null);
    setCvcqScores(null);
    setSelectedResponse(null);
    setConsolidatedCvfAnalysis('');
    setConsolidatedCvfScores(null);
  }, []);

  const handleStart = useCallback(() => {
    setUserScreen('cvf');
  }, []);

  const handleCvfSubmit = useCallback((scores: Scores) => {
    setCvfScores(scores);
    setUserScreen('cvcq');
  }, []);

  const handleCvcqSubmit = useCallback((scores: Scores) => {
    if (cvfScores && currentUser) {
      setCvcqScores(scores);
      setUserScreen('completion');
    } else {
      handleLogout();
    }
  }, [cvfScores, currentUser, handleLogout]);

  const handleSelectResponse = useCallback((response: UserResponse) => {
    setSelectedResponse(response);
  }, []);
  
  const handleBackToDashboard = useCallback(() => {
    setSelectedResponse(null);
  }, []);

  const handleResponsesChange = useCallback((responses: UserResponse[]) => {
    if (responses.length === 0) {
      setConsolidatedCvfScores(null);
      return;
    }

    const totalScores: Scores = { Clan: 0, Adhocracy: 0, Market: 0, Hierarchy: 0 };
    responses.forEach(res => {
        (Object.keys(totalScores) as Quadrant[]).forEach(quadrant => {
            totalScores[quadrant] += res.cvfScores[quadrant];
        });
    });

    const averageScores: Scores = { Clan: 0, Adhocracy: 0, Market: 0, Hierarchy: 0 };
    (Object.keys(averageScores) as Quadrant[]).forEach(quadrant => {
        averageScores[quadrant] = totalScores[quadrant] / responses.length;
    });
    
    setConsolidatedCvfScores(averageScores);
  }, []);


  const renderContent = () => {
    if (isLoadingUser) {
        return <div className="text-center"><p>Carregando...</p></div>;
    }

    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    if (currentUser.role === 'ADMIN') {
       // O admin também precisa preencher o perfil na primeira vez.
       if (!currentUser.fullName || !currentUser.position) {
         return <RegistrationScreen onRegister={handleRegister} />;
      }
      if (selectedResponse && consolidatedCvfScores) {
        return <ResultsScreen 
                  cvfScores={consolidatedCvfScores} // Cultura consolidada
                  cvcqScores={selectedResponse.cvcqScores} // Liderança individual
                  onBack={handleBackToDashboard}
                  reportTitle={`Análise de Alinhamento: ${selectedResponse.fullName}`}
                  consolidatedCvfAnalysis={consolidatedCvfAnalysis}
               />;
      }
      return <AdminDashboard 
                onSelectResponse={handleSelectResponse} 
                onLogout={handleLogout}
                onResponsesChange={handleResponsesChange}
                consolidatedCvfScores={consolidatedCvfScores}
                onCvfAnalysisComplete={setConsolidatedCvfAnalysis}
             />;
    }
    
    if (!currentUser.fullName || !currentUser.position) {
      return <RegistrationScreen onRegister={handleRegister} />;
    }

    switch (userScreen) {
      case 'intro':
        return <IntroScreen onStart={handleStart} username={currentUser.email} fullName={currentUser.fullName} />;
      case 'cvf':
        return <CvfScreen onSubmit={handleCvfSubmit} />;
      case 'cvcq':
        return <CvcqScreen onSubmit={handleCvcqSubmit} />;
      case 'completion':
        if (cvfScores && cvcqScores && currentUser.fullName && currentUser.position) {
          const responseData = { 
            user_id: currentUser.id,
            fullName: currentUser.fullName, 
            position: currentUser.position, 
            cvfScores, 
            cvcqScores 
          };
          return <CompletionScreen onLogout={handleLogout} userResponse={responseData} />;
        }
        return <IntroScreen onStart={handleStart} username={currentUser.email} fullName={currentUser.fullName} />;
      default:
        return <IntroScreen onStart={handleStart} username={currentUser.email} fullName={currentUser.fullName} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
       <main className="container w-full max-w-5xl bg-white rounded-lg shadow-xl p-6 sm:p-8 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;