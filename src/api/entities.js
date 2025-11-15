/**
 * Entity layer for Local Storage
 * Provides unified interface for database operations using IndexedDB
 */

import { BaseEntity } from './BaseEntity';
import { stores, saveSession, getSession, clearSession, ensureInitialized, getAllItems } from './localClient';

// Entity instances
export const Employee = new BaseEntity('employees');
export const Shift = new BaseEntity('shifts');
export const Organization = new BaseEntity('organizations');
export const JobRole = new BaseEntity('job_roles');
export const EmployeeConstraint = new BaseEntity('employee_constraints');
export const SmsAutomation = new BaseEntity('sms_automations');
export const Subscription = new BaseEntity('subscriptions');
export const Payment = new BaseEntity('payments');

/**
 * User Authentication Entity
 * Uses Local Storage for demo/development authentication
 */
export const User = {
  /**
   * Get current authenticated user
   * @returns {Promise<Object>}
   */
  async me() {
    try {
      await ensureInitialized();

      const session = await getSession();
      if (!session || !session.user) {
        // Create a mock 401 error for compatibility
        const authError = new Error('Not authenticated');
        authError.response = { status: 401 };
        throw authError;
      }

      return session.user;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sign in with email and password
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async signIn(email, password) {
    try {
      await ensureInitialized();

      const users = await getAllItems(stores.users);
      const user = users.find(u => u.email === email);

      if (!user) {
        throw new Error('User not found');
      }

      // Simple password check (in real app, use proper hashing)
      if (user.password !== password) {
        throw new Error('Invalid password');
      }

      // Remove password from returned user
      const { password: _, ...userWithoutPassword } = user;

      // Create session
      await saveSession(userWithoutPassword);

      return userWithoutPassword;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  /**
   * Sign up with email and password
   * @param {string} email
   * @param {string} password
   * @param {Object} metadata - Additional user metadata
   * @returns {Promise<Object>}
   */
  async signUp(email, password, metadata = {}) {
    try {
      await ensureInitialized();

      const users = await getAllItems(stores.users);
      const existingUser = users.find(u => u.email === email);

      if (existingUser) {
        throw new Error('User already exists');
      }

      const id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);

      const newUser = {
        id,
        email,
        password, // In real app, hash this!
        full_name: metadata.full_name || email.split('@')[0],
        role: metadata.role || 'user',
        created_at: new Date().toISOString(),
        ...metadata
      };

      await stores.users.setItem(newUser.id, newUser);

      // Remove password from returned user
      const { password: _, ...userWithoutPassword } = newUser;

      // Create session
      await saveSession(userWithoutPassword);

      return userWithoutPassword;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    await clearSession();
  },

  /**
   * Update user profile
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateProfile(updates) {
    try {
      const session = await getSession();
      if (!session || !session.user) {
        throw new Error('Not authenticated');
      }

      const userId = session.user.id;
      const user = await stores.users.setItem(userId);

      if (!user) {
        throw new Error('User not found');
      }

      const updatedUser = {
        ...user,
        ...updates,
        id: userId, // Preserve ID
        updated_at: new Date().toISOString()
      };

      await stores.users.setItem(userId, updatedUser);

      // Update session
      const { password, ...userWithoutPassword } = updatedUser;
      await saveSession(userWithoutPassword);

      return userWithoutPassword;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  /**
   * Reset password
   * @param {string} email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    console.log('Password reset requested for:', email);
    // In a real app, this would send a reset email
    // For local storage, just log it
    alert('סיסמת נשלחה ל-' + email + ' (במצב הדגמה, השתמש ב-demo123)');
  },

  /**
   * Auto-login with demo user (for development)
   * @returns {Promise<Object>}
   */
  async autoLoginDemo() {
    try {
      return await this.signIn('demo@shiftwise.local', 'demo123');
    } catch (error) {
      console.error('Auto-login failed:', error);
      throw error;
    }
  }
};

// Export all entities
export default {
  Employee,
  Shift,
  Organization,
  JobRole,
  EmployeeConstraint,
  SmsAutomation,
  Subscription,
  Payment,
  User
};
