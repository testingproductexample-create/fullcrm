import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Shield, 
  AlertTriangle, 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  BarChart3,
  Settings,
  FileText,
  Users,
  Bell,
  Activity
} from 'lucide-react'

interface Incident {
  id: string
  title: string
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'new' | 'investigating' | 'contained' | 'resolved' | 'closed'
  assignee: string
  created_at: string
  last_updated: string
  description: string
  affected_systems: string[]
  evidence_count: number
  escalation_level: number
}

const mockIncidents: Incident[] = [
  {
    id: 'INC-2025-001',
    title: 'Suspicious Login Activity Detected',
    type: 'phishing',
    severity: 'high',
    status: 'investigating',
    assignee: 'security_analyst_1',
    created_at: '2025-11-06T20:30:00Z',
    last_updated: '2025-11-06T23:15:00Z',
    description: 'Multiple failed login attempts from unfamiliar IP addresses',
    affected_systems: ['authentication_system', 'user_portal'],
    evidence_count: 12,
    escalation_level: 2
  },
  {
    id: 'INC-2025-002',
    title: 'Potential Data Exfiltration',
    type: 'data_breach',
    severity: 'critical',
    status: 'contained',
    assignee: 'forensics_1',
    created_at: '2025-11-06T18:45:00Z',
    last_updated: '2025-11-06T22:30:00Z',
    description: 'Unusual data transfer patterns detected from internal systems',
    affected_systems: ['database_server', 'file_storage'],
    evidence_count: 45,
    escalation_level: 3
  },
  {
    id: 'INC-2025-003',
    title: 'Malware Detection on Endpoint',
    type: 'malware',
    severity: 'medium',
    status: 'new',
    assignee: 'security_analyst_2',
    created_at: '2025-11-06T23:00:00Z',
    last_updated: '2025-11-06T23:00:00Z',
    description: 'Antivirus detected suspicious file execution',
    affected_systems: ['workstation_001'],
    evidence_count: 3,
    escalation_level: 1
  }
]

