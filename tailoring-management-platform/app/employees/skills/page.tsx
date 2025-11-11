'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Award, 
  BookOpen, 
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { 
  Employee, 
  EmployeeSkill, 
  EmployeeCertification,
  SkillsAnalytics
} from '@/types/employee';
import { 
  formatEmployeeName, 
  getProficiencyColor,
  getEmployeeStatusColor 
} from '@/types/employee';

interface SkillWithEmployee extends EmployeeSkill {
  employee: Employee;
}

interface CertificationWithEmployee extends EmployeeCertification {
  employee: Employee;
}

export default function SkillsManagementPage() {
  const [activeTab, setActiveTab] = useState<'skills' | 'certifications' | 'analytics'>('skills');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProficiency, setSelectedProficiency] = useState<string>('');
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillWithEmployee | null>(null);

  const queryClient = useQueryClient();

  // Fetch skills with employee data
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['employee-skills'],
    queryFn: async (): Promise<SkillWithEmployee[]> => {
      const { data, error } = await supabase
        .from('employee_skills')
        .select(`
          *,
          employee:employees(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch certifications with employee data
  const { data: certifications, isLoading: certificationsLoading } = useQuery({
    queryKey: ['employee-certifications'],
    queryFn: async (): Promise<CertificationWithEmployee[]> => {
      const { data, error } = await supabase
        .from('employee_certifications')
        .select(`
          *,
          employee:employees(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employees for dropdowns
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async (): Promise<Employee[]> => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position, employment_status')
        .eq('employment_status', 'Active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      return (data || []) as any as Employee[];
    },
  });

  // Skills analytics
  const { data: analytics } = useQuery({
    queryKey: ['skills-analytics'],
    queryFn: async (): Promise<SkillsAnalytics[]> => {
      const { data, error } = await supabase
        .from('employee_skills')
        .select('skill_name, skill_category, proficiency_level, employee:employees(employment_status)');

      if (error) throw error;

      // Process data for analytics
      const skillsMap = new Map<string, {
        skill_name: string;
        skill_category: string;
        employee_count: number;
        proficiency_levels: string[];
        total_proficiency_score: number;
      }>();

      data?.forEach((skill: any) => {
        if (skill.employee?.employment_status !== 'Active') return;

        const key = skill.skill_name;
        const existing = skillsMap.get(key) || {
          skill_name: skill.skill_name,
          skill_category: skill.skill_category,
          employee_count: 0,
          proficiency_levels: [],
          total_proficiency_score: 0
        };

        existing.employee_count += 1;
        existing.proficiency_levels.push(skill.proficiency_level);

        // Convert proficiency to score (Beginner=1, Intermediate=2, Advanced=3, Expert=4)
        const proficiencyScore: Record<string, number> = {
          'Beginner': 1,
          'Intermediate': 2,
          'Advanced': 3,
          'Expert': 4
        };
        
        existing.total_proficiency_score += (proficiencyScore[skill.proficiency_level] || 0);
        skillsMap.set(key, existing);
      });

      return Array.from(skillsMap.values()).map(skill => ({
        skill_name: skill.skill_name,
        skill_category: skill.skill_category,
        employee_count: skill.employee_count,
        average_proficiency: skill.total_proficiency_score / skill.employee_count,
        skill_gaps: 0, // Would need to calculate based on required vs actual skills
        training_programs_available: 0 // Would need to link to training programs
      }));
    },
  });

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase
        .from('employee_skills')
        .delete()
        .eq('id', skillId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills-analytics'] });
    },
  });

  // Filter skills
  const filteredSkills = skills?.filter(skill => {
    const matchesSearch = !searchTerm || 
      skill.skill_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatEmployeeName(skill.employee).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || skill.skill_category === selectedCategory;
    const matchesProficiency = !selectedProficiency || skill.proficiency_level === selectedProficiency;

    return matchesSearch && matchesCategory && matchesProficiency;
  }) || [];

  // Filter certifications
  const filteredCertifications = certifications?.filter(cert => {
    const matchesSearch = !searchTerm || 
      cert.certification_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatEmployeeName(cert.employee).toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.issuing_organization.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  }) || [];

  // Get unique categories and proficiency levels for filters
  const categories = [...new Set(skills?.map(s => s.skill_category) || [])];
  const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  // Stats calculations
  const totalSkills = skills?.length || 0;
  const totalCertifications = certifications?.length || 0;
  const activeEmployees = [...new Set(skills?.map(s => s.employee_id))].length;
  const averageProficiency = (analytics?.reduce((sum: number, skill: any) => sum + skill.average_proficiency, 0) || 0) / (analytics?.length || 1);

  const statsCards = [
    {
      title: 'Total Skills',
      value: totalSkills,
      subtitle: 'Across all employees',
      icon: <Award className="h-6 w-6" />,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Certifications',
      value: totalCertifications,
      subtitle: 'Professional credentials',
      icon: <CheckCircle className="h-6 w-6" />,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Skilled Employees',
      value: activeEmployees,
      subtitle: 'With recorded skills',
      icon: <Users className="h-6 w-6" />,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      title: 'Avg Proficiency',
      value: `${averageProficiency.toFixed(1)}/4`,
      subtitle: 'Organization average',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-orange-600 bg-orange-100'
    }
  ];

  if (skillsLoading || certificationsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skills Management</h1>
          <p className="text-gray-600 mt-1">Track employee skills, certifications, and development</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddCertModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Award className="h-4 w-4 mr-2" />
            Add Certification
          </button>
          <button
            onClick={() => setShowAddSkillModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Skill
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-gray-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs and Content */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 shadow-sm">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'skills', name: 'Skills Tracking', icon: Target },
              { id: 'certifications', name: 'Certifications', icon: Award },
              { id: 'analytics', name: 'Skills Analytics', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'skills' ? "Search skills or employees..." : "Search certifications or employees..."}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {activeTab === 'skills' && (
              <div className="flex space-x-3">
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedProficiency}
                  onChange={(e) => setSelectedProficiency(e.target.value)}
                >
                  <option value="">All Proficiency</option>
                  {proficiencyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              {filteredSkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSkills.map((skill) => (
                    <div key={skill.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{skill.skill_name}</h3>
                          <p className="text-sm text-gray-600">{skill.skill_category}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency_level)}`}>
                          {skill.proficiency_level}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {skill.employee?.first_name?.[0]}{skill.employee?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatEmployeeName(skill.employee)}
                            </p>
                            <p className="text-xs text-gray-500">{skill.employee.position}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>
                          {skill.years_of_experience && `${skill.years_of_experience} years exp.`}
                        </span>
                        <span>
                          {skill.last_assessed && `Assessed: ${new Date(skill.last_assessed).toLocaleDateString()}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          {skill.certification_available && (
                            <span className="text-green-600">
                              <CheckCircle className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingSkill(skill)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSkillMutation.mutate(skill.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No skills found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || selectedCategory || selectedProficiency
                      ? "Try adjusting your search criteria."
                      : "Get started by adding your first employee skill."}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddSkillModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skill
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div className="space-y-4">
              {filteredCertifications.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCertifications.map((cert) => (
                    <div key={cert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{cert.certification_name}</h3>
                          <p className="text-sm text-gray-600">{cert.issuing_organization}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cert.verification_status === 'Verified' 
                            ? 'text-green-600 bg-green-100'
                            : cert.verification_status === 'Expired'
                            ? 'text-red-600 bg-red-100'
                            : 'text-yellow-600 bg-yellow-100'
                        }`}>
                          {cert.verification_status}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {cert.employee?.first_name?.[0]}{cert.employee?.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatEmployeeName(cert.employee)}
                            </p>
                            <p className="text-xs text-gray-500">{cert.employee.position}</p>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        {cert.issue_date && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {cert.expiry_date && (
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {cert.certification_number && (
                          <div>
                            <span>Cert #: {cert.certification_number}</span>
                          </div>
                        )}
                      </div>

                      {cert.certificate_url && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <a
                            href={cert.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm"
                          >
                            View Certificate →
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No certifications found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "Try adjusting your search criteria."
                      : "Get started by adding your first employee certification."}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddCertModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Certification
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analytics?.map((skill) => (
                    <div key={skill.skill_name} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{skill.skill_name}</h4>
                        <span className="text-sm text-gray-600">{skill.skill_category}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Employees:</span>
                          <span className="font-medium">{skill.employee_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Avg Proficiency:</span>
                          <span className="font-medium">{skill.average_proficiency.toFixed(1)}/4</span>
                        </div>
                        {/* Proficiency bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(skill.average_proficiency / 4) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {analytics && analytics.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics available</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add employee skills to see analytics and trends.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TODO: Add modals for adding/editing skills and certifications */}
      {showAddSkillModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Skill</h3>
            <p className="text-gray-600 mb-4">Modal implementation coming soon...</p>
            <button
              onClick={() => setShowAddSkillModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showAddCertModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Certification</h3>
            <p className="text-gray-600 mb-4">Modal implementation coming soon...</p>
            <button
              onClick={() => setShowAddCertModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}