/**
 * Hierarchy Management Module
 * Exports for tenant, building, and property hierarchy services
 */

export { createAllTenantProfiles, createTenantProfile, getTenantProfile, groupByPhone } from './services/tenantHierarchyService';

export {
  groupByBuilding,
  createBuildingProfile,
  groupByProperty,
  createPropertyProfile,
  createCompleteHierarchy,
  aggregateKPIs,
} from './services/buildingHierarchyService';
