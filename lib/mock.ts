/**
 * Mock data is allowed only when explicitly enabled for demos.
 * Never silent-fallback to mocks in production.
 */
export function useMockData(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}
