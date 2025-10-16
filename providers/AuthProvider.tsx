import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: 'user' | 'agent' | 'controller' | 'admin';
  agent_id?: string;
  responder_type?: 'police' | 'ngo' | 'medical' | 'volunteer';
  status: 'available' | 'busy' | 'offline';
  badge_number?: string;
  specialization: string[];
  rating: number;
  total_cases: number;
  last_active: string;
  // Location fields
  location?: string;
  latitude?: number;
  longitude?: number;
  // Personal information
  gender: 'male' | 'female' | 'other';
  phone: string;
  id_type: 'nid' | 'birth';
  id_number: string;
  dob?: string;
  blood_group?: string;
  address?: string;
  emergency_medical_note?: string;
  profile_picture?: string;
  // Timestamps
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  register: (userData: any) => Promise<void>;
  login: (loginData: LoginData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: User) => void;
}

interface LoginData {
  email: string;
  password: string;
  agent_id?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        api.defaults.headers.Authorization = `Token ${storedToken}`;
        
        // Redirect based on user type if needed
        redirectBasedOnUserType(userData);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const redirectBasedOnUserType = (userData: User) => {
    // This function can be called after login to redirect to appropriate screen
    if (userData.user_type === 'agent') {
      router.replace('/(agent)');
    } else {
      router.replace('/(user)');
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.post('/auth/register/', userData);
      const { token: newToken, user: newUser } = response.data;
      
      await AsyncStorage.setItem('auth_token', newToken);
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      api.defaults.headers.Authorization = `Token ${newToken}`;
      
      // Redirect based on user type after registration
      redirectBasedOnUserType(newUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const login = async (loginData: LoginData) => {
    try {
      const response = await api.post('/auth/login/', loginData);
      const { token: newToken, user: newUser } = response.data;
      
      await AsyncStorage.setItem('auth_token', newToken);
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
      
      setToken(newToken);
      setUser(newUser);
      api.defaults.headers.Authorization = `Token ${newToken}`;
      
      // Redirect based on user type after login
      redirectBasedOnUserType(newUser);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
      delete api.defaults.headers.Authorization;
      
      // Redirect to login after logout
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    AsyncStorage.setItem('user_data', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      register, 
      login, 
      logout,
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};