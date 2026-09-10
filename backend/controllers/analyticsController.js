// controllers/analyticsController.js
const Submission = require('../models/Submission');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// @desc    Get comprehensive analytics data
// @route   GET /api/analytics
// @access  Public (or protect it if you want)
const getAnalytics = async (req, res) => {
  try {
    const { semester, batch, location, companyType } = req.query;

    // Build filter query
    let filter = {};
    if (semester && semester !== 'all') {
      filter.semesterType = semester;
    }

    // Get all submissions
    const allSubmissions = await Submission.find(filter)
      .populate('student', 'enrollmentNo branch')
      .lean();

    // Get all students
    const allStudents = await User.find({ role: 'student' }).lean();

    // Calculate overview stats
    const totalStudents = allStudents.length;
    const activeInternships = allSubmissions.filter(s => 
      s.currentStep !== 'completed' && s.status === 'approved'
    ).length;
    const completedInternships = allSubmissions.filter(s => 
      s.currentStep === 'completed'
    ).length;

    // Calculate stipend statistics
    const stipendData = allSubmissions
      .filter(s => s.registrationData?.hasStipend && s.registrationData?.stipendAmount)
      .map(s => s.registrationData.stipendAmount);

    const averageStipend = stipendData.length > 0
      ? Math.round(stipendData.reduce((a, b) => a + b, 0) / stipendData.length)
      : 0;
    const highestStipend = stipendData.length > 0 ? Math.max(...stipendData) : 0;

    // Calculate placement rate (students who got placement)
    const placedStudents = allSubmissions.filter(s => 
      s.finalReport?.hasPlacement === true || s.finalReport?.hasPPO === true
    ).length;
    const placementRate = totalStudents > 0 
      ? ((placedStudents / totalStudents) * 100).toFixed(1)
      : 0;

    // Semester-wise distribution
    const semesterTypes = ['6th_internship', '7th_internship', '8th_internship', '8th_project', 'any_internship'];
    const semesterWise = semesterTypes.map(sem => {
      const semSubmissions = allSubmissions.filter(s => s.semesterType === sem);
      const semStipends = semSubmissions
        .filter(s => s.registrationData?.stipendAmount)
        .map(s => s.registrationData.stipendAmount);
      
      return {
        semester: sem.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: semSubmissions.length,
        avgStipend: semStipends.length > 0 
          ? Math.round(semStipends.reduce((a, b) => a + b, 0) / semStipends.length)
          : 0
      };
    });

    // Company type distribution
    const companyTypes = ['startup', 'mnc', 'government', 'psu', 'research', 'academic_institute', 'other'];
    const companyColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#64748B'];
    
    const companyTypeDistribution = companyTypes.map((type, index) => {
      const count = allSubmissions.filter(s => 
        s.registrationData?.companyType === type
      ).length;
      
      return {
        name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: count,
        color: companyColors[index]
      };
    }).filter(c => c.value > 0);

    // Location-wise analytics
    const locationMap = {};
    allSubmissions.forEach(s => {
      if (s.registrationData?.companyFullAddress) {
        // Extract city from address (simple extraction, can be improved)
        const address = s.registrationData.companyFullAddress.toLowerCase();
        let city = 'Others';
        
        if (address.includes('bangalore') || address.includes('bengaluru')) city = 'Bangalore';
        else if (address.includes('hyderabad')) city = 'Hyderabad';
        else if (address.includes('mumbai')) city = 'Mumbai';
        else if (address.includes('delhi') || address.includes('noida') || address.includes('gurgaon')) city = 'Delhi NCR';
        else if (address.includes('pune')) city = 'Pune';
        else if (address.includes('chennai')) city = 'Chennai';

        if (!locationMap[city]) {
          locationMap[city] = {
            location: city,
            count: 0,
            stipends: []
          };
        }
        locationMap[city].count++;
        if (s.registrationData?.stipendAmount) {
          locationMap[city].stipends.push(s.registrationData.stipendAmount);
        }
      }
    });

    const locationWise = Object.values(locationMap).map(loc => ({
      location: loc.location,
      count: loc.count,
      avgStipend: loc.stipends.length > 0
        ? Math.round(loc.stipends.reduce((a, b) => a + b, 0) / loc.stipends.length)
        : 0
    })).sort((a, b) => b.count - a.count);

    // Stipend distribution
    const stipendRanges = [
      { range: '0-5k', min: 0, max: 5000 },
      { range: '5k-10k', min: 5000, max: 10000 },
      { range: '10k-15k', min: 10000, max: 15000 },
      { range: '15k-20k', min: 15000, max: 20000 },
      { range: '20k-30k', min: 20000, max: 30000 },
      { range: '30k+', min: 30000, max: Infinity }
    ];

    const stipendDistribution = stipendRanges.map(range => ({
      range: range.range,
      count: stipendData.filter(s => s >= range.min && s < range.max).length
    }));

    // Monthly trend (last 8 months)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthSubmissions = allSubmissions.filter(s => {
        const createdDate = new Date(s.createdAt);
        return createdDate >= monthDate && createdDate <= monthEnd;
      });

      const monthPlacements = allSubmissions.filter(s => {
        const completedDate = s.completedAt ? new Date(s.completedAt) : null;
        return completedDate && completedDate >= monthDate && completedDate <= monthEnd &&
               (s.finalReport?.hasPlacement || s.finalReport?.hasPPO);
      });

      monthlyTrend.push({
        month: monthDate.toLocaleString('default', { month: 'short' }),
        internships: monthSubmissions.length,
        placements: monthPlacements.length
      });
    }

    // Top companies by student count
    const companyMap = {};
    allSubmissions.forEach(s => {
      if (s.registrationData?.companyName) {
        const company = s.registrationData.companyName;
        if (!companyMap[company]) {
          companyMap[company] = {
            name: company,
            students: 0,
            stipends: []
          };
        }
        companyMap[company].students++;
        if (s.registrationData?.stipendAmount) {
          companyMap[company].stipends.push(s.registrationData.stipendAmount);
        }
      }
    });

    const topCompanies = Object.values(companyMap)
      .map(c => ({
        name: c.name,
        students: c.students,
        avgStipend: c.stipends.length > 0
          ? Math.round(c.stipends.reduce((a, b) => a + b, 0) / c.stipends.length)
          : 0
      }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 5);

    // Domain distribution
    const domainMap = {};
    allSubmissions.forEach(s => {
      if (s.registrationData?.internshipDomain) {
        const domain = s.registrationData.internshipDomain;
        domainMap[domain] = (domainMap[domain] || 0) + 1;
      }
    });

    const domains = Object.entries(domainMap)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    // Prepare response
    const analyticsData = {
      overview: {
        totalStudents,
        activeInternships,
        completedInternships,
        averageStipend,
        highestStipend,
        placementRate: parseFloat(placementRate)
      },
      semesterWise,
      companyTypeDistribution,
      locationWise,
      stipendDistribution,
      monthlyTrend,
      topCompanies,
      domains
    };

    successResponse(res, analyticsData, 'Analytics data retrieved successfully');

  } catch (error) {
    console.error('Get analytics error:', error);
    errorResponse(res, 'Failed to retrieve analytics data', 500);
  }
};

module.exports = {
  getAnalytics
};