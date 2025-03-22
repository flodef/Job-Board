'use client';

import ConciergerieForm from '@/app/components/conciergerieForm';
import EmployeeForm from '@/app/components/employeeForm';
import LoadingSpinner from '@/app/components/loadingSpinner';
import UserTypeSelection from '@/app/components/userTypeSelection';
import { useAuth, UserType } from '@/app/contexts/authProvider';
import { useCallback, useEffect, useState } from 'react';

export default function Home() {
  const { isLoading: authLoading, userType, updateUserType } = useAuth();
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showConciergerieForm, setShowConciergerieForm] = useState(false);

  const handleUserTypeSelect = useCallback(
    (type: UserType) => {
      // Save user type to localStorage
      updateUserType(type);

      // Show appropriate form based on user type
      setShowEmployeeForm(type === 'employee');
      setShowConciergerieForm(type === 'conciergerie');
    },
    [updateUserType, setShowEmployeeForm, setShowConciergerieForm],
  );

  // Initialize state from auth context
  useEffect(() => {
    // Only initialize forms after auth is loaded and we've checked registration
    if (authLoading) return;

    // Show appropriate form based on user type
    // If the user is not found in the database, they should still see the form
    handleUserTypeSelect(userType);
  }, [authLoading, userType, handleUserTypeSelect]);

  const handleCloseForm = () => {
    // Reset state to show selection screen
    updateUserType(undefined);
    setShowEmployeeForm(false);
    setShowConciergerieForm(false);
  };

  // Show loading spinner while checking auth state or registration status
  if (authLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-2">
      <div className="w-full max-w-md bg-background overflow-hidden">
        {!userType && !showEmployeeForm && !showConciergerieForm ? (
          <UserTypeSelection onSelect={handleUserTypeSelect} />
        ) : showEmployeeForm ? (
          <EmployeeForm onClose={handleCloseForm} />
        ) : showConciergerieForm ? (
          <ConciergerieForm onClose={handleCloseForm} />
        ) : null}
      </div>
    </div>
  );
}
