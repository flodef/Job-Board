'use client';

import { Page, pages, useMenuContext } from '@/app/contexts/menuProvider';
import { getWelcomeParams } from '@/app/utils/welcomeParams';
import { IconBriefcase, IconCalendar, IconHome, IconSettings, IconUser } from '@tabler/icons-react';
import clsx from 'clsx/lite';
import { ReactNode, useEffect, useState } from 'react';
import { useBadge } from '../contexts/badgeProvider';

// Map pages to their respective icons
const pageSettings: Record<Page, { icon: ReactNode; userType: ('conciergerie' | 'employee' | 'both') }> = {
  [Page.Welcome]: { icon: null, userType: 'both' },
  [Page.Missions]: { icon: <IconBriefcase size={30} />, userType: 'both' },
  [Page.Calendar]: { icon: <IconCalendar size={30} />, userType: 'both' },
  [Page.Homes]: { icon: <IconHome size={30} />, userType: 'conciergerie' },
  [Page.Employees]: { icon: <IconUser size={30} />, userType: 'conciergerie' },
  [Page.Settings]: { icon: <IconSettings size={30} />, userType: 'both' },
};

export default function NavigationLayout({ children }: { children: ReactNode }) {
  const { currentPage, onMenuChange } = useMenuContext();
  const [isHomePage, setIsHomePage] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const { pendingEmployeesCount, newMissionsCount, todayMissionsCount, startedMissionsCount, resetPendingEmployeesCount, resetNewMissionsCount } = useBadge();

  useEffect(() => {
    // Check if we're on the homepage or waiting page
    const path = window.location.pathname;
    setIsHomePage(path === '/' || path === '/waiting');
  }, []);

  useEffect(() => {
    // Get user type from localStorage
    const { userType } = getWelcomeParams();
    setUserType(userType);

    // Listen for storage events to detect when user data changes
    const handleStorageChange = () => {
      const { userType: newUserType } = getWelcomeParams();
      setUserType(newUserType);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle menu item click with badge reset
  const handleMenuClick = (page: Page) => {
    // Reset the appropriate badge counter when clicking on that menu item
    if (page === Page.Employees) {
      resetPendingEmployeesCount();
    } else if (page === Page.Missions) {
      resetNewMissionsCount();
    }

    // Navigate to the page
    onMenuChange(page);
  };

  // Don't show navigation if user is not logged in
  if (!userType) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed header - hidden on home page */}
      {!isHomePage && (
        <header className="max-w-7xl mx-auto h-16 flex items-center justify-center">
          {/* Title */}
          <h1 className="text-2xl font-semibold text-foreground">{currentPage}</h1>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 relative">
        {/* Content wrapper with padding to prevent content from being hidden under the navigation */}
        <div className={clsx('bg-background px-4', !isHomePage ? 'min-h-[calc(100dvh-9rem)] pb-24' : 'min-h-screen')}>
          {children}
        </div>
      </main>

      {/* Fixed bottom navigation bar - hidden on home page */}
      {!isHomePage && (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background border-t border-secondary z-40">
          <div className="max-w-7xl mx-auto flex justify-around h-full">
            {pages
              .filter(page => {
                // Skip Welcome page in navigation
                if (page === Page.Welcome) return false;
                
                // Filter pages based on user type defined in pageSettings
                const pageConfig = pageSettings[page];
                return (
                  userType && 
                  (pageConfig.userType === userType || pageConfig.userType === 'both')
                );
              })
              .map(page => (
                <button
                  key={page}
                  onClick={() => handleMenuClick(page)}
                  className={clsx(
                    'flex flex-col items-center justify-center py-2 px-4',
                    'transition-colors duration-200 w-20 h-20 relative',
                    page === currentPage ? 'text-primary bg-primary/10' : 'text-foreground hover:bg-secondary/20',
                  )}
                >
                  <div className="mb-1 relative">
                    {pageSettings[page].icon}

                    {/* Badge for pending employees */}
                    {page === Page.Employees && pendingEmployeesCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingEmployeesCount > 9 ? '9+' : pendingEmployeesCount}
                      </div>
                    )}

                    {/* Badge for new missions */}
                    {page === Page.Missions && newMissionsCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {newMissionsCount > 9 ? '9+' : newMissionsCount}
                      </div>
                    )}
                    
                    {/* Badge for today's missions (employee) or started missions (conciergerie) */}
                    {page === Page.Calendar && (
                      (userType === 'employee' && todayMissionsCount > 0) ? (
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {todayMissionsCount > 9 ? '9+' : todayMissionsCount}
                        </div>
                      ) : (userType === 'conciergerie' && startedMissionsCount > 0) ? (
                        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {startedMissionsCount > 9 ? '9+' : startedMissionsCount}
                        </div>
                      ) : null
                    )}
                  </div>
                  <span className="text-xs font-medium">{page}</span>
                </button>
              ))}
          </div>
        </nav>
      )}
    </div>
  );
}
