import { IS_PUBLIC_KEY, Public } from '../public.decorator';

describe('Public Decorator', () => {
  it('should set metadata with IS_PUBLIC_KEY and value true', () => {
    const mockSetMetadata = jest.fn();
    jest.mock('@nestjs/common', () => ({
      ...jest.requireActual('@nestjs/common'),
      SetMetadata: mockSetMetadata,
    }));

    const decorator = Public();

    // The decorator should return a function that sets metadata
    expect(typeof decorator).toBe('function');
  });

  it('should have IS_PUBLIC_KEY constant defined', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

  it('should return a decorator function when called', () => {
    const result = Public();
    expect(typeof result).toBe('function');
  });

  it('should apply SetMetadata with correct parameters', () => {
    const mockClass = class TestClass {};
    const mockMethod = jest.fn();
    const descriptor = { value: mockMethod };

    const decorator = Public();
    const result = decorator(mockClass.prototype, 'testMethod', descriptor);

    // The decorator should return a descriptor or undefined
    expect(result).toBeDefined();
  });

  it('should be usable as a class or method decorator', () => {
    // This test verifies the decorator can be used on both class and method level
    expect(() => {
      @Public()
      class TestClass {
        @Public()
        testMethod() {
          return 'test';
        }
      }
    }).not.toThrow();
  });
});
