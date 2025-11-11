'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpenIcon, 
  ClockIcon, 
  UsersIcon, 
  StarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlayCircleIcon,
  CalendarIcon,
  CertificateIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { 
  useTrainingPrograms, 
  useCourseModules,
  useTrainingSessions,
  useEnrollEmployeeMutation 
} from '@/hooks/useTraining';

export default function CoursesPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const { data: trainingPrograms = [], isLoading } = useTrainingPrograms();
  const { data: courseModules = [] } = useCourseModules(selectedCourse || undefined);
  const { data: trainingSessions = [] } = useTrainingSessions();
  const enrollMutation = useEnrollEmployeeMutation();

  // Filter programs
  const filteredPrograms = trainingPrograms.filter(program => {
    const matchesSearch = program.program_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (program.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesCategory = categoryFilter === 'all' || program.program_category === categoryFilter;
    const matchesLevel = levelFilter === 'all' || program.skill_level === levelFilter;
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'mandatory' && program.is_mandatory) ||
                      (selectedTab === 'certification' && program.certification_provided) ||
                      (selectedTab === 'uae' && program.program_category === 'Compliance');
    
    return matchesSearch && matchesCategory && matchesLevel && matchesTab && program.is_active;
  });

  // Get unique categories and levels for filters
  const categories = [...new Set(trainingPrograms.map(p => p.program_category).filter(Boolean))];
  const levels = [...new Set(trainingPrograms.map(p => p.skill_level).filter(Boolean))];

  const handleEnrollment = async (programId: string, programName: string) => {
    try {
      await enrollMutation.mutateAsync({
        organization_id: 'current_org_id', // This would come from auth context
        employee_id: 'current_user_id', // This would come from auth context
        training_program_id: programId,
        enrollment_date: new Date().toISOString(),
        training_status: 'enrolled'
      });
    } catch (error) {
      console.error('Enrollment failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <h1 className="text-3xl font-bold text-gray-900">Training Courses</h1>
          <p className="text-gray-600 mt-2">Discover and enroll in professional development programs</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="px-3 py-1">
            {filteredPrograms.length} Course{filteredPrograms.length !== 1 ? 's' : ''} Available
          </Badge>
          <Link href={`/training/sessions`}>
            <Button variant="outline">
              <CalendarIcon className="h-4 w-4 mr-2" />
              View Sessions
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="glass">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search courses by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setLevelFilter('all');
                }}
                className="w-full md:w-auto"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Categories */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="mandatory">Mandatory</TabsTrigger>
          <TabsTrigger value="certification">Certification</TabsTrigger>
          <TabsTrigger value="uae">UAE Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-6">
          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((program) => {
              const upcomingSessions = trainingSessions.filter(s => 
                s.training_program_id === program.id && 
                new Date(s.session_date) > new Date()
              );

              return (
                <Card key={program.id} className="glass hover-lift cursor-pointer group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                          {program.program_name}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {program.description || 'No description available'}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {/* Course Metadata */}
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant={program.is_mandatory ? 'destructive' : 'secondary'}>
                        {program.program_category}
                      </Badge>
                      {program.certification_provided && (
                        <div className="flex items-center text-sm text-green-600">
                          <CertificateIcon className="h-4 w-4 mr-1" />
                          Certificate
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Course Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {program.duration_hours}h • {program.duration_days}d
                      </div>
                      <div className="flex items-center text-gray-600">
                        <UsersIcon className="h-4 w-4 mr-2" />
                        Max {program.max_participants || 'Unlimited'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <BookOpenIcon className="h-4 w-4 mr-2" />
                        {program.skill_level || 'All Levels'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <StarIcon className="h-4 w-4 mr-2" />
                        Pass: {program.passing_score || 80}%
                      </div>
                    </div>

                    {/* Language Support */}
                    {program.language_support && program.language_support.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <GlobeAltIcon className="h-4 w-4 mr-2" />
                        Available in: {program.language_support.map(lang => 
                          lang === 'en' ? 'English' : lang === 'ar' ? 'Arabic' : lang
                        ).join(', ')}
                      </div>
                    )}

                    {/* Cost */}
                    {program.cost_per_participant_aed && program.cost_per_participant_aed > 0 && (
                      <div className="text-lg font-semibold text-blue-600">
                        AED {program.cost_per_participant_aed}
                      </div>
                    )}

                    {/* Upcoming Sessions */}
                    {upcomingSessions.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-900">Next Sessions:</h5>
                        {upcomingSessions.slice(0, 2).map((session) => (
                          <div key={session.id} className="text-sm text-gray-600 flex items-center">
                            <CalendarIcon className="h-3 w-3 mr-2" />
                            {new Date(session.session_date).toLocaleDateString()} at {session.start_time}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-4">
                      <Link href={`/training/courses/${program.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <PlayCircleIcon className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleEnrollment(program.id, program.program_name)}
                        disabled={enrollMutation.isPending}
                      >
                        {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                      </Button>
                    </div>

                    {/* Additional Badges */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {program.is_mandatory && (
                        <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                      )}
                      {program.training_format === 'online' && (
                        <Badge variant="outline" className="text-xs">Online</Badge>
                      )}
                      {program.training_format === 'in_person' && (
                        <Badge variant="outline" className="text-xs">In-Person</Badge>
                      )}
                      {program.training_format === 'blended' && (
                        <Badge variant="outline" className="text-xs">Blended</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredPrograms.length === 0 && (
            <div className="text-center py-12">
              <BookOpenIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || categoryFilter !== 'all' || levelFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No training programs are currently available'
                }
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setLevelFilter('all');
                  setSelectedTab('all');
                }}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Featured Programs */}
      {selectedTab === 'all' && searchQuery === '' && (
        <Card className="glass">
          <CardHeader>
            <CardTitle>Featured Programs</CardTitle>
            <CardDescription>
              Popular and highly recommended training programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trainingPrograms
                .filter(p => p.is_active && p.certification_provided)
                .slice(0, 3)
                .map((program) => (
                  <div key={program.id} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{program.program_name}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {program.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{program.program_category}</Badge>
                      <Link href={`/training/courses/${program.id}`}>
                        <Button size="sm" variant="outline">Learn More</Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}