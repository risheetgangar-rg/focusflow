import { describe, expect, it } from "vitest";
import { understand } from "./understand";

// Friday 23 October 2026, 2 pm, in whatever timezone the tests run in.
const now = new Date(2026, 9, 23, 14, 0);

describe("understand", () => {
  it("hears a daily medicine reminder with its time", () => {
    expect(understand("Take medication every single day at 10:30 pm", now)).toMatchObject({
      title: "Take medication",
      reminder: true,
      repeat: "daily",
      time: "22:30",
      date: null,
    });
  });

  it("copes with how speech-to-text writes times", () => {
    expect(understand("take my meds at 10.30 p.m. daily", now)).toMatchObject({ title: "Take my meds", time: "22:30", repeat: "daily" });
    expect(understand("call mom at 7", now)).toMatchObject({ title: "Call mom", time: "19:00" });
  });

  it("finds the day", () => {
    expect(understand("pay rent tomorrow", now)).toMatchObject({ title: "Pay rent", date: "2026-10-24" });
    expect(understand("dentist on monday at 11 am", now)).toMatchObject({ title: "Dentist", date: "2026-10-26", time: "11:00" });
    expect(understand("send the report by the 30th", now)).toMatchObject({ title: "Send the report", date: "2026-10-30" });
    expect(understand("submit form on 5th november", now)).toMatchObject({ title: "Submit form", date: "2026-11-05" });
  });

  it("knows when a repeat ends", () => {
    expect(understand("take antibiotics every day for 5 days at 9 am", now)).toMatchObject({
      title: "Take antibiotics",
      repeat: "daily",
      time: "09:00",
      until: "2026-10-27",
    });
    expect(understand("water the plants every morning until friday", now)).toMatchObject({
      title: "Water the plants",
      repeat: "daily",
      time: "09:00",
      until: "2026-10-30",
    });
  });

  it("hears other rhythms and how long something takes", () => {
    expect(understand("gym three times a week for 45 minutes", now)).toMatchObject({ title: "Gym", repeat: "thrice_weekly", minutes: 45 });
    expect(understand("laundry every sunday", now)).toMatchObject({ title: "Laundry", repeat: "weekly", date: "2026-10-25" });
    expect(understand("clean the kitchen tonight", now)).toMatchObject({ title: "Clean the kitchen", date: "2026-10-23", time: "21:00" });
  });

  it("leaves plain tasks alone", () => {
    expect(understand("buy milk and eggs", now)).toMatchObject({ title: "Buy milk and eggs", repeat: null, date: null, time: null });
  });
});
