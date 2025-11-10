'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useBranch,
  useBranchStaffAssignments,
  useBranchInventory,
  useBranchMetrics,
  useBranchSettings,
  useBranchAssets,
  useUpdateBranch
} from '@/hooks/useBranch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  CubeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  PencilIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function BranchDetailPage({ params }: { params: { id: string } }) {
  const branchId = params.id;
  const { user } = useAuth();
  const organizationId = user?.user_metadata?.organization_id;

  const { data: branch, isLoading: loadingBranch } = useBranch(branchId);
  const { data: staffAssignments, isLoading: loadingStaff } = useBranchStaffAssignments(branchId);
  const { data: inventory, isLoading: loadingInventory } = useBranchInventory(branchId);
  const { data: metrics, isLoading: loadingMetrics } = useBranchMetrics(branchId, 'monthly');
  const { data: settings, isLoading: loadingSettings } = useBranchSettings(branchId);
  const { data: assets, isLoading: loadingAssets } = useBranchAssets(branchId);

  const [activeTab, setActiveTab] = useState('overview');

  if (loadingBranch) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!branch) {
    return (
      <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-12">
        <div className="text-center">
          <BuildingOffice2Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Branch not found</h3>
          <p className="text-gray-400 mb-6">The branch you're looking for doesn't exist or has been deleted.</p>
          <Link href="/branches">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Back to Branches
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      inactive: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      under_renovation: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      temporarily_closed: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      permanently_closed: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors.active;
  };

  const latestMetrics = metrics?.[0];
  const lowStockItems = inventory?.filter(item => 
    item.status === 'low_stock' || item.quantity_in_stock <= item.minimum_stock_level
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-4">
          <Link href="/branches">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{branch.branch_name}</h1>
              <Badge className={getStatusColor(branch.status)}>
                {branch.status.replace('_', ' ')}
              </Badge>
              {branch.is_flagship && (
                <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                  Flagship
                </Badge>
              )}
            </div>
            <p className="text-gray-400">
              {branch.branch_type.charAt(0).toUpperCase() + branch.branch_type.slice(1)} • {branch.branch_code}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/branches/${branchId}/edit`}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Branch
            </Button>
          </Link>
          <Link href={`/branches/${branchId}/settings`}>
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              <Cog6ToothIcon className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <UserGroupIcon className="h-6 w-6 text-indigo-400" />
            <span className="text-sm text-gray-400">Total Staff</span>
          </div>
          <div className="text-3xl font-bold text-white">{branch.total_staff_count}</div>
          {staffAssignments && (
            <div className="text-xs text-gray-400 mt-1">
              {staffAssignments.filter(s => s.assignment_type === 'permanent').length} permanent
            </div>
          )}
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ChartBarIcon className="h-6 w-6 text-green-400" />
            <span className="text-sm text-gray-400">Monthly Revenue</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {(latestMetrics?.total_revenue_aed || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-1">AED</div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CubeIcon className="h-6 w-6 text-yellow-400" />
            <span className="text-sm text-gray-400">Inventory Items</span>
          </div>
          <div className="text-3xl font-bold text-white">{inventory?.length || 0}</div>
          {lowStockItems && lowStockItems.length > 0 && (
            <div className="text-xs text-orange-400 mt-1">{lowStockItems.length} low stock</div>
          )}
        </Card>

        <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <WrenchScrewdriverIcon className="h-6 w-6 text-purple-400" />
            <span className="text-sm text-gray-400">Assets</span>
          </div>
          <div className="text-3xl font-bold text-white">{assets?.length || 0}</div>
          {assets && (
            <div className="text-xs text-gray-400 mt-1">
              {assets.filter(a => a.status === 'active').length} active
            </div>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b border-white/10 mb-6">
          <div className="flex gap-4">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'staff', label: 'Staff' },
              { id: 'inventory', label: 'Inventory' },
              { id: 'performance', label: 'Performance' },
              { id: 'assets', label: 'Assets' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Location Details */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-indigo-400" />
                Location Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Address</div>
                  <div className="text-white">
                    {branch.address_line1}<br />
                    {branch.address_line2 && <>{branch.address_line2}<br /></>}
                    {branch.city}, {branch.emirate || 'UAE'}<br />
                    {branch.postal_code && <>{branch.postal_code}</>}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 mb-1">Primary Phone</div>
                  <div className="text-white">{branch.phone_primary}</div>
                </div>
                {branch.phone_secondary && (
                  <div>
                    <div className="text-gray-400 mb-1">Secondary Phone</div>
                    <div className="text-white">{branch.phone_secondary}</div>
                  </div>
                )}
                {branch.email && (
                  <div>
                    <div className="text-gray-400 mb-1">Email</div>
                    <div className="text-white">{branch.email}</div>
                  </div>
                )}
                {branch.whatsapp && (
                  <div>
                    <div className="text-gray-400 mb-1">WhatsApp</div>
                    <div className="text-white">{branch.whatsapp}</div>
                  </div>
                )}
              </div>
            </Card>

            {/* Operational Details */}
            <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BuildingOffice2Icon className="h-5 w-5 text-indigo-400" />
                Operational Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-400 mb-1">Opening Date</div>
                  <div className="text-white">{new Date(branch.opening_date).toLocaleDateString()}</div>
                </div>
                {branch.floor_area_sqm && (
                  <div>
                    <div className="text-gray-400 mb-1">Floor Area</div>
                    <div className="text-white">{branch.floor_area_sqm} sqm</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-400 mb-1">Number of Floors</div>
                  <div className="text-white">{branch.number_of_floors}</div>
                </div>
                {branch.staff_capacity && (
                  <div>
                    <div className="text-gray-400 mb-1">Staff Capacity</div>
                    <div className="text-white">{branch.staff_capacity}</div>
                  </div>
                )}
                {branch.production_capacity_per_month && (
                  <div>
                    <div className="text-gray-400 mb-1">Production Capacity</div>
                    <div className="text-white">{branch.production_capacity_per_month} per month</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-400 mb-1">Services</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {branch.allows_walk_in && (
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                        Walk-in
                      </Badge>
                    )}
                    {branch.allows_delivery && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                        Delivery
                      </Badge>
                    )}
                    {branch.allows_pickup && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                        Pickup
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Information */}
            {(branch.monthly_rent_aed || branch.monthly_utilities_budget_aed || branch.monthly_overhead_aed) && (
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Financial Information</h3>
                <div className="space-y-3 text-sm">
                  {branch.monthly_rent_aed && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Rent</span>
                      <span className="text-white font-medium">{branch.monthly_rent_aed.toLocaleString()} AED</span>
                    </div>
                  )}
                  {branch.monthly_utilities_budget_aed && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Utilities Budget</span>
                      <span className="text-white font-medium">{branch.monthly_utilities_budget_aed.toLocaleString()} AED</span>
                    </div>
                  )}
                  {branch.monthly_overhead_aed && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monthly Overhead</span>
                      <span className="text-white font-medium">{branch.monthly_overhead_aed.toLocaleString()} AED</span>
                    </div>
                  )}
                  {branch.monthly_rent_aed && branch.monthly_utilities_budget_aed && branch.monthly_overhead_aed && (
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-white font-semibold">Total Monthly Costs</span>
                      <span className="text-white font-semibold">
                        {((branch.monthly_rent_aed || 0) + (branch.monthly_utilities_budget_aed || 0) + (branch.monthly_overhead_aed || 0)).toLocaleString()} AED
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* UAE Compliance */}
            {(branch.trade_license_number || branch.municipality_license || branch.civil_defense_certificate) && (
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">UAE Compliance</h3>
                <div className="space-y-3 text-sm">
                  {branch.trade_license_number && (
                    <div>
                      <div className="text-gray-400 mb-1">Trade License Number</div>
                      <div className="text-white">{branch.trade_license_number}</div>
                      {branch.trade_license_expiry && (
                        <div className="text-xs text-gray-400 mt-1">
                          Expires: {new Date(branch.trade_license_expiry).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                  {branch.municipality_license && (
                    <div>
                      <div className="text-gray-400 mb-1">Municipality License</div>
                      <div className="text-white">{branch.municipality_license}</div>
                    </div>
                  )}
                  {branch.civil_defense_certificate && (
                    <div>
                      <div className="text-gray-400 mb-1">Civil Defense Certificate</div>
                      <div className="text-white">{branch.civil_defense_certificate}</div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Staff Assignments</h3>
              <Link href={`/branches/${branchId}/staff/new`}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Assign Staff
                </Button>
              </Link>
            </div>
            {loadingStaff ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : staffAssignments && staffAssignments.length > 0 ? (
              <div className="grid gap-4">
                {staffAssignments.map(assignment => (
                  <Card key={assignment.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{assignment.role_at_branch}</span>
                          <Badge className={`text-xs ${
                            assignment.status === 'active'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }`}>
                            {assignment.status}
                          </Badge>
                          {assignment.is_primary_location && (
                            <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {assignment.assignment_type} • {assignment.department || 'No department'} • {assignment.access_level}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Started: {new Date(assignment.start_date).toLocaleDateString()}
                          {assignment.end_date && ` • Ends: ${new Date(assignment.end_date).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {assignment.weekly_hours && (
                          <div className="text-white">{assignment.weekly_hours}h/week</div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                <div className="text-center">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No staff assigned to this branch yet</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Branch Inventory</h3>
              <Link href={`/branches/inventory?branch=${branchId}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  View Full Inventory
                </Button>
              </Link>
            </div>
            {loadingInventory ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : inventory && inventory.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems && lowStockItems.length > 0 && (
                  <Card className="bg-orange-500/10 backdrop-blur-xl border border-orange-500/30 p-4">
                    <div className="flex items-center gap-2 text-orange-300">
                      <CubeIcon className="h-5 w-5" />
                      <span className="font-medium">{lowStockItems.length} items are low on stock</span>
                    </div>
                  </Card>
                )}
                <div className="grid gap-3">
                  {inventory.slice(0, 10).map(item => (
                    <Card key={item.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-medium">Material ID: {item.material_id.substring(0, 8)}...</div>
                          <div className="text-sm text-gray-400 mt-1">
                            {item.storage_location && `${item.storage_location} • `}
                            {item.unit_of_measure}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{item.quantity_in_stock.toFixed(2)}</div>
                          <Badge className={`text-xs mt-1 ${
                            item.status === 'available'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : item.status === 'low_stock'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                <div className="text-center">
                  <CubeIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No inventory items at this branch</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
              <Link href={`/branches/analytics?branch=${branchId}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  View Full Analytics
                </Button>
              </Link>
            </div>
            {loadingMetrics ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : latestMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                  <div className="text-sm text-gray-400 mb-2">Total Orders</div>
                  <div className="text-3xl font-bold text-white">{latestMetrics.total_orders}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {latestMetrics.completed_orders} completed, {latestMetrics.pending_orders} pending
                  </div>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                  <div className="text-sm text-gray-400 mb-2">Revenue</div>
                  <div className="text-3xl font-bold text-white">
                    {latestMetrics.total_revenue_aed.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">AED</div>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                  <div className="text-sm text-gray-400 mb-2">Average Order Value</div>
                  <div className="text-3xl font-bold text-white">
                    {latestMetrics.average_order_value_aed.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">AED</div>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                  <div className="text-sm text-gray-400 mb-2">Customers Served</div>
                  <div className="text-3xl font-bold text-white">{latestMetrics.total_customers_served}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {latestMetrics.new_customers} new, {latestMetrics.returning_customers} returning
                  </div>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                  <div className="text-sm text-gray-400 mb-2">Production</div>
                  <div className="text-3xl font-bold text-white">{latestMetrics.garments_produced}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {latestMetrics.alterations_completed} alterations
                  </div>
                </Card>

                <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                  <div className="text-sm text-gray-400 mb-2">On-Time Delivery</div>
                  <div className="text-3xl font-bold text-white">
                    {latestMetrics.on_time_delivery_percentage?.toFixed(1) || 0}%
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Delivery rate</div>
                </Card>
              </div>
            ) : (
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No performance metrics available yet</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Branch Assets</h3>
              <Link href={`/branches/${branchId}/assets/new`}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Add Asset
                </Button>
              </Link>
            </div>
            {loadingAssets ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : assets && assets.length > 0 ? (
              <div className="grid gap-4">
                {assets.map(asset => (
                  <Card key={asset.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{asset.asset_name}</span>
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-xs">
                            {asset.asset_type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">{asset.asset_code}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-xs ${
                            asset.status === 'active'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                          }`}>
                            {asset.status}
                          </Badge>
                          <Badge className={`text-xs ${
                            asset.condition === 'excellent' || asset.condition === 'good'
                              ? 'bg-green-500/20 text-green-300 border-green-500/30'
                              : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                          }`}>
                            {asset.condition}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {asset.purchase_cost_aed && (
                          <div className="text-white">{asset.purchase_cost_aed.toLocaleString()} AED</div>
                        )}
                        {asset.purchase_date && (
                          <div className="text-gray-400 text-xs mt-1">
                            {new Date(asset.purchase_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/5 backdrop-blur-xl border border-white/10 p-8">
                <div className="text-center">
                  <WrenchScrewdriverIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">No assets registered at this branch</p>
                </div>
              </Card>
            )}
          </div>
        )}
      </Tabs>
    </div>
  );
}
