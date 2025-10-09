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
  const [userScreen, setUserScreen] = useState<UserScreen>('intro');
  const [cvfScores, setCvfScores] = useState<Scores | null>(null);
  const [cvcqScores, setCvcqScores] = useState<Scores | null>(null);
  
  const [selectedResponse, setSelectedResponse] = useState<UserResponse | null>(null);
  const [consolidatedCvfScores, setConsolidatedCvfScores] = useState<Scores | null>(null);
  const [consolidatedCvfAnalysis, setConsolidatedCvfAnalysis] = useState<string>('');


  useEffect(() => {
    const userInSession = authService.getCurrentUser();
    if (userInSession) {
      const userDetails = authService.getUserDetails(userInSession.username);
      // Combine user and details immediately. If details are null, properties like fullName will be undefined.
      setCurrentUser({ ...userInSession, ...userDetails });
    }
  }, []);

  const handleLogin = useCallback((user: User) => {
    const userDetails = authService.getUserDetails(user.username);
    // Set the full user object. The render logic will determine if registration is needed.
    setCurrentUser({ ...user, ...userDetails });
    setUserScreen('intro'); // Reset to intro screen on every login
  }, []);

  const handleRegister = useCallback((details: UserDetails) => {
    setCurrentUser(currentUser => {
      if (!currentUser) {
        // This case should not happen if called from RegistrationScreen, but it's a safeguard.
        return null;
      }
      authService.saveUserDetails(currentUser.username, details);
      // Return the updated user object to set the state
      return { ...currentUser, ...details };
    });
  }, []);

  const handleLogout = useCallback(() => {
    authService.logout();
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
      // Fallback in case state is lost
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
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} />;
    }

    if (currentUser.role === 'ADMIN') {
      if (selectedResponse && consolidatedCvfScores) {
        return <ResultsScreen 
                  cvfScores={consolidatedCvfScores} // Consolidated culture
                  cvcqScores={selectedResponse.cvcqScores} // Individual leadership
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
    
    // For regular users, check if they need to complete registration.
    // This is the single source of truth.
    if (!currentUser.fullName || !currentUser.position) {
      return <RegistrationScreen onRegister={handleRegister} />;
    }

    // If user is fully registered, proceed to the questionnaire flow.
    switch (userScreen) {
      case 'intro':
        return <IntroScreen onStart={handleStart} username={currentUser.username} fullName={currentUser.fullName} />;
      case 'cvf':
        return <CvfScreen onSubmit={handleCvfSubmit} />;
      case 'cvcq':
        return <CvcqScreen onSubmit={handleCvcqSubmit} />;
      case 'completion':
        if (cvfScores && cvcqScores && currentUser.fullName && currentUser.position) {
          const responseData = { 
            username: currentUser.username, 
            fullName: currentUser.fullName, 
            position: currentUser.position, 
            cvfScores, 
            cvcqScores 
          };
          // Automatically save the response when the user reaches the completion screen
          authService.saveUserResponse(responseData);
          return <CompletionScreen onLogout={handleLogout} userResponse={responseData} />;
        }
        // Fallback if scores/details are missing
        return <IntroScreen onStart={handleStart} username={currentUser.username} fullName={currentUser.fullName} />;
      default:
        return <IntroScreen onStart={handleStart} username={currentUser.username} fullName={currentUser.fullName} />;
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