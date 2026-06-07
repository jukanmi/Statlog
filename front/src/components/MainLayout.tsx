import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomTabBar from './BottomTabBar';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto relative min-h-screen flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <BottomTabBar />
      </div>
    </div>
  );
};

export default MainLayout;
