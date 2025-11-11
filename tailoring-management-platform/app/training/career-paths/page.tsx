'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  BuildingOfficeIcon,
  ArrowUpIcon,
  MapIcon,
  UserGroupIcon,
  ClockIcon,
  TrophyIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  useCareerPaths,
  useCareerPathMutation,
  useEmployees,
  useTrainingPrograms
} from '@/hooks/useTraining';

interface CareerPathFormData {
  path_name: string;
  path_description: string;
  department: string;
  entry_level: string;
  progression_levels: string[];
  required_skills: string[];
  estimated_duration_months: number;
  milestone_requirements: string[];
  certification_requirements: string[];
  is_active: boolean;
}

export default function CareerPathsPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CareerPathFormData>({
    path_name: '',
    path_description: '',
    department: '',
    entry_level: 'entry',
    progression_levels: ['entry', 'junior', 'mid'],
    required_skills: [],
    estimated_duration_months: 12,
    milestone_requirements: [],
    certification_requirements: [],
    is_active: true
  });

  const { data: careerPaths = [], isLoading, refetch } = useCareerPaths();
  const { data: trainingPrograms = [] } = useTrainingPrograms();
  const careerPathMutation = useCareerPathMutation();

  // Calculate metrics
  const totalPaths = careerPaths.length;
  const activePaths = careerPaths.filter(path => path.is_active);
  const departmentDistribution = careerPaths.reduce((acc, path) => {
    const dept = path.department || 'General';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter career paths
  const filteredPaths = careerPaths.filter(path => {
    const matchesSearch = path.path_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         path.path_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         path.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || path.department === departmentFilter;
    const matchesLevel = levelFilter === 'all' || path.entry_level === levelFilter;
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'active' && path.is_active) ||
                      (selectedTab === 'technical' && (path.department === 'Tailoring' || path.department === 'Quality Control')) ||
                      (selectedTab === 'management' && (path.department === 'Management' || path.department === 'Leadership'));
    
    return matchesSearch && matchesDepartment && matchesLevel && matchesTab;
  });

  // Get unique departments for filter
  const departments = [...new Set(careerPaths.map(p => p.department).filter(Boolean))];

  // Mock employee progress data
  const mockEmployeeProgress = {
    'path-1': { enrolled: 8, level_1: 5, level_2: 2, level_3: 1 },
    'path-2': { enrolled: 12, level_1: 7, level_2: 4, level_3: 1 },
    'path-3': { enrolled: 6, level_1: 4, level_2: 2, level_3: 0 }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await careerPathMutation.mutateAsync({
        organization_id: 'current_org_id', // This would come from auth context
        ...formData,
        created_at: new Date().toISOString()
      });
      setIsDialogOpen(false);
      setFormData({
        path_name: '',
        path_description: '',
        department: '',
        entry_level: 'entry',
        progression_levels: ['entry', 'junior', 'mid'],
        required_skills: [],
        estimated_duration_months: 12,
        milestone_requirements: [],
        certification_requirements: [],
        is_active: true
      });
      refetch();
    } catch (error) {
      console.error('Failed to create career path:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'entry': return 'bg-green-100 text-green-800';
      case 'junior': return 'bg-blue-100 text-blue-800';
      case 'mid': return 'bg-purple-100 text-purple-800';
      case 'senior': return 'bg-orange-100 text-orange-800';
      case 'lead': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-indigo-100 text-indigo-800';
      case 'director': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department?.toLowerCase()) {
      case 'tailoring': return <TrophyIcon className="h-4 w-4" />;
      case 'management': return <BuildingOfficeIcon className="h-4 w-4" />;
      case 'quality control': return <CheckCircleIcon className="h-4 w-4" />;
      default: return <UserGroupIcon className="h-4 w-4" />;
    }
  };

  const addSkillToForm = () => {
    const newSkill = prompt('Enter skill name:');
    if (newSkill && newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, newSkill.trim()]
      }));
    }
  };

  const removeSkillFromForm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter((_, i) => i !== index)
    }));
  };

  const addMilestoneToForm = () => {
    const newMilestone = prompt('Enter milestone requirement:');
    if (newMilestone && newMilestone.trim()) {
      setFormData(prev => ({
        ...prev,
        milestone_requirements: [...prev.milestone_requirements, newMilestone.trim()]
      }));
    }
  };

  const removeMilestoneFromForm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestone_requirements: prev.milestone_requirements.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Career Development Paths</h1>
          <p className="text-gray-600 mt-2">Guide employee growth and career progression</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Career Path
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Career Path</DialogTitle>
              <DialogDescription>
                Define a structured progression path for employee development
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="path_name">Path Name</Label>
                  <Input
                    id="path_name"
                    value={formData.path_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, path_name: e.target.value }))}
                    placeholder="e.g., Master Tailor Progression"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Tailoring, Management"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="path_description">Description</Label>
                <Textarea
                  id="path_description"
                  value={formData.path_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, path_description: e.target.value }))}
                  placeholder="Describe the career path objectives and outcomes..."
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry_level">Entry Level</Label>
                  <Select value={formData.entry_level} onValueChange={(value) => setFormData(prev => ({ ...prev, entry_level: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="junior">Junior Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                      <SelectItem value="lead">Lead Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_duration_months">Duration (Months)</Label>
                  <Input
                    id="estimated_duration_months"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.estimated_duration_months}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_duration_months: parseInt(e.target.value) || 12 }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Required Skills</Label>
                <div className="space-y-2">
                  {formData.required_skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={skill} readOnly className="flex-1" />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeSkillFromForm(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addSkillToForm}>
                    Add Required Skill
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Milestone Requirements</Label>
                <div className="space-y-2">
                  {formData.milestone_requirements.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={milestone} readOnly className="flex-1" />
                      <Button type="button" variant="outline" size="sm" onClick={() => removeMilestoneFromForm(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addMilestoneToForm}>
                    Add Milestone
                  </Button>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={careerPathMutation.isPending}>
                  {careerPathMutation.isPending ? 'Creating...' : 'Create Path'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Career Paths</CardTitle>
            <MapIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalPaths}</div>
            <p className="text-xs text-blue-600 mt-1">Available progression routes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Active Paths</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{activePaths.length}</div>
            <p className="text-xs text-green-600 mt-1">Currently available</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Departments</CardTitle>
            <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{Object.keys(departmentDistribution).length}</div>
            <p className="text-xs text-purple-600 mt-1">With career paths</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Total Enrollments</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">26</div>
            <p className="text-xs text-orange-600 mt-1">Employees in paths</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/10 backdrop-blur-md border border-white/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search career paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-4">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Entry Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="entry">Entry Level</SelectItem>
                  <SelectItem value="junior">Junior Level</SelectItem>
                  <SelectItem value="mid">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Paths ({careerPaths.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activePaths.length})</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {/* Department Distribution */}
          {selectedTab === 'all' && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Career Paths by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(departmentDistribution).map(([dept, count]) => (
                    <div key={dept} className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-sm text-gray-600">{dept}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Career Paths Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPaths.map((path) => (
              <Card key={path.id} className="bg-white/10 backdrop-blur-md border border-white/20 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-gray-900 mb-2 flex items-center">
                        {getDepartmentIcon(path.department)}
                        <span className="ml-2">{path.path_name}</span>
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {path.department} • {path.estimated_duration_months} months
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getLevelColor(path.entry_level)}>
                        Entry: {path.entry_level}
                      </Badge>
                      {path.is_active ? (
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {path.path_description}
                  </p>

                  {/* Progression Levels */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <ArrowRightIcon className="h-4 w-4 mr-2" />
                      Career Progression
                    </h4>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                      {Array.isArray(path.progression_levels) ? path.progression_levels.map((level, index) => (
                        <div key={index} className="flex items-center">
                          <Badge className={`${getLevelColor(level)} whitespace-nowrap`}>
                            {level}
                          </Badge>
                          {index < path.progression_levels.length - 1 && (
                            <ArrowRightIcon className="h-4 w-4 mx-2 text-gray-400" />
                          )}
                        </div>
                      )) : (
                        <span className="text-gray-500 text-sm">No progression levels defined</span>
                      )}
                    </div>
                  </div>

                  {/* Required Skills */}
                  {Array.isArray(path.required_skills) && path.required_skills.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <AcademicCapIcon className="h-4 w-4 mr-2" />
                        Required Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {path.required_skills.slice(0, 4).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {path.required_skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{path.required_skills.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress Tracking */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      Employee Progress
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Enrolled</span>
                        <span className="font-medium">8 employees</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                        <div className="text-center">
                          <div className="font-medium">5</div>
                          <div>Level 1</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">2</div>
                          <div>Level 2</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">1</div>
                          <div>Level 3</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  {Array.isArray(path.milestone_requirements) && path.milestone_requirements.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <TrophyIcon className="h-4 w-4 mr-2" />
                        Key Milestones
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {path.milestone_requirements.slice(0, 3).map((milestone, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircleIcon className="h-3 w-3 mr-2 text-green-500" />
                            {milestone}
                          </li>
                        ))}
                        {path.milestone_requirements.length > 3 && (
                          <li className="text-gray-500">+{path.milestone_requirements.length - 3} more milestones</li>
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {path.estimated_duration_months} month{path.estimated_duration_months !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPaths.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No career paths found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchQuery || departmentFilter !== 'all' || levelFilter !== 'all'
                    ? 'Try adjusting your filters or search query.'
                    : 'Start by creating career development paths to guide employee growth.'}
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Career Path
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}