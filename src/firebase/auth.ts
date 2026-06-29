import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth } from './config';

const ADMIN_EMAIL = 'abirsabirhossain@gmail.com';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
  accountType?: 'admin' | 'client';
}

/**
 * Check if user is admin
 */
const isAdminUser = (email: string | null): boolean => {
  return email === ADMIN_EMAIL;
};

/**
 * Check if an email is already registered
 */
export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch (error) {
    console.error('Email check error:', error);
    return false;
  }
};

/**
 * Register a new client with email and password
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<AuthUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name
    await updateProfile(userCredential.user, {
      displayName: displayName,
    });

    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: displayName,
      photoURL: userCredential.user.photoURL,
      isAdmin: false,
      accountType: 'client',
    };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login user with email and password
 */
export const loginUser = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      isAdmin: isAdminUser(userCredential.user.email),
      accountType: isAdminUser(userCredential.user.email) ? 'admin' : 'client',
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Login with Google
 */
export const loginWithGoogle = async (): Promise<AuthUser> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const email = userCredential.user.email;
    
    // Check if admin
    const isAdmin = isAdminUser(email);
    
    if (!isAdmin) {
      // Non-admin Google login not allowed for now
      await signOut(auth);
      throw new Error('Google login is only available for admin users (abirsabirhossain@gmail.com)');
    }

    return {
      uid: userCredential.user.uid,
      email: email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
      isAdmin: true,
      accountType: 'admin',
    };
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

/**
 * Change the current user's password (requires recent re-authentication).
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('You must be signed in to change your password.');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, (firebaseUser: User | null) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        isAdmin: isAdminUser(firebaseUser.email),
        accountType: isAdminUser(firebaseUser.email) ? 'admin' : 'client',
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Get current user
 */
export const getCurrentUser = (): AuthUser | null => {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAdmin: isAdminUser(user.email),
    accountType: isAdminUser(user.email) ? 'admin' : 'client',
  };
};
