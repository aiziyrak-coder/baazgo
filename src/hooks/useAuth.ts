import { useState, useEffect } from 'react';
import { UserProfile, OperationType } from '../types';

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Mock Error: ', error);
}

const PINS_KEY = 'baazgo_credential_pins';

function readPins(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PINS_KEY) || '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writePins(pins: Record<string, string>) {
  localStorage.setItem(PINS_KEY, JSON.stringify(pins));
}

// Demo user
const DEMO_USER: UserProfile = {
  uid: 'demo-user-123',
  name: 'Eshmat Toshmatov',
  email: '998901234567@baazgo.uz',
  phone: '+998901234567',
  cashbackBalance: 250000,
  role: 'admin',
  createdAt: new Date().toISOString()
};

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const pins = readPins();
    if (pins[DEMO_USER.email] === undefined) {
      pins[DEMO_USER.email] = 'demo1234';
      writePins(pins);
    }
    const storedUser = localStorage.getItem('baazgo_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ uid: parsedUser.uid });
        setProfile(parsedUser);
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }, []);

  const formatPhoneEmail = (phone: string) => {
    return `${phone.replace(/\s+/g, '').replace('+', '')}@baazgo.uz`;
  };

  const signInWithPhone = async (phone: string, pin: string) => {
    setLoginError(null);
    setLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const email = formatPhoneEmail(phone);
      
      const storedUsers = localStorage.getItem('baazgo_all_users');
      let allUsers: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [DEMO_USER];
      
      const foundUser = allUsers.find(u => u.email === email);
      const pins = readPins();
      const expectedPin = pins[email] ?? 'demo1234';

      if (foundUser && pin === expectedPin) {
        setUser({ uid: foundUser.uid });
        setProfile({ ...foundUser, role: foundUser.email === DEMO_USER.email ? 'admin' : 'user' }); // DEMO_USER is admin
        localStorage.setItem('baazgo_user', JSON.stringify({ ...foundUser, role: foundUser.email === DEMO_USER.email ? 'admin' : 'user' }));
      } else {
        throw new Error("Telefon raqam yoki parol noto'g'ri");
      }
    } catch (error: any) {
      console.error("Error signing in", error);
      setLoginError(error.message || "Tizimga kirishda xatolik");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithPhone = async (phone: string, pin: string, name: string) => {
    setLoginError(null);
    setLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const newUser: UserProfile = {
        uid: 'user-' + Date.now(),
        name: name || 'Yangi Foydalanuvchi',
        email: formatPhoneEmail(phone),
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      const storedUsers = localStorage.getItem('baazgo_all_users');
      let allUsers: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [DEMO_USER];
      
      if (allUsers.find(u => u.email === newUser.email)) {
        throw new Error("Bu nomerdan allaqachon ro'yxatdan o'tilgan");
      }
      
      allUsers.push(newUser);
      localStorage.setItem('baazgo_all_users', JSON.stringify(allUsers));

      const pins = readPins();
      pins[newUser.email] = pin;
      writePins(pins);
      
      setUser({ uid: newUser.uid });
      setProfile(newUser);
      localStorage.setItem('baazgo_user', JSON.stringify(newUser));
    } catch (error: any) {
      console.error("Error signing up", error);
      setLoginError(error.message || "Ro'yxatdan o'tishda xatolik");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('baazgo_user');
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, loginError, signInWithPhone, registerWithPhone, logout };
}

