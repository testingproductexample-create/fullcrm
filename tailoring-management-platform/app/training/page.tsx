'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, ClockIcon, BookOpenIcon, CertificateIcon, TrendingUpIcon, AlertCircleIcon, PlayCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { 
  useEmployeeTrainings, 
  useEmployeeSkills,
  useEmployeeCertifications, 
  useTrainingDashboardStats,
  useCertificationRenewalAlerts,
  useComplianceTracking
} from '@/hooks/useTraining';

export default function TrainingPortal() {
  const [selectedTab, setSelectedTab] = useState('dashboard');

  // Get current user's training data
  const { data: employeeTrainings = [], isLoading: trainingsLoading } = useEmployeeTrainings();
  const { data: employeeSkills = [], isLoading: skillsLoading } = useEmployeeSkills();
  const { data: certifications = [], isLoading: certificationsLoading } = useEmployeeCertifications();
  const { data: dashboardStats } = useTrainingDashboardStats();
  const { data: renewalAlerts = [] } = useCertificationRenewalAlerts();
  const { data: complianceItems = [] } = useComplianceTracking();

  const activeTrainings = employeeTrainings.filter(t => t.training_status === 'in_progress' || t.training_status === 'enrolled');
  const completedTrainings = employeeTrainings.filter(t => t.training_status === 'completed');
  const pendingCompliance = complianceItems.filter(c => c.status === 'pending' || c.status === 'warning');

  if (trainingsLoading || skillsLoading || certificationsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Training & Development Portal</h1>
          <p className="text-gray-600 mt-2">Your personal learning journey and skill development hub</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/training/courses">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <BookOpenIcon className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
          </Link>
          <Link href="/training/skills">
            <Button variant="outline">
              <TrendingUpIcon className="h-4 w-4 mr-2" />
              Assess Skills
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert Banner for Urgent Items */}
      {(renewalAlerts.length > 0 || pendingCompliance.length > 0) && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircleIcon className="h-5 w-5 text-orange-600" />
            <span className="font-medium text-orange-800">Action Required</span>
          </div>
          <div className="mt-2 text-sm text-orange-700 space-y-1">
            {renewalAlerts.length > 0 && (
              <p>{renewalAlerts.length} certification{renewalAlerts.length > 1 ? 's' : ''} expiring soon</p>
            )}
            {pendingCompliance.length > 0 && (
              <p>{pendingCompliance.length} compliance requirement{pendingCompliance.length > 1 ? 's' : ''} pending</p>
            )}
          </div>
          <Link href="/training/compliance" className="mt-2 inline-flex text-sm text-orange-600 hover:text-orange-800">
            View Details →
          </Link>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Trainings</p>
                <p className="text-3xl font-bold text-blue-600">{activeTrainings.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <PlayCircleIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Courses</p>
                <p className="text-3xl font-bold text-green-600">{completedTrainings.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Certifications</p>
                <p className="text-3xl font-bold text-purple-600">{certifications.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <CertificateIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Skills Tracked</p>
                <p className="text-3xl font-bold text-orange-600">{employeeSkills.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUpIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="current">Current Training</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="skills">Skills Profile</TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedTrainings.slice(0, 3).map((training) => (
                    <div key={training.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {training.training_programs?.program_name || 'Training Completed'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Score: {training.assessment_score || 'N/A'}% • {training.completion_date}
                        </p>
                      </div>
                    </div>
                  ))}
                  {completedTrainings.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No completed trainings yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Upcoming Deadlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeTrainings.slice(0, 3).map((training) => (
                    <div key={training.id} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <ClockIcon className="h-5 w-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {training.training_programs?.program_name || 'Training In Progress'}
                        </p>
                        <p className="text-sm text-gray-600">
                          Due: {training.mandatory_completion_date || 'No deadline set'}
                        </p>
                        {training.attendance_percentage && (
                          <Progress value={training.attendance_percentage} className="mt-2" />
                        )}
                      </div>
                    </div>
                  ))}
                  {activeTrainings.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No active trainings</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Learning Recommendations */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
              <CardDescription>
                Based on your role and skill development goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">Advanced Customer Service</h4>
                  <p className="text-sm text-gray-600 mt-1">Enhance your client interaction skills</p>
                  <Badge variant="secondary" className="mt-2">Recommended</Badge>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">Quality Management Basics</h4>
                  <p className="text-sm text-gray-600 mt-1">Learn quality control fundamentals</p>
                  <Badge variant="secondary" className="mt-2">Trending</Badge>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900">UAE Labor Law Update</h4>
                  <p className="text-sm text-gray-600 mt-1">Stay compliant with latest regulations</p>
                  <Badge variant="destructive" className="mt-2">Required</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Current Training Tab */}
        <TabsContent value="current" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Current Training Programs</CardTitle>
              <CardDescription>
                Your ongoing learning activities and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTrainings.map((training) => (
                  <div key={training.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">
                        {training.training_programs?.program_name || 'Training Program'}
                      </h4>
                      <Badge variant={training.training_status === 'in_progress' ? 'default' : 'secondary'}>
                        {training.training_status}
                      </Badge>
                    </div>
                    {training.attendance_percentage && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{training.attendance_percentage}%</span>
                        </div>
                        <Progress value={training.attendance_percentage} />
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-600">
                        Started: {training.training_start_date || 'Not started'}
                      </div>
                      <Link href={`/training/courses/${training.training_program_id}`}>
                        <Button size="sm" variant="outline">Continue Learning</Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {activeTrainings.length === 0 && (
                  <div className="text-center py-8">
                    <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active trainings</p>
                    <p className="text-sm text-gray-400 mt-1">Explore available courses to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>My Certifications</CardTitle>
              <CardDescription>
                Your professional certifications and renewal status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {certifications.map((cert) => (
                  <div key={cert.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{cert.certification_name}</h4>
                      <Badge variant={cert.verification_status === 'verified' ? 'default' : 'secondary'}>
                        {cert.verification_status || 'Pending'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{cert.issuing_authority}</p>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Issued:</span>
                        <span>{cert.issue_date}</span>
                      </div>
                      {cert.expiry_date && (
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span>{cert.expiry_date}</span>
                        </div>
                      )}
                    </div>
                    {cert.certificate_file_url && (
                      <Button size="sm" variant="outline" className="mt-3 w-full">
                        View Certificate
                      </Button>
                    )}
                  </div>
                ))}
                {certifications.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <CertificateIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No certifications yet</p>
                    <p className="text-sm text-gray-400 mt-1">Complete courses to earn certifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Skills Profile</CardTitle>
              <CardDescription>
                Your current skills and proficiency levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeeSkills.map((skill) => (
                  <div key={skill.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{skill.skill_name}</h4>
                        <p className="text-sm text-gray-600">{skill.skill_category}</p>
                      </div>
                      <Badge variant={skill.is_certified ? 'default' : 'secondary'}>
                        {skill.proficiency_level || 'Not Assessed'}
                      </Badge>
                    </div>
                    {skill.years_experience && (
                      <p className="text-sm text-gray-600">
                        Experience: {skill.years_experience} years
                      </p>
                    )}
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      {skill.quality_rating && (
                        <div className="text-center">
                          <p className="font-medium">{skill.quality_rating}/10</p>
                          <p className="text-gray-500">Quality</p>
                        </div>
                      )}
                      {skill.speed_rating && (
                        <div className="text-center">
                          <p className="font-medium">{skill.speed_rating}/10</p>
                          <p className="text-gray-500">Speed</p>
                        </div>
                      )}
                      {skill.consistency_rating && (
                        <div className="text-center">
                          <p className="font-medium">{skill.consistency_rating}/10</p>
                          <p className="text-gray-500">Consistency</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {employeeSkills.length === 0 && (
                  <div className="text-center py-8">
                    <TrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No skills recorded yet</p>
                    <p className="text-sm text-gray-400 mt-1">Complete a skills assessment to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}