import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('loggedIn', 'true');
            localStorage.setItem('userRole', user.role);
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('userRole');
        }
    }, [user]);

    const login = (userData) => {
        const completeUserData = {
            id: userData.id,                     
            email: userData.email,               
            firstName: userData.firstName,       
            lastName: userData.lastName,         
            role: userData.role,
            status: userData.status,
            favProjects: userData.favProjects || []
        };
        setUser(completeUserData);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loggedIn');
    };

    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
