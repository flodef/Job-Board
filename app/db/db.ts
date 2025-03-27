import { UserType } from '@/app/contexts/authProvider';
import { neon } from '@neondatabase/serverless';

// Initialize neon client
export const sql = neon(process.env.DATABASE_URL as string);

// Cache time: 1 hour in seconds
export const CACHE_TIME = 60 * 60;

/**
 * Check if a user exists and what type they are
 */
export async function getExistingUserType(userId: string): Promise<UserType | null> {
  try {
    const result = await sql`
      SELECT CASE 
        WHEN EXISTS (SELECT 1 FROM conciergerie WHERE id = ${userId}) THEN 'conciergerie'
        WHEN EXISTS (SELECT 1 FROM employee WHERE id = ${userId} AND status = 'accepted') THEN 'employee'
        ELSE NULL
      END AS result
    `;

    return result[0].result ? (result[0].result as UserType) : null;
  } catch (error) {
    console.error('Error checking user status:', error);
    return null;
  }
}
