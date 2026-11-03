
import DashboardBackground from "@/components/shared/DashboardBackground";
import React from "react";

const CommonLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background">
    

      <main className="relative flex-1">
        <DashboardBackground variant="subtle" />

        <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-5 py-8 md:px-8 lg:px-10">
          {children}
        </div>
      </main>

    </div>
  );
};

export default CommonLayout;