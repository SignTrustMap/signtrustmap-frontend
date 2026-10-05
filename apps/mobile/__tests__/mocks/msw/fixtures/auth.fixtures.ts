import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/api/auth/auth';
import type { AppSession } from '@/context/session-provider';

// ---------------------------------------------------------------------------
// 1. User Profiles & Credential Fixtures
// ---------------------------------------------------------------------------
export const mockUsers = {
  demo: {
    id: 'user-demo-all',
    email: 'demo@stm.dev',
    fullName: 'Demo User',
    password: 'Demo@123',
    backendRoles: ['DRIVER', 'REVIEWER', 'SURVEYOR'],
    accountRoles: ['driver', 'reviewer', 'surveyor'] as const,
  },
  reviewer1: {
    id: 'user-reviewer-1',
    email: 'reviewer1@stm.dev',
    fullName: 'Reviewer One',
    password: 'Reviewer@123',
    backendRoles: ['REVIEWER'],
    accountRoles: ['reviewer'] as const,
  },
  reviewer2: {
    id: 'user-reviewer-2',
    email: 'reviewer2@stm.dev',
    fullName: 'Reviewer Two',
    password: 'Reviewer@123',
    backendRoles: ['REVIEWER'],
    accountRoles: ['reviewer'] as const,
  },
  surveyor: {
    id: 'user-surveyor-1',
    email: 'surveyor1@stm.dev',
    fullName: 'Surveyor One',
    password: 'Surveyor@123',
    backendRoles: ['SURVEYOR'],
    accountRoles: ['surveyor'] as const,
  },
  driver: {
    id: 'user-driver-1',
    email: 'driver@stm.dev',
    fullName: 'Driver One',
    password: 'Driver@123',
    backendRoles: ['DRIVER'],
    accountRoles: ['driver'] as const,
  },
  deactivated: {
    id: 'user-deactivated',
    email: 'deactivated@stm.dev',
    fullName: 'Inactive User',
    password: 'Deactivated@123',
    backendRoles: ['DRIVER'],
    accountRoles: ['driver'] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// 2. Request Fixtures
// ---------------------------------------------------------------------------
export const mockLoginRequests = {
  validDemo: {
    email: mockUsers.demo.email,
    password: mockUsers.demo.password,
  } satisfies LoginRequest,

  validReviewer1: {
    email: mockUsers.reviewer1.email,
    password: mockUsers.reviewer1.password,
  } satisfies LoginRequest,

  validSurveyor: {
    email: mockUsers.surveyor.email,
    password: mockUsers.surveyor.password,
  } satisfies LoginRequest,

  validDriver: {
    email: mockUsers.driver.email,
    password: mockUsers.driver.password,
  } satisfies LoginRequest,

  invalidWrongPassword: {
    email: mockUsers.demo.email,
    password: 'WrongPassword999',
  } satisfies LoginRequest,

  invalidNonExistentEmail: {
    email: 'notfound@stm.dev',
    password: 'Password123',
  } satisfies LoginRequest,

  invalidDeactivatedUser: {
    email: mockUsers.deactivated.email,
    password: mockUsers.deactivated.password,
  } satisfies LoginRequest,

  serverErrorTrigger: {
    email: 'servererror@stm.dev',
    password: 'Password123',
  } satisfies LoginRequest,

  networkErrorTrigger: {
    email: 'networkerror@stm.dev',
    password: 'Password123',
  } satisfies LoginRequest,
} as const;

export const mockRegisterRequests = {
  validNewUser: {
    email: 'newuser@stm.dev',
    password: 'Password123',
    fullName: 'New Citizen User',
    phone: '0912345678',
  } satisfies RegisterRequest,

  validReviewerApplicant: {
    email: 'newreviewer@stm.dev',
    password: 'Password123',
    fullName: 'Candidate Reviewer',
    phone: '0987654321',
  } satisfies RegisterRequest,

  invalidExistingEmail: {
    email: mockUsers.demo.email,
    password: 'Password123',
    fullName: 'Duplicate User',
    phone: '0912345678',
  } satisfies RegisterRequest,

  invalidShortPassword: {
    email: 'shortpass@stm.dev',
    password: 'short',
    fullName: 'Short Password User',
    phone: '0912345678',
  } satisfies RegisterRequest,

  serverErrorTrigger: {
    email: 'servererror@stm.dev',
    password: 'Password123',
    fullName: 'Fail User',
    phone: '0912345678',
  } satisfies RegisterRequest,

  networkErrorTrigger: {
    email: 'networkerror@stm.dev',
    password: 'Password123',
    fullName: 'Network Fail User',
    phone: '0912345678',
  } satisfies RegisterRequest,
} as const;

// ---------------------------------------------------------------------------
// 3. Response Fixtures (Backend Wire Payloads)
// ---------------------------------------------------------------------------
export const mockLoginResponses = {
  demo: {
    accessToken: 'mock-jwt-token-demo-all-roles',
    user: {
      id: mockUsers.demo.id,
      email: mockUsers.demo.email,
      fullName: mockUsers.demo.fullName,
      roles: [...mockUsers.demo.backendRoles],
    },
  } satisfies LoginResponse,

  reviewer1: {
    accessToken: 'mock-jwt-token-reviewer-1',
    user: {
      id: mockUsers.reviewer1.id,
      email: mockUsers.reviewer1.email,
      fullName: mockUsers.reviewer1.fullName,
      roles: [...mockUsers.reviewer1.backendRoles],
    },
  } satisfies LoginResponse,

  surveyor: {
    accessToken: 'mock-jwt-token-surveyor-1',
    user: {
      id: mockUsers.surveyor.id,
      email: mockUsers.surveyor.email,
      fullName: mockUsers.surveyor.fullName,
      roles: [...mockUsers.surveyor.backendRoles],
    },
  } satisfies LoginResponse,

  driver: {
    accessToken: 'mock-jwt-token-driver-1',
    user: {
      id: mockUsers.driver.id,
      email: mockUsers.driver.email,
      fullName: mockUsers.driver.fullName,
      roles: [...mockUsers.driver.backendRoles],
    },
  } satisfies LoginResponse,
} as const;

export const mockRegisterResponses = {
  success: {
    message: 'Account registered successfully',
  } satisfies RegisterResponse,

  duplicateEmail: {
    error: 'Conflict',
    message: 'Email is already registered',
  },

  invalidData: {
    error: 'Bad Request',
    message: 'Password must be at least 8 characters',
  },
} as const;

export const mockAuthErrorResponses = {
  unauthorized: {
    error: 'Unauthorized',
    message: 'Invalid email or password',
  },
  forbidden: {
    error: 'Forbidden',
    message: 'Account is deactivated',
  },
  tokenExpired: {
    error: 'Unauthorized',
    message: 'Token has expired',
  },
  conflict: {
    error: 'Conflict',
    message: 'Email is already registered',
  },
  badRequest: {
    error: 'Bad Request',
    message: 'Validation failed',
  },
  serverError: {
    error: 'Internal Server Error',
    message: 'An unexpected internal error occurred. Please try again.',
  },
} as const;

// ---------------------------------------------------------------------------
// 4. Session Fixtures (Transformed AppSession format)
// ---------------------------------------------------------------------------
export const mockAppSessions = {
  demo: {
    accessToken: mockLoginResponses.demo.accessToken,
    account: {
      id: mockUsers.demo.id,
      email: mockUsers.demo.email,
      displayName: mockUsers.demo.fullName,
      roles: [...mockUsers.demo.accountRoles],
    },
  } satisfies AppSession,

  reviewer1: {
    accessToken: mockLoginResponses.reviewer1.accessToken,
    account: {
      id: mockUsers.reviewer1.id,
      email: mockUsers.reviewer1.email,
      displayName: mockUsers.reviewer1.fullName,
      roles: [...mockUsers.reviewer1.accountRoles],
    },
  } satisfies AppSession,

  surveyor: {
    accessToken: mockLoginResponses.surveyor.accessToken,
    account: {
      id: mockUsers.surveyor.id,
      email: mockUsers.surveyor.email,
      displayName: mockUsers.surveyor.fullName,
      roles: [...mockUsers.surveyor.accountRoles],
    },
  } satisfies AppSession,

  driver: {
    accessToken: mockLoginResponses.driver.accessToken,
    account: {
      id: mockUsers.driver.id,
      email: mockUsers.driver.email,
      displayName: mockUsers.driver.fullName,
      roles: [...mockUsers.driver.accountRoles],
    },
  } satisfies AppSession,
} as const;
