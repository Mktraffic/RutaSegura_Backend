import { ROLES_KEY, Roles } from '../roles.decorator';

describe('Roles Decorator', () => {
  it('should have ROLES_KEY constant defined', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  it('should return a decorator function when called with roles', () => {
    const result = Roles('admin', 'user');
    expect(typeof result).toBe('function');
  });

  it('should work with single role', () => {
    const decorator = Roles('admin');
    expect(typeof decorator).toBe('function');
  });

  it('should work with multiple roles', () => {
    const decorator = Roles('admin', 'moderator', 'user');
    expect(typeof decorator).toBe('function');
  });

  it('should work with empty roles array', () => {
    const decorator = Roles();
    expect(typeof decorator).toBe('function');
  });

  it('should be usable as a method decorator', () => {
    expect(() => {
      class TestClass {
        @Roles('admin', 'moderator')
        testMethod() {
          return 'test';
        }
      }
    }).not.toThrow();
  });

  it('should be usable as a class decorator', () => {
    expect(() => {
      @Roles('admin')
      class TestClass {
        testMethod() {
          return 'test';
        }
      }
    }).not.toThrow();
  });

  it('should handle roles with different cases', () => {
    const decorator = Roles('ADMIN', 'User', 'moderator');
    expect(typeof decorator).toBe('function');
  });

  it('should accept roles with special characters', () => {
    const decorator = Roles('admin:write', 'user:read', 'guest-view');
    expect(typeof decorator).toBe('function');
  });
});
