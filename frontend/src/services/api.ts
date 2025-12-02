import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginRequest,
  SignUpRequest,
  RequestCodeRequest,
  ValidateAccountRequest,
  User,
  AuthTokens
} from '../types/auth';
import { Character, Event, Group, Object as StoryObject, Relationship, RelationshipHistory, RelationshipArcData, Project, Alias, Location, LocationTag, LocationHistory, EntityLocation, PaginatedResponse, TextToDiagramResponse, PlotThread, Chapter, Paragraph } from '../types/diagram';
import backendManager from './BackendManager';
import env from '../config/environment';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: env.apiBaseUrl,
      withCredentials: true, // Important for cookie-based authentication
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to ensure backend is ready and use dynamic URL
    this.api.interceptors.request.use(
      async (config) => {
        // Ensure backend is running (only affects on-demand backends)
        await backendManager.ensureBackendReady();

        // Update base URL dynamically (in case backend IP changed)
        config.baseURL = backendManager.getApiBaseUrl();

        // Add auth token if available
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token refresh and server errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle network errors (backend might be cold-starting)
        if (!error.response && env.backend.useOnDemandBackend) {
          // Network error with on-demand backend - might be cold start
          if (!originalRequest._backendRetry) {
            originalRequest._backendRetry = true;
            console.log('Network error, attempting to wake backend...');

            // Reset backend state and try to start it
            backendManager.reset();
            await backendManager.ensureBackendReady();

            // Retry the request
            return this.api(originalRequest);
          }
        }

        // Handle 500 server errors
        if (error.response?.status >= 500) {
          // If using on-demand backend, try one retry after resetting
          if (env.backend.useOnDemandBackend && !originalRequest._serverErrorRetry) {
            originalRequest._serverErrorRetry = true;
            console.log('Server error, attempting to restart backend...');

            backendManager.reset();
            await backendManager.ensureBackendReady();

            return this.api(originalRequest);
          }

          // After retry or if not on-demand, show error page
          if (!window.location.pathname.includes('/server-down')) {
            window.location.href = '/server-down';
          }
          return Promise.reject(error);
        }

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken();
              const { access } = response.data;
              localStorage.setItem('access_token', access);
              originalRequest.headers.Authorization = `Bearer ${access}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(data: LoginRequest): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/login/', data);
  }

  async signUp(data: SignUpRequest): Promise<AxiosResponse<{ user: User } & AuthTokens>> {
    return this.api.post('/auth/sign-up/', data);
  }

  async requestCode(data: RequestCodeRequest): Promise<AxiosResponse<{ provider: string }>> {
    return this.api.post('/auth/request-code/', data);
  }

  async validateAccount(data: ValidateAccountRequest): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/validate-account/', data);
  }

  async requestValidateToken(data: RequestCodeRequest): Promise<AxiosResponse<{ provider: string }>> {
    return this.api.post('/auth/request-validate-token/', data);
  }

  async refreshToken(): Promise<AxiosResponse<AuthTokens>> {
    return this.api.post('/auth/token-refresh/');
  }

  async signOut(): Promise<AxiosResponse<void>> {
    return this.api.post('/auth/sign-out/');
  }

  // User endpoints
  async getCurrentUser(): Promise<AxiosResponse<User>> {
    return this.api.get('/users/me/');
  }

  // Project endpoints
  async getProjects(filter?: 'my-projects' | 'public', authorId?: number): Promise<AxiosResponse<PaginatedResponse<Project>>> {
    const params = new URLSearchParams();
    if (filter) {
      params.append('filter', filter);
    }
    if (authorId) {
      params.append('author', authorId.toString());
    }
    const url = params.toString() ? `/projects/?${params.toString()}` : '/projects/';
    return this.api.get(url);
  }

  async getProject(id: number): Promise<AxiosResponse<Project>> {
    return this.api.get(`/projects/${id}/`);
  }

  async createProject(data: Partial<Project> | FormData): Promise<AxiosResponse<Project>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.post('/projects/', data, { headers });
  }

  async updateProject(id: number, data: Partial<Project> | FormData): Promise<AxiosResponse<Project>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.patch(`/projects/${id}/`, data, { headers });
  }

  async deleteProject(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/projects/${id}/`);
  }

  // Character endpoints
  async getCharacters(projectId?: number): Promise<AxiosResponse<PaginatedResponse<Character>>> {
    const url = projectId ? `/characters/?project=${projectId}` : '/characters/';
    return this.api.get(url);
  }

  async getCharacter(id: number): Promise<AxiosResponse<Character>> {
    return this.api.get(`/characters/${id}/`);
  }

  async createCharacter(data: Partial<Character> | FormData): Promise<AxiosResponse<Character>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.post('/characters/', data, { headers });
  }

  async updateCharacter(id: number, data: Partial<Character> | FormData): Promise<AxiosResponse<Character>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.patch(`/characters/${id}/`, data, { headers });
  }

  async deleteCharacter(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/characters/${id}/`);
  }

  // Event endpoints
  async getEvents(
    projectId?: number,
    filterEntityIds?: number[],
    parentId?: number | null,
    recursive?: boolean
  ): Promise<AxiosResponse<PaginatedResponse<Event>>> {
    const params = new URLSearchParams();
    if (projectId) {
      params.append('project', projectId.toString());
    }
    if (filterEntityIds && filterEntityIds.length > 0) {
      params.append('filter_entities', filterEntityIds.join(','));
    }
    if (parentId !== undefined) {
      // null means fetch top-level events, number means fetch children of that parent
      params.append('parent', parentId === null ? 'null' : parentId.toString());
    }
    if (recursive !== undefined) {
      params.append('recursive', recursive.toString());
    }
    const url = params.toString() ? `/events/?${params.toString()}` : '/events/';
    return this.api.get(url);
  }

  async getEvent(id: number): Promise<AxiosResponse<Event>> {
    return this.api.get(`/events/${id}/`);
  }

  async createEvent(data: Partial<Event>): Promise<AxiosResponse<Event>> {
    return this.api.post('/events/', data);
  }

  async updateEvent(id: number, data: Partial<Event>): Promise<AxiosResponse<Event>> {
    return this.api.patch(`/events/${id}/`, data);
  }

  async deleteEvent(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/events/${id}/`);
  }

  // Group endpoints
  async getGroups(projectId?: number): Promise<AxiosResponse<PaginatedResponse<Group>>> {
    const url = projectId ? `/groups/?project=${projectId}` : '/groups/';
    return this.api.get(url);
  }

  async getGroup(id: number): Promise<AxiosResponse<Group>> {
    return this.api.get(`/groups/${id}/`);
  }

  async createGroup(data: Partial<Group> | FormData): Promise<AxiosResponse<Group>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.post('/groups/', data, { headers });
  }

  async updateGroup(id: number, data: Partial<Group> | FormData): Promise<AxiosResponse<Group>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.patch(`/groups/${id}/`, data, { headers });
  }

  async deleteGroup(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/groups/${id}/`);
  }

  async addCharacterToGroup(groupId: number, characterId: number): Promise<AxiosResponse<any>> {
    return this.api.post(`/groups/${groupId}/add-character/`, { character_id: characterId });
  }

  async removeCharacterFromGroup(groupId: number, characterId: number): Promise<AxiosResponse<any>> {
    return this.api.post(`/groups/${groupId}/remove-character/`, { character_id: characterId });
  }

  // Object endpoints
  async getObjects(projectId?: number): Promise<AxiosResponse<PaginatedResponse<StoryObject>>> {
    const url = projectId ? `/objects/?project=${projectId}` : '/objects/';
    return this.api.get(url);
  }

  async getObject(id: number): Promise<AxiosResponse<StoryObject>> {
    return this.api.get(`/objects/${id}/`);
  }

  async createObject(data: Partial<StoryObject> | FormData): Promise<AxiosResponse<StoryObject>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.post('/objects/', data, { headers });
  }

  async updateObject(id: number, data: Partial<StoryObject> | FormData): Promise<AxiosResponse<StoryObject>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.patch(`/objects/${id}/`, data, { headers });
  }

  async deleteObject(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/objects/${id}/`);
  }

  // Relationship endpoints
  async getRelationships(projectId?: number): Promise<AxiosResponse<PaginatedResponse<Relationship>>> {
    const url = projectId ? `/relationships/?project=${projectId}` : '/relationships/';
    return this.api.get(url);
  }

  async getRelationship(id: number): Promise<AxiosResponse<Relationship>> {
    return this.api.get(`/relationships/${id}/`);
  }

  async createRelationship(data: Partial<Relationship>): Promise<AxiosResponse<Relationship>> {
    return this.api.post('/relationships/', data);
  }

  async updateRelationship(id: number, data: Partial<Relationship>): Promise<AxiosResponse<Relationship>> {
    return this.api.patch(`/relationships/${id}/`, data);
  }

  async deleteRelationship(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/relationships/${id}/`);
  }

  // Temporal relationship endpoints
  async getRelationshipState(
    relationshipId: number,
    eventId: number
  ): Promise<AxiosResponse<{ type: string; intensity: number; status: string; description: string }>> {
    return this.api.get(`/relationships/${relationshipId}/state/?at_event=${eventId}`);
  }

  async getRelationshipHistory(relationshipId: number): Promise<AxiosResponse<RelationshipHistory[]>> {
    return this.api.get(`/relationships/${relationshipId}/history/`);
  }

  async recordRelationshipChange(
    relationshipId: number,
    data: {
      event_id: number;
      new_type?: string;
      new_intensity?: number;
      new_status?: string;
      change_reason?: string;
    }
  ): Promise<AxiosResponse<Relationship>> {
    return this.api.post(`/relationships/${relationshipId}/record-change/`, data);
  }

  async getRelationshipArc(relationshipId: number): Promise<AxiosResponse<RelationshipArcData[]>> {
    return this.api.get(`/relationships/${relationshipId}/arc/`);
  }

  // Alias endpoints
  async getAliases(entityId?: number): Promise<AxiosResponse<PaginatedResponse<Alias>>> {
    const url = entityId ? `/aliases/?entity=${entityId}` : '/aliases/';
    return this.api.get(url);
  }

  async getAlias(id: number): Promise<AxiosResponse<Alias>> {
    return this.api.get(`/aliases/${id}/`);
  }

  async createAlias(data: Partial<Alias>): Promise<AxiosResponse<Alias>> {
    return this.api.post('/aliases/', data);
  }

  async updateAlias(id: number, data: Partial<Alias>): Promise<AxiosResponse<Alias>> {
    return this.api.patch(`/aliases/${id}/`, data);
  }

  async deleteAlias(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/aliases/${id}/`);
  }

  // Location endpoints
  async getLocations(projectId?: number): Promise<AxiosResponse<PaginatedResponse<Location>>> {
    const url = projectId ? `/locations/?project=${projectId}` : '/story/locations/';
    return this.api.get(url);
  }

  async getLocation(id: number): Promise<AxiosResponse<Location>> {
    return this.api.get(`/locations/${id}/`);
  }

  async createLocation(data: Partial<Location> | FormData): Promise<AxiosResponse<Location>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.post('/locations/', data, { headers });
  }

  async updateLocation(id: number, data: Partial<Location> | FormData): Promise<AxiosResponse<Location>> {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    return this.api.patch(`/locations/${id}/`, data, { headers });
  }

  async deleteLocation(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/locations/${id}/`);
  }

  async getLocationHierarchy(id: number): Promise<AxiosResponse<any>> {
    return this.api.get(`/locations/${id}/hierarchy/`);
  }

  async getLocationTree(projectId: number): Promise<AxiosResponse<Location[]>> {
    return this.api.get(`/locations/tree/?project=${projectId}`);
  }

  // Location Tag endpoints
  async getLocationTags(): Promise<AxiosResponse<PaginatedResponse<LocationTag>>> {
    return this.api.get('/location-tags/');
  }

  async getLocationTag(id: number): Promise<AxiosResponse<LocationTag>> {
    return this.api.get(`/location-tags/${id}/`);
  }

  async createLocationTag(data: Partial<LocationTag>): Promise<AxiosResponse<LocationTag>> {
    return this.api.post('/location-tags/', data);
  }

  async updateLocationTag(id: number, data: Partial<LocationTag>): Promise<AxiosResponse<LocationTag>> {
    return this.api.patch(`/location-tags/${id}/`, data);
  }

  async deleteLocationTag(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/location-tags/${id}/`);
  }

  // Location History endpoints
  async getLocationHistory(params?: { locationId?: number; eventId?: number }): Promise<AxiosResponse<PaginatedResponse<LocationHistory>>> {
    let url = '/location-history/';
    const queryParams: string[] = [];
    if (params?.locationId) queryParams.push(`location=${params.locationId}`);
    if (params?.eventId) queryParams.push(`event=${params.eventId}`);
    if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
    return this.api.get(url);
  }

  async getLocationHistoryItem(id: number): Promise<AxiosResponse<LocationHistory>> {
    return this.api.get(`/location-history/${id}/`);
  }

  async createLocationHistory(data: Partial<LocationHistory>): Promise<AxiosResponse<LocationHistory>> {
    return this.api.post('/location-history/', data);
  }

  async updateLocationHistory(id: number, data: Partial<LocationHistory>): Promise<AxiosResponse<LocationHistory>> {
    return this.api.patch(`/location-history/${id}/`, data);
  }

  async deleteLocationHistory(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/location-history/${id}/`);
  }

  // Entity Location endpoints
  async getEntityLocations(params?: { entityId?: number; locationId?: number; eventId?: number; entityType?: string }): Promise<AxiosResponse<PaginatedResponse<EntityLocation>>> {
    let url = '/entity-locations/';
    const queryParams: string[] = [];
    if (params?.entityId) queryParams.push(`entity=${params.entityId}`);
    if (params?.locationId) queryParams.push(`location=${params.locationId}`);
    if (params?.eventId) queryParams.push(`event=${params.eventId}`);
    if (params?.entityType) queryParams.push(`entity_type=${params.entityType}`);
    if (queryParams.length > 0) url += `?${queryParams.join('&')}`;
    return this.api.get(url);
  }

  async getEntityLocationItem(id: number): Promise<AxiosResponse<EntityLocation>> {
    return this.api.get(`/entity-locations/${id}/`);
  }

  async createEntityLocation(data: Partial<EntityLocation>): Promise<AxiosResponse<EntityLocation>> {
    return this.api.post('/entity-locations/', data);
  }

  async updateEntityLocation(id: number, data: Partial<EntityLocation>): Promise<AxiosResponse<EntityLocation>> {
    return this.api.patch(`/entity-locations/${id}/`, data);
  }

  async deleteEntityLocation(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/entity-locations/${id}/`);
  }

  // Entity Location custom endpoints
  async getEntityLocationHistory(entityId: number): Promise<AxiosResponse<EntityLocation[]>> {
    return this.api.get(`/entity-locations/by_entity/?entity_id=${entityId}`);
  }

  async getLocationEntities(locationId: number, eventId: number): Promise<AxiosResponse<EntityLocation[]>> {
    return this.api.get(`/entity-locations/by_location/?location_id=${locationId}&event_id=${eventId}`);
  }

  async getEventEntityLocations(eventId: number): Promise<AxiosResponse<EntityLocation[]>> {
    return this.api.get(`/entity-locations/by_event/?event_id=${eventId}`);
  }

  // Text-to-diagram endpoint
  async textToDiagram(text: string, projectId: number): Promise<AxiosResponse<TextToDiagramResponse>> {
    return this.api.post('/text-to-diagram/', { text, project_id: projectId });
  }

  // Entity search endpoint with pagination
  async searchEntities(params: {
    q?: string;
    project?: number;
    entity_type?: 'character' | 'group' | 'location' | 'object' | 'system';
    page?: number;
    page_size?: number;
  }): Promise<AxiosResponse<{
    count: number;
    next: number | null;
    previous: number | null;
    results: any[];
    page: number;
    page_size: number;
    total_pages: number;
  }>> {
    const queryParams: string[] = [];
    if (params.q) queryParams.push(`q=${encodeURIComponent(params.q)}`);
    if (params.project) queryParams.push(`project=${params.project}`);
    if (params.entity_type) queryParams.push(`entity_type=${params.entity_type}`);
    if (params.page) queryParams.push(`page=${params.page}`);
    if (params.page_size) queryParams.push(`page_size=${params.page_size}`);

    const url = queryParams.length > 0
      ? `/entities/search/?${queryParams.join('&')}`
      : '/entities/search/';

    return this.api.get(url);
  }

  // Plot Thread endpoints
  async getPlotThreads(projectId?: number): Promise<AxiosResponse<PaginatedResponse<PlotThread>>> {
    const url = projectId ? `/plot-threads/?project=${projectId}` : '/plot-threads/';
    return this.api.get(url);
  }

  async getPlotThread(id: number): Promise<AxiosResponse<PlotThread>> {
    return this.api.get(`/plot-threads/${id}/`);
  }

  async createPlotThread(data: Partial<PlotThread>): Promise<AxiosResponse<PlotThread>> {
    return this.api.post('/plot-threads/', data);
  }

  async updatePlotThread(id: number, data: Partial<PlotThread>): Promise<AxiosResponse<PlotThread>> {
    return this.api.patch(`/plot-threads/${id}/`, data);
  }

  async deletePlotThread(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/plot-threads/${id}/`);
  }

  // Chapter endpoints
  async getChapters(projectId?: number): Promise<AxiosResponse<PaginatedResponse<Chapter>>> {
    const url = projectId ? `/chapters/?project=${projectId}` : '/chapters/';
    return this.api.get(url);
  }

  async getChapter(id: number): Promise<AxiosResponse<Chapter>> {
    return this.api.get(`/chapters/${id}/`);
  }

  async createChapter(data: Partial<Chapter>): Promise<AxiosResponse<Chapter>> {
    return this.api.post('/chapters/', data);
  }

  async updateChapter(id: number, data: Partial<Chapter>): Promise<AxiosResponse<Chapter>> {
    return this.api.patch(`/chapters/${id}/`, data);
  }

  async deleteChapter(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/chapters/${id}/`);
  }

  async exportChapterTxt(id: number): Promise<AxiosResponse<Blob>> {
    return this.api.get(`/chapters/${id}/export-txt/`, {
      responseType: 'blob'
    });
  }

  async exportProjectTxt(projectId: number): Promise<AxiosResponse<Blob>> {
    return this.api.post('/chapters/export-project-txt/', { project_id: projectId }, {
      responseType: 'blob'
    });
  }

  // Paragraph endpoints
  async getParagraphs(chapterId?: number): Promise<AxiosResponse<PaginatedResponse<Paragraph>>> {
    const url = chapterId ? `/paragraphs/?chapter=${chapterId}` : '/paragraphs/';
    return this.api.get(url);
  }

  async getParagraph(id: number): Promise<AxiosResponse<Paragraph>> {
    return this.api.get(`/paragraphs/${id}/`);
  }

  async createParagraph(data: Partial<Paragraph>): Promise<AxiosResponse<Paragraph>> {
    return this.api.post('/paragraphs/', data);
  }

  async updateParagraph(id: number, data: Partial<Paragraph>): Promise<AxiosResponse<Paragraph>> {
    return this.api.patch(`/paragraphs/${id}/`, data);
  }

  async deleteParagraph(id: number): Promise<AxiosResponse<void>> {
    return this.api.delete(`/paragraphs/${id}/`);
  }
}

const apiService = new ApiService();
export default apiService;