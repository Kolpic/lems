import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientExceptionFilter } from './prisma-exception.filter';

describe('PrismaClientExceptionFilter', () => {
  let filter: PrismaClientExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new PrismaClientExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({}),
        getNext: () => jest.fn(),
      }),
      getArgs: () => [],
      getArgByIndex: () => undefined,
      switchToRpc: () => ({}) as ReturnType<ArgumentsHost['switchToRpc']>,
      switchToWs: () => ({}) as ReturnType<ArgumentsHost['switchToWs']>,
      getType: () => 'http' as const,
    } satisfies ArgumentsHost;
  });

  it('should return 409 Conflict for P2002 (unique constraint violation)', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`signature`)',
      {
        code: 'P2002',
        clientVersion: '7.0.0',
        meta: { target: ['signature'] },
      },
    );

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: expect.stringContaining('signature') as string,
      error: 'Conflict',
    });
  });

  it('should default to "unknown field" when P2002 meta.target is missing', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '7.0.0' },
    );

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: expect.stringContaining('unknown field') as string,
      error: 'Conflict',
    });
  });

  it('should return 500 Internal Server Error for non-P2002 errors', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      { code: 'P2003', clientVersion: '7.0.0' },
    );

    filter.catch(error, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  });
});
