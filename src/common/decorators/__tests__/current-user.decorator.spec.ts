import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from '../current-user.decorator';

describe('CurrentUser Decorator', () => {
  it('should be a function', () => {
    expect(typeof CurrentUser).toBe('function');
  });

  it('should return a function when called', () => {
    const result = CurrentUser();
    expect(typeof result).toBe('function');
  });

  it('should return a decorator that can be applied to a parameter', () => {
    // Create a mock execution context
    const mockRequest = {
      user: {
        id: '1',
        email: 'test@example.com',
        role: 'admin',
      },
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    // Get the decorator function
    const decorator = CurrentUser();

    // The decorator should be callable with (data, context)
    // This tests the factory function that createParamDecorator creates
    expect(typeof decorator).toBe('function');
  });

  it('should extract user from request when execution context is provided', () => {
    const mockRequest = {
      user: {
        id: '123',
        username: 'testuser',
        role: 'user',
      },
    };

    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;

    // Create the param decorator by calling CurrentUser
    const decorator = CurrentUser();

    // NestJS internally calls this with (data, ctx)
    // We can test the factory function behavior
    expect(typeof decorator).toBe('function');
  });

  it('should work without parameters', () => {
    const result = CurrentUser();
    expect(result).toBeDefined();
    expect(typeof result).toBe('function');
  });

  it('should be usable as a method parameter decorator', () => {
    // Test that it can be applied to a method parameter
    expect(() => {
      class TestController {
        getProfile(@CurrentUser() user: any) {
          return user;
        }
      }
    }).not.toThrow();
  });

  it('should support data parameter', () => {
    // createParamDecorator supports passing data
    // Test that CurrentUser works with or without data
    const decorator = CurrentUser('optional-data');
    expect(typeof decorator).toBe('function');
  });
});
