import request from "supertest";
import { app } from "../../src/app";
import { TextTypes } from "../../src/constants/settings";
import { Passages, CommonWords } from "../../src/constants/passages";

describe("Test /race/passage routes", () => {
  test("valid text types", async () => {
    [TextTypes.PASSAGE, TextTypes.TOP_WORDS].map(async (type: number) => {
      const res = await request(app).get(`/race/passage?type=${type}`).send();
      expect(res.status).toBe(200);
    });
  });

  test("passage type response", async () => {
    const res = await request(app)
      .get(`/race/passage?type=${TextTypes.PASSAGE}`)
      .send();
    expect(Passages).toContain(res.body.passage);
  });

  test("top_words type response", async () => {
    const res = await request(app)
      .get(`/race/passage?type=${TextTypes.TOP_WORDS}`)
      .send();
    res.body.passage.split(" ").map((word: string) => {
      expect(CommonWords).toContain(word);
    });
  });

  test("Invalid text types", async () => {
    [-1, Object.keys(TextTypes).length].map(async (type: number) => {
      const res = await request(app).get(`/race/passage?type=${type}`).send();
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid passage type");
    });
  });

  test("No text type", async () => {
    const res = await request(app).get("/race/passage").send();
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid passage type");
  });
});
