describe("socket router index", () => {
  let mockGetRouter, mockAddRoutes, mockAddCredentials, mockEnd, router;

  beforeEach(() => {
    router = {
      addStart: jest.fn(() => router),
      addEnd: jest.fn(() => router)
    };

    mockGetRouter = jest.fn(() => router);
    jest.mock("@iml/router", () => ({ default: mockGetRouter }));

    mockAddCredentials = jest.fn();
    jest.mock("../../../socket-router/middleware/add-credentials", () => mockAddCredentials);

    mockEnd = jest.fn();
    jest.mock("../../../socket-router/middleware/end", () => mockEnd);

    mockAddRoutes = jest.fn();
    jest.mock("../../../socket-router/add-routes", () => mockAddRoutes);

    socketRouter = require("../../../socket-router");
  });

  it("should call getRouter", () => {
    expect(mockGetRouter).toHaveBeenCalledTimes(1);
  });

  it("should insert addCredentials as pre middleware", () => {
    expect(router.addStart).toHaveBeenCalledTimes(1);
    expect(router.addStart).toHaveBeenCalledWith(mockAddCredentials);
  });

  it("should insert end as post middleware", () => {
    expect(router.addEnd).toHaveBeenCalledTimes(1);
    expect(router.addEnd).toHaveBeenCalledWith(mockEnd);
  });

  it("should add the routes", () => {
    expect(mockAddRoutes).toHaveBeenCalledTimes(1);
  });
});
