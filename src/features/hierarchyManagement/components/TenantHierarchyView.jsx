/**
 * Tenant Hierarchy View
 * Displays Properties → Buildings → Tenants with nested dropdowns
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Home, Building2, Users, Phone, Mail, MapPin } from 'lucide-react';

export default function TenantHierarchyView({ properties = [], onTenantSelect = () => {} }) {
  const [expandedProperties, setExpandedProperties] = useState(new Set());
  const [expandedBuildings, setExpandedBuildings] = useState(new Set());
  const [selectedTenant, setSelectedTenant] = useState(null);

  const toggleProperty = (propertyId) => {
    const newExpanded = new Set(expandedProperties);
    if (newExpanded.has(propertyId)) {
      newExpanded.delete(propertyId);
    } else {
      newExpanded.add(propertyId);
    }
    setExpandedProperties(newExpanded);
  };

  const toggleBuilding = (buildingId) => {
    const newExpanded = new Set(expandedBuildings);
    if (newExpanded.has(buildingId)) {
      newExpanded.delete(buildingId);
    } else {
      newExpanded.add(buildingId);
    }
    setExpandedBuildings(newExpanded);
  };

  const handleTenantSelect = (tenant) => {
    setSelectedTenant(tenant);
    onTenantSelect(tenant);
  };

  if (!properties || properties.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No properties data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Home className="w-6 h-6" />
          Property Hierarchy
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {properties.length} properties • {properties.reduce((sum, p) => sum + p.buildingCount, 0)} buildings •{' '}
          {properties.reduce((sum, p) => sum + p.tenantCount, 0)} tenants
        </p>
      </div>

      {/* Properties List */}
      <div className="space-y-3">
        {properties.map((property) => (
          <div key={property.propertyId} className="border rounded-lg overflow-hidden">
            {/* Property Header */}
            <button
              onClick={() => toggleProperty(property.propertyId)}
              className="w-full bg-blue-50 hover:bg-blue-100 px-4 py-3 flex items-center justify-between border-b transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                {expandedProperties.has(property.propertyId) ? (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                )}
                <Home className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-semibold text-gray-900">{property.displayName}</div>
                  <div className="text-xs text-gray-600">
                    {property.buildingCount} building{property.buildingCount !== 1 ? 's' : ''} •{' '}
                    {property.tenantCount} tenant{property.tenantCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Property KPIs */}
              <div className="flex gap-4 text-xs text-gray-700 mr-2">
                <div className="text-right">
                  <div className="font-semibold text-green-600">{property.kpis?.successRate || '0%'}</div>
                  <div className="text-gray-500">Success Rate</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-blue-600">{property.kpis?.satisfactionRate || '0%'}</div>
                  <div className="text-gray-500">Satisfaction</div>
                </div>
              </div>
            </button>

            {/* Buildings List */}
            {expandedProperties.has(property.propertyId) && (
              <div className="bg-gray-50 p-4 space-y-2 border-t">
                {property.buildings?.map((building) => (
                  <div key={building.buildingId} className="bg-white rounded border">
                    {/* Building Header */}
                    <button
                      onClick={() => toggleBuilding(building.buildingId)}
                      className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        {expandedBuildings.has(building.buildingId) ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        <Building2 className="w-4 h-4 text-gray-600" />
                        <div className="text-left text-sm">
                          <div className="font-medium text-gray-900">{building.displayName}</div>
                          <div className="text-xs text-gray-500">{building.tenants?.length || 0} tenants</div>
                        </div>
                      </div>

                      {/* Building KPIs */}
                      <div className="flex gap-3 text-xs text-gray-600 mr-2">
                        <div className="text-right">
                          <div className="font-semibold">{building.kpis?.successRate || '0%'}</div>
                        </div>
                      </div>
                    </button>

                    {/* Tenants List */}
                    {expandedBuildings.has(building.buildingId) && (
                      <div className="bg-gray-50 p-3 space-y-2 border-t">
                        {building.tenantList?.map((tenant) => (
                          <button
                            key={tenant.phoneNumber}
                            onClick={() => handleTenantSelect(tenant)}
                            className={`w-full p-3 rounded border text-left transition-colors ${
                              selectedTenant?.phoneNumber === tenant.phoneNumber
                                ? 'bg-blue-100 border-blue-300'
                                : 'bg-white hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  {tenant.name}
                                </div>

                                {/* Tenant Details */}
                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                  {tenant.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-3 h-3" />
                                      {tenant.email}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    {tenant.phoneNumber}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {tenant.conversationCount} conversation{tenant.conversationCount !== 1 ? 's' : ''} •{' '}
                                    {tenant.messageCount} messages
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
