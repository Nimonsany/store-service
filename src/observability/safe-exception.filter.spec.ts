import { ArgumentsHost, ConflictException, Logger } from '@nestjs/common';
import { SafeExceptionFilter } from './safe-exception.filter';

describe('SafeExceptionFilter', () => {
  const request = {
    method: 'POST',
    path: '/stores',
  };

  let status: jest.Mock;
  let json: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    json = jest.fn();

    status = jest.fn().mockReturnValue({
      json,
    });

    host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          status,
        }),
      }),
    } as unknown as ArgumentsHost;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('preserves known HttpException responses', () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const filter = new SafeExceptionFilter();
    const exception = new ConflictException('Store slug already exists');

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(exception.getResponse());
  });

  it('returns a generic 500 for unknown exceptions', () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const filter = new SafeExceptionFilter();

    filter.catch(new Error('database error with sensitive context'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
    });
  });

  it('does not log exception messages or secrets', () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const filter = new SafeExceptionFilter();

    filter.catch(new Error('internalSecret=do-not-log-this-secret'), host);

    const logged = String(errorSpy.mock.calls[0][0]);

    expect(logged).toContain('"event":"http_exception"');
    expect(logged).toContain('"method":"POST"');
    expect(logged).toContain('"path":"/stores"');
    expect(logged).toContain('"statusCode":500');
    expect(logged).toContain('"errorType":"Error"');

    expect(logged).not.toContain('do-not-log-this-secret');
    expect(logged).not.toContain('internalSecret');
  });
});
