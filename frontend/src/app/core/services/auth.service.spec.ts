import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  // Create valid JWT tokens for testing
  const createMockJWT = (expiresInSeconds: number = 3600): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds
    }));
    return `${header}.${payload}.mock-signature`;
  };

  const mockAuthResponse: AuthResponse = {
    accessToken: createMockJWT(3600),
    user: {
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'user'
    }
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login user and store tokens', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Create fresh mock response with valid tokens
      const loginResponse: AuthResponse = {
        accessToken: createMockJWT(3600),
        user: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'user'
        }
      };

      service.login(loginRequest).subscribe(response => {
        expect(response).toEqual(loginResponse);
        expect(service.getAccessToken()).toBe(loginResponse.accessToken);
        expect(service.isAuthenticated()).toBe(true);
        expect(service.currentUser()?.email).toBe(loginResponse.user.email);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginRequest);
      expect(req.request.withCredentials).toBe(true);
      req.flush(loginResponse);
    });

    it('should handle login error', (done) => {
      const loginRequest: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      service.login(loginRequest).subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('register', () => {
    it('should register user and store tokens', (done) => {
      const registerRequest: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'New User'
      };

      // Create fresh mock response with valid tokens
      const registerResponse: AuthResponse = {
        accessToken: createMockJWT(3600),
        user: {
          id: '2',
          email: 'newuser@example.com',
          fullName: 'New User',
          role: 'user'
        }
      };

      service.register(registerRequest).subscribe(response => {
        expect(response).toEqual(registerResponse);
        expect(service.isAuthenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerRequest);
      expect(req.request.withCredentials).toBe(true);
      req.flush(registerResponse);
    });
  });

  describe('logout', () => {
    it('should clear tokens and navigate to login', () => {
      // Set up authenticated state (in-memory)
      (service as any).setAccessToken(createMockJWT(3600));
      (service as any).setUser(mockAuthResponse.user);

      service.logout();

      // Expect and flush the logout request
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.withCredentials).toBe(true);
      req.flush({});

      expect(service.getAccessToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('token management', () => {
    it('should decode JWT token', () => {
      // Mock JWT token (header.payload.signature)
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.signature';
      
      const payload = service.decodeToken(mockToken);
      
      expect(payload.sub).toBe('1234567890');
      expect(payload.email).toBe('test@example.com');
    });

    it('should check if token is valid', () => {
      // Create a token that expires in the future
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: futureExp }))}.signature`;
      
      (service as any).setAccessToken(mockToken);
      
      expect(service.hasValidToken()).toBe(true);
    });

    it('should detect expired token', () => {
      // Create a token that already expired
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ exp: pastExp }))}.signature`;
      
      (service as any).setAccessToken(mockToken);
      
      expect(service.hasValidToken()).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', (done) => {
      const refreshResponse = {
        accessToken: createMockJWT(3600),
        user: mockAuthResponse.user
      };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(refreshResponse);
        expect(service.getAccessToken()).toBe(refreshResponse.accessToken);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(refreshResponse);
    });

    it('should logout on refresh token failure', (done) => {
      (service as any).setAccessToken(createMockJWT(3600));

      service.refreshToken().subscribe({
        error: () => {
          // Expect the logout request
          const logoutReq = httpMock.match(`${environment.apiUrl}/auth/logout`);
          if (logoutReq.length > 0) {
            logoutReq[0].flush({});
          }
          
          expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
          done();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.withCredentials).toBe(true);
      req.flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });
});
