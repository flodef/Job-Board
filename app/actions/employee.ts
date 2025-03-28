'use server';

import {
  DbEmployee,
  createEmployee,
  employeeExists,
  getAllEmployees,
  updateEmployeeSettings,
  updateEmployeeStatus,
} from '@/app/db/employeeDb';
import { Employee, EmployeeNotificationSettings, EmployeeStatus } from '@/app/types/dataTypes';
import { revalidateTag } from 'next/cache';

/**
 * Fetch all employees from the database with caching
 * Cache is refreshed every hour or when explicitly revalidated
 */
export async function fetchEmployees(): Promise<Employee[]> {
  try {
    const employees = await getAllEmployees();
    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

/**
 * Create a new employee in the database
 */
export async function createNewEmployee(data: {
  id: string;
  firstName: string;
  familyName: string;
  tel: string;
  email: string;
  geographicZone: string;
  message?: string;
  conciergerieName?: string;
  notificationSettings?: EmployeeNotificationSettings;
}): Promise<{ employee: Employee | null; alreadyExists: boolean }> {
  try {
    // Check if employee already exists with the same name, phone, or email
    const exists = await employeeExists(data.firstName, data.familyName, data.tel, data.email);

    if (exists) {
      return { employee: null, alreadyExists: true };
    }

    // Convert to DB format
    const dbData: Omit<DbEmployee, 'created_at'> = {
      id: data.id,
      first_name: data.firstName,
      family_name: data.familyName,
      tel: data.tel,
      email: data.email,
      geographic_zone: data.geographicZone,
      message: data.message,
      conciergerie_name: data.conciergerieName,
      notification_settings: data.notificationSettings,
      status: 'pending',
    };

    const created = await createEmployee(dbData);

    if (!created) return { employee: null, alreadyExists: false };

    // Revalidate cache after creation
    revalidateTag('employees');
    revalidateTag('employees_by_conciergerie');

    return { employee: created, alreadyExists: false };
  } catch (error) {
    console.error('Error creating employee:', error);
    return { employee: null, alreadyExists: false };
  }
}

/**
 * Update an employee's status in the database
 */
export async function updateEmployeeStatusAction(id: string, status: EmployeeStatus): Promise<Employee | null> {
  try {
    const updated = await updateEmployeeStatus(id, status);

    if (!updated) return null;

    // Revalidate cache after update
    revalidateTag('employees');
    revalidateTag('employees_by_conciergerie');
    revalidateTag('employee');

    return updated;
  } catch (error) {
    console.error(`Error updating employee status for ID ${id}:`, error);
    return null;
  }
}

/**
 * Update an employee's settings in the database
 */
export async function updateEmployeeData(
  id: string,
  data: {
    tel?: string;
    email?: string;
    geographicZone?: string;
    message?: string;
    conciergerieName?: string;
    notificationSettings?: EmployeeNotificationSettings;
  },
): Promise<Employee | null> {
  try {
    // Convert to DB format
    const dbData: Partial<DbEmployee> = {
      tel: data.tel,
      email: data.email,
      geographic_zone: data.geographicZone,
      message: data.message,
      conciergerie_name: data.conciergerieName,
      notification_settings: data.notificationSettings,
    };

    const updated = await updateEmployeeSettings(id, dbData);

    if (!updated) return null;

    // Revalidate cache after update
    revalidateTag('employees');
    revalidateTag('employees_by_conciergerie');
    revalidateTag('employee');

    return updated;
  } catch (error) {
    console.error(`Error updating employee settings for ID ${id}:`, error);
    return null;
  }
}