function App() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false)

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity
    
    return matchesSearch && matchesStatus && matchesSeverity
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-gray-500'
      case 'investigating': return 'bg-blue-500'
      case 'contained': return 'bg-orange-500'
      case 'resolved': return 'bg-green-500'
      case 'closed': return 'bg-gray-400'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />
      case 'investigating': return <Eye className="h-4 w-4" />
      case 'contained': return <Shield className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTimeSinceUpdate = (timestamp: string) => {
    const now = new Date()
    const updated = new Date(timestamp)
    const diffMs = now.getTime() - updated.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m ago`
    return `${diffMinutes}m ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Security Incident Response Center</h1>
                <p className="text-sm text-gray-500">Real-time threat detection and incident management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="destructive" className="px-3 py-1">
                {incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length} Active Critical
              </Badge>
              <Button onClick={() => setIsNewIncidentOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Incident
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="threats">Threat Detection</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="recovery">Recovery</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {incidents.filter(i => i.created_at >= new Date(Date.now() - 24*60*60*1000).toISOString()).length} in last 24h
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Immediate attention required</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.2h</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Evidence Collected</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {incidents.reduce((sum, i) => sum + i.evidence_count, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total items this month</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Incidents</CardTitle>
                <CardDescription>Latest security incidents requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.slice(0, 5).map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{incident.id}</div>
                            <div className="text-sm text-gray-500">{incident.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{incident.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(incident.status)}
                            <Badge className={getStatusColor(incident.status)}>
                              {incident.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{incident.assignee}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {getTimeSinceUpdate(incident.last_updated)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedIncident(incident)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-6">
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Management</CardTitle>
                <CardDescription>Search, filter, and manage security incidents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search incidents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="contained">Contained</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Incidents Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Affected Systems</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIncidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{incident.id}</div>
                            <div className="text-sm text-gray-500">{incident.title}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{incident.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(incident.status)}
                            <Badge className={getStatusColor(incident.status)}>
                              {incident.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{incident.assignee}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {incident.affected_systems.slice(0, 2).map((system) => (
                              <Badge key={system} variant="secondary" className="text-xs">
                                {system}
                              </Badge>
                            ))}
                            {incident.affected_systems.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{incident.affected_systems.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span>{incident.evidence_count} items</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {getTimeSinceUpdate(incident.last_updated)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedIncident(incident)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <BarChart3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="threats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Threat Detection Dashboard</CardTitle>
                <CardDescription>Real-time monitoring and automated threat detection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Active Detections</h3>
                    <div className="space-y-3">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>High-risk login attempt</AlertTitle>
                        <AlertDescription>
                          Multiple failed logins from IP 203.45.67.89 detected. Suspicious activity pattern.
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Malware signature detected</AlertTitle>
                        <AlertDescription>
                          Known malware signature found in file transfer on workstation-001.
                        </AlertDescription>
                      </Alert>
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Unusual network traffic</AlertTitle>
                        <AlertDescription>
                          Anomalous outbound connections detected from internal server.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Detection Statistics</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Network Intrusions</span>
                          <span>23%</span>
                        </div>
                        <Progress value={23} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Malware Detection</span>
                          <span>35%</span>
                        </div>
                        <Progress value={35} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Data Exfiltration</span>
                          <span>18%</span>
                        </div>
                        <Progress value={18} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Phishing Attempts</span>
                          <span>24%</span>
                        </div>
                        <Progress value={24} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Collection & Management</CardTitle>
                <CardDescription>Digital forensics and evidence preservation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Evidence Management System</h3>
                  <p className="text-gray-500 mb-4">
                    Secure collection, storage, and analysis of digital evidence
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Automatic Collection</h4>
                      <p className="text-sm text-gray-500">
                        Automated evidence gathering from system logs, network traffic, and file systems
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Chain of Custody</h4>
                      <p className="text-sm text-gray-500">
                        Complete audit trail and tamper-proof evidence tracking
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Forensic Analysis</h4>
                      <p className="text-sm text-gray-500">
                        Advanced tools for timeline analysis and correlation
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recovery" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recovery & Business Continuity</CardTitle>
                <CardDescription>Incident recovery procedures and business continuity planning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Recovery Status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Database Systems</div>
                            <div className="text-sm text-gray-500">Recovery progress: 85%</div>
                          </div>
                          <Progress value={85} className="w-24" />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">Network Infrastructure</div>
                            <div className="text-sm text-gray-500">Recovery progress: 100%</div>
                          </div>
                          <Progress value={100} className="w-24" />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">User Services</div>
                            <div className="text-sm text-gray-500">Recovery progress: 60%</div>
                          </div>
                          <Progress value={60} className="w-24" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Recovery Actions</h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>System isolation completed</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>Backup restoration initiated</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-yellow-500" />
                          <span>Security patches being applied</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Clock className="h-5 w-5 text-yellow-500" />
                          <span>Service validation in progress</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post-Incident Analysis & Reports</CardTitle>
                <CardDescription>Comprehensive incident reporting and lessons learned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Reporting</h3>
                  <p className="text-gray-500 mb-4">
                    Detailed incident analysis and trend reporting
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Incident Trends</h4>
                      <p className="text-sm text-gray-500">
                        Historical analysis and pattern identification
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Response Metrics</h4>
                      <p className="text-sm text-gray-500">
                        Performance indicators and SLA compliance
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Lessons Learned</h4>
                      <p className="text-sm text-gray-500">
                        Post-incident reviews and improvements
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* New Incident Dialog */}
      <Dialog open={isNewIncidentOpen} onOpenChange={setIsNewIncidentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Incident</DialogTitle>
            <DialogDescription>
              Log a new security incident and begin the response process
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Incident Title</label>
                <Input placeholder="Brief description of the incident" />
              </div>
              <div>
                <label className="text-sm font-medium">Incident Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="malware">Malware</SelectItem>
                    <SelectItem value="phishing">Phishing</SelectItem>
                    <SelectItem value="data_breach">Data Breach</SelectItem>
                    <SelectItem value="ddos">DDoS</SelectItem>
                    <SelectItem value="insider_threat">Insider Threat</SelectItem>
                    <SelectItem value="network_intrusion">Network Intrusion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Assignee</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security_analyst_1">Security Analyst 1</SelectItem>
                    <SelectItem value="security_analyst_2">Security Analyst 2</SelectItem>
                    <SelectItem value="forensics_1">Forensics Specialist</SelectItem>
                    <SelectItem value="incident_commander">Incident Commander</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                placeholder="Detailed description of the incident, including observed symptoms and initial findings"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Affected Systems</label>
              <Input placeholder="Enter system names separated by commas" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewIncidentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsNewIncidentOpen(false)}>
              Create Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incident Detail Dialog */}
      {selectedIncident && (
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedIncident.id} - {selectedIncident.title}</DialogTitle>
              <DialogDescription>
                Incident details and response timeline
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Incident Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Type:</span> {selectedIncident.type}</div>
                    <div><span className="font-medium">Severity:</span> 
                      <Badge className={getSeverityColor(selectedIncident.severity)}>
                        {selectedIncident.severity}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Status:</span> 
                      <Badge className={getStatusColor(selectedIncident.status)}>
                        {selectedIncident.status}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Assignee:</span> {selectedIncident.assignee}</div>
                    <div><span className="font-medium">Created:</span> {new Date(selectedIncident.created_at).toLocaleString()}</div>
                    <div><span className="font-medium">Last Updated:</span> {new Date(selectedIncident.last_updated).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Affected Systems</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.affected_systems.map((system) => (
                      <Badge key={system} variant="secondary">
                        {system}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedIncident.description}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Evidence Items ({selectedIncident.evidence_count})</h4>
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Evidence collection system integrated here
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Response Actions</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-2 border rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Incident classified and assigned</span>
                  </div>
                  <div className="flex items-center space-x-3 p-2 border rounded">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Initial investigation in progress</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedIncident(null)}>
                Close
              </Button>
              <Button>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default App
