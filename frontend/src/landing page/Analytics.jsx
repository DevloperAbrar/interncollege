// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
// } from 'recharts';
// import {
//   Users, Building, MapPin, TrendingUp, DollarSign, Calendar,
//   Award, Briefcase, Filter, Download, Search, ChevronDown,
//   ArrowLeft, Activity, Target, Clock, CheckCircle, Sun, Moon,
//   Home, BarChart3, Menu, X
// } from 'lucide-react';
// import { useApi } from '../hooks/useApi';

// const Analytics = () => {
//   const navigate = useNavigate();
//   const { execute, loading } = useApi();
  
//   const [analyticsData, setAnalyticsData] = useState(null);
//   const [darkMode, setDarkMode] = useState(false);
//   const [filters, setFilters] = useState({
//     semester: 'all',
//     batch: 'all',
//     location: 'all',
//     companyType: 'all'
//   });
//   const [showFilters, setShowFilters] = useState(false);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isScrolled, setIsScrolled] = useState(false);

//   useEffect(() => {
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme) {
//       setDarkMode(savedTheme === 'dark');
//     } else {
//       const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//       setDarkMode(prefersDark);
//     }
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('theme', darkMode ? 'dark' : 'light');
//   }, [darkMode]);

//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   useEffect(() => {
//     fetchAnalytics();
//   }, [filters]);

//   const fetchAnalytics = async () => {
//     try {
//       const response = await execute(() => 
//         fetch(`${import.meta.env.VITE_API_URL}/analytics?${new URLSearchParams(filters)}`, {
//           headers: {
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//           }
//         }).then(res => res.json())
//       );
//       setAnalyticsData(response.data);
//     } catch (error) {
//       console.error('Failed to fetch analytics:', error);
//     }
//   };

//   const toggleTheme = () => {
//     setDarkMode(!darkMode);
//   };

//   // Mock data structure
//   const mockData = {
//     overview: {
//       totalStudents: 487,
//       activeInternships: 312,
//       completedInternships: 175,
//       averageStipend: 15420,
//       highestStipend: 50000,
//       placementRate: 78.5
//     },
//     semesterWise: [
//       { semester: '6th Internship', count: 142, avgStipend: 12000 },
//       { semester: '7th Internship', count: 98, avgStipend: 16500 },
//       { semester: '8th Internship', count: 72, avgStipend: 18200 },
//       { semester: '8th Project', count: 65, avgStipend: 0 },
//       { semester: 'Any Internship', count: 110, avgStipend: 14800 }
//     ],
//     companyTypeDistribution: [
//       { name: 'Startups', value: 145, color: '#3B82F6' },
//       { name: 'MNC', value: 98, color: '#8B5CF6' },
//       { name: 'Government', value: 42, color: '#10B981' },
//       { name: 'PSU', value: 28, color: '#F59E0B' },
//       { name: 'Research', value: 35, color: '#EF4444' },
//       { name: 'Academic', value: 52, color: '#6366F1' },
//       { name: 'Other', value: 87, color: '#64748B' }
//     ],
//     locationWise: [
//       { location: 'Bangalore', count: 95, avgStipend: 22000 },
//       { location: 'Hyderabad', count: 78, avgStipend: 19500 },
//       { location: 'Mumbai', count: 62, avgStipend: 21000 },
//       { location: 'Delhi NCR', count: 71, avgStipend: 20500 },
//       { location: 'Pune', count: 54, avgStipend: 18000 },
//       { location: 'Chennai', count: 48, avgStipend: 17500 },
//       { location: 'Others', count: 79, avgStipend: 13500 }
//     ],
//     stipendDistribution: [
//       { range: '0-5k', count: 85 },
//       { range: '5k-10k', count: 142 },
//       { range: '10k-15k', count: 98 },
//       { range: '15k-20k', count: 67 },
//       { range: '20k-30k', count: 42 },
//       { range: '30k+', count: 28 }
//     ],
//     monthlyTrend: [
//       { month: 'Jan', internships: 42, placements: 12 },
//       { month: 'Feb', internships: 58, placements: 18 },
//       { month: 'Mar', internships: 65, placements: 22 },
//       { month: 'Apr', internships: 72, placements: 25 },
//       { month: 'May', internships: 89, placements: 31 },
//       { month: 'Jun', internships: 95, placements: 38 },
//       { month: 'Jul', internships: 87, placements: 35 },
//       { month: 'Aug', internships: 78, placements: 28 }
//     ],
//     topCompanies: [
//       { name: 'TCS', students: 28, avgStipend: 15000 },
//       { name: 'Infosys', students: 24, avgStipend: 18000 },
//       { name: 'Wipro', students: 22, avgStipend: 16000 },
//       { name: 'Tech Mahindra', students: 18, avgStipend: 17500 },
//       { name: 'Cognizant', students: 16, avgStipend: 16500 }
//     ],
//     domains: [
//       { domain: 'Web Development', count: 128 },
//       { domain: 'Data Science', count: 95 },
//       { domain: 'Mobile Apps', count: 72 },
//       { domain: 'AI/ML', count: 68 },
//       { domain: 'Cloud Computing', count: 45 },
//       { domain: 'Cybersecurity', count: 38 },
//       { domain: 'Others', count: 41 }
//     ]
//   };

//   const data = analyticsData || mockData;

//   const StatCard = ({ icon: Icon, title, value, subtitle, trend, color }) => (
//     <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-all ${
//       darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
//     }`}>
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{title}</p>
//           <h3 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
//           {subtitle && <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>}
//         </div>
//         <div className={`p-3 rounded-lg ${color}`}>
//           <Icon className="w-6 h-6 text-white" />
//         </div>
//       </div>
//       {trend && (
//         <div className="mt-4 flex items-center text-sm">
//           <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
//           <span className="text-green-600 font-medium">{trend}</span>
//           <span className={`ml-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>vs last month</span>
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className={`min-h-screen transition-colors duration-300 ${
//       darkMode 
//         ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900' 
//         : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100'
//     }`}>
//       {/* Navbar */}
//       <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
//         isScrolled 
//           ? darkMode 
//             ? 'bg-gray-900/95 backdrop-blur-sm shadow-lg' 
//             : 'bg-white/95 backdrop-blur-sm shadow-lg'
//           : darkMode
//             ? 'bg-gray-900/50 backdrop-blur-sm'
//             : 'bg-white/50 backdrop-blur-sm'
//       }`}>
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center space-x-4">
//               <button
//                 onClick={() => navigate('/')}
//                 className={`p-2 rounded-lg transition-colors ${
//                   darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
//                 }`}
//                 title="Back to Home"
//               >
//                 <Home className={`w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
//               </button>
//               <div>
//                 <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
//                   InternTrack Analytics
//                 </h1>
//                 <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
//                   Comprehensive Internship Insights
//                 </p>
//               </div>
//             </div>

//             {/* Desktop Actions */}
//             <div className="hidden md:flex items-center space-x-3">
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
//                   darkMode 
//                     ? 'border-gray-700 hover:bg-gray-800 text-gray-300' 
//                     : 'border-gray-300 hover:bg-gray-50 text-gray-700'
//                 }`}
//               >
//                 <Filter className="w-4 h-4 mr-2" />
//                 Filters
//                 <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
//               </button>
//               <button
//                 onClick={toggleTheme}
//                 className={`p-2 rounded-lg transition-colors ${
//                   darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
//                 }`}
//                 title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
//               >
//                 {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//               </button>
//               <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
//                 <Download className="w-4 h-4 mr-2" />
//                 Export
//               </button>
//             </div>

//             {/* Mobile Menu Button */}
//             <div className="md:hidden flex items-center space-x-2">
//               <button
//                 onClick={toggleTheme}
//                 className={`p-2 rounded-lg transition-colors ${
//                   darkMode ? 'text-gray-300' : 'text-gray-700'
//                 }`}
//               >
//                 {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
//               </button>
//               <button
//                 onClick={() => setIsMenuOpen(!isMenuOpen)}
//                 className={`p-2 transition-colors ${
//                   darkMode ? 'text-gray-300' : 'text-gray-700'
//                 }`}
//               >
//                 {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
//               </button>
//             </div>
//           </div>

//           {/* Mobile Menu */}
//           {isMenuOpen && (
//             <div className={`md:hidden border-t py-4 ${
//               darkMode ? 'border-gray-700' : 'border-gray-200'
//             }`}>
//               <button
//                 onClick={() => {
//                   setShowFilters(!showFilters);
//                   setIsMenuOpen(false);
//                 }}
//                 className={`w-full flex items-center px-4 py-2 rounded-lg mb-2 ${
//                   darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
//                 }`}
//               >
//                 <Filter className="w-4 h-4 mr-2" />
//                 Filters
//               </button>
//               <button
//                 onClick={() => setIsMenuOpen(false)}
//                 className="w-full flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
//               >
//                 <Download className="w-4 h-4 mr-2" />
//                 Export Data
//               </button>
//             </div>
//           )}

//           {/* Filters Panel */}
//           {showFilters && (
//             <div className={`py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <div>
//                   <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                     Semester
//                   </label>
//                   <select
//                     value={filters.semester}
//                     onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
//                       darkMode 
//                         ? 'bg-gray-800 border-gray-700 text-gray-300' 
//                         : 'bg-white border-gray-300 text-gray-900'
//                     }`}
//                   >
//                     <option value="all">All Semesters</option>
//                     <option value="6th_internship">6th Internship</option>
//                     <option value="7th_internship">7th Internship</option>
//                     <option value="8th_internship">8th Internship</option>
//                     <option value="8th_project">8th Project</option>
//                     <option value="any_internship">Any Internship</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                     Batch
//                   </label>
//                   <select
//                     value={filters.batch}
//                     onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
//                       darkMode 
//                         ? 'bg-gray-800 border-gray-700 text-gray-300' 
//                         : 'bg-white border-gray-300 text-gray-900'
//                     }`}
//                   >
//                     <option value="all">All Batches</option>
//                     <option value="2021">2021</option>
//                     <option value="2022">2022</option>
//                     <option value="2023">2023</option>
//                     <option value="2024">2024</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                     Location
//                   </label>
//                   <select
//                     value={filters.location}
//                     onChange={(e) => setFilters({ ...filters, location: e.target.value })}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
//                       darkMode 
//                         ? 'bg-gray-800 border-gray-700 text-gray-300' 
//                         : 'bg-white border-gray-300 text-gray-900'
//                     }`}
//                   >
//                     <option value="all">All Locations</option>
//                     <option value="bangalore">Bangalore</option>
//                     <option value="hyderabad">Hyderabad</option>
//                     <option value="mumbai">Mumbai</option>
//                     <option value="delhi">Delhi NCR</option>
//                     <option value="pune">Pune</option>
//                     <option value="chennai">Chennai</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                     Company Type
//                   </label>
//                   <select
//                     value={filters.companyType}
//                     onChange={(e) => setFilters({ ...filters, companyType: e.target.value })}
//                     className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
//                       darkMode 
//                         ? 'bg-gray-800 border-gray-700 text-gray-300' 
//                         : 'bg-white border-gray-300 text-gray-900'
//                     }`}
//                   >
//                     <option value="all">All Types</option>
//                     <option value="startup">Startup</option>
//                     <option value="mnc">MNC</option>
//                     <option value="government">Government</option>
//                     <option value="psu">PSU</option>
//                     <option value="research">Research</option>
//                     <option value="academic_institute">Academic</option>
//                   </select>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
//         {loading ? (
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//           </div>
//         ) : (
//           <>
//             {/* Overview Stats */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
//               <StatCard
//                 icon={Users}
//                 title="Total Students"
//                 value={data.overview.totalStudents.toLocaleString()}
//                 subtitle="Registered"
//                 color="bg-blue-600"
//                 trend="+12%"
//               />
//               <StatCard
//                 icon={Activity}
//                 title="Active Internships"
//                 value={data.overview.activeInternships.toLocaleString()}
//                 subtitle="In Progress"
//                 color="bg-green-600"
//                 trend="+8%"
//               />
//               <StatCard
//                 icon={CheckCircle}
//                 title="Completed"
//                 value={data.overview.completedInternships.toLocaleString()}
//                 subtitle="Successful"
//                 color="bg-purple-600"
//                 trend="+15%"
//               />
//               <StatCard
//                 icon={DollarSign}
//                 title="Avg Stipend"
//                 value={`₹${data.overview.averageStipend.toLocaleString()}`}
//                 subtitle="Per Month"
//                 color="bg-yellow-600"
//                 trend="+5%"
//               />
//               <StatCard
//                 icon={TrendingUp}
//                 title="Highest Stipend"
//                 value={`₹${data.overview.highestStipend.toLocaleString()}`}
//                 subtitle="Achievement"
//                 color="bg-red-600"
//               />
//               <StatCard
//                 icon={Award}
//                 title="Placement Rate"
//                 value={`${data.overview.placementRate}%`}
//                 subtitle="Success Rate"
//                 color="bg-indigo-600"
//                 trend="+3%"
//               />
//             </div>

//             {/* Charts Row 1 */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//               {/* Semester-wise Distribution */}
//               <div className={`rounded-xl shadow-sm border p-6 ${
//                 darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
//               }`}>
//                 <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                   Semester-wise Distribution
//                 </h3>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={data.semesterWise}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
//                     <XAxis dataKey="semester" tick={{ fontSize: 12, fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
//                     <YAxis tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
//                     <Tooltip
//                       contentStyle={{
//                         backgroundColor: darkMode ? '#1F2937' : '#fff',
//                         border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
//                         borderRadius: '8px',
//                         color: darkMode ? '#F3F4F6' : '#111827'
//                       }}
//                     />
//                     <Legend />
//                     <Bar dataKey="count" fill="#3B82F6" name="Students" />
//                     <Bar dataKey="avgStipend" fill="#8B5CF6" name="Avg Stipend (₹)" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>

//               {/* Company Type Distribution */}
//               <div className={`rounded-xl shadow-sm border p-6 ${
//                 darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
//               }`}>
//                 <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                   Company Type Distribution
//                 </h3>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <PieChart>
//                     <Pie
//                       data={data.companyTypeDistribution}
//                       cx="50%"
//                       cy="50%"
//                       labelLine={false}
//                       label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
//                       outerRadius={100}
//                       fill="#8884d8"
//                       dataKey="value"
//                     >
//                       {data.companyTypeDistribution.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>
//                     <Tooltip
//                       contentStyle={{
//                         backgroundColor: darkMode ? '#1F2937' : '#fff',
//                         border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
//                         borderRadius: '8px'
//                       }}
//                     />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Charts Row 2 */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//               {/* Location-wise Analytics */}
//               <div className={`rounded-xl shadow-sm border p-6 ${
//                 darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
//               }`}>
//                 <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                   Location-wise Analytics
//                 </h3>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={data.locationWise} layout="horizontal">
//                     <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
//                     <XAxis type="number" tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
//                     <YAxis 
//                       dataKey="location" 
//                       type="category" 
//                       width={80} 
//                       tick={{ fontSize: 11, fill: darkMode ? '#9CA3AF' : '#6B7280' }} 
//                     />
//                     <Tooltip
//                       contentStyle={{
//                         backgroundColor: darkMode ? '#1F2937' : '#fff',
//                         border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
//                         borderRadius: '8px'
//                       }}
//                     />
//                     <Legend />
//                     <Bar dataKey="count" fill="#10B981" name="Students" />
//                     <Bar dataKey="avgStipend" fill="#F59E0B" name="Avg Stipend (₹)" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>

//               {/* Stipend Distribution */}
//               <div className={`rounded-xl shadow-sm border p-6 ${
//                 darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
//               }`}>
//                 <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                   Stipend Distribution
//                 </h3>
//                 <ResponsiveContainer width="100%" height={300}>
//                   <BarChart data={data.stipendDistribution}>
//                     <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
//                     <XAxis dataKey="range" tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
//                     <YAxis tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
//                     <Tooltip
//                       contentStyle={{
//                         backgroundColor: darkMode ? '#1F2937' : '#fff',
//                         border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
//                         borderRadius: '8px'
//                       }}
//                     />
//                     <Bar dataKey="count" fill="#6366F1" name="Students" />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             {/* Monthly Trend */}
//             <div className={`rounded-xl shadow-sm border p-6 mb-6 ${
//               darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
//             }`}>
//               <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                 Monthly Trend
//               </h3>
//               <ResponsiveContainer width="100%" height={300}>
//                 <LineChart data={data.monthlyTrend}>
//                   <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
//                   <XAxis dataKey="month" tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
//                   <YAxis tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }} />
//                   <Tooltip
//                     contentStyle={{
//                       backgroundColor: darkMode ? '#1F2937' : '#fff',
//                       border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
//                       borderRadius: '8px'
//                     }}
//                   />
//                   <Legend />
//                   <Line
//                     type="monotone"
//                     dataKey="internships"
//                     stroke="#3B82F6"
//                     strokeWidth={2}
//                     name="New Internships"
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="placements"
//                     stroke="#10B981"
//                     strokeWidth={2}
//                     name="Placements"
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>

//             {/* Bottom Section */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Top Companies */}
//               <div className={`rounded-xl shadow-sm border p-6 ${
//                 darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
//               }`}>
//                 <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                   Top Companies
//                 </h3>
//                 <div className="space-y-4">
//                   {data.topCompanies.map((company, index) => (
//                     <div 
//                       key={index} 
//                       className={`flex items-center justify-between p-3 rounded-lg ${
//                         darkMode ? 'bg-gray-900/50' : 'bg-gray-50'
//                       }`}
//                     >
//                       <div className="flex items-center space-x-3">
//                         <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                           <span className="text-sm font-bold text-blue-600">{index + 1}</span>
//                         </div>
//                         <div>
//                           <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                             {company.name}
//                           </p>
//                           <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
//                             {company.students} students
//                           </p>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                           ₹{company.avgStipend.toLocaleString()}
//                         </p>
//                         <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
//                           avg stipend
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>

//               {/* Top Domains */}
//               <div className={`rounded-xl shadow-sm border p-6 ${
//                 darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100'
//               }`}>
//                 <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                   Popular Domains
//                 </h3>
//                 <div className="space-y-3">
//                   {data.domains.map((domain, index) => (
//                     <div key={index}>
//                       <div className="flex items-center justify-between mb-1">
//                         <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
//                           {domain.domain}
//                         </span>
//                         <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
//                           {domain.count}
//                         </span>
//                       </div>
//                       <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
//                         <div
//                           className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
//                           style={{ width: `${(domain.count / data.overview.totalStudents) * 100}%` }}
//                         ></div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Analytics;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, TrendingUp, DollarSign, Award, Filter,
  Download, ChevronDown, Activity, CheckCircle, X, Menu
} from 'lucide-react';
import { useApi } from '../hooks/useApi';
import SharedNavbar from '../pages/shared/Sharednavbar';
import SharedFooter from '../pages/shared/Sharedfooter';

