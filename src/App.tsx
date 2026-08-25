import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { NotificationToast } from './components/common/NotificationToast';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { SubordinadoDashboard } from './components/subordinado/SubordinadoDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ClassroomScheduleMap } from './components/classroom/ClassroomScheduleMap';
import { AcademicAiAssistant } from './components/ai/AcademicAiAssistant';
import { AcademicActivitiesManager } from './components/admin/AcademicActivitiesManager';
import { RolePermissionsManager } from './components/admin/RolePermissionsManager';
import { UserManagement } from './components/admin/UserManagement';
import { AcademicOfferPlanner } from './components/admin/AcademicOfferPlanner';
import { StudentManagement } from './components/admin/StudentManagement';
import { TeacherManagement } from './components/admin/TeacherManagement';
import { PublicLandingPage } from './components/public/PublicLandingPage';
import { AviFloatingChat } from './components/ai/AviFloatingChat';

function MainAppContent() {
  const { currentUser, isAuthenticated, switchRole, login } = useApp();
  const [currentView, setCurrentView] = useState<'public_site' | 'system_portal'>('public_site');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Synchronize URL hash with view and tab
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '').trim();
      if (!hash) return;

      if (hash === 'portal' || hash === 'dashboard') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('dashboard');
      } else if (hash === 'alumnos' || hash === 'estudiantes' || hash === 'students' || hash === 'students_admin') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('students_admin');
      } else if (hash === 'docentes' || hash === 'profesores' || hash === 'teachers' || hash === 'teachers_admin') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('teachers_admin');
      } else if (hash === 'usuarios' || hash === 'users' || hash === 'users_admin') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('users_admin');
      } else if (hash === 'oferta' || hash === 'planificador' || hash === 'offer_admin') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('offer_admin');
      } else if (hash === 'cursos' || hash === 'course_admin' || hash === 'asignaturas') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('course_admin');
      } else if (hash === 'actividades') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('activities');
      } else if (hash === 'permisos') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('permissions');
      } else if (hash === 'aulas') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('classrooms');
      } else if (hash === 'notas') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('grades');
      } else if (hash === 'matricula' || hash === 'inscripcion') {
        if (isAuthenticated) setCurrentView('system_portal');
        setActiveTab('enrollment');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated]);

  // If view is public_site or user is not logged in, show Public Website
  if (currentView === 'public_site' || !isAuthenticated) {
    return <PublicLandingPage onGoToDashboard={() => setCurrentView('system_portal')} />;
  }

  const renderTabContent = () => {
    if (activeTab === 'ai_assistant') {
      return <AcademicAiAssistant />;
    }

    if (activeTab === 'students_admin') {
      return <StudentManagement />;
    }

    if (activeTab === 'teachers_admin') {
      return <TeacherManagement />;
    }

    if (activeTab === 'users_admin') {
      return <UserManagement />;
    }

    if (activeTab === 'offer_admin') {
      return <AcademicOfferPlanner />;
    }

    if (activeTab === 'classrooms') {
      return <ClassroomScheduleMap />;
    }

    if (activeTab === 'activities') {
      return <AcademicActivitiesManager />;
    }

    if (activeTab === 'permissions') {
      return <RolePermissionsManager />;
    }

    switch (currentUser.role) {
      case 'student':
        return <StudentDashboard activeTab={activeTab} />;
      case 'teacher':
        return <TeacherDashboard activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'subordinado':
        return <SubordinadoDashboard activeTab={activeTab} />;
      case 'admin':
        return <AdminDashboard activeTab={activeTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onGoToPublicSite={() => setCurrentView('public_site')}
      />

      {/* Real-time Toast Popup */}
      <NotificationToast />

      {/* Floating AVI Assistant Widget (Bottom-Right) */}
      <AviFloatingChat />

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 py-6 gap-6">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Workspace */}
        <main className="flex-1 min-w-0">
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}

