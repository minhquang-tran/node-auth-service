//test/models/user.test.js
const db = require('../../db/connection');
const { createUser, getUserByEmail } = require('../../models/user');

jest.mock('../../db/connection');

const mockDbUser = {
  insert: jest.fn(),
  where: jest.fn(() => {
    return {
      first: jest.fn()
    };
  })
};

db.mockImplementation(() => mockDbUser);

describe('User Model', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('createUser should insert a user into the Users table', async () => {
    const user = { email: 'test@example.com', password: 'password123' };
    mockDbUser.insert.mockReturnValueOnce(Promise.resolve([1])); // Simulate successful insert

    const result = await createUser(user);
    expect(mockDbUser.insert).toHaveBeenCalledWith(user);
    expect(result).toEqual([1]);
  });

  test('getUserByEmail should return a user by email', async () => {
    const email = 'test@example.com';
    const expectedUser = { id: 1, email, password: 'password123' };
    const mockFirst = jest.fn().mockReturnValueOnce(Promise.resolve(expectedUser));
    mockDbUser.where.mockReturnValueOnce({ first: mockFirst });

    const result = await getUserByEmail(email);
    expect(mockDbUser.where).toHaveBeenCalledWith({ email });
    expect(mockFirst).toHaveBeenCalled();
    expect(result).toEqual(expectedUser);
  });
});