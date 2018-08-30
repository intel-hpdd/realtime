const highland = require("highland");

describe("db utils", () => {
  let client, dbUtils, mockStream, mockPool, pool, exit, warn, error, queryError;
  beforeEach(() => {
    queryError = new Error("bad query");
    client = {
      on: jest.fn(),
      release: jest.fn(),
      query: jest.fn(() => Promise.reject(queryError))
    };

    exit = process.exit;
    warn = console.warn;
    error = console.error;

    process.exit = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();

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
    process.exit = exit;
    console.warn = warn;
    console.error = error;
  });

  it("should create a pool", () => {
    expect(mockPool).toHaveBeenCalledWith({
      user: "chroma",
      password: "abc123",
      database: "chroma",
      host: "localhost"
    });
  });

  it("should have a pool property", () => {
    expect(dbUtils.pool).toEqual(pool);
  });

  it("should listen for errors on the pool", () => {
    expect(pool.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  describe("handling pool error", () => {
    let onError;
    beforeEach(() => {
      onError = pool.on.mock.calls[0][1];
      onError(new Error("bad error"));
    });

    it("should end the pool", () => {
      expect(pool.end).toHaveBeenCalledTimes(1);
    });

    it("should exit the process", () => {
      expect(process.exit).toHaveBeenCalledWith(1);
    });
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

    it("should listen for errors", () => {
      expect(client.on).toHaveBeenCalledWith("error", expect.any(Function));
    });

    describe("handling client errors", () => {
      let onError, error;
      beforeEach(() => {
        onError = client.on.mock.calls[2][1];
        error = new Error("e-r-r-o-r");
      });

      it("should release the client", () => {
        try {
          onError(error);
        } catch (e) {
        } finally {
          expect(client.release).toHaveBeenCalledTimes(1);
        }
      });

      it("should log the error", () => {
        try {
          onError(error);
        } catch (e) {
        } finally {
          expect(console.error).toHaveBeenCalledWith("Error listening for table_update", error);
        }
      });

      it("should release the client", () => {
        expect(() => {
          onError(error);
        }).toThrow(error);
      });
    });

    it("should make a query", () => {
      expect(client.query).toHaveBeenCalledWith("LISTEN table_update");
    });

    it("should catch errors when running the query", () => {
      expect(console.error).toHaveBeenCalledWith("got error", queryError);
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