const Analytics = () => {
  const navigate = useNavigate();
  const { execute, loading } = useApi();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({ semester: 'all', batch: 'all', location: 'all', companyType: 'all' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('theme');
    if (s) setDarkMode(s === 'dark');
  }, []);
  useEffect(() => { localStorage.setItem('theme', darkMode ? 'dark' : 'light'); }, [darkMode]);
  useEffect(() => { fetchAnalytics(); }, [filters]);

  const fetchAnalytics = async () => {
    try {
      const response = await execute(() =>
        fetch(`${import.meta.env.VITE_API_URL}/analytics?${new URLSearchParams(filters)}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }).then(r => r.json())
      );
      setAnalyticsData(response?.data);
    } catch (e) { console.error(e); }
  };

  const mock = {
    overview: { totalStudents: 487, activeInternships: 312, completedInternships: 175, averageStipend: 15420, highestStipend: 50000, placementRate: 78.5 },
    semesterWise: [
      { semester: '6th', count: 142, avgStipend: 12000 },
      { semester: '7th', count: 98, avgStipend: 16500 },
      { semester: '8th Int.', count: 72, avgStipend: 18200 },
      { semester: '8th Proj.', count: 65, avgStipend: 0 },
      { semester: 'Any', count: 110, avgStipend: 14800 }
    ],
    companyTypeDistribution: [
      { name: 'Startups', value: 145, color: '#4F46E5' },
      { name: 'MNC', value: 98, color: '#0891B2' },
      { name: 'Government', value: 42, color: '#059669' },
      { name: 'PSU', value: 28, color: '#D97706' },
      { name: 'Research', value: 35, color: '#E11D48' },
      { name: 'Academic', value: 52, color: '#7C3AED' },
      { name: 'Other', value: 87, color: '#71717A' }
    ],
    locationWise: [
      { location: 'Bangalore', count: 95, avgStipend: 22000 },
      { location: 'Hyderabad', count: 78, avgStipend: 19500 },
      { location: 'Mumbai', count: 62, avgStipend: 21000 },
      { location: 'Delhi NCR', count: 71, avgStipend: 20500 },
      { location: 'Pune', count: 54, avgStipend: 18000 },
      { location: 'Chennai', count: 48, avgStipend: 17500 },
      { location: 'Others', count: 79, avgStipend: 13500 }
    ],
    stipendDistribution: [
      { range: '0-5k', count: 85 }, { range: '5-10k', count: 142 },
      { range: '10-15k', count: 98 }, { range: '15-20k', count: 67 },
      { range: '20-30k', count: 42 }, { range: '30k+', count: 28 }
    ],
    monthlyTrend: [
      { month: 'Jan', internships: 42, placements: 12 }, { month: 'Feb', internships: 58, placements: 18 },
      { month: 'Mar', internships: 65, placements: 22 }, { month: 'Apr', internships: 72, placements: 25 },
      { month: 'May', internships: 89, placements: 31 }, { month: 'Jun', internships: 95, placements: 38 },
      { month: 'Jul', internships: 87, placements: 35 }, { month: 'Aug', internships: 78, placements: 28 }
    ],
    topCompanies: [
      { name: 'TCS', students: 28, avgStipend: 15000 }, { name: 'Infosys', students: 24, avgStipend: 18000 },
      { name: 'Wipro', students: 22, avgStipend: 16000 }, { name: 'Tech Mahindra', students: 18, avgStipend: 17500 },
      { name: 'Cognizant', students: 16, avgStipend: 16500 }
    ],
    domains: [
      { domain: 'Web Development', count: 128 }, { domain: 'Data Science', count: 95 },
      { domain: 'Mobile Apps', count: 72 }, { domain: 'AI/ML', count: 68 },
      { domain: 'Cloud Computing', count: 45 }, { domain: 'Cybersecurity', count: 38 }, { domain: 'Others', count: 41 }
    ]
  };

  const data = analyticsData || mock;

  const tt = darkMode
    ? { backgroundColor: '#18181B', border: '1px solid #3F3F46', borderRadius: '10px', color: '#FAFAFA', fontSize: '13px' }
    : { backgroundColor: '#fff', border: '1px solid #E4E4E7', borderRadius: '10px', color: '#09090B', fontSize: '13px' };

  const gridColor = darkMode ? '#3F3F46' : '#F4F4F5';
  const axisColor = darkMode ? '#71717A' : '#A1A1AA';

  const StatCard = ({ icon: Icon, title, value, subtitle, trend, iconBg, iconColor }) => (
    <div className={`a-stat ${darkMode ? 'dark' : ''}`}>
      <div className="a-stat-left">
        <p className="a-stat-title">{title}</p>
        <h3 className="a-stat-value">{value}</h3>
        {subtitle && <p className="a-stat-sub">{subtitle}</p>}
        {trend && (
          <div className="a-stat-trend">
            <TrendingUp size={13}/> <span>{trend}</span>
            <span className="a-stat-trend-label">vs last month</span>
          </div>
        )}
      </div>
      <div className="a-stat-icon" style={{ background: iconBg }}>
        <Icon size={20} color={iconColor || '#fff'}/>
      </div>
    </div>
  );

  const ChartCard = ({ title, children }) => (
    <div className={`a-chart ${darkMode ? 'dark' : ''}`}>
      <h3 className="a-chart-title">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className={`a-root ${darkMode ? 'dark' : ''}`}>

      {/* ── Shared Navbar ───────────────────────────────────────────── */}
      <SharedNavbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNavigateToLogin={() => navigate('/login')}
      />

      {/* Page header strip */}
      <div className={`a-page-header ${darkMode ? 'dark' : ''}`}>
        <div className="a-page-header-inner">
          <div>
            <h1 className="a-page-title">IPMS Analytics</h1>
            <p className="a-page-sub">MITS Gwalior — Internship Insights</p>
          </div>
          <div className="a-page-actions">
            <button
              className={`a-filter-btn ${darkMode ? 'dark' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14}/> Filters
              <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}/>
            </button>
            <button className="a-export-btn">
              <Download size={14}/> Export
            </button>
          </div>
        </div>

        {showFilters && (
          <div className={`a-filters ${darkMode ? 'dark' : ''}`}>
            <div className="a-filters-grid">
              {[
                { key: 'semester', label: 'Semester', opts: [['all','All Semesters'],['6th_internship','6th Internship'],['7th_internship','7th Internship'],['8th_internship','8th Internship'],['8th_project','8th Project'],['any_internship','Any Internship']] },
                { key: 'batch', label: 'Batch', opts: [['all','All Batches'],['2021','2021'],['2022','2022'],['2023','2023'],['2024','2024']] },
                { key: 'location', label: 'Location', opts: [['all','All Locations'],['bangalore','Bangalore'],['hyderabad','Hyderabad'],['mumbai','Mumbai'],['delhi','Delhi NCR'],['pune','Pune'],['chennai','Chennai']] },
                { key: 'companyType', label: 'Company Type', opts: [['all','All Types'],['startup','Startup'],['mnc','MNC'],['government','Government'],['psu','PSU'],['research','Research'],['academic_institute','Academic']] },
              ].map(({ key, label, opts }) => (
                <div key={key}>
                  <label className="a-filter-label">{label}</label>
                  <select
                    value={filters[key]}
                    onChange={e => setFilters({ ...filters, [key]: e.target.value })}
                    className={`a-select ${darkMode ? 'dark' : ''}`}
                  >
                    {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="a-content">
        {loading ? (
          <div className="a-loading">
            <div className="a-spinner"/>
            <p className={darkMode ? 'text-gray' : ''}>Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="a-stats-grid">
              <StatCard icon={Users} title="Total Students" value={data.overview.totalStudents.toLocaleString()} subtitle="Registered" trend="+12%" iconBg="#EEF2FF" iconColor="#4F46E5"/>
              <StatCard icon={Activity} title="Active Internships" value={data.overview.activeInternships.toLocaleString()} subtitle="In Progress" trend="+8%" iconBg="#ECFDF5" iconColor="#059669"/>
              <StatCard icon={CheckCircle} title="Completed" value={data.overview.completedInternships.toLocaleString()} subtitle="Successful" trend="+15%" iconBg="#F5F3FF" iconColor="#7C3AED"/>
              <StatCard icon={DollarSign} title="Avg Stipend" value={`₹${data.overview.averageStipend.toLocaleString()}`} subtitle="Per Month" trend="+5%" iconBg="#FFFBEB" iconColor="#D97706"/>
              <StatCard icon={TrendingUp} title="Highest Stipend" value={`₹${data.overview.highestStipend.toLocaleString()}`} subtitle="Achievement" iconBg="#FFF1F2" iconColor="#E11D48"/>
              <StatCard icon={Award} title="Placement Rate" value={`${data.overview.placementRate}%`} subtitle="Success Rate" trend="+3%" iconBg="#ECFEFF" iconColor="#0891B2"/>
            </div>

            {/* Charts Row 1 */}
            <div className="a-charts-row">
              <ChartCard title="Semester-wise Distribution">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.semesterWise} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                    <XAxis dataKey="semester" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={tt}/>
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}/>
                    <Bar dataKey="count" fill="#4F46E5" name="Students" radius={[4,4,0,0]}/>
                    <Bar dataKey="avgStipend" fill="#0891B2" name="Avg Stipend (₹)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Company Type Distribution">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={data.companyTypeDistribution} cx="50%" cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0.06 ? `${name} ${(percent*100).toFixed(0)}%` : ''}
                      outerRadius={100} dataKey="value"
                    >
                      {data.companyTypeDistribution.map((e, i) => <Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip contentStyle={tt}/>
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Charts Row 2 */}
            <div className="a-charts-row">
              <ChartCard title="Location-wise Analytics">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.locationWise} layout="horizontal" margin={{ top: 8, right: 8, left: 60, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false}/>
                    <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}/>
                    <YAxis dataKey="location" type="category" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={tt}/>
                    <Legend wrapperStyle={{ fontSize: '12px' }}/>
                    <Bar dataKey="count" fill="#059669" name="Students" radius={[0,4,4,0]}/>
                    <Bar dataKey="avgStipend" fill="#D97706" name="Avg Stipend (₹)" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Stipend Distribution">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.stipendDistribution} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={tt}/>
                    <Bar dataKey="count" fill="#7C3AED" name="Students" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Monthly Trend */}
            <ChartCard title="Monthly Trend — Internships vs Placements">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.monthlyTrend} margin={{ top: 8, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={tt}/>
                  <Legend wrapperStyle={{ fontSize: '12px' }}/>
                  <Line type="monotone" dataKey="internships" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 4 }} name="New Internships"/>
                  <Line type="monotone" dataKey="placements" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} name="Placements"/>
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Bottom */}
            <div className="a-charts-row">
              <ChartCard title="Top Companies">
                <div className="a-companies">
                  {data.topCompanies.map((c, i) => (
                    <div key={i} className={`a-company-row ${darkMode ? 'dark' : ''}`}>
                      <div className="a-company-left">
                        <div className="a-company-rank">{i+1}</div>
                        <div>
                          <p className="a-company-name">{c.name}</p>
                          <p className="a-company-students">{c.students} students</p>
                        </div>
                      </div>
                      <div>
                        <p className="a-company-stipend">₹{c.avgStipend.toLocaleString()}</p>
                        <p className="a-company-slabel">avg stipend</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Popular Domains">
                <div className="a-domains">
                  {data.domains.map((d, i) => (
                    <div key={i} className="a-domain-item">
                      <div className="a-domain-header">
                        <span className="a-domain-name">{d.domain}</span>
                        <span className="a-domain-count">{d.count}</span>
                      </div>
                      <div className={`a-domain-bar-bg ${darkMode ? 'dark' : ''}`}>
                        <div
                          className="a-domain-bar"
                          style={{
                            width: `${(d.count / data.overview.totalStudents) * 100}%`,
                            background: `hsl(${i * 45 + 230}, 70%, 55%)`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </div>
          </>
        )}
      </div>

      {/* ── Shared Footer ───────────────────────────────────────────── */}
      <SharedFooter />

      <style>{`
        .a-root{
          --c-bg:#FAFAFA; --c-surface:#fff; --c-surface2:#F4F4F5;
          --c-border:#E4E4E7; --c-text:#09090B; --c-text2:#52525B; --c-text3:#A1A1AA;
          --c-primary:#4F46E5;
          background:var(--c-bg); color:var(--c-text);
          font-family:-apple-system,'Segoe UI',sans-serif; min-height:100vh;
        }
        .a-root.dark{
          --c-bg:#09090B; --c-surface:#18181B; --c-surface2:#27272A;
          --c-border:#3F3F46; --c-text:#FAFAFA; --c-text2:#A1A1AA; --c-text3:#71717A;
        }

        /* Page header */
        .a-page-header{
          background:var(--c-surface); border-bottom:1px solid var(--c-border);
        }
        .a-page-header-inner{
          max-width:1280px; margin:0 auto; padding:20px 24px;
          display:flex; align-items:center; justify-content:space-between; gap:16px;
          flex-wrap:wrap;
        }
        .a-page-title{ font-size:20px; font-weight:700; color:var(--c-text); margin:0 0 3px; }
        .a-page-sub{ font-size:12.5px; color:var(--c-text3); margin:0; }
        .a-page-actions{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .a-filter-btn{
          display:flex; align-items:center; gap:6px;
          padding:8px 14px; border-radius:8px;
          border:1px solid var(--c-border); background:var(--c-surface);
          font-size:13px; font-weight:500; color:var(--c-text2); cursor:pointer;
          transition:all .15s;
        }
        .a-filter-btn:hover{ background:var(--c-surface2); }
        .a-export-btn{
          display:flex; align-items:center; gap:6px;
          padding:8px 16px; border-radius:8px;
          background:#4F46E5; color:#fff; border:none;
          font-size:13px; font-weight:600; cursor:pointer;
          transition:all .15s;
        }
        .a-export-btn:hover{ background:#3730A3; }
        .a-filters{
          background:var(--c-surface); border-top:1px solid var(--c-border);
          padding:20px 24px;
        }
        .a-filters-grid{
          max-width:1280px; margin:0 auto;
          display:grid; grid-template-columns:repeat(4,1fr); gap:16px;
        }
        @media(max-width:768px){ .a-filters-grid{ grid-template-columns:repeat(2,1fr); } }
        .a-filter-label{ font-size:12px; font-weight:600; color:var(--c-text2); display:block; margin-bottom:7px; }
        .a-select{
          width:100%; padding:8px 12px; border-radius:8px;
          border:1px solid var(--c-border); background:var(--c-surface);
          font-size:13px; color:var(--c-text); outline:none;
          transition:border-color .15s;
        }
        .a-select:focus{ border-color:#4F46E5; }

        .a-content{ max-width:1280px; margin:0 auto; padding:28px 24px 48px; }
        .a-loading{ display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; gap:16px; }
        .a-spinner{ width:36px; height:36px; border:3px solid var(--c-border); border-top-color:#4F46E5; border-radius:50%; animation:aspin .7s linear infinite; }
        @keyframes aspin{ to{ transform:rotate(360deg); } }
        .text-gray{ color:var(--c-text3); font-size:14px; }

        .a-stats-grid{
          display:grid; grid-template-columns:repeat(6,1fr); gap:14px; margin-bottom:20px;
        }
        @media(max-width:1100px){ .a-stats-grid{ grid-template-columns:repeat(3,1fr); } }
        @media(max-width:600px){ .a-stats-grid{ grid-template-columns:repeat(2,1fr); } }
        .a-stat{
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:12px; padding:18px; display:flex; justify-content:space-between;
          align-items:flex-start; gap:8px;
          box-shadow:0 1px 3px rgba(0,0,0,.04);
          transition:transform .2s, box-shadow .2s;
        }
        .a-stat:hover{ transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,.08); }
        .a-stat-left{ flex:1; min-width:0; }
        .a-stat-title{ font-size:11.5px; font-weight:500; color:var(--c-text3); margin:0 0 6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .a-stat-value{ font-size:20px; font-weight:800; color:var(--c-text); margin:0 0 3px; }
        .a-stat-sub{ font-size:11px; color:var(--c-text3); margin:0; }
        .a-stat-trend{ display:flex; align-items:center; gap:4px; margin-top:6px; font-size:11.5px; color:#059669; }
        .a-stat-trend svg{ flex-shrink:0; }
        .a-stat-trend span:first-of-type{ font-weight:600; }
        .a-stat-trend-label{ color:var(--c-text3); font-weight:400; }
        .a-stat-icon{
          width:38px; height:38px; border-radius:9px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }

        .a-charts-row{
          display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;
        }
        @media(max-width:900px){ .a-charts-row{ grid-template-columns:1fr; } }
        .a-chart{
          background:var(--c-surface); border:1px solid var(--c-border);
          border-radius:12px; padding:22px;
          box-shadow:0 1px 3px rgba(0,0,0,.04);
          margin-bottom:16px;
        }
        .a-chart-title{ font-size:14px; font-weight:700; color:var(--c-text); margin:0 0 18px; }

        .a-companies{ display:flex; flex-direction:column; gap:8px; }
        .a-company-row{
          display:flex; align-items:center; justify-content:space-between;
          padding:10px 14px; border-radius:9px; background:var(--c-surface2);
          transition:background .15s;
        }
        .a-company-row:hover{ background:var(--c-border); }
        .a-company-left{ display:flex; align-items:center; gap:12px; }
        .a-company-rank{
          width:28px; height:28px; border-radius:50%;
          background:#EEF2FF; color:#4F46E5;
          font-size:12px; font-weight:700;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .a-company-name{ font-size:13.5px; font-weight:600; color:var(--c-text); margin:0 0 2px; }
        .a-company-students{ font-size:12px; color:var(--c-text3); margin:0; }
        .a-company-stipend{ font-size:14px; font-weight:700; color:var(--c-text); margin:0 0 2px; text-align:right; }
        .a-company-slabel{ font-size:11px; color:var(--c-text3); margin:0; text-align:right; }

        .a-domains{ display:flex; flex-direction:column; gap:12px; }
        .a-domain-item{ display:flex; flex-direction:column; gap:5px; }
        .a-domain-header{ display:flex; justify-content:space-between; align-items:center; }
        .a-domain-name{ font-size:13px; font-weight:500; color:var(--c-text2); }
        .a-domain-count{ font-size:13px; font-weight:700; color:var(--c-text); }
        .a-domain-bar-bg{ width:100%; height:6px; border-radius:999px; background:var(--c-surface2); overflow:hidden; }
        .a-domain-bar{ height:100%; border-radius:999px; transition:width .6s ease; }
      `}</style>
    </div>
  );
};

export default Analytics;