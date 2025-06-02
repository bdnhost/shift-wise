import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Employees from "./Employees";

import Landing from "./Landing";

import Index from "./Index";

import Settings from "./Settings";

import Shifts from "./Shifts";

import Schedule from "./Schedule";

import AdminDashboard from "./AdminDashboard";

import MissionControlPage from "./MissionControlPage";

import TestSms from "./TestSms";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Employees: Employees,
    
    Landing: Landing,
    
    Index: Index,
    
    Settings: Settings,
    
    Shifts: Shifts,
    
    Schedule: Schedule,
    
    AdminDashboard: AdminDashboard,
    
    MissionControlPage: MissionControlPage,
    
    TestSms: TestSms,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Employees" element={<Employees />} />
                
                <Route path="/Landing" element={<Landing />} />
                
                <Route path="/Index" element={<Index />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Shifts" element={<Shifts />} />
                
                <Route path="/Schedule" element={<Schedule />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/MissionControlPage" element={<MissionControlPage />} />
                
                <Route path="/TestSms" element={<TestSms />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}