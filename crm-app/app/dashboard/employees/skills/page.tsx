'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Award, 
  Plus, 
  Search, 
  Filter,
  Star,
  CheckCircle,
  Calendar,
  Building,
  Users,
  Edit,
  Trash2,
  Eye,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { EmployeeSkill, EmployeeCertification, Employee } from '@/types/database';

interface SkillWithEmployee extends EmployeeSkill {
  employees?: {
    first_name: string;
    last_name: string;
    job_title: string;
    departments?: {
      department_name: string;
    };
  };
}

interface CertificationWithEmployee extends EmployeeCertification {
  employees?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
}

export default function SkillsManagement() {
  const [activeTab, setActiveTab] = useState('skills');
  const [skills, setSkills] = useState<SkillWithEmployee[]>([]);
  const [certifications, setCertifications] = useState<CertificationWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load skills with employee data
      const { data: skillsData } = await supabase
        .from('employee_skills')
        .select(`
          *,
          employees(
            first_name,
            last_name,
            job_title,
            departments(department_name)
          )
        `)
        .order('skill_category', { ascending: true });

      // Load certifications with employee data
      const { data: certificationsData } = await supabase
        .from('employee_certifications')
        .select(`
          *,
          employees(
            first_name,
            last_name,
            job_title
          )
        `)
        .order('certification_name', { ascending: true });

      // Load employees for dropdown
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, job_title')
        .eq('employment_status', 'Active')
        .order('first_name');

      setSkills(skillsData || []);
      setCertifications(certificationsData || []);
      setEmployees(employeesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = searchTerm === '' || 
      skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.skill_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.employees?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.employees?.last_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === '' || skill.skill_category === selectedCategory;
    const matchesLevel = selectedLevel === '' || skill.proficiency_level === selectedLevel;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = searchTerm === '' || 
      cert.certification_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.issuing_authority.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.employees?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.employees?.last_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const skillCategories = [...new Set(skills.map(skill => skill.skill_category))];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'bg-green-100 text-green-700';
      case 'Advanced': return 'bg-blue-100 text-blue-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Beginner': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCertificationStatusColor = (status?: string) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 text-green-700';
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Expired': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isExpiringCertification = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow;
  };

  // Statistics
  const skillStats = {
    totalSkills: skills.length,
    uniqueCategories: skillCategories.length,
    expertLevel: skills.filter(s => s.proficiency_level === 'Expert').length,
    certified: skills.filter(s => s.is_certified).length
  };

  const certStats = {
    totalCertifications: certifications.length,
    verified: certifications.filter(c => c.verification_status === 'Verified').length,
    expiringSoon: certifications.filter(c => isExpiringCertification(c.expiry_date)).length,
    unique: [...new Set(certifications.map(c => c.certification_name))].length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4"></div>
            <div className="h-10 bg-neutral-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h2 font-bold text-neutral-900">Skills & Certifications</h1>
            <p className="text-body text-neutral-700 mt-1">
              Manage employee skills, certifications, and professional development
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <Link href="/dashboard/employees/skills/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Skill/Certification
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-small font-medium text-blue-700">Total Skills</span>
            </div>
            <p className="text-h3 font-bold text-blue-900 mt-1">{skillStats.totalSkills}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-small font-medium text-green-700">Expert Level</span>
            </div>
            <p className="text-h3 font-bold text-green-900 mt-1">{skillStats.expertLevel}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-600" />
              <span className="text-small font-medium text-purple-700">Certifications</span>
            </div>
            <p className="text-h3 font-bold text-purple-900 mt-1">{certStats.totalCertifications}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <span className="text-small font-medium text-orange-700">Expiring Soon</span>
            </div>
            <p className="text-h3 font-bold text-orange-900 mt-1">{certStats.expiringSoon}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-glass-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('skills')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'skills'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Skills ({filteredSkills.length})
            </button>
            <button
              onClick={() => setActiveTab('certifications')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'certifications'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Certifications ({filteredCertifications.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-small transition-colors ${
                activeTab === 'analytics'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-700 hover:text-neutral-900'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder={activeTab === 'skills' ? 'Search skills, categories, or employees...' : 'Search certifications or employees...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>

          {/* Filters */}
          {showFilters && activeTab === 'skills' && (
            <div className="p-4 bg-glass-light rounded-lg border border-glass-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">All Categories</option>
                    {skillCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-small font-medium text-neutral-700 mb-2">
                    Proficiency Level
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">All Levels</option>
                    {skillLevels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                      setSelectedLevel('');
                    }}
                    className="btn-secondary w-full"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          {filteredSkills.map((skill) => (
            <div key={skill.id} className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-h3 font-bold text-neutral-900">{skill.skill_name}</h3>
                    <div className={`px-2 py-1 rounded-full text-tiny font-medium ${getSkillLevelColor(skill.proficiency_level)}`}>
                      {skill.proficiency_level}
                    </div>
                    {skill.is_certified && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-tiny">
                        <CheckCircle className="w-3 h-3" />
                        Certified
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-small text-neutral-700">
                    <span>Category: {skill.skill_category}</span>
                    {skill.skill_subcategory && <span>Subcategory: {skill.skill_subcategory}</span>}
                    {skill.years_experience && <span>Experience: {skill.years_experience} years</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Users className="w-4 h-4 text-neutral-500" />
                    <span className="text-small text-neutral-700">
                      {skill.employees?.first_name} {skill.employees?.last_name} • {skill.employees?.job_title}
                    </span>
                    {skill.employees?.departments && (
                      <>
                        <span className="text-neutral-400">•</span>
                        <span className="text-small text-neutral-700">{skill.employees.departments.department_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/employees/profile/${skill.employee_id}`}
                    className="btn-outline p-2"
                    title="View Employee"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button className="btn-outline p-2" title="Edit Skill">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="btn-outline p-2 text-red-600 hover:bg-red-50" title="Delete Skill">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Rating Information */}
              {(skill.quality_rating || skill.speed_rating || skill.consistency_rating) && (
                <div className="mt-4 pt-4 border-t border-glass-border">
                  <div className="flex items-center gap-6">
                    {skill.quality_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-small text-neutral-700">Quality:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-orange-500 fill-current" />
                          <span className="font-medium">{skill.quality_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                    {skill.speed_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-small text-neutral-700">Speed:</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{skill.speed_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                    {skill.consistency_rating && (
                      <div className="flex items-center gap-2">
                        <span className="text-small text-neutral-700">Consistency:</span>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{skill.consistency_rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredSkills.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Award className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-h3 font-bold text-neutral-900 mb-2">No skills found</h3>
              <p className="text-body text-neutral-700">
                {searchTerm || selectedCategory || selectedLevel
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by adding employee skills.'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'certifications' && (
        <div className="space-y-4">
          {filteredCertifications.map((cert) => (
            <div key={cert.id} className="glass-card p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-h3 font-bold text-neutral-900">{cert.certification_name}</h3>
                    <div className={`px-2 py-1 rounded-full text-tiny font-medium ${getCertificationStatusColor(cert.verification_status)}`}>
                      {cert.verification_status || 'Pending'}
                    </div>
                    {isExpiringCertification(cert.expiry_date) && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-tiny">
                        <Calendar className="w-3 h-3" />
                        Expiring Soon
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-small text-neutral-700 mb-2">
                    <span>Authority: {cert.issuing_authority}</span>
                    {cert.certification_number && <span>Number: {cert.certification_number}</span>}
                    {cert.certification_level && <span>Level: {cert.certification_level}</span>}
                  </div>
                  <div className="flex items-center gap-6 text-small text-neutral-700 mb-2">
                    <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                    {cert.expiry_date && (
                      <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                    )}
                    {cert.cost_aed && <span>Cost: AED {cert.cost_aed.toLocaleString()}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-neutral-500" />
                    <span className="text-small text-neutral-700">
                      {cert.employees?.first_name} {cert.employees?.last_name} • {cert.employees?.job_title}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/employees/profile/${cert.employee_id}`}
                    className="btn-outline p-2"
                    title="View Employee"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button className="btn-outline p-2" title="Edit Certification">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="btn-outline p-2 text-red-600 hover:bg-red-50" title="Delete Certification">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredCertifications.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Star className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-h3 font-bold text-neutral-900 mb-2">No certifications found</h3>
              <p className="text-body text-neutral-700">
                {searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by adding employee certifications.'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="glass-card p-12 text-center">
          <TrendingUp className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-h3 font-bold text-neutral-900 mb-2">Skills Analytics</h3>
          <p className="text-body text-neutral-700">
            Skills analytics dashboard is coming soon. Track skill gaps, certification compliance, and team competencies.
          </p>
        </div>
      )}
    </div>
  );
}