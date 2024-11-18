//test/models/token.test.js
const db = require('../../db/connection');
const { createToken, getToken, deleteTokensByUserId, deleteToken } = require('../../models/token');

jest.mock('../../db/connection');

const mockDb = {
  insert: jest.fn(),
  where: jest.fn(() => {
    const mockWhere = {
      first: jest.fn(),
      del: jest.fn()
    };
    return mockWhere;
  }),
  del: jest.fn()
};

db.mockImplementation(() => mockDb);

describe('Token Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createToken should insert a token into the Tokens table', async () => {
    const token = { refreshToken: 'some-token', userId: 1 };
    mockDb.insert.mockReturnValueOnce(Promise.resolve([1])); // Simulate successful insert

    const result = await createToken(token);
    expect(mockDb.insert).toHaveBeenCalledWith(token);
    expect(result).toEqual([1]);
  });

  test('getToken should return the token by refreshToken', async () => {
    const refreshToken = 'some-token';
    const expectedToken = { id: 1, refreshToken, userId: 1 };
    const mockFirst = jest.fn().mockReturnValueOnce(Promise.resolve(expectedToken));
    mockDb.where.mockReturnValueOnce({ first: mockFirst });

    const result = await getToken(refreshToken);
    expect(mockDb.where).toHaveBeenCalledWith({ refreshToken });
    expect(mockFirst).toHaveBeenCalled();
    expect(result).toEqual(expectedToken);
  });

  test('deleteTokensByUserId should delete tokens by userId', async () => {
    const userId = 1;
    const mockDel = jest.fn().mockReturnValueOnce(Promise.resolve(1));
    mockDb.where.mockReturnValueOnce({ del: mockDel }); // Simulate one row deleted

    const result = await deleteTokensByUserId(userId);
    expect(mockDb.where).toHaveBeenCalledWith({ userId });
    expect(mockDel).toHaveBeenCalled();
    expect(result).toEqual(1);
  });

  test('deleteToken should delete a token by refreshToken', async () => {
    const refreshToken = 'some-token';
    const mockDel = jest.fn().mockReturnValueOnce(Promise.resolve(1));
    mockDb.where.mockReturnValueOnce({ del: mockDel }); // Simulate one row deleted

    const result = await deleteToken(refreshToken);
    expect(mockDb.where).toHaveBeenCalledWith({ refreshToken });
    expect(mockDel).toHaveBeenCalled();
    expect(result).toEqual(1);
  });
});