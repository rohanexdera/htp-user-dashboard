import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
            
            // Load user data from localStorage if available
            if (user) {
                const storedUserData = localStorage.getItem('userData');
                if (storedUserData) {
                    setUserData(JSON.parse(storedUserData));
                }
            } else {
                setUserData(null);
                localStorage.removeItem('userData');
            }
        });

        return unsubscribe;
    }, []);

    const saveUserData = (data) => {
        setUserData(data);
        localStorage.setItem('userData', JSON.stringify(data));
    };

    const clearUserData = () => {
        setUserData(null);
        localStorage.removeItem('userData');
    };

    const value = {
        currentUser,
        userData,
        loading,
        saveUserData,
        clearUserData,
        isAuthenticated: !!currentUser
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
