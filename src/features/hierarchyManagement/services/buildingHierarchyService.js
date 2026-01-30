/**
 * Building & Property Hierarchy Service
 * Organizes tenants into buildings (street + number) and properties (street only)
 * Accumulates KPIs up the hierarchy
 */

/**
 * Normalize street name (remove variations like "Str.", "Straße", etc.)
 * @param {String} street - Street name
 * @returns {String} Normalized street name
 */
const normalizeStreet = (street) => {
  if (!street) return null;
  return street
    .toLowerCase()
    .replace(/\s+(strasse|str\.?|straße|weg|platz|allee|avenue|rue)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Group tenant profiles by building (street + number)
 * @param {Array} tenantProfiles - Array of tenant profiles
 * @returns {Object} {buildingId: {building, tenants: []}}
 */
export const groupByBuilding = (tenantProfiles) => {
  const buildingMap = {};

  tenantProfiles.forEach((tenant) => {
    if (!tenant.street || !tenant.streetNumber) {
      // Handle tenants without address
      const unknownId = 'building-unknown';
      if (!buildingMap[unknownId]) {
        buildingMap[unknownId] = {
          buildingId: unknownId,
          street: 'Unknown Street',
          streetNumber: null,
          city: null,
          displayName: 'Unknown Building',
          tenants: [],
          tenantCount: 0,
        };
      }
      buildingMap[unknownId].tenants.push(tenant);
      return;
    }

    // Create building ID from street + number
    const buildingId = `${normalizeStreet(tenant.street)}-${tenant.streetNumber}`.toLowerCase();

    if (!buildingMap[buildingId]) {
      buildingMap[buildingId] = {
        buildingId: buildingId,
        street: tenant.street,
        streetNumber: tenant.streetNumber,
        city: tenant.city,
        displayName: `${tenant.street} ${tenant.streetNumber}${tenant.city ? ', ' + tenant.city : ''}`,
        tenants: [],
        tenantCount: 0,
      };
    }

    buildingMap[buildingId].tenants.push(tenant);
  });

  // Update tenant counts and sort
  for (const [, building] of Object.entries(buildingMap)) {
    building.tenantCount = building.tenants.length;
    building.tenants.sort((a, b) => a.name.localeCompare(b.name));
  }

  return buildingMap;
};

/**
 * Create building profile with aggregated KPIs
 * @param {Object} building - Building object with tenants
 * @param {Object} tenantKPIs - Map of tenant phone → KPI metrics
 * @returns {Object} Building profile with aggregated data
 */
export const createBuildingProfile = (building, tenantKPIs = {}) => {
  const tenantKPIList = building.tenants
    .map((tenant) => tenantKPIs[tenant.phoneNumber] || {})
    .filter((kpi) => Object.keys(kpi).length > 0);

  // Aggregate KPIs
  const aggregatedKPIs = aggregateKPIs(tenantKPIList);

  return {
    ...building,
    kpis: aggregatedKPIs,
    tenantList: building.tenants.map((t) => ({
      phoneNumber: t.phoneNumber,
      name: t.name,
      email: t.email,
      conversationCount: t.conversationCount,
      messageCount: t.messageCount,
    })),
  };
};

/**
 * Group tenant profiles by property (street name only)
 * @param {Array} tenantProfiles - Array of tenant profiles
 * @returns {Object} {propertyId: {property, buildings: {}}}
 */
export const groupByProperty = (tenantProfiles) => {
  const propertyMap = {};

  tenantProfiles.forEach((tenant) => {
    if (!tenant.street) {
      // Handle unknown properties
      const unknownId = 'property-unknown';
      if (!propertyMap[unknownId]) {
        propertyMap[unknownId] = {
          propertyId: unknownId,
          street: 'Unknown Property',
          city: null,
          displayName: 'Unknown Property',
          buildings: {},
          buildingCount: 0,
          tenantCount: 0,
        };
      }
      propertyMap[unknownId].tenantCount++;
      return;
    }

    // Create property ID from street name only
    const propertyId = normalizeStreet(tenant.street).toLowerCase();

    if (!propertyMap[propertyId]) {
      propertyMap[propertyId] = {
        propertyId: propertyId,
        street: tenant.street,
        city: tenant.city,
        displayName: tenant.city ? `${tenant.street}, ${tenant.city}` : tenant.street,
        buildings: {},
        buildingCount: 0,
        tenantCount: 0,
      };
    }

    // Add to building within property
    const buildingId = `${propertyId}-${tenant.streetNumber}`.toLowerCase();
    if (!propertyMap[propertyId].buildings[buildingId]) {
      propertyMap[propertyId].buildings[buildingId] = {
        buildingId: buildingId,
        street: tenant.street,
        streetNumber: tenant.streetNumber,
        city: tenant.city,
        displayName: `${tenant.street} ${tenant.streetNumber}`,
        tenants: [],
      };
    }

    propertyMap[propertyId].buildings[buildingId].tenants.push(tenant);
    propertyMap[propertyId].tenantCount++;
  });

  // Update building counts
  for (const [, property] of Object.entries(propertyMap)) {
    property.buildingCount = Object.keys(property.buildings).length;
  }

  return propertyMap;
};

/**
 * Create property profile with aggregated KPIs
 * @param {Object} property - Property object with buildings
 * @param {Object} tenantKPIs - Map of tenant phone → KPI metrics
 * @returns {Object} Property profile with aggregated data
 */
export const createPropertyProfile = (property, tenantKPIs = {}) => {
  const buildingProfiles = Object.values(property.buildings).map((building) =>
    createBuildingProfile(building, tenantKPIs)
  );

  const allTenantKPIs = buildingProfiles
    .flatMap((b) => b.tenantList)
    .map((t) => tenantKPIs[t.phoneNumber] || {})
    .filter((kpi) => Object.keys(kpi).length > 0);

  const aggregatedKPIs = aggregateKPIs(allTenantKPIs);

  return {
    ...property,
    buildings: buildingProfiles,
    kpis: aggregatedKPIs,
  };
};

/**
 * Aggregate KPIs from multiple sources (tenants/buildings/properties)
 * @param {Array} kpiList - Array of KPI objects to aggregate
 * @returns {Object} Aggregated KPI metrics
 */
export const aggregateKPIs = (kpiList) => {
  if (!kpiList || kpiList.length === 0) {
    return {
      totalConversations: 0,
      averageResponseTime: 'N/A',
      successRate: '0%',
      satisfactionRate: '0%',
      frustrationRate: '0%',
      avgConversationLength: '0',
      totalMessages: 0,
      uniqueIssueTypes: [],
      dataQualityScore: '0%',
    };
  }

  // Sum metrics
  let totalConversations = 0;
  let totalMessages = 0;
  let totalResponseTime = 0;
  let totalSuccess = 0;
  let totalReports = 0;
  let totalSatisfaction = 0;
  let totalFrustration = 0;
  let totalConvLength = 0;
  let totalQuality = 0;
  const issueTypes = new Set();

  kpiList.forEach((kpi) => {
    if (kpi.totalInquiries) totalConversations += kpi.totalInquiries;
    if (kpi.totalMessages) totalMessages += kpi.totalMessages;
    if (kpi.avgConversationLength) totalConvLength += parseFloat(kpi.avgConversationLength) || 0;
    if (kpi.satisfied) totalSatisfaction += kpi.satisfied;
    if (kpi.frustrated) totalFrustration += kpi.frustrated;
    if (kpi.successfulReports) totalSuccess += kpi.successfulReports;
    if (kpi.failedReports) totalReports += kpi.failedReports;
    if (kpi.dataQualityScore) totalQuality += parseFloat(kpi.dataQualityScore) || 0;

    // Collect issue types
    if (kpi.topIssues && Array.isArray(kpi.topIssues)) {
      kpi.topIssues.forEach((issue) => issueTypes.add(issue.category || issue.name || issue));
    }
  });

  const avgResponseTime =
    kpiList.length > 0
      ? kpiList
          .map((k) => (k.avgResponseTime ? parseFloat(k.avgResponseTime) : 0))
          .reduce((a, b) => a + b, 0) / kpiList.length
      : 0;

  const avgConvLength = kpiList.length > 0 ? totalConvLength / kpiList.length : 0;
  const avgQuality = kpiList.length > 0 ? totalQuality / kpiList.length : 0;
  const successRate =
    totalReports > 0 ? ((totalSuccess / (totalSuccess + totalReports)) * 100).toFixed(1) : 0;
  const satisfactionRate =
    totalSatisfaction + totalFrustration > 0
      ? ((totalSatisfaction / (totalSatisfaction + totalFrustration)) * 100).toFixed(1)
      : 0;

  return {
    totalConversations,
    totalMessages,
    averageResponseTime: avgResponseTime.toFixed(1) + 's',
    successRate: successRate + '%',
    satisfactionRate: satisfactionRate + '%',
    frustrationRate: (100 - satisfactionRate).toFixed(1) + '%',
    avgConversationLength: avgConvLength.toFixed(1),
    uniqueIssueTypes: Array.from(issueTypes),
    dataQualityScore: avgQuality.toFixed(0) + '%',
  };
};

/**
 * Create complete hierarchy: Properties → Buildings → Tenants
 * @param {Array} tenantProfiles - All tenant profiles
 * @param {Object} tenantKPIs - Map of tenant phone → KPI metrics
 * @returns {Array} Array of property profiles
 */
export const createCompleteHierarchy = (tenantProfiles, tenantKPIs = {}) => {
  const propertyMap = groupByProperty(tenantProfiles);
  const properties = [];

  for (const [, property] of Object.entries(propertyMap)) {
    const propertyProfile = createPropertyProfile(property, tenantKPIs);
    properties.push(propertyProfile);
  }

  // Sort by street name
  return properties.sort((a, b) => a.street.localeCompare(b.street));
};
