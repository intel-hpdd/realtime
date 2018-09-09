const highland = require("highland");

describe("db utils", () => {
  let client, dbUtils, mockStream, mockPool, pool, warn;
  beforeEach(() => {
    client = {
      on: jest.fn(),
      release: jest.fn(),
      query: jest.fn(() => Promise.resolve({}))
    };

    warn = console.warn;
    console.warn = jest.fn();

    pool = {
      connect: jest.fn(() => Promise.resolve(client)),
      on: jest.fn(),
      end: jest.fn(() => Promise.resolve(true)),
      query: jest.fn(() =>
        Promise.resolve({
          rows: [{ x: 7 }]
        })
      )
    };

    mockPool = jest.fn(() => pool);

    jest.mock("pg", () => ({
      Pool: mockPool
    }));

    jest.mock("../../conf.js", () => ({
      DB_USER: "chroma",
      DB_PASSWORD: "abc123",
      DB_NAME: "chroma",
      DB_HOST: "localhost"
    }));

    stream = highland();
    mockStream = jest.fn(s => s);
    jest.mock("../../broadcaster", () => mockStream);

    dbUtils = require("../../db-utils");
  });

  afterEach(() => {
    console.warn = warn;
  });

  it("should create a pool", () => {
    expect(mockPool).toHaveBeenCalledWith({
      connectionTimeoutMillis: 10000,
      database: "chroma",
      host: "localhost",
      password: "abc123",
      user: "chroma"
    });
  });

  it("should have a pool property", () => {
    expect(dbUtils.pool).toEqual(pool);
  });

  describe("client connection", () => {
    let spy;
    beforeEach(() => {
      spy = jest.fn();
      dbUtils.viewer.write("data");
      dbUtils.viewer.each(spy);
    });

    it("should connect to the pool", () => {
      expect(pool.connect).toHaveBeenCalledTimes(1);
    });

    it("should listen for notifications", () => {
      expect(client.on).toHaveBeenCalledWith("notification", expect.any(Function));
    });

    it("should push when a notification is received", () => {
      const onNotification = client.on.mock.calls[0][1];
      onNotification("notify");
      expect(spy).toHaveBeenCalledWith("notify");
    });

    it("should listen for a notice", () => {
      expect(client.on).toHaveBeenCalledWith("notice", expect.any(Function));
    });

    it("should log when a notice occurs", () => {
      const onNotice = client.on.mock.calls[1][1];
      onNotice("this is a notice");
      expect(console.warn).toHaveBeenCalledWith("notice: ", "this is a notice");
    });

    it("should make a query", () => {
      expect(client.query).toHaveBeenCalledWith("LISTEN table_update");
    });
  });

  describe("query", () => {
    let query, p;
    beforeEach(() => {
      query = "select * from table where name=$1";
      p = dbUtils.query(query, "john");
    });

    it("should call query on the pool", () => {
      expect(pool.query).toHaveBeenCalledWith(query, "john");
    });

    it("should return the result", done => {
      p.then(x => {
        expect(x).toEqual({
          rows: [
            {
              x: 7
            }
          ]
        });
        done();
      });
    });
  });
});
