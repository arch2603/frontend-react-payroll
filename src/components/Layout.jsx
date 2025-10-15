import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {
        sidebarOpen && 
        (
          <div 
              onClick={ () => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          />

        )
      }
        <Sidebar open={sidebarOpen}  setOpen={setSidebarOpen}/>

        <div className="flex-1 min-w-0 md:pl-64 flex flex-col min-h-screen">
          <Header onMenuClick = { () => setSidebarOpen(true)} />
          
          <main className="flex-1 min-w-0-light p-6 overflow-y-auto">
             {/* {children} */}
             <div className="max-w-7xl mx-auto">
                  <Outlet />
             </div>

          </main>

        </div>
      
     
    </div>
  );
}
