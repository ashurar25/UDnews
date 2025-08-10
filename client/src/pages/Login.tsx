
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AdminLogin from "@/components/AdminLogin";

const Login = () => {
  const [location, setLocation] = useLocation();
  
  const handleLogin = (token: string) => {
    // Save token and redirect to admin
    localStorage.setItem('adminToken', token);
    setLocation('/admin');
  };

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setLocation('/admin');
    }
  }, [setLocation]);

  return <AdminLogin onLogin={handleLogin} />;
};

export default Login;
