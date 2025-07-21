
import 'dotenv/config';


// Jest setup file for proper test isolation
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

// Ensure no shared state between tests
afterAll(() => {
  jest.clearAllMocks();
  jest.resetModules();
}); 