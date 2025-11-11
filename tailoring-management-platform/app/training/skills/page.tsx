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
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { 
  useSkillAssessments,
  useSkillAssessmentMutation,
  useEmployeeSkills,
  useEmployees
} from '@/hooks/useTraining';

interface SkillAssessmentFormData {
  employee_id: string;
  skill_id: string;
  assessment_date: string;
  assessment_type: string;
  assessor_id?: string;
  skill_level_before?: string;
  skill_level_after: string;
  score?: number;
  strengths?: string;
  improvement_areas?: string;
  recommendations?: string;
  assessment_criteria?: string;
  follow_up_date?: string;
}

export default function SkillsAssessmentPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SkillAssessmentFormData>({
    employee_id: '',
    skill_id: '',
    assessment_date: new Date().toISOString().split('T')[0],
    assessment_type: 'observation',
    skill_level_after: 'beginner',
    score: 0,
    strengths: '',
    improvement_areas: '',
    recommendations: '',
    assessment_criteria: '',
    follow_up_date: ''
  });

  const { data: assessments = [], isLoading, refetch } = useSkillAssessments(employeeFilter === 'all' ? undefined : employeeFilter);
  const { data: employeeSkills = [] } = useEmployeeSkills();
  const assessmentMutation = useSkillAssessmentMutation();

  // Calculate skill metrics
  const totalAssessments = assessments.length;
  const recentAssessments = assessments.filter(assessment => {
    const assessmentDate = new Date(assessment.assessment_date);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return assessmentDate >= thirtyDaysAgo;
  });

  const skillLevelDistribution = assessments.reduce((acc, assessment) => {
    const level = assessment.skill_level_after;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const averageScore = assessments.length > 0 ? 
    assessments.reduce((sum, assessment) => sum + (assessment.score || 0), 0) / assessments.length : 0;

  const improvementCount = assessments.filter(assessment => {
    if (!assessment.skill_level_before || !assessment.skill_level_after) return false;
    const levels = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];
    const beforeIndex = levels.indexOf(assessment.skill_level_before);
    const afterIndex = levels.indexOf(assessment.skill_level_after);
    return afterIndex > beforeIndex;
  }).length;

  // Filter assessments
  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.employee_skills?.skill_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.employees?.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assessment.employees?.last_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill = skillFilter === 'all' || assessment.skill_id === skillFilter;
    const matchesLevel = levelFilter === 'all' || assessment.skill_level_after === levelFilter;
    const matchesEmployee = employeeFilter === 'all' || assessment.employee_id === employeeFilter;
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'recent' && recentAssessments.includes(assessment)) ||
                      (selectedTab === 'improved' && assessment.skill_level_before && assessment.skill_level_after && 
                       ['beginner', 'intermediate', 'advanced', 'expert', 'master'].indexOf(assessment.skill_level_after) >
                       ['beginner', 'intermediate', 'advanced', 'expert', 'master'].indexOf(assessment.skill_level_before)) ||
                      (selectedTab === 'needs_followup' && assessment.follow_up_date && new Date(assessment.follow_up_date) <= new Date());
    
    return matchesSearch && matchesSkill && matchesLevel && matchesEmployee && matchesTab;
  });

  // Get unique values for filters
  const uniqueSkills = [...new Set(assessments.map(a => ({ id: a.skill_id, name: a.employee_skills?.skill_name })).filter(s => s.name))];
  const uniqueEmployees = [...new Set(assessments.map(a => ({ 
    id: a.employee_id, 
    name: `${a.employees?.first_name} ${a.employees?.last_name}` 
  })).filter(e => e.name !== 'undefined undefined'))];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assessmentMutation.mutateAsync({
        organization_id: 'current_org_id', // This would come from auth context
        ...formData,
        evidence_files: [],
        created_at: new Date().toISOString()
      });
      setIsDialogOpen(false);
      setFormData({
        employee_id: '',
        skill_id: '',
        assessment_date: new Date().toISOString().split('T')[0],
        assessment_type: 'observation',
        skill_level_after: 'beginner',
        score: 0,
        strengths: '',
        improvement_areas: '',
        recommendations: '',
        assessment_criteria: '',
        follow_up_date: ''
      });
      refetch();
    } catch (error) {
      console.error('Failed to create skill assessment:', error);
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-red-100 text-red-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'expert': return 'bg-green-100 text-green-800';
      case 'master': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Skills Assessment</h1>
          <p className="text-gray-600 mt-2">Evaluate and track employee skill development</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Skill Assessment</DialogTitle>
              <DialogDescription>
                Evaluate an employee's skill level and provide feedback
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee</Label>
                  <Select value={formData.employee_id} onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueEmployees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill_id">Skill</Label>
                  <Select value={formData.skill_id} onValueChange={(value) => setFormData(prev => ({ ...prev, skill_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueSkills.map(skill => (
                        <SelectItem key={skill.id} value={skill.id}>
                          {skill.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assessment_date">Assessment Date</Label>
                  <Input
                    id="assessment_date"
                    type="date"
                    value={formData.assessment_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, assessment_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assessment_type">Assessment Type</Label>
                  <Select value={formData.assessment_type} onValueChange={(value) => setFormData(prev => ({ ...prev, assessment_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="observation">Observation</SelectItem>
                      <SelectItem value="practical_exam">Practical Exam</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="portfolio">Portfolio</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="skill_level_before">Previous Level</Label>
                  <Select value={formData.skill_level_before || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, skill_level_before: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Previous level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill_level_after">Current Level</Label>
                  <Select value={formData.skill_level_after} onValueChange={(value) => setFormData(prev => ({ ...prev, skill_level_after: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="score">Score (0-100)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData(prev => ({ ...prev, score: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assessment_criteria">Assessment Criteria</Label>
                <Textarea
                  id="assessment_criteria"
                  value={formData.assessment_criteria}
                  onChange={(e) => setFormData(prev => ({ ...prev, assessment_criteria: e.target.value }))}
                  placeholder="Define what was assessed and how..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="strengths">Strengths</Label>
                <Textarea
                  id="strengths"
                  value={formData.strengths}
                  onChange={(e) => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                  placeholder="What the employee does well..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="improvement_areas">Areas for Improvement</Label>
                <Textarea
                  id="improvement_areas"
                  value={formData.improvement_areas}
                  onChange={(e) => setFormData(prev => ({ ...prev, improvement_areas: e.target.value }))}
                  placeholder="What could be improved..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recommendations">Recommendations</Label>
                <Textarea
                  id="recommendations"
                  value={formData.recommendations}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Training suggestions, next steps..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date (Optional)</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={assessmentMutation.isPending}>
                  {assessmentMutation.isPending ? 'Creating...' : 'Create Assessment'}
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
            <CardTitle className="text-sm font-medium text-blue-700">Total Assessments</CardTitle>
            <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalAssessments}</div>
            <p className="text-xs text-blue-600 mt-1">All skill evaluations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Average Score</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{averageScore.toFixed(1)}%</div>
            <p className="text-xs text-green-600 mt-1">Overall performance</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Skill Improvements</CardTitle>
            <ArrowTrendingUpIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{improvementCount}</div>
            <p className="text-xs text-purple-600 mt-1">Level upgrades recorded</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Recent Assessments</CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{recentAssessments.length}</div>
            <p className="text-xs text-orange-600 mt-1">In the last 30 days</p>
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
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-4">
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="w-48 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {uniqueSkills.map(skill => (
                    <SelectItem key={skill.id} value={skill.id}>{skill.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger className="w-48 bg-white/50 backdrop-blur-sm">
                  <SelectValue placeholder="Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {uniqueEmployees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({assessments.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent ({recentAssessments.length})</TabsTrigger>
          <TabsTrigger value="improved">Improved ({improvementCount})</TabsTrigger>
          <TabsTrigger value="needs_followup">Follow-up Needed</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {/* Skill Level Distribution Chart */}
          {selectedTab === 'all' && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrophyIcon className="h-5 w-5 mr-2" />
                  Skill Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(skillLevelDistribution).map(([level, count]) => (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="capitalize font-medium">{level}</span>
                        <Badge className={getSkillLevelColor(level)}>{count} assessments</Badge>
                      </div>
                      <Progress 
                        value={(count / totalAssessments) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment) => (
              <Card key={assessment.id} className="bg-white/10 backdrop-blur-md border border-white/20 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 mb-1">
                        {assessment.employee_skills?.skill_name || 'Unknown Skill'}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {assessment.employees?.first_name} {assessment.employees?.last_name}
                      </CardDescription>
                    </div>
                    <Badge className={getSkillLevelColor(assessment.skill_level_after)}>
                      {assessment.skill_level_after}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Assessment Date</span>
                      <span className="font-medium">{formatDate(assessment.assessment_date)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Type</span>
                      <span className="font-medium capitalize">{assessment.assessment_type}</span>
                    </div>
                    {assessment.score !== null && assessment.score !== undefined && (
                      <div>
                        <span className="text-gray-500 block">Score</span>
                        <span className={`font-bold ${getScoreColor(assessment.score)}`}>
                          {assessment.score}%
                        </span>
                      </div>
                    )}
                    {assessment.skill_level_before && (
                      <div>
                        <span className="text-gray-500 block">Previous Level</span>
                        <span className="font-medium capitalize">{assessment.skill_level_before}</span>
                      </div>
                    )}
                  </div>

                  {assessment.strengths && (
                    <div className="text-sm">
                      <span className="text-gray-500 block mb-1">Key Strengths</span>
                      <p className="text-gray-700 line-clamp-2">{assessment.strengths}</p>
                    </div>
                  )}

                  {assessment.improvement_areas && (
                    <div className="text-sm">
                      <span className="text-gray-500 block mb-1">Improvement Areas</span>
                      <p className="text-gray-700 line-clamp-2">{assessment.improvement_areas}</p>
                    </div>
                  )}

                  {assessment.follow_up_date && (
                    <div className="flex items-center space-x-2 text-sm">
                      <ExclamationCircleIcon className="h-4 w-4 text-orange-500" />
                      <span className="text-gray-600">
                        Follow-up: {formatDate(assessment.follow_up_date)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Button variant="outline" size="sm">
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAssessments.length === 0 && (
            <Card className="bg-white/10 backdrop-blur-md border border-white/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AcademicCapIcon className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchQuery || skillFilter !== 'all' || levelFilter !== 'all' || employeeFilter !== 'all'
                    ? 'Try adjusting your filters or search query.'
                    : 'Start by creating skill assessments to track employee development.'}
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Assessment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}