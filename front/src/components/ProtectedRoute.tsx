import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
    // 현재 경로를 state로 넘겨 로그인 후 돌아올 수 있게 함
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
