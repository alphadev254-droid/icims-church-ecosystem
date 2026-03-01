import apiClient from '@/lib/api-client';

export const locationService = {
  getRegions: async (): Promise<string[]> => {
    const { data } = await apiClient.get('/locations/regions');
    return data.data;
  },
  
  getDistricts: async (region: string): Promise<string[]> => {
    const { data } = await apiClient.get(`/locations/districts/${encodeURIComponent(region)}`);
    return data.data;
  },
  
  getTraditionalAuthorities: async (region: string, district: string): Promise<string[]> => {
    const { data } = await apiClient.get(`/locations/traditional-authorities/${encodeURIComponent(region)}/${encodeURIComponent(district)}`);
    return data.data;
  },
  
  getVillages: async (region: string, district: string, traditionalAuthority: string): Promise<string[]> => {
    const { data } = await apiClient.get(`/locations/villages/${encodeURIComponent(region)}/${encodeURIComponent(district)}/${encodeURIComponent(traditionalAuthority)}`);
    return data.data;
  },

  // Helper to get TAs by district (fetches region first)
  getTAs: async (district: string): Promise<string[]> => {
    // First get all regions
    const regions = await locationService.getRegions();
    // Find which region contains this district
    for (const region of regions) {
      const districts = await locationService.getDistricts(region);
      if (districts.includes(district)) {
        // Found the region, now get TAs
        return await locationService.getTraditionalAuthorities(region, district);
      }
    }
    return [];
  },
};

// Alias for backward compatibility
export const locationsService = locationService;